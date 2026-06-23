from __future__ import annotations

from langchain_core.documents import Document
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_openai import ChatOpenAI

from config import LLM_MODEL, OPENAI_API_KEY, OPENAI_BASE_URL
from pipeline.prompt_config import PromptConfig, load_prompt_config
from pipeline.schema import StartupOpportunityReport


def _format_context(documents: list[Document]) -> str:
    """Render retrieved chunks with source metadata for the prompt."""
    blocks: list[str] = []
    for index, doc in enumerate(documents, start=1):
        title = doc.metadata.get("title", "Untitled")
        url = doc.metadata.get("url", "")
        blocks.append(f"[{index}] {title}\nURL: {url}\n{doc.page_content}")
    return "\n\n".join(blocks)


def _source_urls(documents: list[Document]) -> list[str]:
    """Collect source URLs from retrieved document metadata."""
    urls: list[str] = []
    for doc in documents:
        url = doc.metadata.get("url")
        if isinstance(url, str) and url and url not in urls:
            urls.append(url)
    return urls


def _attach_source_urls(payload: dict) -> StartupOpportunityReport:
    """Force report sources to come from retrieved document metadata."""
    report = payload["report"]
    source_urls = payload["source_urls"]
    return StartupOpportunityReport.model_validate(
        {
            **report.model_dump(mode="json"),
            "sources": source_urls,
        }
    )


def build_rag_chain(vector_store: object, prompt_config: PromptConfig | None = None):
    """Build an LCEL RAG chain that returns a validated report model."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is required to build the RAG chain")

    active_config = prompt_config or load_prompt_config()
    parser = PydanticOutputParser(pydantic_object=StartupOpportunityReport)
    retriever = vector_store.as_retriever(search_kwargs={"k": active_config.top_k})
    llm = ChatOpenAI(
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL,
        model=LLM_MODEL,
        temperature=active_config.temperature,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", active_config.system_prompt),
            ("user", active_config.user_prompt_template),
        ]
    ).partial(format_instructions=parser.get_format_instructions(), prompt_version=active_config.version)

    def retrieve_inputs(topic: str) -> dict:
        docs = retriever.invoke(topic)
        return {
            "topic": topic,
            "context": _format_context(docs),
            "source_urls": _source_urls(docs),
        }

    generation_chain = prompt | llm | parser
    return RunnableLambda(retrieve_inputs) | RunnablePassthrough.assign(report=generation_chain) | RunnableLambda(
        _attach_source_urls
    )


def generate_report(chain: object, topic: str) -> StartupOpportunityReport:
    """Run the RAG chain for a topic and return a validated report."""
    return chain.invoke(topic)
