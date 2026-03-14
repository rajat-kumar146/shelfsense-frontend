/**
 * ShelfSense — Topbar
 * Sticky dark topbar: hamburger (mobile), page title, breadcrumb
 */

import { useLocation } from "react-router-dom";
import { Menu, ShieldCheck } from "lucide-react";

const PAGE_META = {
  "/dashboard": { title: "Dashboard",          sub: "Overview of your inventory"         },
  "/products":  { title: "Products",           sub: "Manage your product list"            },
  "/scanner":   { title: "Barcode Scanner",    sub: "Scan to add or look up products"     },
  "/reports":   { title: "Reports",            sub: "Export and analyse inventory data"   },
  "/reminders": { title: "Reminder Settings",  sub: "Configure expiry alert schedule"     },
  "/account":   { title: "Account Settings",   sub: "Manage your profile and password"    },
};

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || PAGE_META["/dashboard"];

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 30,
      background: "rgba(17,17,24,0.85)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderBottom: "1px solid #1a1a24",
      padding: "0 28px",
      height: 60,
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexShrink: 0,
    }}>
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="hamburger"
        style={{
          display: "none",
          alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: 9,
          background: "#1a1a24", border: "1px solid #252535",
          color: "#9ca3af", cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Menu size={18} />
      </button>

      {/* Mobile logo (only shows when sidebar hidden) */}
      <div className="mobile-logo" style={{ display: "none", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={14} color="#111" />
        </div>
        <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>
          ShelfSense
        </span>
      </div>

      {/* Page title — desktop */}
      <div className="page-title" style={{ flex: 1 }}>
        <h2 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, margin: 0, lineHeight: 1 }}>
          {meta.title}
        </h2>
        <p style={{ color: "#374151", fontSize: 11, margin: "3px 0 0" }}>
          {meta.sub}
        </p>
      </div>

      {/* Right: live status dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#34d399",
          boxShadow: "0 0 8px #34d399",
          animation: "topbarPulse 2s infinite",
        }} />
        <span style={{ color: "#374151", fontSize: 11, fontFamily: "monospace" }}>LIVE</span>
      </div>

      <style>{`
        @media (max-width: 899px) {
          .hamburger    { display: flex !important; }
          .mobile-logo  { display: flex !important; }
          .page-title   { display: none !important; }
        }
        @keyframes topbarPulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
    </header>
  );
}