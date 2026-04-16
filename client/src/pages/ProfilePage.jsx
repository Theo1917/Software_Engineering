import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get("/profile/me");
        setProfile(response.data);
        setSkillsInput((response.data.user.skills || []).join(", "));
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Unable to load profile");
      }
    }

    fetchProfile();
  }, []);

  async function handleUpdateSkills(event) {
    event.preventDefault();
    setError("");

    try {
      const nextSkills = skillsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await api.put("/profile/me/skills", { skills: nextSkills });
      setProfile((prev) => ({ ...prev, user: response.data.user }));
      setSkillsInput((response.data.user.skills || []).join(", "));
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to update skills");
    }
  }

  const analytics = profile?.analytics;

  return (
    <section className="space-y-5 fade-in">
      <article className="card">
        <h1 className="text-2xl font-semibold">{profile?.user?.name || user?.name}</h1>
        <p className="text-sm text-ink/70 mt-1">{profile?.user?.email || user?.email}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(profile?.user?.skills || user?.skills || []).map((skill) => (
            <span key={skill} className="px-3 py-1 rounded-full bg-mint/10 text-mint text-xs">
              {skill}
            </span>
          ))}
        </div>

        <form onSubmit={handleUpdateSkills} className="mt-4 space-y-2">
          <label className="text-xs uppercase tracking-wide text-ink/60">Skill Tag Management</label>
          <input
            className="input"
            value={skillsInput}
            onChange={(event) => setSkillsInput(event.target.value)}
            placeholder="React, Node.js, PostgreSQL"
          />
          <button className="btn-secondary" type="submit">
            Save Skills
          </button>
        </form>
      </article>

      {analytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Tasks Created" value={analytics.tasks_created} />
          <MetricCard label="Tasks Completed" value={analytics.tasks_completed} />
          <MetricCard label="Tasks Disputed" value={analytics.tasks_disputed} />
          <MetricCard label="Proposals Submitted" value={analytics.proposals_submitted} />
          <MetricCard label="Proposals Accepted" value={analytics.proposals_accepted} />
          <MetricCard label="Reputation" value={profile.user.reputation} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="card">
      <p className="text-xs uppercase tracking-wide text-ink/60">{label}</p>
      <p className="text-3xl font-bold mt-2">{value ?? 0}</p>
    </article>
  );
}
