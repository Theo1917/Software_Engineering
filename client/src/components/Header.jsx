import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { navItems } from "./navItems";
import { navClass } from "./navClass";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-obsidian via-surface to-obsidian text-text shadow-card border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-2xl font-bold text-neon">
          Amrita Forum
        </Link>
        {/* Desktop navigation */}
        <nav className="hidden lg:flex space-x-4">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <>
              <NavLink to="/recommendations" className={navClass}>✨ For You</NavLink>
              <NavLink to="/my-tasks" className={navClass}>My Tasks</NavLink>
            </>
          )}
          {isAuthenticated && (
            <>
              <NavLink to="/notifications" className={navClass}>📢 Notifications</NavLink>
              <NavLink to="/profile" className={navClass}>Profile</NavLink>
              <NavLink to="/teams" className={navClass}>Teams</NavLink>
              {user?.isAdmin && <NavLink to="/admin" className={navClass}>Admin Panel</NavLink>}
            </>
          )}
          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navClass}>Login</NavLink>
              <NavLink to="/register" className={navClass}>Register</NavLink>
            </>
          ) : (
            <Button variant="danger" onClick={logout}>
              Logout {user?.name ? `(${user.name})` : ""}
            </Button>
          )}
        </nav>
        {/* Mobile hamburger */}
        <button
          type="button"
          className="lg:hidden text-text hover:text-neon"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="lg:hidden bg-obsidian/95 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-2 flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navClass}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <>
                <NavLink to="/recommendations" className={navClass} onClick={() => setMenuOpen(false)}>
                  ✨ For You
                </NavLink>
                <NavLink to="/my-tasks" className={navClass} onClick={() => setMenuOpen(false)}>
                  My Tasks
                </NavLink>
                <NavLink to="/notifications" className={navClass} onClick={() => setMenuOpen(false)}>
                  📢 Notifications
                </NavLink>
                <NavLink to="/profile" className={navClass} onClick={() => setMenuOpen(false)}>
                  Profile
                </NavLink>
                <NavLink to="/teams" className={navClass} onClick={() => setMenuOpen(false)}>
                  Teams
                </NavLink>
                {user?.isAdmin && (
                  <NavLink to="/admin" className={navClass} onClick={() => setMenuOpen(false)}>
                    Admin Panel
                  </NavLink>
                )}
              </>
            )}
            {!isAuthenticated ? (
              <>
                <NavLink to="/login" className={navClass} onClick={() => setMenuOpen(false)}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navClass} onClick={() => setMenuOpen(false)}>
                  Register
                </NavLink>
              </>
            ) : (
              <Button variant="danger" onClick={logout}>
                Logout {user?.name ? `(${user.name})` : ""}
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
