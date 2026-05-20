import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", skills: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
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
      <p className="text-sm text-text/70 mt-1">Create your community account</p>

      <form noValidate onSubmit={handleSubmit} className="space-y-3 mt-5">
        <Input
          label="Name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          error={submitted && !form.name ? "Name is required" : ""}
          required
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          error={submitted && !form.password ? "Password is required" : ""}
          required
        />
        <Input
          label="Skills"
          type="text"
          autoComplete="off"
          value={form.skills}
          onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
          hint="Optional. Separate skills with commas."
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </Button>
      </form>

      <p className="text-sm mt-4 text-text/75">
        Already registered? <Link to="/login" className="text-danger font-semibold">Login</Link>
      </p>
    </section>
  );
}
