import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const initialTaskForm = {
  title: "",
  description: "",
  techStack: "",
  difficulty: "INTERMEDIATE",
  budget: "",
  deadline: "",
};

export default function TasksPage() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialTaskForm);
  const [filters, setFilters] = useState({ skill: "", difficulty: "", minBudget: "", maxBudget: "" });

  async function fetchTasks() {
    setLoading(true);
    setError("");

    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

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

  async function openTask(taskId) {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setSelectedTask(response.data.task);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to load task detail");
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setError("");

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
      });

      setForm(initialTaskForm);
      fetchTasks();
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

  return (
    <section className="space-y-6 fade-in">
      <div className="card">
        <h1 className="text-2xl font-semibold">Task Board</h1>
        <p className="text-sm text-ink/70 mt-1">Open opportunities from the community.</p>

        <div className="grid gap-2 sm:grid-cols-4 mt-4">
          <input
            className="input"
            placeholder="Skill"
            value={filters.skill}
            onChange={(event) => setFilters((prev) => ({ ...prev, skill: event.target.value }))}
          />
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
          <input
            className="input"
            type="number"
            min="0"
            placeholder="Min Budget"
            value={filters.minBudget}
            onChange={(event) => setFilters((prev) => ({ ...prev, minBudget: event.target.value }))}
          />
          <input
            className="input"
            type="number"
            min="0"
            placeholder="Max Budget"
            value={filters.maxBudget}
            onChange={(event) => setFilters((prev) => ({ ...prev, maxBudget: event.target.value }))}
          />
        </div>

        <button className="btn-secondary mt-3" onClick={fetchTasks}>
          Apply Filters
        </button>
      </div>

      {isAuthenticated && (
        <form onSubmit={handleCreateTask} className="card space-y-3">
          <h2 className="text-lg font-semibold">Create Task</h2>
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <textarea
            className="input min-h-24"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Tech Stack (comma separated)"
            value={form.techStack}
            onChange={(event) => setForm((prev) => ({ ...prev, techStack: event.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="input"
              value={form.difficulty}
              onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="Budget"
              value={form.budget}
              onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
              required
            />
            <input
              className="input"
              type="date"
              value={form.deadline}
              onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
              required
            />
          </div>

          <button className="btn-primary" type="submit">
            Publish Task
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

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
          <p className="text-ink/70">Loading tasks...</p>
        ) : (
          tasks.map((task) => (
            <article key={task.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <span className="px-3 py-1 rounded-full bg-mint/15 text-mint text-xs">{task.status}</span>
              </div>
              <p className="text-sm text-ink/80 mt-2">{task.description}</p>
              <p className="text-xs text-ink/60 mt-3">
                Creator: {task.creator_name} | Difficulty: {task.difficulty} | Budget: Rs {task.budget}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(task.tech_stack || []).map((skill) => (
                  <span key={skill} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={() => openTask(task.id)}>
                  View Detail
                </button>
                {isAuthenticated ? (
                  <button className="btn-primary" onClick={() => handleApply(task.id)}>
                    Submit Proposal
                  </button>
                ) : (
                  <Link className="btn-secondary" to="/login">
                    Login to Apply
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
        </div>

        <aside className="card h-fit">
          <h2 className="text-lg font-semibold">Task Detail Panel</h2>
          {!selectedTask ? (
            <p className="text-sm text-ink/70 mt-3">Select a task to view complete details.</p>
          ) : (
            <div className="mt-3 space-y-2">
              <h3 className="font-semibold">{selectedTask.title}</h3>
              <p className="text-sm text-ink/80">{selectedTask.description}</p>
              <p className="text-xs text-ink/60">
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
        </aside>
      </div>
    </section>
  );
}
