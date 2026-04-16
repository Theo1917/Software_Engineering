import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <section className="space-y-8 fade-in">
      <div className="card overflow-hidden relative">
        <div className="absolute -right-16 -top-10 h-40 w-40 rounded-full bg-ember/20 blur-2xl" />
        <div className="absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-mint/20 blur-2xl" />

        <h1 className="text-3xl sm:text-4xl font-bold leading-tight max-w-3xl">
          Sprint 2 Platform: a structured tech community blending discussion depth with task execution.
        </h1>
        <p className="mt-4 text-ink/75 max-w-2xl">
          Ask precise technical questions, post solution-ready tasks, collaborate through proposals, and build
          verified reputation over time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/tasks" className="btn-primary">
            Explore Tasks
          </Link>
          <Link to="/my-tasks" className="btn-secondary">
            Creator Workspace
          </Link>
          <Link to="/tech-news" className="btn-secondary">
            Tech News Feed
          </Link>
          <Link to="/discussions" className="btn-secondary">
            Join Discussions
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="card">
          <h2 className="font-semibold text-lg">Task Marketplace</h2>
          <p className="text-sm text-ink/75 mt-2">Creator and solver flows with status tracking and proposal management.</p>
        </article>
        <article className="card">
          <h2 className="font-semibold text-lg">Discussion Engine</h2>
          <p className="text-sm text-ink/75 mt-2">Post in categories, vote quality up/down, and build threaded conversation quality.</p>
        </article>
        <article className="card">
          <h2 className="font-semibold text-lg">Profile Analytics</h2>
          <p className="text-sm text-ink/75 mt-2">Track tasks created, completed, disputes, and proposal acceptance metrics.</p>
        </article>
      </div>
    </section>
  );
}
