/**
 * ShelfSense — Account Settings (Upgraded)
 * Features:
 *  - Avatar with initials + color
 *  - Profile info edit (name, company)
 *  - Password change with strength meter
 *  - Account details panel (role, plan, member since)
 *  - Danger zone (sign out)
 *  - Animated save states
 */

import { useState, useMemo } from "react";
import {
  User, Lock, Building2, Save, Eye, EyeOff,
  CheckCircle, Loader2, ShieldCheck, LogOut,
  AlertTriangle, Star, Calendar, Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

// ─── Password strength ────────────────────────────────────────────────────────
function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "#1a1a24" };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "",          color: "#1a1a24"  },
    { label: "Very weak", color: "#ef4444"  },
    { label: "Weak",      color: "#f97316"  },
    { label: "Fair",      color: "#f59e0b"  },
    { label: "Strong",    color: "#34d399"  },
    { label: "Very strong",color: "#10b981" },
  ];
  return { score, ...map[score] };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 72 }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const colors = ["#f59e0b","#34d399","#f97316","#8b5cf6","#06b6d4","#ec4899"];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  const bg = colors[colorIdx];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${bg}20`, border: `2px solid ${bg}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 800, color: bg,
      fontFamily: "'Syne',sans-serif", flexShrink: 0,
      boxShadow: `0 0 24px ${bg}20`,
    }}>
      {initials}
    </div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
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

// ─── Input field ──────────────────────────────────────────────────────────────
function InputField({ label, required, hint, disabled, children }) {
  return (
    <div>
      <label style={{ display: "block", color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ color: "#374151", fontSize: 11, marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

const baseInput = {
  width: "100%", background: "#0e0e16",
  border: "1px solid #252535", borderRadius: 10,
  color: "#e5e7eb", fontSize: 14, padding: "10px 14px",
  outline: "none", fontFamily: "'DM Sans',sans-serif",
  boxSizing: "border-box", transition: "border-color 0.2s",
};

// ─── Save button ──────────────────────────────────────────────────────────────
function SaveBtn({ saving, saved, label = "Save Changes", savedLabel = "Saved!" }) {
  return (
    <button type="submit" disabled={saving} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "11px 22px", borderRadius: 10,
      background: saved ? "#34d399" : "#f59e0b",
      border: "none", color: "#111",
      fontSize: 14, fontWeight: 700,
      cursor: saving ? "not-allowed" : "pointer",
      transition: "background 0.3s",
      opacity: saving ? 0.7 : 1,
    }}>
      {saving
        ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</>
        : saved
        ? <><CheckCircle size={16} /> {savedLabel}</>
        : <><Save size={16} /> {label}</>
      }
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AccountSettings() {
  const { user, updateUser, logout } = useAuth();

  // Profile form
  const [profile, setProfile]         = useState({ name: user?.name || "", companyName: user?.companyName || "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile]   = useState(false);

  // Password form
  const [pw, setPw]               = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw]       = useState({ current: false, newPw: false, confirm: false });
  const [savingPw, setSavingPw]   = useState(false);
  const [savedPw, setSavedPw]     = useState(false);

  const strength = useMemo(() => passwordStrength(pw.newPw), [pw.newPw]);

  // ── Save profile ────────────────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error("Name is required");
    setSavingProfile(true); setSavedProfile(false);
    try {
      const { data } = await api.put("/auth/profile", profile);
      updateUser(data.user);
      setSavedProfile(true);
      toast.success("Profile updated!");
      setTimeout(() => setSavedProfile(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Save password ───────────────────────────────────────────────────────────
  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pw.newPw.length < 6)       return toast.error("Password must be at least 6 characters");
    if (pw.newPw !== pw.confirm)   return toast.error("Passwords do not match");
    if (!pw.current)               return toast.error("Enter your current password");
    setSavingPw(true); setSavedPw(false);
    try {
      await api.put("/auth/password", { currentPassword: pw.current, newPassword: pw.newPw });
      setSavedPw(true);
      toast.success("Password updated!");
      setPw({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setSavedPw(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || "Password update failed");
    } finally {
      setSavingPw(false);
    }
  };

  const focusStyle  = (e) => e.target.style.borderColor = "#f59e0b";
  const blurStyle   = (e) => e.target.style.borderColor = "#252535";

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>

      {/* ── Header with avatar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, padding: "20px 24px", background: "#111118", border: "1px solid #1a1a24", borderRadius: 16, animation: "slideUp 0.4s ease-out" }}>
        <Avatar name={user?.name} size={72} />
        <div>
          <h1 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, margin: 0 }}>
            {user?.name || "Your Account"}
          </h1>
          <p style={{ color: "#4b5563", fontSize: 13, margin: "5px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={13} /> {user?.email}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <span style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
              {user?.role || "admin"}
            </span>
            <span style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", fontSize: 11, fontWeight: 600 }}>
              Free Plan
            </span>
          </div>
        </div>
      </div>

      {/* ── Profile section ── */}
      <SectionCard icon={User} title="Profile Information" subtitle="Update your name and company" delay={60}>
        <form onSubmit={handleProfileSave}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            <InputField label="Full Name" required>
              <input
                style={baseInput}
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                onFocus={focusStyle} onBlur={blurStyle}
                required
              />
            </InputField>

            <InputField label="Email" hint="Email cannot be changed">
              <input
                style={{ ...baseInput, opacity: 0.45, cursor: "not-allowed" }}
                value={user?.email || ""}
                disabled
              />
            </InputField>

            <InputField label="Company Name" hint="Optional — shown on your dashboard">
              <div style={{ position: "relative" }}>
                <Building2 size={15} color="#374151" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  style={{ ...baseInput, paddingLeft: 36 }}
                  value={profile.companyName}
                  onChange={e => setProfile(p => ({ ...p, companyName: e.target.value }))}
                  placeholder="Your company or store name"
                  onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
            </InputField>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SaveBtn saving={savingProfile} saved={savedProfile} label="Save Profile" savedLabel="Profile Saved!" />
          </div>
        </form>
      </SectionCard>

      {/* ── Password section ── */}
      <div style={{ marginTop: 16 }}>
        <SectionCard icon={Lock} title="Change Password" subtitle="Use a strong password to keep your account secure" delay={120}>
          <form onSubmit={handlePwSave}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>

              {/* Current password */}
              <InputField label="Current Password" required>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.current ? "text" : "password"}
                    style={{ ...baseInput, paddingRight: 42 }}
                    value={pw.current}
                    onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                    placeholder="Your current password"
                    onFocus={focusStyle} onBlur={blurStyle}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#374151", display: "flex", padding: 4 }}>
                    {showPw.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </InputField>

              {/* New password */}
              <InputField label="New Password" required>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.newPw ? "text" : "password"}
                    style={{ ...baseInput, paddingRight: 42 }}
                    value={pw.newPw}
                    onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
                    placeholder="At least 6 characters"
                    onFocus={focusStyle} onBlur={blurStyle}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(s => ({ ...s, newPw: !s.newPw }))}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#374151", display: "flex", padding: 4 }}>
                    {showPw.newPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength meter */}
                {pw.newPw && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= strength.score ? strength.color : "#1a1a24", transition: "background 0.3s" }} />
                      ))}
                    </div>
                    {strength.label && (
                      <p style={{ color: strength.color, fontSize: 11, margin: 0, fontWeight: 600 }}>{strength.label}</p>
                    )}
                  </div>
                )}
              </InputField>

              {/* Confirm password */}
              <InputField label="Confirm New Password" required>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw.confirm ? "text" : "password"}
                    style={{ ...baseInput, paddingRight: 42, borderColor: pw.confirm && pw.confirm !== pw.newPw ? "#ef4444" : "#252535" }}
                    value={pw.confirm}
                    onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    onFocus={focusStyle}
                    onBlur={e => { e.target.style.borderColor = pw.confirm && pw.confirm !== pw.newPw ? "#ef4444" : "#252535"; }}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#374151", display: "flex", padding: 4 }}>
                    {showPw.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {pw.confirm && pw.confirm === pw.newPw && (
                    <CheckCircle size={15} color="#34d399" style={{ position: "absolute", right: 38, top: "50%", transform: "translateY(-50%)" }} />
                  )}
                </div>
                {pw.confirm && pw.confirm !== pw.newPw && (
                  <p style={{ color: "#ef4444", fontSize: 11, marginTop: 5 }}>Passwords do not match</p>
                )}
              </InputField>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn saving={savingPw} saved={savedPw} label="Update Password" savedLabel="Password Updated!" />
            </div>
          </form>
        </SectionCard>
      </div>

      {/* ── Account details ── */}
      <div style={{ marginTop: 16 }}>
        <SectionCard icon={ShieldCheck} title="Account Details" delay={180}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 12, overflow: "hidden", border: "1px solid #1a1a24" }}>
            {[
              { icon: User,      label: "Role",         value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Admin" },
              { icon: Star,      label: "Plan",         value: "Free",       valueColor: "#34d399" },
              { icon: Calendar,  label: "Member since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—" },
              { icon: Mail,      label: "Email",        value: user?.email || "—" },
            ].map(({ icon: Icon, label, value, valueColor }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "#0e0e16", borderBottom: "1px solid #111118" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={14} color="#374151" />
                  <span style={{ color: "#6b7280", fontSize: 13 }}>{label}</span>
                </div>
                <span style={{ color: valueColor || "#e5e7eb", fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Danger zone ── */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <div style={{
          background: "#111118", border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 16, padding: "18px 24px",
          animation: "slideUp 0.4s ease-out 220ms both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <AlertTriangle size={16} color="#ef4444" />
            <h3 style={{ color: "#ef4444", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, margin: 0 }}>Danger Zone</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#e5e7eb", fontWeight: 600, fontSize: 14, margin: 0 }}>Sign out of ShelfSense</p>
              <p style={{ color: "#4b5563", fontSize: 12, margin: "3px 0 0" }}>You'll need to log in again to access your inventory.</p>
            </div>
            <button
              onClick={logout}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        input { color-scheme: dark; }
      `}</style>
    </div>
  );
}