import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function navClass({ isActive }) {
  return `px-3 py-2 rounded-full text-sm transition ${
    isActive ? "bg-ink text-white" : "text-ink/80 hover:bg-white"
  }`;
}

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-white/75 border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="font-bold text-lg tracking-tight text-ink">
          Amrita Community Forum
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>
          <NavLink to="/tasks" className={navClass}>
            Tasks
          </NavLink>
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
          {isAuthenticated && (
            <NavLink to="/profile" className={navClass}>
              Profile
            </NavLink>
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
            <button
              onClick={logout}
              className="px-3 py-2 rounded-full text-sm bg-ember text-white hover:bg-orange-600"
            >
              Logout {user?.name ? `(${user.name})` : ""}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
