from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from config import CHROMA_COLLECTION_NAME, CHROMA_PERSIST_PATH, LLM_MODEL
from pipeline.prompt_config import PromptConfig, load_prompt_config, save_prompt_config
from pipeline.rag import build_rag_chain, generate_report
from pipeline.report_store import get_report, list_reports, save_report
from pipeline.vector_store import load_vector_store, vector_store_exists

logger = logging.getLogger(__name__)


class GenerateReportRequest(BaseModel):
    topic: str = Field(min_length=1)


class AppState(BaseModel):
    rag_chain: Any | None = None
    vector_store: Any | None = None
    vector_store_ready: bool = False

    model_config = {"arbitrary_types_allowed": True}


state = AppState()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Load the vector store and RAG chain once when the API starts."""
    if vector_store_exists():
        try:
            vector_store = load_vector_store()
            state.vector_store = vector_store
            state.rag_chain = build_rag_chain(vector_store, load_prompt_config())
            state.vector_store_ready = True
        except Exception as exc:
            logger.exception("Failed to initialize RAG chain: %s", exc)
            state.vector_store = None
            state.rag_chain = None
            state.vector_store_ready = False
    else:
        logger.warning("Chroma store not found. Run `python -m pipeline.index` before generating reports.")
    yield


app = FastAPI(title="RAG Startup Opportunity Report Engine", version="1.0.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    """Return API health status."""
    return {"status": "ok"}


@app.get("/backend/status")
def backend_status() -> dict[str, Any]:
    """Return backend and model configuration status for the workbench."""
    prompt_config = load_prompt_config()
    return {
        "status": "ok",
        "model": LLM_MODEL,
        "vector_store_ready": state.vector_store_ready,
        "chroma_collection": CHROMA_COLLECTION_NAME,
        "chroma_path": CHROMA_PERSIST_PATH,
        "prompt_version": prompt_config.version,
        "temperature": prompt_config.temperature,
        "top_k": prompt_config.top_k,
        "saved_reports": len(list_reports()),
    }


@app.get("/prompt-config")
def get_prompt_config() -> dict[str, Any]:
    """Return editable model behavior configuration."""
    return load_prompt_config().model_dump()


@app.put("/prompt-config")
def update_prompt_config(payload: PromptConfig) -> dict[str, Any]:
    """Save model behavior configuration and rebuild the active RAG chain."""
    updated = save_prompt_config(payload)
    if state.vector_store is not None:
        try:
            state.rag_chain = build_rag_chain(state.vector_store, updated)
            state.vector_store_ready = True
        except Exception as exc:
            logger.exception("Failed to rebuild RAG chain after prompt update: %s", exc)
            raise HTTPException(status_code=500, detail="Prompt saved but chain rebuild failed") from exc
    return updated.model_dump()


@app.get("/reports")
def reports(query: str | None = None, source: str | None = None, prompt_version: str | None = None) -> dict[str, Any]:
    """Return saved generated reports."""
    items = list_reports(query=query, source=source, prompt_version=prompt_version)
    return {"reports": [item.model_dump(mode="json") for item in items]}


@app.get("/reports/{report_id}")
def report_detail(report_id: str) -> dict[str, Any]:
    """Return a saved generated report by id."""
    stored = get_report(report_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Report not found")
    return stored.model_dump(mode="json")


@app.post("/generate-report")
def generate_report_endpoint(payload: GenerateReportRequest) -> dict[str, Any]:
    """Generate a structured startup opportunity report for a topic."""
    if not state.vector_store_ready or state.rag_chain is None:
        raise HTTPException(
            status_code=503,
            detail="Vector store is not ready. Run `python -m pipeline.index` first.",
        )

    try:
        report = generate_report(state.rag_chain, payload.topic)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Report generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Report generation failed") from exc

    prompt_config = load_prompt_config()
    stored = save_report(report, payload.topic, prompt_config.version, LLM_MODEL)
    return {
        **report.model_dump(mode="json"),
        "_metadata": {
            "id": stored.id,
            "topic": stored.topic,
            "prompt_version": stored.prompt_version,
            "model": stored.model,
            "created_at": stored.created_at,
        },
    }
