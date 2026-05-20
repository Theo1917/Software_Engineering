import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Input from "../components/Input";

const initialForm = {
  question: "",
  deploymentPlatform: "",
  repoUrl: "",
  logs: "",
  repoManifest: "",
  configText: "",
  environmentNotes: "",
  screenshotNotes: "",
  extraNotes: "",
};

export default function DeploymentAssistantPage() {
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [relatedIssues, setRelatedIssues] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [memory, setMemory] = useState([]);
  const [semanticQuery, setSemanticQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState({ sessions: [], memory: [] });
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      const response = await api.get("/engineering-assistant/sessions?limit=8");
      setSessions(response.data.sessions || []);
      setMemory(response.data.memory || []);
    } catch {
      // Keep page interactive even if history fails.
    } finally {
      setHistoryLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(event) {
    setFiles(Array.from(event.target.files || []));
  }

  async function handleSemanticSearch(event) {
    event.preventDefault();
    if (!semanticQuery.trim()) {
      return;
    }

    try {
      setSemanticLoading(true);
      const response = await api.get("/engineering-assistant/semantic-search", {
        params: {
          q: semanticQuery.trim(),
          limit: 8,
        },
      });
      setSemanticResults({
        sessions: response.data.sessions || [],
        memory: response.data.memory || [],
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Semantic search failed.");
    } finally {
      setSemanticLoading(false);
    }
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    setError("");

    if (
      !form.question.trim() &&
      !form.logs.trim() &&
      !form.repoManifest.trim() &&
      !form.configText.trim() &&
      files.length === 0
    ) {
      setError("Provide at least one signal: question, logs, repo/config text, or uploaded files.");
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    files.forEach((file) => payload.append("attachments", file));

    try {
      setLoading(true);
      const response = await api.post("/engineering-assistant/analyze", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAnalysis(response.data.analysis);
      setRelatedIssues(response.data.relatedIssues || []);
      setSelectedSession(response.data.session || null);
      await loadHistory();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Analysis failed. Please provide more deployment context.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenSession(sessionId) {
    try {
      const response = await api.get(`/engineering-assistant/sessions/${sessionId}`);
      setSelectedSession(response.data.session);
      setAnalysis({
        title: response.data.session.title,
        summary: response.data.session.summary,
        projectUnderstanding: response.data.session.detected_stack || {},
        deploymentAnalysis: { signals: response.data.session.detected_signals || [] },
        rootCause: response.data.session.root_cause || {},
        fixPlan: response.data.session.fix_plan || [],
        explanation: response.data.session.explanation || [],
      });
      setRelatedIssues([]);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to load this session.");
    }
  }

  return (
    <section className="space-y-6 fade-in">
      <Card accent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">AI Deployment Debugging Assistant</h1>
            <p className="mt-2 text-sm text-text/70">
              Upload logs, screenshots, repository snapshots, and config files. The assistant maps your stack, detects root cause,
              and generates deployment-ready fixes.
            </p>
          </div>
          <Badge tone="neon" className="self-start sm:self-auto">Signature Feature</Badge>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Step 1: Submit Project Data</h2>
          <form onSubmit={handleAnalyze} className="space-y-3" noValidate>
            <Input
              label="What is failing?"
              placeholder="Example: Backend crashes on Render after deployment"
              value={form.question}
              onChange={(event) => updateField("question", event.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Deployment platform"
                placeholder="Render, Vercel, Railway, Docker"
                value={form.deploymentPlatform}
                onChange={(event) => updateField("deploymentPlatform", event.target.value)}
              />
              <Input
                label="GitHub repository URL"
                placeholder="https://github.com/org/repo"
                value={form.repoUrl}
                onChange={(event) => updateField("repoUrl", event.target.value)}
              />
            </div>

            <Input
              as="textarea"
              inputClassName="min-h-32"
              label="Deployment logs"
              placeholder="Paste Render/Vercel/Railway/Docker logs here"
              value={form.logs}
              onChange={(event) => updateField("logs", event.target.value)}
            />

            <Input
              as="textarea"
              inputClassName="min-h-28"
              label="Repository structure or manifest"
              placeholder="Paste package.json, Docker setup, or project tree"
              value={form.repoManifest}
              onChange={(event) => updateField("repoManifest", event.target.value)}
            />

            <Input
              as="textarea"
              inputClassName="min-h-28"
              label="Config files"
              placeholder="Paste vercel.json, render.yaml, Dockerfile, env examples"
              value={form.configText}
              onChange={(event) => updateField("configText", event.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                as="textarea"
                inputClassName="min-h-24"
                label="Environment notes"
                placeholder="Mention known env vars and missing ones"
                value={form.environmentNotes}
                onChange={(event) => updateField("environmentNotes", event.target.value)}
              />
              <Input
                as="textarea"
                inputClassName="min-h-24"
                label="Screenshot notes"
                placeholder="Describe screenshot error details"
                value={form.screenshotNotes}
                onChange={(event) => updateField("screenshotNotes", event.target.value)}
              />
            </div>

            <Input
              as="textarea"
              inputClassName="min-h-20"
              label="Extra context"
              placeholder="Anything else the assistant should know"
              value={form.extraNotes}
              onChange={(event) => updateField("extraNotes", event.target.value)}
            />

            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <label htmlFor="assistant-files" className="text-sm font-medium text-text">Attachments</label>
              <p className="mt-1 text-xs text-text/60">Upload logs, screenshots, config files, or one zip archive (up to 12 files).</p>
              <input
                id="assistant-files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="mt-3 block w-full text-sm text-text/70 file:mr-3 file:rounded-lg file:border-0 file:bg-neon file:px-3 file:py-2 file:text-sm file:font-medium file:text-obsidian"
                accept=".txt,.log,.json,.yaml,.yml,.env,.md,.js,.jsx,.ts,.tsx,.py,.toml,.cfg,.conf,.zip,.png,.jpg,.jpeg,.webp"
              />
              {files.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-text/70">
                  {files.map((file) => (
                    <li key={`${file.name}-${file.size}`}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Analyzing project..." : "Run AI Deployment Analysis"}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">Semantic Engineering Search</h2>
            <form onSubmit={handleSemanticSearch} className="space-y-3">
              <Input
                label="Ask naturally"
                placeholder="Why is my backend crashing after deployment on Render?"
                value={semanticQuery}
                onChange={(event) => setSemanticQuery(event.target.value)}
              />
              <Button type="submit" variant="secondary" disabled={semanticLoading}>
                {semanticLoading ? "Searching..." : "Find Similar Issues"}
              </Button>
            </form>

            {(semanticResults.sessions.length > 0 || semanticResults.memory.length > 0) && (
              <div className="space-y-3">
                {semanticResults.sessions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Related Sessions</p>
                    {semanticResults.sessions.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleOpenSession(item.id)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:border-neon/40"
                      >
                        <p className="text-sm font-medium text-text">{item.title}</p>
                        <p className="mt-1 text-xs text-text/60 line-clamp-2">{item.summary}</p>
                      </button>
                    ))}
                  </div>
                )}

                {semanticResults.memory.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Matching Patterns</p>
                    {semanticResults.memory.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                        <p className="text-sm font-medium text-text">{item.issue_type}</p>
                        <p className="mt-1 text-xs text-text/60">{item.root_cause}</p>
                        <p className="mt-1 text-xs text-text/50">Seen {item.occurrence_count} time(s)</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">Engineering Memory</h2>
            {historyLoading ? (
              <p className="text-sm text-text/60">Loading memory graph...</p>
            ) : memory.length === 0 ? (
              <p className="text-sm text-text/60">No patterns learned yet. Run an analysis to start memory accumulation.</p>
            ) : (
              <div className="space-y-2">
                {memory.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-sm font-medium text-text">{item.issue_type}</p>
                    <p className="text-xs text-text/60 mt-1">{item.stack_signature}</p>
                    <p className="mt-1 text-xs text-text/60">Seen {item.occurrence_count} time(s)</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">Recent Debug Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-sm text-text/60">No sessions yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() => handleOpenSession(session.id)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:border-neon/40"
                  >
                    <p className="text-sm font-medium text-text">{session.title}</p>
                    <p className="mt-1 text-xs text-text/60 line-clamp-2">{session.summary}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {analysis && (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{analysis.title || "Deployment Analysis"}</h2>
            <Badge tone="pink">Confidence {analysis.confidence || analysis.rootCause?.confidence || 0}%</Badge>
          </div>

          <p className="text-sm text-text/80">{analysis.summary}</p>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Deployment Platform</p>
              <p className="mt-2 text-sm text-text">{analysis.projectUnderstanding?.deploymentPlatform || "Unknown"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Architecture</p>
              <p className="mt-2 text-sm text-text">{analysis.projectUnderstanding?.architecture?.style || "Unknown"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Detected Stack</p>
              <p className="mt-2 text-sm text-text">
                {(analysis.projectUnderstanding?.technologies || [])
                  .map((item) => item.name)
                  .join(", ") || "No stack detected"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-danger">Root Cause</p>
            <p className="mt-2 text-sm text-text">{analysis.rootCause?.actualCause || "No clear root cause found yet."}</p>
            {analysis.rootCause?.visibleSymptom && (
              <p className="mt-2 text-xs text-text/70">Visible symptom: {analysis.rootCause.visibleSymptom}</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Fix Plan</h3>
            {(analysis.fixPlan || []).length === 0 ? (
              <p className="text-sm text-text/60">No fix steps generated.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {analysis.fixPlan.map((fix, index) => (
                  <div key={`${fix.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-text">{fix.title}</p>
                    <p className="mt-1 text-sm text-text/75">{fix.action}</p>
                    <p className="mt-2 text-xs text-text/60">{fix.why}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Generated Config Suggestions</h3>
            {(analysis.generatedConfigs || []).length === 0 ? (
              <p className="text-sm text-text/60">No config snippets generated for this context.</p>
            ) : (
              <div className="space-y-3">
                {analysis.generatedConfigs.map((snippet) => (
                  <div key={snippet.type} className="rounded-2xl border border-white/10 bg-obsidian/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neon">{snippet.type}</p>
                    </div>
                    <p className="mt-1 text-xs text-text/60">{snippet.rationale}</p>
                    <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-text/90">
{snippet.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Explanation Layer</h3>
            {(analysis.explanation || []).map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-text">{item.title}</p>
                <p className="mt-2 text-sm text-text/75">{item.body}</p>
              </div>
            ))}
          </div>

          {relatedIssues.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Related Issue Intelligence</h3>
              <div className="space-y-2">
                {relatedIssues.map((issue) => (
                  <div key={issue.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm font-medium text-text">{issue.title}</p>
                    <p className="mt-1 text-xs text-text/60">{issue.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSession && (
            <p className="text-xs text-text/50">Session ID: {selectedSession.id} • Saved {new Date(selectedSession.created_at || Date.now()).toLocaleString()}</p>
          )}
        </Card>
      )}
    </section>
  );
}
