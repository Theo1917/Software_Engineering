import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const intendedPath = location.state?.from?.pathname || "/profile";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
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

      <form noValidate onSubmit={handleSubmit} className="space-y-3 mt-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          error={submitted && !form.email ? "Email is required" : ""}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          error={submitted && !form.password ? "Password is required" : ""}
          required
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

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
