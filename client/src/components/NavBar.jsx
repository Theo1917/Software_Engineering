import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

function navClass({ isActive }) {
  return `px-3 py-2 rounded-full text-sm transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian ${
    isActive
      ? "bg-neon text-obsidian shadow-[0_0_18px_rgba(0,255,102,0.28)]"
      : "text-text/75 hover:bg-surface/80 hover:text-text hover:-translate-y-0.5"
  }`;
}

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-obsidian/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-1 rounded-full bg-gradient-to-b from-neon to-danger" />
          <Link to="/" className="leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian rounded-lg">
            <p className="text-xs uppercase tracking-[0.28em] text-muted">Community Forum</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-text">Amrita Community Forum</p>
          </Link>
        </div>

        <div className="hidden xl:block text-xs uppercase tracking-[0.26em] text-muted">
          A place to build, review, and ship work with intent
        </div>

        <nav className="flex w-full flex-wrap items-center gap-2 overflow-x-auto pb-1 xl:w-auto xl:justify-end xl:overflow-visible xl:pb-0">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>
          <NavLink to="/tasks" className={navClass}>
            Tasks
          </NavLink>
          <NavLink to="/search" className={navClass}>
            🔍 Search
          </NavLink>
          <NavLink to="/trending" className={navClass}>
            🔥 Trending
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/recommendations" className={navClass}>
              ✨ For You
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/my-tasks" className={navClass}>
              My Tasks
            </NavLink>
          )}
          <NavLink to="/tech-news" className={navClass}>
            Tech News
          </NavLink>
          <NavLink to="/discussions" className={navClass}>
            Discussions
          </NavLink>
          <NavLink to="/knowledge-base" className={navClass}>
            Knowledge Base
          </NavLink>
          <NavLink to="/deployment-assistant" className={navClass}>
            AI Debug
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/notifications" className={navClass}>
                📢 Notifications
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
              <NavLink to="/teams" className={navClass}>
                Teams
              </NavLink>
              {user?.isAdmin && (
                <NavLink to="/admin" className={navClass}>
                  Admin Panel
                </NavLink>
              )}
            </>
          )}

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={navClass}>
                Register
              </NavLink>
            </>
          ) : (
            <Button variant="danger" onClick={logout}>
              Logout {user?.name ? `(${user.name})` : ""}
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
