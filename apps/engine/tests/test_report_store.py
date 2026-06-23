from pathlib import Path

from pipeline.report_store import get_report, list_reports, save_report
from pipeline.schema import StartupOpportunityReport


def _report(title: str) -> StartupOpportunityReport:
    return StartupOpportunityReport(
        title=title,
        thesis="India-specific timing creates a narrow wedge.",
        market_signal="Retrieved context shows repeated buyer pain.",
        opportunity="Build a focused workflow product for the first buyer segment.",
        risks=["Distribution risk", "Compliance risk", "Data access risk"],
        sources=["https://example.com/source"],
    )


def test_report_store_saves_lists_and_loads_report(tmp_path: Path) -> None:
    stored = save_report(_report("UPI Reconciliation"), "UPI ops", "prompt-v1", "model-a", tmp_path)

    summaries = list_reports(query="reconciliation", reports_dir=tmp_path)
    loaded = get_report(stored.id, tmp_path)

    assert summaries[0].id == stored.id
    assert summaries[0].title == "UPI Reconciliation"
    assert loaded is not None
    assert loaded.topic == "UPI ops"


def test_report_store_filters_by_source_and_prompt(tmp_path: Path) -> None:
    save_report(_report("Payment Ops"), "UPI ops", "prompt-v1", "model-a", tmp_path)

    assert len(list_reports(source="example.com", prompt_version="prompt-v1", reports_dir=tmp_path)) == 1
    assert list_reports(source="missing.com", reports_dir=tmp_path) == []
