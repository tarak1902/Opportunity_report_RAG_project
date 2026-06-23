from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field, field_validator

from config.settings import ENGINE_ROOT, RETRIEVAL_TOP_K


PROMPT_CONFIG_PATH = ENGINE_ROOT / "config" / "model_behavior.json"


class PromptConfig(BaseModel):
    version: str = Field(min_length=1)
    system_prompt: str = Field(min_length=20)
    user_prompt_template: str = Field(min_length=20)
    temperature: float = Field(ge=0, le=2)
    top_k: int = Field(ge=1, le=20)
    updated_at: str

    @field_validator("user_prompt_template")
    @classmethod
    def validate_template(cls, value: str) -> str:
        required = ["{topic}", "{context}", "{source_urls}", "{format_instructions}"]
        missing = [item for item in required if item not in value]
        if missing:
            raise ValueError(f"user_prompt_template is missing placeholders: {', '.join(missing)}")
        return value


def _default_prompt_config() -> PromptConfig:
    return PromptConfig(
        version="opportunity-behavior-v1",
        system_prompt=(
            "You generate evidence-backed startup opportunity reports for India-focused founders. "
            "Return only JSON that matches the requested schema. Use only the provided source URLs."
        ),
        user_prompt_template=(
            "Topic: {topic}\n\n"
            "Retrieved context:\n{context}\n\n"
            "Allowed source URLs: {source_urls}\n\n"
            "{format_instructions}"
        ),
        temperature=0.2,
        top_k=RETRIEVAL_TOP_K,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )


def load_prompt_config(path: Path = PROMPT_CONFIG_PATH) -> PromptConfig:
    if not path.exists():
        return _default_prompt_config()
    payload = json.loads(path.read_text(encoding="utf-8"))
    return PromptConfig.model_validate(payload)


def save_prompt_config(config: PromptConfig, path: Path = PROMPT_CONFIG_PATH) -> PromptConfig:
    updated = config.model_copy(update={"updated_at": datetime.now(timezone.utc).isoformat()})
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(updated.model_dump(), indent=2) + "\n", encoding="utf-8")
    return updated
