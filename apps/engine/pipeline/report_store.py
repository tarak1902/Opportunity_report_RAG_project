from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from pydantic import BaseModel, Field

from config.settings import ENGINE_ROOT
from pipeline.schema import StartupOpportunityReport


REPORTS_DIR = ENGINE_ROOT / "generated_reports"


class StoredReport(BaseModel):
    id: str
    topic: str
    prompt_version: str
    model: str
    created_at: str
    report: StartupOpportunityReport


class StoredReportSummary(BaseModel):
    id: str
    topic: str
    title: str
    prompt_version: str
    model: str
    created_at: str
    sources: list[str]


def _safe_slug(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return slug[:48] or "report"


def save_report(
    report: StartupOpportunityReport,
    topic: str,
    prompt_version: str,
    model: str,
    reports_dir: Path = REPORTS_DIR,
) -> StoredReport:
    reports_dir.mkdir(parents=True, exist_ok=True)
    created_at = datetime.now(timezone.utc).isoformat()
    report_id = f"{created_at[:10]}-{_safe_slug(topic)}-{uuid4().hex[:8]}"
    stored = StoredReport(
        id=report_id,
        topic=topic,
        prompt_version=prompt_version,
        model=model,
        created_at=created_at,
        report=report,
    )
    (reports_dir / f"{report_id}.json").write_text(
        json.dumps(stored.model_dump(mode="json"), indent=2) + "\n",
        encoding="utf-8",
    )
    return stored


def _read_report(path: Path) -> StoredReport | None:
    try:
        return StoredReport.model_validate(json.loads(path.read_text(encoding="utf-8")))
    except Exception:
        return None


def list_reports(
    query: str | None = None,
    source: str | None = None,
    prompt_version: str | None = None,
    reports_dir: Path = REPORTS_DIR,
) -> list[StoredReportSummary]:
    if not reports_dir.exists():
        return []

    normalized_query = query.lower().strip() if query else ""
    normalized_source = source.lower().strip() if source else ""
    normalized_prompt = prompt_version.lower().strip() if prompt_version else ""
    summaries: list[StoredReportSummary] = []

    for path in reports_dir.glob("*.json"):
        stored = _read_report(path)
        if not stored:
            continue

        source_urls = [str(url) for url in stored.report.sources]
        searchable = " ".join(
            [
                stored.topic,
                stored.report.title,
                stored.report.thesis,
                stored.report.market_signal,
                stored.report.opportunity,
                " ".join(stored.report.risks),
                " ".join(source_urls),
            ]
        ).lower()

        if normalized_query and normalized_query not in searchable:
            continue
        if normalized_source and not any(normalized_source in item.lower() for item in source_urls):
            continue
        if normalized_prompt and normalized_prompt != stored.prompt_version.lower():
            continue

        summaries.append(
            StoredReportSummary(
                id=stored.id,
                topic=stored.topic,
                title=stored.report.title,
                prompt_version=stored.prompt_version,
                model=stored.model,
                created_at=stored.created_at,
                sources=source_urls,
            )
        )

    return sorted(summaries, key=lambda item: item.created_at, reverse=True)


def get_report(report_id: str, reports_dir: Path = REPORTS_DIR) -> StoredReport | None:
    path = reports_dir / f"{report_id}.json"
    if not path.exists():
        return None
    return _read_report(path)
