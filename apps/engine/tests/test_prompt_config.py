from pathlib import Path

import pytest
from pydantic import ValidationError

from pipeline.prompt_config import PromptConfig, load_prompt_config, save_prompt_config


def test_prompt_config_round_trip(tmp_path: Path) -> None:
    path = tmp_path / "model_behavior.json"
    config = PromptConfig(
        version="test-v1",
        system_prompt="You generate grounded structured startup reports.",
        user_prompt_template="{topic}\n{context}\n{source_urls}\n{format_instructions}",
        temperature=0.3,
        top_k=4,
        updated_at="2026-06-20T00:00:00Z",
    )

    saved = save_prompt_config(config, path)
    loaded = load_prompt_config(path)

    assert loaded.version == "test-v1"
    assert loaded.temperature == 0.3
    assert loaded.top_k == 4
    assert loaded.updated_at == saved.updated_at


def test_prompt_config_requires_generation_placeholders() -> None:
    with pytest.raises(ValidationError):
        PromptConfig(
            version="bad-v1",
            system_prompt="You generate grounded structured startup reports.",
            user_prompt_template="{topic}\n{context}",
            temperature=0.2,
            top_k=5,
            updated_at="2026-06-20T00:00:00Z",
        )
