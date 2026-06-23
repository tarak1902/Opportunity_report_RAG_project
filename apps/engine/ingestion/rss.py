from __future__ import annotations

import logging
from typing import Iterable

import feedparser
import trafilatura
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def _entry_date(entry: object) -> str:
    """Return the best available date string for an RSS entry."""
    if isinstance(entry, dict):
        return str(entry.get("published") or entry.get("updated") or entry.get("created") or "")
    return str(
        getattr(entry, "published", "")
        or getattr(entry, "updated", "")
        or getattr(entry, "created", "")
    )


def _entry_value(entry: object, key: str, default: str = "") -> str:
    """Read an RSS entry value from feedparser's dict-like result."""
    if isinstance(entry, dict):
        return str(entry.get(key, default))
    return str(getattr(entry, key, default))


def extract_article(url: str) -> str | None:
    """Fetch and extract main article text with trafilatura."""
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        return None
    return trafilatura.extract(downloaded)


def ingest_feeds(feed_urls: Iterable[str], max_entries_per_feed: int | None = None) -> list[Document]:
    """Read RSS feeds and return extracted article documents with source metadata."""
    documents: list[Document] = []

    for feed_url in feed_urls:
        parsed = feedparser.parse(feed_url)
        feed = parsed.get("feed", {}) if isinstance(parsed, dict) else getattr(parsed, "feed", {})
        source = feed.get("title", feed_url) if isinstance(feed, dict) else getattr(feed, "title", feed_url)
        parsed_entries = parsed.get("entries", []) if isinstance(parsed, dict) else getattr(parsed, "entries", [])
        entries = parsed_entries[:max_entries_per_feed] if max_entries_per_feed else parsed_entries

        for entry in entries:
            url = _entry_value(entry, "link")
            title = _entry_value(entry, "title", "Untitled article")
            if not url:
                logger.warning("Skipping RSS entry without URL: %s", title)
                continue

            try:
                text = extract_article(url)
            except Exception as exc:
                logger.warning("Extraction failed for %s: %s", url, exc)
                continue

            if not text:
                logger.warning("No article text extracted for %s", url)
                continue

            documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "source": str(source),
                        "title": title,
                        "date": _entry_date(entry),
                        "url": url,
                    },
                )
            )

    return documents
