import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

const laneOrder = ["OPEN", "IN_NEGOTIATION", "IN_PROGRESS", "COMPLETED", "DISPUTED"];

const initialTaskForm = {
  title: "",
  description: "",
  techStack: "",
  difficulty: "INTERMEDIATE",
  budget: "",
  deadline: "",
};

export default function MyTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [form, setForm] = useState(initialTaskForm);

  async function fetchWorkspaceData() {
    setError("");
    try {
      const [tasksResponse, proposalsResponse] = await Promise.all([
        api.get("/tasks/mine/created"),
        api.get("/tasks/mine/received-proposals"),
      ]);

      setTasks(tasksResponse.data.tasks || []);
      setProposals(proposalsResponse.data.proposals || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to load creator workspace");
    }
  }

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const laneMap = useMemo(() => {
    const map = {};
    laneOrder.forEach((status) => {
      map[status] = tasks.filter((task) => task.status === status);
    });
    return map;
  }, [tasks]);

  async function handleProposalAction(proposalId, status) {
    try {
      await api.patch(`/tasks/proposals/${proposalId}`, { status });
      fetchWorkspaceData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to update proposal");
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/tasks", {
        title: form.title,
        description: form.description,
        techStack: form.techStack
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean),
        difficulty: form.difficulty,
        budget: Number(form.budget),
        deadline: form.deadline,
      });

      setForm(initialTaskForm);
      setShowCreateForm(false);
      fetchWorkspaceData();
      alert("Task created successfully!");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to create task");
    }
  }

  async function handleEditTask(e) {
    e.preventDefault();
    setError("");

    try {
      await api.patch(`/tasks/${editingTaskId}`, {
        title: form.title,
        description: form.description,
        techStack: form.techStack
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean),
        difficulty: form.difficulty,
        budget: Number(form.budget),
        deadline: form.deadline,
      });

      setForm(initialTaskForm);
      setEditingTaskId(null);
      fetchWorkspaceData();
      alert("Task updated successfully!");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to update task");
    }
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      fetchWorkspaceData();
      alert("Task deleted successfully!");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to delete task");
    }
  }

  function handleEditClick(task) {
    setForm({
      title: task.title,
      description: task.description,
      techStack: (task.tech_stack || []).join(", "),
      difficulty: task.difficulty,
      budget: task.budget,
      deadline: task.deadline,
    });
    setEditingTaskId(task.id);
  }

  function cancelEdit() {
    setForm(initialTaskForm);
    setEditingTaskId(null);
    setShowCreateForm(false);
  }

  return (
    <section className="space-y-6 fade-in">
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">My Tasks - Creator Workspace</h1>
            <p className="text-sm text-text/70 mt-1">Sprint 1 task lanes connected with Sprint 2 backend workflow.</p>
          </div>
          {!editingTaskId && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary"
            >
              {showCreateForm ? "Cancel" : "+ New Task"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Create/Edit Task Form */}
      {(showCreateForm || editingTaskId) && (
        <form onSubmit={editingTaskId ? handleEditTask : handleCreateTask} className="card space-y-3">
          <h2 className="text-lg font-semibold">{editingTaskId ? "Edit Task" : "Create New Task"}</h2>
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            className="input min-h-24"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Tech Stack (comma separated)"
            value={form.techStack}
            onChange={(e) => setForm({ ...form, techStack: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="input"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
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
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              required
            />
            <input
              className="input"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              {editingTaskId ? "Update Task" : "Create Task"}
            </button>
            <button type="button" onClick={cancelEdit} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task Lanes */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {laneOrder.map((lane) => (
          <article key={lane} className="card">
            <h2 className="text-xs font-semibold tracking-wide text-text/70">{lane.replaceAll("_", " ")}</h2>
            <div className="mt-3 space-y-3">
              {(laneMap[lane] || []).length === 0 && <p className="text-xs text-muted">No tasks</p>}
              {(laneMap[lane] || []).map((task) => (
                <div key={task.id} className="rounded-xl border border-white/10 p-3 bg-surface/80">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-text/60 mt-1">Proposals: {task.proposal_count}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {task.status === "OPEN" && (
                      <>
                        <button
                          onClick={() => handleEditClick(task)}
                          className="text-xs px-2 py-1 bg-neon/15 text-neon rounded hover:bg-neon/25"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-xs px-2 py-1 bg-danger/15 text-danger rounded hover:bg-danger/25"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigate(`/task/${task.id}`)}
                      className="text-xs px-2 py-1 bg-white/5 text-text/70 rounded hover:bg-white/10"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Proposal Inbox */}
      <article className="card">
        <h2 className="text-lg font-semibold">Proposal Inbox</h2>
        <p className="text-sm text-text/70 mt-1">Review and accept/reject applications from solvers.</p>

        <div className="mt-4 space-y-3">
          {proposals.length === 0 && <p className="text-sm text-text/60">No received proposals yet.</p>}
          {proposals.map((proposal) => (
            <div key={proposal.id} className="rounded-xl border border-white/10 p-4 bg-surface/80">
              <p className="text-sm font-semibold">{proposal.task_title}</p>
              <p className="text-xs text-text/60 mt-1">
                Solver: {proposal.solver_name} | Bid: Rs {proposal.bid_amount} | Status: {proposal.status}
              </p>
              <p className="text-sm text-text/80 mt-2">{proposal.message}</p>

              {proposal.status === "SUBMITTED" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn-primary" onClick={() => handleProposalAction(proposal.id, "ACCEPTED")}>
                    Accept
                  </button>
                  <button className="btn-secondary" onClick={() => handleProposalAction(proposal.id, "REJECTED")}>
                    Reject
                  </button>
                </div>
              )}

              {proposal.status === "ACCEPTED" && (
                <button
                  onClick={() => navigate(`/task/${proposal.task_id}`)}
                  className="btn-primary mt-3"
                >
                  View Task & Negotiate
                </button>
              )}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
