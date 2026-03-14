/**
 * ShelfSense — Layout Shell
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIAssistant from "../AIAssistant/AIAssistant";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        marginLeft: 0,
        minWidth: 0,
      }}
      className="main-area"
      >
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 28px 48px",
        }}
        className="main-content"
        >
          <Outlet />
        </main>
      </div>

      {/* AI Assistant — fixed position, always on top */}
      <AIAssistant />

      <style>{`
        @media (min-width: 900px) {
          .main-area { margin-left: 240px !important; }
        }
        @media (max-width: 600px) {
          .main-content { padding: 20px 16px 48px !important; }
        }
      `}</style>
    </div>
  );
}