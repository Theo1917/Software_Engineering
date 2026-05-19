import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const intendedPath = location.state?.from?.pathname || "/profile";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate(intendedPath, { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-md mx-auto card fade-in">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-text/70 mt-1">Access your Sprint 2 account</p>
      {location.state?.from?.pathname && (
        <p className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-neon">
          Sign in to continue to {location.state.from.pathname}
        </p>
      )}

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

        {error && <p className="text-sm text-danger">{error}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link to="/login" className="text-muted hover:text-text">
            Retry
          </Link>
          <Link to="/forgot-password" className="text-danger font-semibold">
            Forgot password?
          </Link>
        </div>
      </form>

      <p className="text-sm mt-4 text-text/75">
        No account? <Link to="/register" className="text-danger font-semibold">Register</Link>
      </p>
    </section>
  );
}
