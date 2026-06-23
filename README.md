# RAG Startup Opportunity Report Engine

Python backend for generating structured startup opportunity reports from real article data.

This project is intentionally backend-only. It does not include authentication, user registration, payment gateways, admin dashboards, subscriptions, frontend dashboards, Celery jobs, Supabase flows, Pinecone, or social-media scraping.

## Architecture

RSS feeds -> `trafilatura` article extraction -> LangChain documents -> recursive chunking -> local HuggingFace embeddings -> persisted Chroma -> top-k retrieval -> `ChatOpenAI` LCEL chain -> validated JSON -> FastAPI.

## Project Structure

- `apps/engine/ingestion`: RSS parsing and article extraction.
- `apps/engine/pipeline`: chunking, embeddings, Chroma indexing/loading, retrieval, LCEL generation, report schema.
- `apps/engine/api`: FastAPI app and endpoint models.
- `apps/engine/main.py`: `uvicorn main:app` entrypoint.

## Setup

```powershell
cd apps/engine
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY`. For OpenRouter, use:

```env
OPENAI_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=openai/gpt-4.1-mini
```

## Build The Index

Use sample documents for a quick local proof:

```powershell
python -m pipeline.index --sample --rebuild
```

Use configured RSS feeds:

```powershell
python -m pipeline.index --rebuild --max-entries-per-feed 5
```

If a Chroma store already exists, `python -m pipeline.index` loads it instead of rebuilding.

## Run The API

```powershell
python -m uvicorn main:app --reload --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Generate a report:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8000/generate-report `
  -ContentType "application/json" `
  -Body '{"topic":"AI tools for Indian SMEs"}'
```

Example response:

```json
{
  "title": "SME Payment Reconciliation Copilot",
  "thesis": "Indian SMEs are digitizing payments faster than their back-office workflows can adapt.",
  "market_signal": "Retrieved articles show manual reconciliation and fragmented operations remain common.",
  "opportunity": "Build a lightweight assistant that reconciles UPI, gateway, and ledger records for small finance teams.",
  "risks": ["Low willingness to pay", "Integration complexity", "Incumbent payment platforms could bundle similar tools"],
  "sources": ["https://example.com/sme-payment-ops"]
}
```

## Design Decisions

- Ingestion and embedding are a separate indexing step so API calls do not re-fetch or re-embed articles.
- Embeddings run locally on CPU with `sentence-transformers/all-MiniLM-L6-v2`.
- Chroma persists locally for simple development and repeatable startup loading.
- The LLM output is parsed through a Pydantic output parser so malformed JSON is caught.
- Source URLs in generated reports are restricted to retrieved document metadata.
