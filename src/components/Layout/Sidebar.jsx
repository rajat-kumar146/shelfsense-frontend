/**
 * ShelfSense — Sidebar
 * Fixed 240px dark sidebar with logo, nav links, user footer
 */

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ScanLine,
  FileBarChart2, Bell, Settings, ShieldCheck,
  LogOut, X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard"  },
  { to: "/products",  icon: Package,         label: "Products"   },
  { to: "/scanner",   icon: ScanLine,        label: "Scanner"    },
  { to: "/reports",   icon: FileBarChart2,   label: "Reports"    },
  { to: "/reminders", icon: Bell,            label: "Reminders"  },
  { to: "/account",   icon: Settings,        label: "Account"    },
];

// Auto-color avatar based on first letter
function avatarColor(name = "") {
  const colors = ["#f59e0b","#3b82f6","#8b5cf6","#ec4899","#10b981","#f97316"];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initial = (user?.name || user?.email || "?")[0].toUpperCase();
  const color   = avatarColor(user?.name || user?.email || "");

  return (
    <aside style={{
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      width: 240,
      background: "#111118",
      borderRight: "1px solid #1a1a24",
      display: "flex",
      flexDirection: "column",
      zIndex: 50,
      transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
    }}
    className="sidebar"
    >
      {/* Close button (mobile) */}
      <button
        onClick={onClose}
        className="sidebar-close"
        style={{
          display: "none",
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none",
          color: "#4b5563", cursor: "pointer", padding: 4,
        }}
      >
        <X size={18} />
      </button>

      {/* Logo */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: "1px solid #1a1a24",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: "#f59e0b",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
          flexShrink: 0,
        }}>
          <ShieldCheck size={19} color="#111" />
        </div>
        <div>
          <p style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, margin: 0, lineHeight: 1 }}>
            ShelfSense
          </p>
          <p style={{ color: "#374151", fontSize: 10, margin: "3px 0 0", letterSpacing: "0.04em" }}>
            Inventory Tracker
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <p style={{
          color: "#252535", fontSize: 10, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.12em",
          padding: "8px 10px 6px", margin: 0,
        }}>
          Main Menu
        </p>

        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              marginBottom: 2,
              textDecoration: "none",
              background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
              border: `1px solid ${isActive ? "rgba(245,158,11,0.2)" : "transparent"}`,
              color: isActive ? "#f59e0b" : "#6b7280",
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s",
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.style.background.includes("0.1")) {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.color = "#9ca3af";
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background.includes("0.1")) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        borderTop: "1px solid #1a1a24",
        padding: "14px 14px 18px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `${color}22`,
            border: `1.5px solid ${color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ color, fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif" }}>
              {initial}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </p>
            <p style={{ color: "#374151", fontSize: 11, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "9px 12px", borderRadius: 9,
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .sidebar { transform: translateX(0) !important; }
          .sidebar-close { display: none !important; }
        }
        @media (max-width: 899px) {
          .sidebar-close { display: flex !important; }
        }
      `}</style>
    </aside>
  );
}