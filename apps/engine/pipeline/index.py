from __future__ import annotations

import argparse
import logging
import shutil
from pathlib import Path

from langchain_core.documents import Document

from config import CHROMA_PERSIST_PATH, RSS_FEED_URLS
from ingestion import ingest_feeds
from pipeline.chunker import chunk_documents
from pipeline.vector_store import build_vector_store, load_vector_store, vector_store_exists

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def sample_documents() -> list[Document]:
    """Return small sample documents for proving the indexing path locally."""
    return [
        Document(
            page_content=(
                "Indian SMEs are adopting UPI and WhatsApp commerce faster than their back-office "
                "tools can keep up. Owners still reconcile payments manually across spreadsheets."
            ),
            metadata={
                "source": "sample",
                "title": "SME payment operations gap",
                "date": "2026-01-01",
                "url": "https://example.com/sme-payment-ops",
            },
        ),
        Document(
            page_content=(
                "Small D2C brands report rising return-to-origin costs and weak visibility into "
                "cash-on-delivery failures in tier-2 markets."
            ),
            metadata={
                "source": "sample",
                "title": "D2C logistics pain",
                "date": "2026-01-02",
                "url": "https://example.com/d2c-logistics",
            },
        ),
    ]


def index_documents(documents: list[Document]) -> int:
    """Chunk documents, embed them, and persist them into Chroma."""
    chunks = chunk_documents(documents)
    if not chunks:
        logger.warning("No chunks generated; nothing to index")
        return 0
    build_vector_store(chunks)
    return len(chunks)


def main() -> None:
    """CLI entrypoint for building or loading the local Chroma index."""
    parser = argparse.ArgumentParser(description="Build the local Chroma index for the RAG backend.")
    parser.add_argument("--rebuild", action="store_true", help="Delete and rebuild the local Chroma store.")
    parser.add_argument("--sample", action="store_true", help="Index built-in sample documents instead of RSS feeds.")
    parser.add_argument("--max-entries-per-feed", type=int, default=None, help="Limit RSS entries per feed.")
    args = parser.parse_args()

    persist_path = Path(CHROMA_PERSIST_PATH)
    if args.rebuild and persist_path.exists():
        shutil.rmtree(persist_path)

    if vector_store_exists() and not args.rebuild:
        load_vector_store()
        logger.info("Loaded existing Chroma store at %s", CHROMA_PERSIST_PATH)
        return

    documents = sample_documents() if args.sample else ingest_feeds(RSS_FEED_URLS, args.max_entries_per_feed)
    indexed = index_documents(documents)
    logger.info("Indexed %s chunks into %s", indexed, CHROMA_PERSIST_PATH)


if __name__ == "__main__":
    main()

