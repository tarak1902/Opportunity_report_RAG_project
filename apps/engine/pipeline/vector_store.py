from __future__ import annotations

import os
from pathlib import Path

os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

from chromadb.config import Settings
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

from config import CHROMA_COLLECTION_NAME, CHROMA_PERSIST_PATH, EMBEDDING_MODEL


def _chroma_settings(persist_path: str) -> Settings:
    """Create Chroma settings that point at the same persisted directory."""
    return Settings(
        anonymized_telemetry=False,
        is_persistent=True,
        persist_directory=persist_path,
    )


def get_embeddings() -> HuggingFaceEmbeddings:
    """Create the local CPU HuggingFace embedding model."""
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)


def vector_store_exists(persist_path: str = CHROMA_PERSIST_PATH) -> bool:
    """Return true when a persisted Chroma store appears to exist."""
    path = Path(persist_path)
    return path.exists() and any(path.iterdir())


def load_vector_store(persist_path: str = CHROMA_PERSIST_PATH) -> Chroma:
    """Load a persisted Chroma vector store."""
    return Chroma(
        collection_name=CHROMA_COLLECTION_NAME,
        persist_directory=persist_path,
        embedding_function=get_embeddings(),
        client_settings=_chroma_settings(persist_path),
    )


def build_vector_store(documents: list[Document], persist_path: str = CHROMA_PERSIST_PATH) -> Chroma:
    """Create and persist a Chroma vector store from chunked documents."""
    return Chroma.from_documents(
        documents=documents,
        embedding=get_embeddings(),
        collection_name=CHROMA_COLLECTION_NAME,
        persist_directory=persist_path,
        client_settings=_chroma_settings(persist_path),
    )
