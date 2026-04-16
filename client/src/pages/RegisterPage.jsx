import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", skills: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });
      navigate("/profile");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-md mx-auto card fade-in">
      <h1 className="text-2xl font-semibold">Register</h1>
      <p className="text-sm text-ink/70 mt-1">Create your community account</p>

      <form onSubmit={handleSubmit} className="space-y-3 mt-5">
        <input
          className="input"
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
        <input
          className="input"
          type="text"
          placeholder="Skills (comma separated)"
          value={form.skills}
          onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="text-sm mt-4 text-ink/75">
        Already registered? <Link to="/login" className="text-ember font-semibold">Login</Link>
      </p>
    </section>
  );
}
