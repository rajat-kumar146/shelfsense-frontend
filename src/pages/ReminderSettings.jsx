/**
 * ShelfSense — Reminder Settings (Upgraded)
 * Features:
 *  - Toggle alert days (1, 7, 15, 30) with visual cards
 *  - Custom day input (add your own threshold)
 *  - Email & dashboard notification toggles
 *  - Email test send button
 *  - Live preview of next alert schedule
 *  - Animated save feedback
 */

import { useState, useEffect } from "react";
import {
  Bell, Mail, LayoutDashboard, Save, Plus,
  X, Clock, CheckCircle, Send, Loader2,
  AlertTriangle, ChevronRight, Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

// ─── Preset alert days ────────────────────────────────────────────────────────
const PRESET_DAYS = [
  { days: 1,  label: "1 day",    desc: "Final warning",  urgency: "red"    },
  { days: 7,  label: "7 days",   desc: "Urgent alert",   urgency: "orange" },
  { days: 15, label: "15 days",  desc: "Advance notice", urgency: "amber"  },
  { days: 30, label: "30 days",  desc: "Early warning",  urgency: "green"  },
];

const urgencyColors = {
  red:    { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  active: "rgba(239,68,68,0.15)",  text: "#ef4444", dot: "#ef4444"  },
  orange: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", active: "rgba(249,115,22,0.15)", text: "#f97316", dot: "#f97316"  },
  amber:  { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", active: "rgba(245,158,11,0.15)", text: "#f59e0b", dot: "#f59e0b"  },
  green:  { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", active: "rgba(52,211,153,0.15)", text: "#34d399", dot: "#34d399"  },
};

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 99,
        background: value ? "#f59e0b" : "#1a1a24",
        border: `1px solid ${value ? "#f59e0b" : "#252535"}`,
        cursor: "pointer", transition: "all 0.2s", flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: value ? 22 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, children, delay = 0 }) {
  return (
    <div style={{
      background: "#111118", border: "1px solid #1a1a24",
      borderRadius: 16, padding: "22px 24px",
      animation: `slideUp 0.4s ease-out ${delay}ms both`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} color="#f59e0b" />
        </div>
        <div>
          <h3 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ color: "#4b5563", fontSize: 12, margin: "3px 0 0" }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReminderSettings() {
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    daysBeforeExpiry: [1, 7, 15, 30],
    emailNotifications: true,
    dashboardNotifications: true,
  });
  const [fetching, setFetching] = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [customDay, setCustomDay] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    api.get("/reminders/settings")
      .then(({ data }) => setSettings(data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  // ── Toggle a day ────────────────────────────────────────────────────────────
  const toggleDay = (day) => {
    const cur = settings.daysBeforeExpiry;
    const next = cur.includes(day)
      ? cur.filter(d => d !== day)
      : [...cur, day].sort((a, b) => b - a);
    setSettings(s => ({ ...s, daysBeforeExpiry: next }));
  };

  // ── Add custom day ──────────────────────────────────────────────────────────
  const addCustomDay = () => {
    const d = parseInt(customDay);
    if (!d || d < 1 || d > 365) return toast.error("Enter a day between 1 and 365");
    if (settings.daysBeforeExpiry.includes(d)) return toast("Already added!", { icon: "ℹ️" });
    setSettings(s => ({ ...s, daysBeforeExpiry: [...s.daysBeforeExpiry, d].sort((a,b) => b - a) }));
    setCustomDay("");
    setShowCustom(false);
    toast.success(`${d}-day alert added`);
  };

  // ── Remove a non-preset day ─────────────────────────────────────────────────
  const removeCustom = (day) => {
    setSettings(s => ({ ...s, daysBeforeExpiry: s.daysBeforeExpiry.filter(d => d !== day) }));
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/reminders/settings", settings);
      setSaved(true);
      toast.success("Reminder settings saved!");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // ── Test email ──────────────────────────────────────────────────────────────
  const handleTestEmail = async () => {
    if (!settings.emailNotifications) {
      toast("Enable email notifications first.", { icon: "ℹ️" });
      return;
    }
    setTestSending(true);
    try {
      await api.post("/reminders/test");
      toast.success(`Test email sent to ${user?.email}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send. Check EMAIL_USER / EMAIL_PASS in .env");
    } finally {
      setTestSending(false);
    }
  };

  // ── Extra (non-preset) days ─────────────────────────────────────────────────
  const presetNums   = PRESET_DAYS.map(p => p.days);
  const customDays   = settings.daysBeforeExpiry.filter(d => !presetNums.includes(d));

  if (fetching) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", gap: 12 }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid rgba(245,158,11,0.15)", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }}/>
      <span style={{ color: "#374151", fontSize: 14 }}>Loading settings…</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, margin: 0 }}>
          Reminder Settings
        </h1>
        <p style={{ color: "#4b5563", fontSize: 13, margin: "6px 0 0" }}>
          Configure when ShelfSense alerts you about expiring products.
        </p>
      </div>

      {/* ── Alert schedule ── */}
      <SectionCard icon={Bell} title="Alert Schedule" subtitle="Choose how many days before expiry to get notified" delay={0}>

        {/* Preset days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {PRESET_DAYS.map(({ days, label, desc, urgency }) => {
            const isOn = settings.daysBeforeExpiry.includes(days);
            const c    = urgencyColors[urgency];
            return (
              <button
                key={days}
                type="button"
                onClick={() => toggleDay(days)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 12, textAlign: "left",
                  background: isOn ? c.active : "#0e0e16",
                  border: `1px solid ${isOn ? c.border : "#1a1a24"}`,
                  cursor: "pointer", transition: "all 0.18s",
                }}
              >
                {/* Checkbox circle */}
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  background: isOn ? c.text : "transparent",
                  border: `2px solid ${isOn ? c.text : "#374151"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}>
                  {isOn && <CheckCircle size={13} color="#111" strokeWidth={3} />}
                </div>
                <div>
                  <p style={{ color: isOn ? "#fff" : "#6b7280", fontWeight: 700, fontSize: 14, margin: 0, fontFamily: "'Syne',sans-serif" }}>
                    {label}
                  </p>
                  <p style={{ color: isOn ? c.text : "#374151", fontSize: 11, margin: "2px 0 0" }}>{desc}</p>
                </div>
                <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: isOn ? c.dot : "#1f2937", flexShrink: 0, boxShadow: isOn ? `0 0 8px ${c.dot}` : "none", transition: "all 0.18s" }} />
              </button>
            );
          })}
        </div>

        {/* Custom days */}
        {customDays.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {customDays.map(d => (
              <span key={d} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 99,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                color: "#f59e0b", fontSize: 13, fontWeight: 600,
              }}>
                {d} days
                <button onClick={() => removeCustom(d)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f59e0b", padding: 0, display: "flex" }}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add custom day */}
        {showCustom ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number" min="1" max="365"
              placeholder="e.g. 45"
              value={customDay}
              onChange={e => setCustomDay(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomDay()}
              autoFocus
              style={{
                flex: 1, background: "#0e0e16", border: "1px solid #f59e0b",
                borderRadius: 10, color: "#e5e7eb", fontSize: 14,
                padding: "9px 14px", outline: "none", fontFamily: "'DM Sans',sans-serif",
              }}
            />
            <button onClick={addCustomDay} style={{ padding: "9px 16px", borderRadius: 10, background: "#f59e0b", border: "none", color: "#111", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Add
            </button>
            <button onClick={() => { setShowCustom(false); setCustomDay(""); }} style={{ padding: "9px 12px", borderRadius: 10, background: "#1a1a24", border: "1px solid #252535", color: "#6b7280", cursor: "pointer" }}>
              <X size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowCustom(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 10,
            background: "#0e0e16", border: "1px dashed #252535",
            color: "#4b5563", fontSize: 13, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#252535"; e.currentTarget.style.color = "#4b5563"; }}
          >
            <Plus size={14} /> Add custom day
          </button>
        )}

        {/* Active schedule preview */}
        {settings.daysBeforeExpiry.length > 0 && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#0e0e16", borderRadius: 10, border: "1px solid #1a1a24" }}>
            <p style={{ color: "#4b5563", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
              Active schedule
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {[...settings.daysBeforeExpiry].sort((a,b) => b-a).map((d, i, arr) => (
                <span key={d} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{d}d</span>
                  {i < arr.length - 1 && <ChevronRight size={12} color="#252535" />}
                </span>
              ))}
              <span style={{ color: "#374151", fontSize: 12, marginLeft: 4 }}>before expiry</span>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Notification channels ── */}
      <div style={{ marginTop: 16 }}>
        <SectionCard icon={Zap} title="Notification Channels" subtitle="Choose how you receive alerts" delay={80}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Email */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#0e0e16", borderRadius: 12, border: "1px solid #1a1a24" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: settings.emailNotifications ? "rgba(245,158,11,0.1)" : "#111118", border: `1px solid ${settings.emailNotifications ? "rgba(245,158,11,0.25)" : "#252535"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                  <Mail size={16} color={settings.emailNotifications ? "#f59e0b" : "#374151"} />
                </div>
                <div>
                  <p style={{ color: "#e5e7eb", fontWeight: 600, fontSize: 14, margin: 0 }}>Email Notifications</p>
                  <p style={{ color: "#4b5563", fontSize: 12, margin: "3px 0 0" }}>
                    {user?.email || "your registered email"}
                  </p>
                </div>
              </div>
              <Toggle value={settings.emailNotifications} onChange={v => setSettings(s => ({ ...s, emailNotifications: v }))} />
            </div>

            {/* Dashboard */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#0e0e16", borderRadius: 12, border: "1px solid #1a1a24" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: settings.dashboardNotifications ? "rgba(245,158,11,0.1)" : "#111118", border: `1px solid ${settings.dashboardNotifications ? "rgba(245,158,11,0.25)" : "#252535"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                  <LayoutDashboard size={16} color={settings.dashboardNotifications ? "#f59e0b" : "#374151"} />
                </div>
                <div>
                  <p style={{ color: "#e5e7eb", fontWeight: 600, fontSize: 14, margin: 0 }}>Dashboard Alerts</p>
                  <p style={{ color: "#4b5563", fontSize: 12, margin: "3px 0 0" }}>Show urgent items on the dashboard</p>
                </div>
              </div>
              <Toggle value={settings.dashboardNotifications} onChange={v => setSettings(s => ({ ...s, dashboardNotifications: v }))} />
            </div>

          </div>

          {/* Email setup hint */}
          
        </SectionCard>
      </div>

      {/* ── How it works ── */}
      <div style={{ marginTop: 16 }}>
        <SectionCard icon={Clock} title="How It Works" delay={160}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { step: "1", text: "Every day at midnight, ShelfSense scans your entire inventory." },
              { step: "2", text: "Products matching your alert thresholds trigger an email to your account." },
              { step: "3", text: "Each product is alerted only once per threshold to avoid spam." },
              { step: "4", text: "Expired and urgent products are always highlighted on your dashboard." },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {step}
                </span>
                <p style={{ color: "#6b7280", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Save & Test row ── */}
      <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleTestEmail}
          disabled={testSending}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "11px 18px", borderRadius: 10,
            background: "#1a1a24", border: "1px solid #252535",
            color: testSending ? "#374151" : "#9ca3af",
            fontSize: 13, fontWeight: 600, cursor: testSending ? "not-allowed" : "pointer",
          }}
        >
          {testSending ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Send size={15} />}
          Test Email
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 24px", borderRadius: 10,
            background: saved ? "#34d399" : "#f59e0b",
            border: "none", color: "#111",
            fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            transition: "background 0.3s", opacity: saving ? 0.7 : 1,
          }}
        >
          {saving
            ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</>
            : saved
            ? <><CheckCircle size={16} /> Saved!</>
            : <><Save size={16} /> Save Settings</>
          }
        </button>
      </div>

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        select option, input { color-scheme: dark; }
      `}</style>
    </div>
  );
}