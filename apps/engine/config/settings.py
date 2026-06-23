from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ENGINE_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ENGINE_ROOT / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL") or None
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CHROMA_PERSIST_PATH = os.getenv("CHROMA_PERSIST_PATH", str(ENGINE_ROOT / "chroma_db"))
CHROMA_COLLECTION_NAME = os.getenv("CHROMA_COLLECTION_NAME", "startup_opportunity_articles")

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
RETRIEVAL_TOP_K = 5

DEFAULT_FEED_URLS = [
    "https://techcrunch.com/feed/",
    "https://www.startupdaily.net/feed/",
    "https://yourstory.com/feed",
]

RSS_FEED_URLS = [
    url.strip()
    for url in os.getenv("RSS_FEED_URLS", ",".join(DEFAULT_FEED_URLS)).split(",")
    if url.strip()
]
