import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/stocks", label: "Stocks" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/investments", label: "Investments" },
  { to: "/budgets", label: "Budgets" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.name || "?")
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose();
  };

  return (
      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">L</div>
          <span className="sidebar-brand-name">Ledger</span>

          <button
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
              <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                      `sidebar-link${isActive ? " active" : ""}`
                  }
              >
                {link.label}
              </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>

            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-email">{user?.email}</span>
            </div>
          </div>

          <button
              className="btn btn-ghost btn-block mt-2"
              onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>
  );
}