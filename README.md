# Startup Opportunity Report 

A retrieval-augmented generation (RAG) system that produces **evidence-backed startup opportunity reports** from real source content. You point it at an RSS feed or article URL, it ingests and indexes the content, and then generates structured opportunity reports that are **grounded only in retrieved sources** — no invented figures, no fake citations.

> **Why this exists:** A plain LLM asked "what's a startup opportunity in Indian specialty coffee?" will confidently fabricate market sizes, funding numbers, and citations. This engine is built around solving that — it answers *only* from real, retrieved sources and is constrained to never invent facts or URLs.



---

## What it does

1. **Ingest** — fetches an RSS feed or a direct article URL, extracts clean main text (Trafilatura), chunks it, embeds it locally, and stores it in a vector database.
2. **Generate** — given a topic, retrieves the most relevant source chunks and uses an LLM to produce a structured report grounded in that context.
3. **View** — reports are saved as JSON and displayed in a document viewer, with an editable prompt configuration (system prompt, temperature, top-k, versioning).

Every report is validated against a strict schema and cites only the source URLs it actually retrieved from.


<img width="667" height="174" alt="Screenshot 2026-06-22 134817" src="https://github.com/user-attachments/assets/6eec6821-409d-430c-8fce-9efe65cdc946" />
<img width="399" height="740" alt="Screenshot 2026-06-22 134510" src="https://github.com/user-attachments/assets/e0e0519b-514a-485f-aeed-883277b26ecd" />

<img width="1436" height="735" alt="Screenshot 2026-06-22 134311" src="https://github.com/user-attachments/assets/803ebda5-52ee-4230-8115-2c1cb608593c" />

Video demontration in the LinkedIN :- www.linkedin.com/in/taraka-sai-ram-adusumilli-328819286
---

## Architecture

```
INGESTION
  User enters RSS feed or article URL
    -> POST /ingest
    -> feedparser / trafilatura  (fetch + extract main text)
    -> chunk documents
    -> local HuggingFace embeddings (all-MiniLM-L6-v2)
    -> append chunks to ChromaDB
    -> rebuild active retriever / RAG chain

GENERATION
  User enters a topic
    -> POST /generate-report
    -> retriever pulls top-k chunks from ChromaDB
    -> prompt template + retrieved context -> ChatOpenAI (LCEL chain)
    -> PydanticOutputParser validates the structured output
    -> report saved as local JSON
    -> frontend document viewer displays it
```

The generation path is a straight **LangChain LCEL chain** (prompt → LLM → validated parser). Source chunks live in ChromaDB; generated reports are stored separately as JSON files.

**Stack**

| Layer | Choice |
|---|---|
| Backend | FastAPI + Uvicorn (Python 3.11) |
| Orchestration | LangChain (LCEL) |
| Ingestion | feedparser + Trafilatura |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (local, CPU) |
| Vector store | ChromaDB (persisted locally) |
| LLM | OpenAI-compatible via `ChatOpenAI` (configurable base URL + model) |
| Validation | Pydantic (`PydanticOutputParser`) |
| Frontend | Next.js + React + TypeScript + Tailwind CSS |

---

## Design decisions

A few choices worth explaining, since they're the heart of the project:

- **Grounding over fluency.** The system prompt constrains the LLM to use only retrieved source URLs and forbids inventing citations, dates, funding amounts, or facts not present in the context. Solving hallucination is the actual hard problem in RAG, so the prompt design and the strict Pydantic schema are deliberate, not incidental.
- **Local embeddings.** Embeddings run locally with a small sentence-transformer, so the retrieval side has zero API cost — the only paid call is generation.
- **Configurable LLM via an OpenAI-compatible interface.** The model and base URL are env-driven, so the same code runs against OpenAI, OpenRouter, or any compatible endpoint without changing code.
- **Reports stored separately from the vector store.** ChromaDB holds source chunks; generated reports are plain JSON files — simple, inspectable, and easy to export.
- **Editable, versioned prompts.** Prompt config (system prompt, template, temperature, top-k) is editable and versioned at runtime, so prompt iteration doesn't require code changes.

---

## Getting started

### Prerequisites
- Python 3.11
- Node.js 22+ and npm

### 1. Install dependencies

```bash
# JS deps (from repo root)
npm install

# Python deps
cd apps/engine
pip install -r requirements.txt
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp apps/engine/.env.example apps/engine/.env
```

Engine environment variables:

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | API key for your LLM provider |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL (e.g. an OpenAI or OpenRouter endpoint) |
| `LLM_MODEL` | Model name (falls back to `gpt-4o-mini` if unset) |
| `RSS_FEED_URLS` | Comma-separated default feeds to seed from |
| `CHROMA_PERSIST_PATH` | Where ChromaDB persists (default `apps/engine/chroma_db`) |
| `CHROMA_COLLECTION_NAME` | Chroma collection name |

### 3. Seed the vector index

```bash
cd apps/engine

# Seed with bundled sample docs
python -m pipeline.index --rebuild --sample

# Or seed from configured RSS feeds
python -m pipeline.index --rebuild --max-entries-per-feed 5
```

### 4. Run

```bash
# Backend (port 8000)
cd apps/engine
python -m uvicorn main:app --reload --port 8000

# Frontend (port 3000), from repo root
npm run dev -w apps/web -- -p 3000
```

Open `http://localhost:3000`, paste a feed or article URL, ingest it, then enter a topic and generate a report.

---

## API

FastAPI backend (port 8000):

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check → `{ "status": "ok" }` |
| `GET` | `/backend/status` | Backend / model / vector-store status |
| `GET` | `/prompt-config` | Current editable prompt config |
| `PUT` | `/prompt-config` | Save prompt config, rebuild RAG chain |
| `GET` | `/reports` | List saved report summaries |
| `GET` | `/reports/{id}` | Fetch a saved report |
| `POST` | `/ingest` | Fetch + extract + chunk + embed a source (`{ source_url, max_entries? }`) |
| `POST` | `/generate-report` | Retrieve + generate + save (`{ topic }`) |

The Next.js frontend exposes matching proxy routes under `/api/*`.

---

## Report schema

Each generated report is validated against:

```json
{
  "title": "string",
  "thesis": "string",
  "market_signal": "string",
  "opportunity": "string",
  "risks": ["string"],
  "sources": ["url"]
}
```

Saved report files wrap this with metadata (`id`, `topic`, `prompt_version`, `model`, `created_at`).

---

## Project structure

```
apps/
  engine/                 # FastAPI + RAG backend
    api/app.py
    config/                 # settings + model behavior
    ingestion/rss.py        # feedparser + trafilatura
    pipeline/
      chunker.py
      index.py              # build/seed the vector index
      rag.py                # LCEL RAG chain
      report_store.py       # save/load generated reports
      schema.py             # Pydantic report schema
      vector_store.py       # ChromaDB wrapper
    generated_reports/      # saved report JSON
    main.py
  web/                    # Next.js frontend
    app/
      page.tsx
      api/                  # proxy routes to the engine
    lib/
packages/shared/
```

---

## Status & roadmap

**v1 (current) — working, tested, local.**
Manual fetch → index → generate → view, with grounded generation, prompt versioning, schema validation, and source citations. Runs locally end to end.

**v2 (planned), actively doing**
- Automated, scheduled live data ingestion (Tavily / Firecrawl for discovery)
- Containerization (Docker) and cloud deployment (AWS)
- Observability / tracing (LangSmith)
- Reintroduce auth, persistence, and billing for a hosted multi-user version

---

## Notes

- Local generated reports under `apps/engine/generated_reports/` are git-ignored by default; a small number of sample reports are kept in the repo to illustrate output.
- Embeddings run locally, so retrieval costs nothing; only LLM generation calls the provider API.
- This is a portfolio / learning build focused on the core RAG problem (grounded, evidence-backed generation). The v1 `.env.example` files contain some placeholder variables reserved for v2 features (auth, billing) that the core flow does not require.
