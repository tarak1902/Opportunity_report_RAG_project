from ingestion import rss


class Entry:
    title = "Sample article"
    link = "https://example.com/article"
    published = "2026-01-01"


def test_ingest_feeds_preserves_required_metadata(monkeypatch) -> None:
    monkeypatch.setattr(rss.feedparser, "parse", lambda _: {"feed": {"title": "Sample feed"}, "entries": [Entry()]})
    monkeypatch.setattr(rss, "extract_article", lambda _: "Clean article text")

    documents = rss.ingest_feeds(["https://example.com/feed"])

    assert documents[0].page_content == "Clean article text"
    assert documents[0].metadata == {
        "source": "Sample feed",
        "title": "Sample article",
        "date": "2026-01-01",
        "url": "https://example.com/article",
    }


def test_ingest_feeds_skips_failed_extraction(monkeypatch) -> None:
    monkeypatch.setattr(rss.feedparser, "parse", lambda _: {"feed": {"title": "Sample feed"}, "entries": [Entry()]})
    monkeypatch.setattr(rss, "extract_article", lambda _: None)

    assert rss.ingest_feeds(["https://example.com/feed"]) == []
