from langchain_core.documents import Document

from config import CHUNK_OVERLAP, CHUNK_SIZE
from pipeline.chunker import chunk_documents


def test_chunk_documents_uses_configured_size_and_overlap() -> None:
    text = "A" * (CHUNK_SIZE + 500)
    chunks = chunk_documents([Document(page_content=text, metadata={"source": "unit"})])

    assert len(chunks) >= 2
    assert chunks[0].metadata["source"] == "unit"
    assert len(chunks[0].page_content) <= CHUNK_SIZE
    assert CHUNK_OVERLAP == 150
