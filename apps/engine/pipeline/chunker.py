from __future__ import annotations

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from config import CHUNK_OVERLAP, CHUNK_SIZE


def chunk_documents(documents: list[Document]) -> list[Document]:
    """Split documents into retrieval-sized chunks using the configured splitter."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    return splitter.split_documents(documents)

