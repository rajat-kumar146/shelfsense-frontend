/**
 * ShelfSense — Login Page (Redesigned)
 * Bold split layout: animated left panel + clean right form
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Package, Bell, BarChart2 } from "lucide-react";

const FEATURES = [
  { icon: Package,    text: "Track every product's expiry date in real time" },
  { icon: Bell,       text: "Get automated alerts before products expire"     },
  { icon: BarChart2,  text: "Visual analytics and inventory reports"          },
];

export default function Login() {
  const [form, setForm]             = useState({ email: "", password: "" });
  const [showPassword, setShowPw]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const { login }                   = useAuth();
  const navigate                    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#0a0a0f", fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Left panel ── */}
      <div style={{
        display: "none",
        width: "46%", flexShrink: 0,
        background: "#111118",
        borderRight: "1px solid #1a1a24",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 52px",
        position: "relative",
        overflow: "hidden",
      }}
      className="left-panel"
      >
        {/* Background decoration */}
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
            <ShieldCheck size={22} color="#111" />
          </div>
          <div>
            <p style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, margin: 0, lineHeight: 1 }}>ShelfSense</p>
            <p style={{ color: "#374151", fontSize: 11, margin: "3px 0 0" }}>Inventory Expiry Tracker</p>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: "relative" }}>
          <p style={{ color: "#374151", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
            Smart inventory management
          </p>
          <h2 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 38, lineHeight: 1.15, margin: "0 0 32px" }}>
            Never let a<br />
            <span style={{ color: "#f59e0b" }}>product expire</span><br />
            unnoticed.
          </h2>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, animation: `slideRight 0.5s ease-out ${i * 100}ms both` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} color="#f59e0b" />
                </div>
                <p style={{ color: "#9ca3af", fontSize: 14, margin: 0, lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat strip */}
        <div style={{ display: "flex", gap: 32, position: "relative" }}>
          {[
            { num: "100%", label: "Free to use"   },
            { num: "∞",    label: "Products"       },
            { num: "24/7", label: "Monitoring"     },
          ].map(({ num, label }) => (
            <div key={label}>
              <p style={{ color: "#f59e0b", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, margin: 0 }}>{num}</p>
              <p style={{ color: "#374151", fontSize: 12, margin: "3px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.5s ease-out" }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }} className="mobile-logo">
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} color="#111" />
            </div>
            <span style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>ShelfSense</span>
          </div>

          <h1 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, margin: "0 0 6px" }}>
            Welcome back
          </h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: "0 0 32px" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#f59e0b", fontWeight: 600, textDecoration: "none" }}>
              Create one free →
            </Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Email */}
            <div>
              <label style={{ display: "block", color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                required
                style={{
                  width: "100%", background: "#111118",
                  border: "1px solid #1f1f2e", borderRadius: 12,
                  color: "#e5e7eb", fontSize: 15, padding: "13px 16px",
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#f59e0b"}
                onBlur={e => e.target.style.borderColor = "#1f1f2e"}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Your password"
                  required
                  style={{
                    width: "100%", background: "#111118",
                    border: "1px solid #1f1f2e", borderRadius: 12,
                    color: "#e5e7eb", fontSize: 15, padding: "13px 46px 13px 16px",
                    outline: "none", boxSizing: "border-box",
                    fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#f59e0b"}
                  onBlur={e => e.target.style.borderColor = "#1f1f2e"}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#374151", display: "flex", padding: 4 }}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px", borderRadius: 12,
              background: loading ? "rgba(245,158,11,0.6)" : "#f59e0b",
              border: "none", color: "#111",
              fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
              marginTop: 6, fontFamily: "'Syne',sans-serif",
              transition: "opacity 0.2s, transform 0.1s",
              boxShadow: "0 4px 20px rgba(245,158,11,0.2)",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => e.currentTarget.style.transform = ""}
            >
              {loading
                ? <><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#111", animation: "spin 0.8s linear infinite" }}/> Signing in…</>
                : <>Sign In <ArrowRight size={17} /></>
              }
            </button>
          </form>

          <p style={{ color: "#252535", fontSize: 12, textAlign: "center", marginTop: 28 }}>
            © {new Date().getFullYear()} ShelfSense · All rights reserved
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .left-panel { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        input { color-scheme: dark; }
      `}</style>
    </div>
  );
}