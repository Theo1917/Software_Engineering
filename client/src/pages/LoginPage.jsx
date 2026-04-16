import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate("/profile");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-md mx-auto card fade-in">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-ink/70 mt-1">Access your Sprint 2 account</p>

      <form onSubmit={handleSubmit} className="space-y-3 mt-5">
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-sm mt-4 text-ink/75">
        No account? <Link to="/register" className="text-ember font-semibold">Register</Link>
      </p>
    </section>
  );
}
