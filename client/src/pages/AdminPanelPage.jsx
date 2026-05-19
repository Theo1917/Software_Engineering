import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const tabs = ["dashboard", "tasks", "users", "disputes", "flagged", "logs"];

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [statsResponse, usersResponse, tasksResponse, disputesResponse, flagsResponse, logsResponse] =
        await Promise.all([
          api.get("/admin/dashboard/stats"),
          api.get("/admin/users?limit=20"),
          api.get("/admin/tasks?limit=25"),
          api.get("/admin/disputes?limit=25"),
          api.get("/admin/flagged-content?limit=25"),
          api.get("/admin/system-logs?limit=40"),
        ]);

      setStats(statsResponse.data);
      setUsers(usersResponse.data.users || []);
      setTasks(tasksResponse.data.tasks || []);
      setDisputes(disputesResponse.data.disputes || []);
      setFlaggedContent(flagsResponse.data.content || []);
      setLogs(logsResponse.data.logs || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspendUser(userId, reason) {
    try {
      await api.post(`/admin/users/${userId}/suspend`, {
        reason,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to suspend user");
    }
  }

  async function handleUnsuspendUser(userId) {
    try {
      await api.post(`/admin/users/${userId}/unsuspend`);
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unsuspend user");
    }
  }

  async function handleDeletePost(postId) {
    if (!window.confirm("Delete this post?")) return;

    try {
      await api.delete(`/admin/posts/${postId}`, { data: { reason: "Admin moderation" } });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete post");
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await api.delete(`/admin/comments/${commentId}`, { data: { reason: "Admin moderation" } });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete comment");
    }
  }

  async function handleResolveDispute(disputeId, resolution) {
    try {
      await api.patch(`/admin/disputes/${disputeId}/resolve`, {
        resolution,
        resolutionNotes: "Resolved by admin",
      });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve dispute");
    }
  }

  return (
    <section className="space-y-6 fade-in">
      <div className="card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-text/70 mt-1">Monitoring, moderation, and platform analytics</p>
          </div>
          <button className="btn-secondary" onClick={loadDashboard} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="card">
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab ? "bg-neon text-obsidian" : "bg-white/5 text-text/70 hover:bg-white/10"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-text/60">Loading admin data...</p>}

      {activeTab === "dashboard" && stats && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={stats.total_users} />
          <StatCard label="Total Tasks" value={stats.total_tasks} />
          <StatCard label="Completed Tasks" value={stats.completed_tasks} tone="green" />
          <StatCard label="Open Disputes" value={stats.open_disputes} tone="red" />
          <StatCard label="Flagged Content" value={stats.flagged_content} tone="amber" />
          <StatCard label="Suspended Users" value={stats.suspended_users} />
          <StatCard label="Total Posts" value={stats.total_posts} />
          <StatCard label="Total Comments" value={stats.total_comments} />
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Task Overview</h2>
            <span className="text-xs uppercase tracking-wide text-muted">Latest {tasks.length} records</span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 bg-surface/80 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-xs text-text/60 mt-1">
                      Creator: {task.creator_name} | Solver: {task.solver_name || "Unassigned"}
                    </p>
                    <p className="text-xs text-text/60 mt-1">
                      Budget Rs {task.budget} | Difficulty {task.difficulty} | Due {task.deadline}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-danger/15 px-3 py-1 text-xs text-danger">
                      {task.status}
                    </span>
                    <button className="btn-secondary text-xs" onClick={() => navigate(`/task/${task.id}`)}>
                      Open
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-text/60">
                  <span>Proposals: {task.proposal_count}</span>
                  <span>Disputes: {task.dispute_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Users</h2>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-white/10 bg-surface/80 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-text/60">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-neon/15 px-2 py-1 text-neon">Reputation {user.reputation}</span>
                      <span className="rounded-full bg-neon/10 px-2 py-1 text-neon">
                        {user.tasks_completed} completed
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-1 text-text/70">
                        Rating {Number(user.average_rating || 0).toFixed(2)}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-1 text-muted">
                        {user.moderation_status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const reason = window.prompt("Enter suspension reason:");
                        if (reason) handleSuspendUser(user.id, reason);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Suspend
                    </button>
                    {user.moderation_status === "SUSPENDED" && (
                      <button onClick={() => handleUnsuspendUser(user.id)} className="btn-secondary text-sm">
                        Unsuspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "disputes" && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Dispute Log</h2>
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="rounded-2xl border border-danger/20 bg-danger/10 p-4">
                <p className="font-medium">{dispute.task_title}</p>
                <p className="text-sm text-text/70 mt-1">Raised by: {dispute.raised_by_name}</p>
                <p className="text-sm text-text/80 mt-2">{dispute.reason}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleResolveDispute(dispute.id, "RESOLVED")} className="btn-primary text-sm">
                    Resolve
                  </button>
                  <button onClick={() => handleResolveDispute(dispute.id, "REJECTED")} className="btn-secondary text-sm">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "flagged" && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Community Moderation</h2>
          <div className="space-y-3">
            {flaggedContent.map((content) => (
              <div key={content.id} className="rounded-2xl border border-danger/20 bg-danger/10 p-4">
                <p className="text-xs text-text/60">Reported by: {content.reporter_name}</p>
                <p className="mt-1 font-medium">Reason: {content.reason}</p>
                {content.post_title && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold">Post: {content.post_title}</p>
                    <p className="text-sm text-text/70">{content.post_content}</p>
                    <button className="btn-primary text-sm" onClick={() => handleDeletePost(content.post_id)}>
                      Delete Post
                    </button>
                  </div>
                )}
                {content.comment_content && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold">Comment</p>
                    <p className="text-sm text-text/70">{content.comment_content}</p>
                    <button className="btn-primary text-sm" onClick={() => handleDeleteComment(content.comment_id)}>
                      Delete Comment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">System Logs</h2>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-surface/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-text/60">{new Date(log.created_at).toLocaleString()}</p>
                </div>
                <p className="text-xs text-text/60 mt-1">
                  {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ""} {log.ip_address ? `| ${log.ip_address}` : ""}
                </p>
                {log.details && <pre className="mt-2 overflow-auto rounded-xl bg-white/5 p-3 text-xs text-text">{JSON.stringify(log.details, null, 2)}</pre>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-white/5 border-white/10",
    green: "bg-neon/10 border-neon/20",
    red: "bg-danger/10 border-danger/20",
    amber: "bg-danger/10 border-danger/20",
  };

  return (
    <article className={`card border ${tones[tone] || tones.slate}`}>
      <p className="text-sm text-text/60">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? 0}</p>
    </article>
  );
}
