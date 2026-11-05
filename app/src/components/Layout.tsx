import { useState, type ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  FiActivity,
  FiBox,
  FiKey,
  FiUser,
  FiLogOut,
  FiMenu,
  FiArrowUpRight,
} from "react-icons/fi";
import { useAuthStore } from "../stores/authStore";
import { useAccountStore } from "../stores/accountStore";
export function Layout({ children }: { children: ReactNode }) {
  const environment = useAuthStore((s) => s.config?.environment);
  const logout = useAuthStore((s) => s.logout);
  const account = useAccountStore((s) => s.account);
  const [open, setOpen] = useState(false);
  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link className="brand" to="/">
          <span className="brand-mark">↗</span>
          <span>
            CodePush<small>RELEASE CONTROL</small>
          </span>
        </Link>
        <div
          className={`environment ${
            environment === "prod" ? "production" : ""
          }`}
        >
          <span className="status-dot" />
          {environment?.toUpperCase() || "LOCAL"}
          <span className="environment-label">Environment</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation" onClick={() => setOpen(false)}>
          <NavLink end to="/">
            <FiActivity />
            Overview
          </NavLink>
          <NavLink to="/apps">
            <FiBox />
            Applications
          </NavLink>
          <NavLink to="/access-keys">
            <FiKey />
            Access tokens
          </NavLink>
          <NavLink to="/account">
            <FiUser />
            Account & setup
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <FiArrowUpRight />
            <strong>
              Small updates.
              <br />A big difference.
            </strong>
            <p>Your next release starts here.</p>
          </div>
          <div className="sidebar-user">
            <span className="avatar">
              {(account?.name || account?.email || "CP")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <span>
              <strong>{account?.name || "CodePush Admin"}</strong>
              <small>Microsoft Entra ID</small>
            </span>
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => void logout()}
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <FiMenu />
          </button>
          <span>
            Workspace <span className="slash">/</span> Release control
          </span>
          <span className="topbar-right">
            <span className="status-dot" />
            {environment?.toUpperCase()}
            <span className="topbar-divider" />
            Microsoft SSO
          </span>
        </div>
        <main>{children}</main>
        <footer>
          CodePush <span>Over-the-air delivery, under your control.</span>
        </footer>
      </div>
    </div>
  );
}
