import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const laneOrder = ["OPEN", "IN_NEGOTIATION", "IN_PROGRESS", "COMPLETED", "DISPUTED"];

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState("");

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

  return (
    <section className="space-y-6 fade-in">
      <div className="card">
        <h1 className="text-2xl font-semibold">My Tasks - Creator Workspace</h1>
        <p className="text-sm text-ink/70 mt-1">Sprint 1 task lanes connected with Sprint 2 backend workflow.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {laneOrder.map((lane) => (
          <article key={lane} className="card">
            <h2 className="text-xs font-semibold tracking-wide text-ink/70">{lane.replaceAll("_", " ")}</h2>
            <div className="mt-3 space-y-3">
              {(laneMap[lane] || []).length === 0 && <p className="text-xs text-ink/50">No tasks</p>}
              {(laneMap[lane] || []).map((task) => (
                <div key={task.id} className="rounded-xl border border-ink/10 p-3 bg-white">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-ink/60 mt-1">Proposals: {task.proposal_count}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <article className="card">
        <h2 className="text-lg font-semibold">Proposal Inbox</h2>
        <p className="text-sm text-ink/70 mt-1">Review and accept/reject applications from solvers.</p>

        <div className="mt-4 space-y-3">
          {proposals.length === 0 && <p className="text-sm text-ink/60">No received proposals yet.</p>}
          {proposals.map((proposal) => (
            <div key={proposal.id} className="rounded-xl border border-ink/10 p-4 bg-white/80">
              <p className="text-sm font-semibold">{proposal.task_title}</p>
              <p className="text-xs text-ink/60 mt-1">
                Solver: {proposal.solver_name} | Bid: Rs {proposal.bid_amount} | Status: {proposal.status}
              </p>
              <p className="text-sm text-ink/80 mt-2">{proposal.message}</p>

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
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
