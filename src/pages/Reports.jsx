/**
 * ShelfSense — Reports & Export (Upgraded)
 * Features:
 *  - Export Full / Expiring / Expired inventory
 *  - CSV and Excel formats
 *  - Live product count preview per report type
 *  - Download history (session)
 *  - Animated cards, loading states
 */

import { useState, useEffect } from "react";
import {
  FileDown, FileText, Table2, AlertTriangle, XCircle,
  CheckCircle, Download, Clock, RefreshCw, BarChart2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

// ─── Report type definitions ──────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: "all",
    label: "Full Inventory",
    description: "Every product in your inventory regardless of status",
    icon: Table2,
    accent: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
    statsKey: "total",
  },
  {
    id: "expiring",
    label: "Expiring Products",
    description: "Products expiring within 30 days (Expiring Soon + Urgent)",
    icon: AlertTriangle,
    accent: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
    statsKey: "expiring",
  },
  {
    id: "expired",
    label: "Expired Products",
    description: "All products past their expiry date",
    icon: XCircle,
    accent: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
    statsKey: "expired",
  },
];

// ─── What's included list ─────────────────────────────────────────────────────
const FIELDS = [
  "Product Name", "Category", "Barcode",
  "Batch Number", "Quantity", "Manufacture Date",
  "Expiry Date", "Status", "Notes", "Created Date",
];

// ─── Download history entry ───────────────────────────────────────────────────
function HistoryEntry({ entry }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: 10,
      background: "#0e0e16", border: "1px solid #1a1a24",
      animation: "fadeIn 0.3s ease-out",
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: entry.type === "excel" ? "rgba(52,211,153,0.1)" : "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {entry.type === "excel" ? <Table2 size={14} color="#34d399" /> : <FileText size={14} color="#f59e0b" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.filename}
        </p>
        <p style={{ color: "#374151", fontSize: 11, margin: "2px 0 0" }}>{entry.time}</p>
      </div>
      <span style={{ color: "#4b5563", fontSize: 11, padding: "2px 8px", background: "#1a1a24", borderRadius: 6 }}>
        {entry.type.toUpperCase()}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [stats, setStats]         = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [downloading, setDownloading]   = useState({}); // { "all-csv": true, ... }
  const [history, setHistory]     = useState([]);

  // Load summary stats to show counts per card
  useEffect(() => {
    api.get("/products/stats")
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const getCount = (statsKey) => {
    if (!stats) return null;
    if (statsKey === "total")    return stats.total;
    if (statsKey === "expiring") return (stats.expiring_soon || 0) + (stats.urgent || 0);
    if (statsKey === "expired")  return stats.expired || 0;
    return null;
  };

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExport = async (filter, type) => {
    const key = `${filter}-${type}`;
    setDownloading(prev => ({ ...prev, [key]: true }));

    try {
      const response = await api.get("/reports/export", {
        params: { filter, type },
        responseType: "blob",
      });

      const ext      = type === "excel" ? "xlsx" : "csv";
      const filename = `shelfsense-${filter}-${new Date().toISOString().slice(0,10)}.${ext}`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a   = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`${type === "excel" ? "Excel" : "CSV"} downloaded!`);

      // Add to session history
      setHistory(prev => [{
        id: Date.now(),
        filename,
        type,
        filter,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }, ...prev].slice(0, 8));

    } catch (err) {
      const msg = err.response?.status === 404
        ? "No products match this filter."
        : "Export failed — please try again.";
      toast.error(msg);
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card = {
    background: "#111118", border: "1px solid #1a1a24",
    borderRadius: 16, overflow: "hidden",
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, margin: 0 }}>
          Reports & Export
        </h1>
        <p style={{ color: "#4b5563", fontSize: 13, margin: "6px 0 0" }}>
          Download your inventory data as CSV or Excel for auditing, compliance, or offline analysis.
        </p>
      </div>

      {/* ── Summary bar ── */}
      {!loadingStats && stats && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24,
        }}>
          {[
            { label: "Total Products",   value: stats.total,                                  color: "#f59e0b", icon: BarChart2    },
            { label: "Expiring / Urgent",value: (stats.expiring_soon||0)+(stats.urgent||0),   color: "#f97316", icon: AlertTriangle },
            { label: "Already Expired",  value: stats.expired || 0,                           color: "#ef4444", icon: XCircle      },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{ background: "#111118", border: "1px solid #1a1a24", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: 0, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{value}</p>
                <p style={{ color: "#4b5563", fontSize: 12, margin: "4px 0 0" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Report cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        {REPORT_TYPES.map(({ id, label, description, icon: Icon, accent, statsKey }, idx) => {
          const count = getCount(statsKey);
          return (
            <div key={id} style={{
              ...card,
              animation: `slideUp 0.4s ease-out ${idx * 80}ms both`,
            }}>
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", borderBottom: "1px solid #0e0e16" }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: accent.bg, border: `1px solid ${accent.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={22} color={accent.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
                      {label}
                    </h3>
                    {count !== null && (
                      <span style={{ padding: "2px 9px", borderRadius: 99, background: accent.bg, border: `1px solid ${accent.border}`, color: accent.color, fontSize: 12, fontWeight: 700 }}>
                        {count} {count === 1 ? "product" : "products"}
                      </span>
                    )}
                  </div>
                  <p style={{ color: "#4b5563", fontSize: 13, margin: "4px 0 0" }}>{description}</p>
                </div>
              </div>

              {/* Export buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 24px", background: "rgba(255,255,255,0.01)" }}>
                <span style={{ color: "#374151", fontSize: 12, marginRight: 4 }}>Export as:</span>

                {/* CSV */}
                <button
                  onClick={() => handleExport(id, "csv")}
                  disabled={downloading[`${id}-csv`]}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 10,
                    background: "#1a1a24", border: "1px solid #252535",
                    color: downloading[`${id}-csv`] ? "#374151" : "#e5e7eb",
                    fontSize: 13, fontWeight: 600, cursor: downloading[`${id}-csv`] ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!downloading[`${id}-csv`]) { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; }}}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#252535"; e.currentTarget.style.color = downloading[`${id}-csv`] ? "#374151" : "#e5e7eb"; }}
                >
                  {downloading[`${id}-csv`]
                    ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                    : <FileText size={14} />}
                  CSV
                </button>

                {/* Excel */}
                <button
                  onClick={() => handleExport(id, "excel")}
                  disabled={downloading[`${id}-excel`]}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 10,
                    background: "#f59e0b", border: "none",
                    color: downloading[`${id}-excel`] ? "rgba(0,0,0,0.4)" : "#111",
                    fontSize: 13, fontWeight: 700, cursor: downloading[`${id}-excel`] ? "not-allowed" : "pointer",
                    transition: "opacity 0.15s",
                    opacity: downloading[`${id}-excel`] ? 0.7 : 1,
                  }}
                >
                  {downloading[`${id}-excel`]
                    ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                    : <FileDown size={14} />}
                  Excel (.xlsx)
                </button>

                {count === 0 && (
                  <span style={{ marginLeft: 8, color: "#374151", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle size={13} color="#34d399" /> Nothing to export
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── What's included + Download history ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Fields included */}
        <div style={{ background: "#111118", border: "1px solid #1a1a24", borderRadius: 16, padding: "20px 22px" }}>
          <h4 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <Table2 size={15} color="#4b5563" /> Fields in every export
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
            {FIELDS.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, color: "#6b7280", fontSize: 12 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Download history */}
        <div style={{ background: "#111118", border: "1px solid #1a1a24", borderRadius: 16, padding: "20px 22px" }}>
          <h4 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={15} color="#4b5563" /> This session's downloads
          </h4>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Download size={28} color="#1f2937" style={{ margin: "0 auto 10px" }} />
              <p style={{ color: "#1f2937", fontSize: 13, margin: 0 }}>No downloads yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map(entry => <HistoryEntry key={entry.id} entry={entry} />)}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}