/**
 * ShelfSense — Scanner Page (Redesigned)
 * Aesthetic: Industrial/utilitarian — like a warehouse scanning terminal.
 * Bold monospace readouts, animated viewfinder, scan history feed,
 * manual entry fallback, Open Food Facts auto-lookup on scan.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine, Keyboard, History, ArrowRight,
  Package, CheckCircle, XCircle, Loader2,
  Zap, RefreshCw, Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import BarcodeScanner from "../components/Scanner/BarcodeScanner";

// ─── OFF lookup ────────────────────────────────────────────────────────────────
async function lookupBarcode(barcode) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  if (!res.ok) throw new Error("Network error");
  const data = await res.json();
  if (data.status !== 1) return null;
  return data.product;
}

// ─── Scan history item ────────────────────────────────────────────────────────
function HistoryItem({ entry, onUse }) {
  const statusColor = entry.found ? "#34d399" : "#374151";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px", borderRadius: 10,
      background: "#0e0e16", border: "1px solid #1a1a24",
      animation: "slideIn 0.3s ease-out",
    }}>
      {/* Status dot */}
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: statusColor, flexShrink: 0,
        boxShadow: entry.found ? `0 0 8px ${statusColor}` : "none",
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 700, margin: 0, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.barcode}
        </p>
        <p style={{ color: entry.found ? "#4b5563" : "#252535", fontSize: 11, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.name || "Not found in database"}
        </p>
      </div>

      <span style={{ color: "#1f2937", fontSize: 10, fontFamily: "monospace", flexShrink: 0 }}>
        {entry.time}
      </span>

      <button onClick={() => onUse(entry.barcode)} style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 12px", borderRadius: 7,
        background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
        color: "#f59e0b", fontSize: 11, fontWeight: 700, cursor: "pointer",
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        Use <ArrowRight size={11} />
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Scanner() {
  const navigate = useNavigate();

  const [mode, setMode]             = useState("scanner"); // "scanner" | "manual"
  const [showCamera, setShowCamera] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [looking, setLooking]       = useState(false);
  const [lastScan, setLastScan]     = useState(null); // { barcode, name, brand, image, found }
  const [history, setHistory]       = useState([]);

  // ── Process a scanned/entered barcode ──────────────────────────────────────
  const processBarcode = useCallback(async (barcode) => {
    if (!barcode?.trim()) return;
    setLooking(true);
    setLastScan(null);

    let name = null, brand = null, image = null, found = false;
    try {
      const product = await lookupBarcode(barcode.trim());
      if (product) {
        name  = product.product_name || product.product_name_en || null;
        brand = product.brands || null;
        image = product.image_front_small_url || product.image_url || null;
        found = Boolean(name);
      }
    } catch { /* network issue, still allow manual add */ }

    const result = { barcode: barcode.trim(), name, brand, image, found };
    setLastScan(result);
    setLooking(false);

    // Add to history
    const entry = {
      ...result,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setHistory(prev => [entry, ...prev].slice(0, 20));

    if (found) toast.success(`Found: ${name}`);
    else       toast("Not in Open Food Facts — add manually.", { icon: "ℹ️" });
  }, []);

  // ── Camera scan callback ────────────────────────────────────────────────────
  const handleScan = (barcode) => {
    setShowCamera(false);
    processBarcode(barcode);
  };

  // ── Manual submit ───────────────────────────────────────────────────────────
  const handleManual = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processBarcode(manualCode);
    setManualCode("");
  };

  // ── Navigate to Add Product with barcode pre-filled ─────────────────────────
  const handleAddProduct = () => {
    if (!lastScan) return;
    navigate(`/products/add?barcode=${encodeURIComponent(lastScan.barcode)}`);
  };

  // ── Use a history entry ─────────────────────────────────────────────────────
  const useHistoryEntry = (barcode) => {
    processBarcode(barcode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Terminal header ── */}
      <div style={{ marginBottom: 24, animation: "fadeUp 0.4s ease-out" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#374151", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            SCANNER · TERMINAL v1.0
          </span>
        </div>
        <h1 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, margin: 0 }}>
          Barcode Scanner
        </h1>
        <p style={{ color: "#374151", fontSize: 13, margin: "6px 0 0" }}>
          Scan a barcode to instantly look up and add products to your inventory.
        </p>
      </div>

      {/* ── Mode tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#0e0e16", border: "1px solid #1a1a24", borderRadius: 12, padding: 4 }}>
        {[
          { id: "scanner", label: "Camera Scan", icon: ScanLine   },
          { id: "manual",  label: "Manual Entry", icon: Keyboard   },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMode(id)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px", borderRadius: 9,
            background: mode === id ? "#111118" : "transparent",
            border: mode === id ? "1px solid #252535" : "1px solid transparent",
            color: mode === id ? "#f59e0b" : "#374151",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Scanner mode ── */}
      {mode === "scanner" && (
        <div style={{ marginBottom: 20, animation: "fadeUp 0.3s ease-out" }}>
          {!showCamera ? (
            /* Viewfinder preview (idle) */
            <div style={{
              position: "relative", borderRadius: 16, overflow: "hidden",
              background: "#0a0a0f", border: "1px solid #1a1a24",
              aspectRatio: "16/7", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => setShowCamera(true)}
            >
              {/* Animated scan line */}
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg, transparent, #f59e0b, transparent)",
                  animation: "scanLine 2.5s ease-in-out infinite",
                  opacity: 0.6,
                }} />
              </div>

              {/* Corner brackets */}
              {[
                { top: 20, left: 20,  borderTop: "2px solid #f59e0b", borderLeft: "2px solid #f59e0b"  },
                { top: 20, right: 20, borderTop: "2px solid #f59e0b", borderRight: "2px solid #f59e0b" },
                { bottom: 20, left: 20,  borderBottom: "2px solid #f59e0b", borderLeft: "2px solid #f59e0b"  },
                { bottom: 20, right: 20, borderBottom: "2px solid #f59e0b", borderRight: "2px solid #f59e0b" },
              ].map((style, i) => (
                <div key={i} style={{ position: "absolute", width: 24, height: 24, ...style }} />
              ))}

              {/* Grid lines */}
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

              {/* Center prompt */}
              <div style={{ textAlign: "center", position: "relative" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <ScanLine size={26} color="#f59e0b" />
                </div>
                <p style={{ color: "#e5e7eb", fontWeight: 700, fontSize: 15, margin: "0 0 4px", fontFamily: "'Syne',sans-serif" }}>
                  Click to activate camera
                </p>
                <p style={{ color: "#374151", fontSize: 12, margin: 0 }}>
                  Point at any EAN / UPC / QR barcode
                </p>
              </div>
            </div>
          ) : (
            /* Live camera */
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(245,158,11,0.2)" }}>
              <BarcodeScanner onScan={handleScan} onClose={() => setShowCamera(false)} />
            </div>
          )}
        </div>
      )}

      {/* ── Manual mode ── */}
      {mode === "manual" && (
        <div style={{ marginBottom: 20, animation: "fadeUp 0.3s ease-out" }}>
          <form onSubmit={handleManual}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Enter barcode number (e.g. 8901030860201)"
                autoFocus
                style={{
                  flex: 1, background: "#0e0e16", border: "1px solid #252535",
                  borderRadius: 12, color: "#e5e7eb", fontSize: 15,
                  padding: "14px 18px", outline: "none",
                  fontFamily: "monospace", letterSpacing: "0.06em",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#f59e0b"}
                onBlur={e => e.target.style.borderColor = "#252535"}
              />
              <button type="submit" disabled={!manualCode.trim() || looking} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 22px", borderRadius: 12,
                background: "#f59e0b", border: "none", color: "#111",
                fontSize: 14, fontWeight: 700, cursor: (!manualCode.trim() || looking) ? "not-allowed" : "pointer",
                opacity: (!manualCode.trim() || looking) ? 0.5 : 1,
              }}>
                {looking ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <Zap size={16} />}
                Lookup
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Result card ── */}
      {(looking || lastScan) && (
        <div style={{
          marginBottom: 20, borderRadius: 16, overflow: "hidden",
          border: `1px solid ${lastScan?.found ? "rgba(52,211,153,0.2)" : lastScan ? "rgba(255,255,255,0.06)" : "rgba(245,158,11,0.15)"}`,
          background: "#111118", animation: "fadeUp 0.3s ease-out",
        }}>
          {looking ? (
            <div style={{ padding: "32px", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid rgba(245,158,11,0.15)", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }}/>
              <span style={{ color: "#4b5563", fontSize: 14, fontFamily: "monospace" }}>QUERYING DATABASE…</span>
            </div>
          ) : lastScan && (
            <>
              {/* Result header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #0e0e16", display: "flex", alignItems: "center", gap: 10 }}>
                {lastScan.found
                  ? <CheckCircle size={16} color="#34d399" />
                  : <XCircle size={16} color="#374151" />}
                <span style={{ color: lastScan.found ? "#34d399" : "#374151", fontSize: 12, fontWeight: 700, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {lastScan.found ? "PRODUCT IDENTIFIED" : "NOT IN DATABASE"}
                </span>
                <span style={{ marginLeft: "auto", color: "#252535", fontSize: 11, fontFamily: "monospace" }}>
                  {lastScan.barcode}
                </span>
              </div>

              {/* Result body */}
              <div style={{ padding: "20px", display: "flex", gap: 18, alignItems: "center" }}>
                {/* Product image or icon */}
                <div style={{ width: 64, height: 64, borderRadius: 12, background: "#0e0e16", border: "1px solid #1a1a24", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {lastScan.image
                    ? <img src={lastScan.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                    : <Package size={28} color="#252535" />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: lastScan.found ? "#fff" : "#374151", fontWeight: 700, fontSize: 17, margin: 0, fontFamily: "'Syne',sans-serif" }}>
                    {lastScan.name || "Unknown Product"}
                  </p>
                  {lastScan.brand && (
                    <p style={{ color: "#4b5563", fontSize: 13, margin: "4px 0 0" }}>{lastScan.brand}</p>
                  )}
                  <p style={{ color: "#252535", fontSize: 11, margin: "6px 0 0", fontFamily: "monospace" }}>
                    Source: Open Food Facts
                  </p>
                </div>

                {/* Action button */}
                <button onClick={handleAddProduct} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "11px 18px", borderRadius: 10, flexShrink: 0,
                  background: "#f59e0b", border: "none", color: "#111",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(245,158,11,0.2)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = ""}
                >
                  Add to Inventory <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Scan history ── */}
      {history.length > 0 && (
        <div style={{ animation: "fadeUp 0.4s ease-out 100ms both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <History size={15} color="#374151" />
              <span style={{ color: "#374151", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>
                Scan History ({history.length})
              </span>
            </div>
            <button onClick={() => setHistory([])} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#252535", fontSize: 12, cursor: "pointer" }}>
              <Trash2 size={12} /> Clear
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((entry, i) => (
              <HistoryItem key={`${entry.barcode}-${i}`} entry={entry} onUse={useHistoryEntry} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state (no history) ── */}
      {history.length === 0 && !lastScan && !looking && (
        <div style={{ textAlign: "center", padding: "32px 0", animation: "fadeUp 0.5s ease-out 200ms both" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#1a1a24", animation: `blink 1.4s ${i * 0.3}s infinite` }} />
            ))}
          </div>
          <p style={{ color: "#1f2937", fontSize: 13, fontFamily: "monospace" }}>
            AWAITING SCAN INPUT…
          </p>
        </div>
      )}

      {/* ── Tip bar ── */}
      <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 10, background: "#0e0e16", border: "1px solid #1a1a24", display: "flex", alignItems: "center", gap: 10 }}>
        <RefreshCw size={13} color="#252535" />
        <p style={{ color: "#252535", fontSize: 12, margin: 0, fontFamily: "monospace" }}>
          TIP: After scanning, click "Add to Inventory" — product name &amp; category are auto-filled from Open Food Facts.
        </p>
      </div>

      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes blink   { 0%,100%{opacity:0.2}50%{opacity:1} }
        @keyframes scanLine {
          0%   { top: 10%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        input { color-scheme: dark; }
      `}</style>
    </div>
  );
}