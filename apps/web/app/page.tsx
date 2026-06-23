"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "generate" | "reports" | "prompt" | "backend";

type Report = {
  title: string;
  thesis: string;
  market_signal: string;
  opportunity: string;
  risks: string[];
  sources: string[];
  _metadata?: ReportMetadata;
};

type ReportMetadata = {
  id: string;
  topic: string;
  prompt_version: string;
  model: string;
  created_at: string;
};

type StoredReport = {
  id: string;
  topic: string;
  prompt_version: string;
  model: string;
  created_at: string;
  report: Report;
};

type ReportSummary = {
  id: string;
  topic: string;
  title: string;
  prompt_version: string;
  model: string;
  created_at: string;
  sources: string[];
};

type PromptConfig = {
  version: string;
  system_prompt: string;
  user_prompt_template: string;
  temperature: number;
  top_k: number;
  updated_at: string;
};

type BackendStatus = {
  status: string;
  model: string;
  vector_store_ready: boolean;
  chroma_collection: string;
  chroma_path: string;
  prompt_version: string;
  temperature: number;
  top_k: number;
  saved_reports: number;
  error?: string;
};

type LoadState = "idle" | "loading" | "saving" | "success" | "error";

const tabs: { id: Tab; label: string }[] = [
  { id: "generate", label: "Generate" },
  { id: "reports", label: "Reports" },
  { id: "prompt", label: "Prompt" },
  { id: "backend", label: "Backend" }
];

const examples = [
  "GST notice workflow for small CA firms",
  "UPI reconciliation for Indian SMEs",
  "Return-to-origin analytics for D2C brands",
  "WhatsApp commerce support for tier-2 retailers"
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [topic, setTopic] = useState(examples[1]);
  const [generateState, setGenerateState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<StoredReport | null>(null);
  const [reportQuery, setReportQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [promptFilter, setPromptFilter] = useState("");
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null);
  const [promptDraft, setPromptDraft] = useState<PromptConfig | null>(null);
  const [promptState, setPromptState] = useState<LoadState>("idle");
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [backendState, setBackendState] = useState<LoadState>("idle");

  const canGenerate = useMemo(
    () => topic.trim().length > 0 && generateState !== "loading",
    [generateState, topic]
  );

  useEffect(() => {
    void refreshBackend();
    void loadPromptConfig();
    void loadReports();
  }, []);

  async function refreshBackend() {
    setBackendState("loading");
    try {
      const response = await fetch("/api/backend/status", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Backend status failed.");
      setBackendStatus(payload as BackendStatus);
      setBackendState("success");
    } catch (error) {
      setBackendStatus(null);
      setBackendState("error");
      setMessage(error instanceof Error ? error.message : "Backend status failed.");
    }
  }

  async function loadPromptConfig() {
    setPromptState("loading");
    try {
      const response = await fetch("/api/prompt-config", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? payload.detail ?? "Prompt config failed.");
      setPromptConfig(payload as PromptConfig);
      setPromptDraft(payload as PromptConfig);
      setPromptState("success");
    } catch (error) {
      setPromptState("error");
      setMessage(error instanceof Error ? error.message : "Prompt config failed.");
    }
  }

  async function savePromptConfig() {
    if (!promptDraft) return;
    setPromptState("saving");
    try {
      const response = await fetch("/api/prompt-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptDraft)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? payload.detail ?? "Prompt save failed.");
      setPromptConfig(payload as PromptConfig);
      setPromptDraft(payload as PromptConfig);
      setPromptState("success");
      await refreshBackend();
    } catch (error) {
      setPromptState("error");
      setMessage(error instanceof Error ? error.message : "Prompt save failed.");
    }
  }

  async function loadReports() {
    const params = new URLSearchParams();
    if (reportQuery.trim()) params.set("query", reportQuery.trim());
    if (sourceFilter.trim()) params.set("source", sourceFilter.trim());
    if (promptFilter.trim()) params.set("prompt_version", promptFilter.trim());

    try {
      const response = await fetch(`/api/reports?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? payload.detail ?? "Reports failed.");
      setReports(payload.reports ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reports failed.");
    }
  }

  async function openReport(reportId: string) {
    try {
      const response = await fetch(`/api/reports/${reportId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? payload.detail ?? "Report failed.");
      setSelectedReport(payload as StoredReport);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Report failed.");
    }
  }

  async function generateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim()) return;

    setGenerateState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? payload.detail ?? "Report generation failed.");
      setReport(payload as Report);
      setGenerateState("success");
      await loadReports();
      await refreshBackend();
    } catch (error) {
      setGenerateState("error");
      setMessage(error instanceof Error ? error.message : "Report generation failed.");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-4 md:grid-cols-[232px_1fr] md:px-6 md:py-6">
        <aside className="md:sticky md:top-6 md:self-start">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase text-neutral-500">Startup Engine</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight">Backend Workbench</h1>
          </div>

          <nav className="grid gap-1 rounded-lg border border-neutral-200 bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  activeTab === tab.id ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <StatusStrip backendState={backendState} backendStatus={backendStatus} />
        </aside>

        <section className="min-h-[720px]">
          {message && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {message}
            </div>
          )}

          {activeTab === "generate" && (
            <GeneratePanel
              topic={topic}
              setTopic={setTopic}
              canGenerate={canGenerate}
              generateState={generateState}
              report={report}
              onSubmit={generateReport}
            />
          )}

          {activeTab === "reports" && (
            <ReportsPanel
              reports={reports}
              selectedReport={selectedReport}
              query={reportQuery}
              sourceFilter={sourceFilter}
              promptFilter={promptFilter}
              setQuery={setReportQuery}
              setSourceFilter={setSourceFilter}
              setPromptFilter={setPromptFilter}
              loadReports={loadReports}
              openReport={openReport}
            />
          )}

          {activeTab === "prompt" && (
            <PromptPanel
              promptConfig={promptConfig}
              promptDraft={promptDraft}
              promptState={promptState}
              setPromptDraft={setPromptDraft}
              savePromptConfig={savePromptConfig}
              resetPromptDraft={() => setPromptDraft(promptConfig)}
            />
          )}

          {activeTab === "backend" && (
            <BackendPanel backendState={backendState} backendStatus={backendStatus} refreshBackend={refreshBackend} />
          )}
        </section>
      </div>
    </main>
  );
}

function StatusStrip({
  backendState,
  backendStatus
}: {
  backendState: LoadState;
  backendStatus: BackendStatus | null;
}) {
  const ready = backendStatus?.vector_store_ready;
  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-neutral-500">Runtime</p>
      <div className="mt-3 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-neutral-600">Backend</span>
          <span className={backendState === "error" ? "text-red-700" : "text-emerald-700"}>
            {backendState === "loading" ? "Checking" : backendState === "error" ? "Offline" : "Online"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-neutral-600">Vector store</span>
          <span className={ready ? "text-emerald-700" : "text-red-700"}>{ready ? "Ready" : "Not ready"}</span>
        </div>
      </div>
    </div>
  );
}

function GeneratePanel({
  topic,
  setTopic,
  canGenerate,
  generateState,
  report,
  onSubmit
}: {
  topic: string;
  setTopic: (value: string) => void;
  canGenerate: boolean;
  generateState: LoadState;
  report: Report | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Generate Report</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-neutral-800" htmlFor="topic">
            Topic
            <textarea
              id="topic"
              rows={5}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="w-full resize-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
          </label>
          <button
            type="submit"
            disabled={!canGenerate}
            className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {generateState === "loading" ? "Generating" : "Generate"}
          </button>
        </form>

        <div className="mt-5 grid gap-2">
          <p className="text-xs font-semibold uppercase text-neutral-500">Topics</p>
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setTopic(example)}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-white"
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        {generateState === "loading" && <PanelMessage title="Generating" body="Retrieving indexed context." />}
        {!report && generateState !== "loading" && <PanelMessage title="No Report" body="Run generation to populate this panel." />}
        {report && <ReportView report={report} />}
      </section>
    </div>
  );
}

function ReportsPanel({
  reports,
  selectedReport,
  query,
  sourceFilter,
  promptFilter,
  setQuery,
  setSourceFilter,
  setPromptFilter,
  loadReports,
  openReport
}: {
  reports: ReportSummary[];
  selectedReport: StoredReport | null;
  query: string;
  sourceFilter: string;
  promptFilter: string;
  setQuery: (value: string) => void;
  setSourceFilter: (value: string) => void;
  setPromptFilter: (value: string) => void;
  loadReports: () => Promise<void>;
  openReport: (id: string) => Promise<void>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Reports</h2>
          <button
            type="button"
            onClick={() => void loadReports()}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search report text"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              placeholder="Source/domain"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            <input
              value={promptFilter}
              onChange={(event) => setPromptFilter(event.target.value)}
              placeholder="Prompt version"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadReports()}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Apply Filters
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          {reports.length === 0 && <p className="text-sm text-neutral-500">No saved reports found.</p>}
          {reports.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void openReport(item.id)}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 text-left hover:bg-white"
            >
              <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{item.topic}</p>
              <p className="mt-2 text-xs text-neutral-500">
                {new Date(item.created_at).toLocaleString()} · {item.prompt_version}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        {selectedReport ? (
          <ReportView
            report={{
              ...selectedReport.report,
              _metadata: {
                id: selectedReport.id,
                topic: selectedReport.topic,
                prompt_version: selectedReport.prompt_version,
                model: selectedReport.model,
                created_at: selectedReport.created_at
              }
            }}
          />
        ) : (
          <PanelMessage title="Select Report" body="Open a saved report from the list." />
        )}
      </section>
    </div>
  );
}

function PromptPanel({
  promptConfig,
  promptDraft,
  promptState,
  setPromptDraft,
  savePromptConfig,
  resetPromptDraft
}: {
  promptConfig: PromptConfig | null;
  promptDraft: PromptConfig | null;
  promptState: LoadState;
  setPromptDraft: (value: PromptConfig) => void;
  savePromptConfig: () => Promise<void>;
  resetPromptDraft: () => void;
}) {
  if (!promptDraft) {
    return <PanelMessage title="Prompt Config" body="Prompt configuration is not loaded." />;
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Model Behavior</h2>
          <p className="mt-1 text-sm text-neutral-500">{promptConfig?.updated_at ?? "Not saved"}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetPromptDraft}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void savePromptConfig()}
            disabled={promptState === "saving"}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:bg-neutral-300"
          >
            {promptState === "saving" ? "Saving" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-neutral-800">
          Version
          <input
            value={promptDraft.version}
            onChange={(event) => setPromptDraft({ ...promptDraft, version: event.target.value })}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-neutral-800">
            Temperature
            <input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={promptDraft.temperature}
              onChange={(event) => setPromptDraft({ ...promptDraft, temperature: Number(event.target.value) })}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-neutral-800">
            Retrieval top K
            <input
              type="number"
              min={1}
              max={20}
              value={promptDraft.top_k}
              onChange={(event) => setPromptDraft({ ...promptDraft, top_k: Number(event.target.value) })}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-neutral-800">
          System prompt
          <textarea
            rows={8}
            value={promptDraft.system_prompt}
            onChange={(event) => setPromptDraft({ ...promptDraft, system_prompt: event.target.value })}
            className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm leading-6 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-neutral-800">
          User prompt template
          <textarea
            rows={14}
            value={promptDraft.user_prompt_template}
            onChange={(event) => setPromptDraft({ ...promptDraft, user_prompt_template: event.target.value })}
            className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm leading-6 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
        </label>
      </div>
    </section>
  );
}

function BackendPanel({
  backendState,
  backendStatus,
  refreshBackend
}: {
  backendState: LoadState;
  backendStatus: BackendStatus | null;
  refreshBackend: () => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Backend</h2>
        <button
          type="button"
          onClick={() => void refreshBackend()}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Refresh
        </button>
      </div>

      {!backendStatus && <PanelMessage title={backendState === "loading" ? "Checking" : "Unavailable"} body="Backend status is not available." />}
      {backendStatus && (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Metric label="Status" value={backendStatus.status} />
          <Metric label="Model" value={backendStatus.model} />
          <Metric label="Vector store" value={backendStatus.vector_store_ready ? "Ready" : "Not ready"} />
          <Metric label="Prompt version" value={backendStatus.prompt_version} />
          <Metric label="Temperature" value={String(backendStatus.temperature)} />
          <Metric label="Top K" value={String(backendStatus.top_k)} />
          <Metric label="Collection" value={backendStatus.chroma_collection} />
          <Metric label="Saved reports" value={String(backendStatus.saved_reports)} />
          <Metric label="Chroma path" value={backendStatus.chroma_path} wide />
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-lg border border-neutral-200 bg-neutral-50 p-3 ${wide ? "md:col-span-2 xl:col-span-3" : ""}`}>
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

function PanelMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-6 text-center">
      <div>
        <p className="text-lg font-semibold text-neutral-950">{title}</p>
        <p className="mt-2 text-sm text-neutral-500">{body}</p>
      </div>
    </div>
  );
}

function ReportView({ report }: { report: Report }) {
  return (
    <article className="p-5 md:p-6">
      <header className="border-b border-neutral-200 pb-5">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          {report._metadata?.topic ?? "Generated report"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">{report.title}</h2>
        {report._metadata && (
          <p className="mt-3 text-xs text-neutral-500">
            {report._metadata.model} · {report._metadata.prompt_version} ·{" "}
            {new Date(report._metadata.created_at).toLocaleString()}
          </p>
        )}
      </header>

      <div className="grid gap-5 py-5">
        <ReportSection title="Thesis" body={report.thesis} />
        <ReportSection title="Market Signal" body={report.market_signal} />
        <ReportSection title="Opportunity" body={report.opportunity} />

        <section>
          <h3 className="text-sm font-semibold">Risks</h3>
          <ul className="mt-3 grid gap-2">
            {report.risks.map((risk) => (
              <li key={risk} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm leading-6 text-neutral-700">
                {risk}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold">Sources</h3>
          <div className="mt-3 grid gap-2">
            {report.sources.map((source) => (
              <a
                key={source}
                href={source}
                target="_blank"
                rel="noreferrer"
                className="break-all rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 underline-offset-4 hover:underline"
              >
                {source}
              </a>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function ReportSection({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-700">{body}</p>
    </section>
  );
}
