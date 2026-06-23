import pytest
from pydantic import ValidationError

from pipeline.schema import StartupOpportunityReport


def test_report_schema_validates_required_fields() -> None:
    report = StartupOpportunityReport(
        title="UPI Reconciliation Copilot",
        thesis="SMEs need better payment operations.",
        market_signal="Manual reconciliation remains common.",
        opportunity="Build a lightweight reconciliation assistant.",
        risks=["Low willingness to pay"],
        sources=["https://example.com/source"],
    )

    assert str(report.sources[0]) == "https://example.com/source"


def test_report_schema_rejects_malformed_sources() -> None:
    with pytest.raises(ValidationError):
        StartupOpportunityReport(
            title="Bad report",
            thesis="Missing valid source.",
            market_signal="Signal",
            opportunity="Opportunity",
            risks=["Risk"],
            sources=["not-a-url"],
        )
