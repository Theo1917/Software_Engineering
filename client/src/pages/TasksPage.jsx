import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Input from "../components/Input";

const initialTaskForm = {
  title: "",
  description: "",
  techStack: "",
  difficulty: "INTERMEDIATE",
  budget: "",
  deadline: "",
  teamId: null,
};

export default function TasksPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [savedTasks, setSavedTasks] = useState([]);
  const [recommendedTasks, setRecommendedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialTaskForm);
  const [submitted, setSubmitted] = useState(false);
  const [filters, setFilters] = useState({ skill: "", difficulty: "", minBudget: "", maxBudget: "" });
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState([]);

  async function fetchTasks(nextFilters = filters, nextSearch = search) {
    setLoading(true);
    setError("");

    try {
      const params = {};
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      if (nextSearch.trim()) {
        params.q = nextSearch.trim();
      }

      const response = await api.get("/tasks", { params });
      setTasks(response.data.tasks);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
    fetchDiscoveryLists();
    if (isAuthenticated) {
      fetchUserTeams();
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setMyProposals([]);
      return;
    }

    async function fetchMyProposals() {
      try {
        const response = await api.get("/tasks/mine/proposals");
        setMyProposals(response.data.proposals || []);
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Unable to load proposals");
      }
    }

    fetchMyProposals();
  }, [isAuthenticated]);

  async function fetchDiscoveryLists() {
    if (!isAuthenticated) {
      setSavedTasks([]);
      setRecommendedTasks([]);
      return;
    }

    try {
      const [savedResponse, recommendedResponse] = await Promise.all([
        api.get("/tasks/saved"),
        api.get("/tasks/recommended"),
      ]);

      setSavedTasks(savedResponse.data.tasks || []);
      setRecommendedTasks(recommendedResponse.data.tasks || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to load saved or recommended tasks");
    }
  }

  async function fetchUserTeams() {
    try {
      const response = await api.get("/teams");
      setTeams(response.data.teams || []);
    } catch (apiError) {
      console.error("Unable to load teams:", apiError);
    }
  }

  async function openTask(taskId) {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setSelectedTask(response.data.task);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to load task detail");
    }
  }

  async function toggleSavedTask(taskId) {
    try {
      await api.post(`/tasks/${taskId}/save`);
      await fetchDiscoveryLists();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to update saved tasks");
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setSubmitted(true);
    setError("");

    if (!form.title.trim() || !form.description.trim() || !form.budget || !form.deadline) {
      setError("Please complete the required task fields.");
      return;
    }

    try {
      await api.post("/tasks", {
        title: form.title,
        description: form.description,
        techStack: form.techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        difficulty: form.difficulty,
        budget: Number(form.budget),
        deadline: form.deadline,
        teamId: form.teamId ? Number(form.teamId) : null,
      });

      setForm(initialTaskForm);
      fetchTasks();
      fetchDiscoveryLists();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to create task");
    }
  }

  async function handleApply(taskId) {
    const message = window.prompt("Proposal message");
    const bid = window.prompt("Bid amount");

    if (!message || !bid) {
      return;
    }

    try {
      await api.post(`/tasks/${taskId}/proposals`, {
        message,
        bidAmount: Number(bid),
      });
      window.alert("Proposal submitted");
      const proposalResponse = await api.get("/tasks/mine/proposals");
      setMyProposals(proposalResponse.data.proposals || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to submit proposal");
    }
  }

  const savedTaskIds = new Set(savedTasks.map((savedTask) => savedTask.id));

  return (
    <section className="space-y-6 fade-in">
      <Card>
        <h1 className="text-2xl font-semibold">Task Board</h1>
        <p className="text-sm text-text/70 mt-1">Open opportunities from the community.</p>

        <div className="grid gap-2 sm:grid-cols-5 mt-4">
          <Input
            className="sm:col-span-2"
            label="Search tasks"
            placeholder="Search title, description, or tech stack"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Input
            label="Skill"
            placeholder="Skill"
            value={filters.skill}
            onChange={(event) => setFilters((prev) => ({ ...prev, skill: event.target.value }))}
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text">Difficulty</span>
            <select
              className="input"
              value={filters.difficulty}
              onChange={(event) => setFilters((prev) => ({ ...prev, difficulty: event.target.value }))}
            >
            <option value="">Any Difficulty</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            </select>
          </label>
          <Input
            label="Min budget"
            type="number"
            min="0"
            placeholder="Min Budget"
            value={filters.minBudget}
            onChange={(event) => setFilters((prev) => ({ ...prev, minBudget: event.target.value }))}
          />
          <Input
            label="Max budget"
            type="number"
            min="0"
            placeholder="Max Budget"
            value={filters.maxBudget}
            onChange={(event) => setFilters((prev) => ({ ...prev, maxBudget: event.target.value }))}
          />
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={fetchTasks}>Apply Filters</Button>
          <Button variant="secondary" onClick={() => { const clearedFilters = { skill: "", difficulty: "", minBudget: "", maxBudget: "" }; setSearch(""); setFilters(clearedFilters); fetchTasks(clearedFilters, ""); }}>Reset</Button>
        </div>
      </Card>

      {isAuthenticated && (
        <form onSubmit={handleCreateTask} className="card space-y-3">
          <h2 className="text-lg font-semibold">Create Task</h2>
          <Input
            label="Task title"
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            error={submitted && !form.title.trim() ? "Title is required" : ""}
            required
          />
          <Input
            as="textarea"
            label="Description"
            inputClassName="min-h-24"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            error={submitted && !form.description.trim() ? "Description is required" : ""}
            required
          />
          <Input
            label="Tech stack"
            placeholder="Tech Stack (comma separated)"
            value={form.techStack}
            onChange={(event) => setForm((prev) => ({ ...prev, techStack: event.target.value }))}
            hint="Optional. Separate technologies with commas."
          />
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text">Difficulty</span>
              <select
                className="input"
                value={form.difficulty}
                onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </label>
            <Input
              label="Budget"
              type="number"
              min="0"
              placeholder="Budget"
              value={form.budget}
              onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
              error={submitted && !form.budget ? "Budget is required" : ""}
              required
            />
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
              error={submitted && !form.deadline ? "Deadline is required" : ""}
              required
            />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text">Team</span>
              <select
                className="input"
                value={form.teamId || ""}
                onChange={(event) => setForm((prev) => ({ ...prev, teamId: event.target.value || null }))}
              >
                <option value="">Personal Task</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button variant="primary" type="submit">Publish Task</Button>
        </form>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {isAuthenticated && (
        <article className="card">
          <h2 className="text-lg font-semibold">My Submitted Proposals</h2>
          <p className="text-sm text-ink/70 mt-1">Sprint 1 solver-side tracking connected to the Sprint 2 pipeline.</p>
          <div className="mt-3 space-y-2">
            {myProposals.length === 0 && <p className="text-sm text-ink/60">No proposals submitted yet.</p>}
            {myProposals.map((proposal) => (
              <div key={proposal.id} className="rounded-xl border border-ink/10 p-3 bg-white">
                <p className="text-sm font-medium">{proposal.title}</p>
                <p className="text-xs text-ink/60 mt-1">
                  Bid: Rs {proposal.bid_amount} | Proposal: {proposal.status} | Task: {proposal.task_status}
                </p>
              </div>
            ))}
          </div>
        </article>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
        {loading ? (
          <p className="text-text/70">Loading tasks...</p>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  {task.team_name && (
                    <p className="text-xs text-cyan-400 mt-1">👥 Team: {task.team_name}</p>
                  )}
                </div>
                <Badge className="text-xs" tone="neon">{task.status}</Badge>
              </div>
              <p className="text-sm text-text/80 mt-2">{task.description}</p>
              <p className="text-xs text-text/60 mt-3">Creator: {task.creator_name} | Difficulty: {task.difficulty} | Budget: Rs {task.budget}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(task.tech_stack || []).map((skill) => (
                  <Badge key={skill} className="text-xs" tone="neutral">{skill}</Badge>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => navigate(`/task/${task.id}`)}>View Detail</Button>
                {isAuthenticated ? (
                  <>
                    <Button variant="primary" onClick={() => handleApply(task.id)}>Submit Proposal</Button>
                    <Button variant="secondary" onClick={() => toggleSavedTask(task.id)}>{savedTaskIds.has(task.id) ? "Unsave" : "Save Task"}</Button>
                  </>
                ) : (
                  <Link to="/login"><Button variant="secondary">Login to Apply</Button></Link>
                )}
              </div>
            </Card>
          ))
        )}
        </div>

        <aside className="card h-fit">
          <h2 className="text-lg font-semibold">Task Detail Panel</h2>
          {!selectedTask ? (
            <p className="text-sm text-text/70 mt-3">Select a task to view complete details.</p>
          ) : (
            <div className="mt-3 space-y-2">
              <h3 className="font-semibold">{selectedTask.title}</h3>
              <p className="text-sm text-text/80">{selectedTask.description}</p>
              <p className="text-xs text-text/60">
                Difficulty: {selectedTask.difficulty} | Budget: Rs {selectedTask.budget} | Deadline: {selectedTask.deadline}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {(selectedTask.tech_stack || []).map((skill) => (
                  <span key={skill} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-6 space-y-4 border-t border-white/10 pt-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Recommended Tasks</h3>
                  <span className="text-xs text-muted">{recommendedTasks.length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {recommendedTasks.length === 0 ? (
                    <p className="text-sm text-text/60">No recommendations yet.</p>
                  ) : (
                    recommendedTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="w-full rounded-xl border border-white/10 bg-surface/80 p-3 text-left hover:border-neon/30"
                        onClick={() => openTask(task.id)}
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-text/60 mt-1">Match score: {task.match_score ?? 0}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Saved Tasks</h3>
                  <span className="text-xs text-muted">{savedTasks.length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {savedTasks.length === 0 ? (
                    <p className="text-sm text-text/60">No saved tasks yet.</p>
                  ) : (
                    savedTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="w-full rounded-xl border border-white/10 bg-surface/80 p-3 text-left hover:border-neon/30"
                        onClick={() => openTask(task.id)}
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-text/60 mt-1">Rs {task.budget} | {task.status}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
