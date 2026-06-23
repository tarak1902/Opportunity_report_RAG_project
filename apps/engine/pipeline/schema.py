from __future__ import annotations

from pydantic import BaseModel, Field, HttpUrl


class StartupOpportunityReport(BaseModel):
    """Validated JSON report returned by the RAG chain and API."""

    title: str = Field(description="Concise startup opportunity title")
    thesis: str = Field(description="Why this opportunity exists now")
    market_signal: str = Field(description="Evidence-backed market signal from retrieved articles")
    opportunity: str = Field(description="Specific product or business opportunity")
    risks: list[str] = Field(description="Execution, market, or regulatory risks")
    sources: list[HttpUrl] = Field(description="URLs from retrieved article metadata")

