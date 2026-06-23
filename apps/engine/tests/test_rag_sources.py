from langchain_core.documents import Document

from pipeline.rag import _attach_source_urls, _source_urls
from pipeline.schema import StartupOpportunityReport


def test_source_urls_come_from_retrieved_metadata() -> None:
    docs = [
        Document(page_content="One", metadata={"url": "https://example.com/a"}),
        Document(page_content="Two", metadata={"url": "https://example.com/a"}),
        Document(page_content="Three", metadata={"url": "https://example.com/b"}),
    ]

    assert _source_urls(docs) == ["https://example.com/a", "https://example.com/b"]


def test_attach_source_urls_overrides_llm_sources() -> None:
    report = StartupOpportunityReport(
        title="Title",
        thesis="Thesis",
        market_signal="Signal",
        opportunity="Opportunity",
        risks=["Risk"],
        sources=["https://example.com/llm"],
    )

    updated = _attach_source_urls(
        {
            "report": report,
            "source_urls": ["https://example.com/retrieved"],
        }
    )

    assert str(updated.sources[0]) == "https://example.com/retrieved"
