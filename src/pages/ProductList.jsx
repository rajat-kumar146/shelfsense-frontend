/**
 * ShelfSense — Product List (Upgraded)
 * Features: search, category filter, status filter, column sorting,
 *           bulk select + bulk delete, pagination, delete confirm modal,
 *           empty state, animated rows, days-left pill
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Plus, Edit2, Trash2,
  ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, ChevronsUpDown,
  Package, CheckSquare, Square, X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import StatusBadge from "../components/UI/StatusBadge";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "All",
  "Food & Beverages",
  "Pharmaceuticals",
  "Cosmetics & Personal Care",
  "Cleaning Products",
  "Electronics",
  "Industrial",
  "Other",
];

const STATUSES = [
  { value: "",              label: "All Status" },
  { value: "safe",          label: "Safe" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "urgent",        label: "Urgent" },
  { value: "expired",       label: "Expired" },
];

const PAGE_SIZE = 15;

// ─── Days-left pill ───────────────────────────────────────────────────────────
function DaysLeftPill({ expiry }) {
  const d = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
  let bg, color, border, label;
  if (d < 0)       { bg="#1a0a0a"; color="#ef4444"; border="rgba(239,68,68,0.25)";  label=`${Math.abs(d)}d ago`; }
  else if (d <= 7)  { bg="#1a0a0a"; color="#ef4444"; border="rgba(239,68,68,0.25)"; label=`${d}d left`; }
  else if (d <= 30) { bg="#1a1506"; color="#f59e0b"; border="rgba(245,158,11,0.25)"; label=`${d}d left`; }
  else              { bg="#06160e"; color="#34d399"; border="rgba(52,211,153,0.2)";  label=`${d}d left`; }
  return (
    <span style={{
      display:"inline-block", padding:"2px 9px", borderRadius:99,
      background:bg, border:`1px solid ${border}`, color,
      fontSize:11, fontWeight:700, fontFamily:"monospace", whiteSpace:"nowrap",
    }}>{label}</span>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ field, sortBy, sortOrder }) {
  if (sortBy !== field) return <ChevronsUpDown size={13} color="#374151" />;
  return sortOrder === "asc"
    ? <ChevronUp size={13} color="#f59e0b" />
    : <ChevronDown size={13} color="#f59e0b" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductList() {
  const [searchParams] = useSearchParams();

  const [products, setProducts]     = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);

  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("All");
  const [status, setStatus]       = useState(searchParams.get("status") || "");
  const [page, setPage]           = useState(1);
  const [sortBy, setSortBy]       = useState("expiryDate");
  const [sortOrder, setSortOrder] = useState("asc");

  const [selected, setSelected]     = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit: PAGE_SIZE, sortBy, sortOrder,
        ...(search && { search }),
        ...(category !== "All" && { category }),
        ...(status && { status }),
      };
      const { data } = await api.get("/products", { params });
      setProducts(data.products || []);
      setPagination(data.pagination || {});
      setSelected(new Set());
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status, sortBy, sortOrder]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
    setPage(1);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget === "bulk") {
        setBulkDeleting(true);
        await Promise.all([...selected].map(id => api.delete(`/products/${id}`)));
        toast.success(`${selected.size} product(s) deleted`);
        setSelected(new Set());
      } else {
        await api.delete(`/products/${deleteTarget.id}`);
        toast.success("Product deleted");
      }
      fetchProducts();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
      setBulkDeleting(false);
    }
  };

  // ── Select ─────────────────────────────────────────────────────────────────
  const toggleOne = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const isAllSelected = products.length > 0 && products.every(p => selected.has(p._id));
  const toggleAll = () => {
    setSelected(isAllSelected ? new Set() : new Set(products.map(p => p._id)));
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inputStyle = {
    background: "#0e0e16", border: "1px solid #252535",
    borderRadius: 10, color: "#e5e7eb", fontSize: 13,
    padding: "9px 14px", outline: "none", width: "100%",
    fontFamily: "'DM Sans', sans-serif",
  };
  const th = {
    textAlign: "left", padding: "11px 14px",
    color: "#374151", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.06em",
    borderBottom: "1px solid #131320", whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.015)",
    userSelect: "none",
  };
  const td = { padding: "11px 14px", borderBottom: "1px solid #0e0e16", fontSize: 13, whiteSpace: "nowrap" };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Bulk bar ── */}
      {selected.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 12, padding: "12px 18px", marginBottom: 16,
          animation: "slideDown 0.25s ease-out",
        }}>
          <CheckSquare size={17} color="#f59e0b" />
          <span style={{ color: "#fbbf24", fontWeight: 600, fontSize: 14 }}>
            {selected.size} selected
          </span>
          <button onClick={() => setDeleteTarget("bulk")} style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#ef4444", borderRadius: 8, padding: "6px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <Trash2 size={14} /> Delete Selected
          </button>
          <button onClick={() => setSelected(new Set())} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", padding: 4 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={14} color="#374151" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            style={{ ...inputStyle, paddingLeft: 36 }}
            placeholder="Search name, barcode, batch…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#374151" }}>
              <X size={13} />
            </button>
          )}
        </div>

        <select style={{ ...inputStyle, width: "auto", minWidth: 160, cursor: "pointer" }}
          value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <select style={{ ...inputStyle, width: "auto", minWidth: 150, cursor: "pointer" }}
          value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {(search || category !== "All" || status) && (
          <button onClick={() => { setSearch(""); setCategory("All"); setStatus(""); setPage(1); }} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#1a1a24", border: "1px solid #252535",
            color: "#6b7280", borderRadius: 10, padding: "9px 14px",
            fontSize: 13, cursor: "pointer",
          }}>
            <X size={13} /> Clear
          </button>
        )}

        <Link to="/products/add" style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#f59e0b", color: "#111",
          borderRadius: 10, padding: "9px 16px",
          fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
        }}>
          <Plus size={15} /> Add Product
        </Link>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#111118", border: "1px solid #1a1a24", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(245,158,11,0.15)", borderTopColor: "#f59e0b", animation: "spin 0.8s linear infinite" }}/>
            <span style={{ color: "#374151", fontSize: 14 }}>Loading…</span>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "64px 32px", textAlign: "center" }}>
            <Package size={48} color="#1f2937" style={{ margin: "0 auto 14px" }} />
            <p style={{ color: "#374151", fontWeight: 600, fontSize: 15, margin: "0 0 6px", fontFamily: "'Syne',sans-serif" }}>No products found</p>
            <p style={{ color: "#1f2937", fontSize: 13, margin: "0 0 20px" }}>
              {search || category !== "All" || status ? "Try adjusting your filters." : "Add your first product to get started."}
            </p>
            <Link to="/products/add" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#f59e0b", color: "#111",
              borderRadius: 10, padding: "9px 18px",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              <Plus size={15} /> Add First Product
            </Link>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: 44, cursor: "default" }}>
                      <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", color: isAllSelected ? "#f59e0b" : "#374151", display: "flex", padding: 0 }}>
                        {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                    {[
                      { label: "Product",     field: "productName" },
                      { label: "Category",    field: "category"    },
                      { label: "Barcode",     field: null          },
                      { label: "Qty",         field: "quantity"    },
                      { label: "Expiry Date", field: "expiryDate"  },
                      { label: "Days Left",   field: null          },
                      { label: "Status",      field: "status"      },
                      { label: "Actions",     field: null          },
                    ].map(({ label, field }) => (
                      <th key={label}
                        style={{ ...th, cursor: field ? "pointer" : "default" }}
                        onClick={() => field && toggleSort(field)}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {label}
                          {field && <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const isSel = selected.has(p._id);
                    return (
                      <tr key={p._id}
                        style={{ background: isSel ? "rgba(245,158,11,0.04)" : "", transition: "background 0.15s", animation: `fadeRow 0.3s ease-out ${i * 25}ms both` }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = ""; }}
                      >
                        <td style={{ ...td, width: 44 }}>
                          <button onClick={() => toggleOne(p._id)} style={{ background: "none", border: "none", cursor: "pointer", color: isSel ? "#f59e0b" : "#2a2a38", display: "flex", padding: 0 }}>
                            {isSel ? <CheckSquare size={15} /> : <Square size={15} />}
                          </button>
                        </td>

                        <td style={{ ...td, maxWidth: 200 }}>
                          <span style={{ display: "block", color: "#e5e7eb", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{p.productName}</span>
                          {p.batchNumber && <span style={{ color: "#374151", fontSize: 11, fontFamily: "monospace" }}>#{p.batchNumber}</span>}
                        </td>

                        <td style={{ ...td, color: "#4b5563", fontSize: 12 }}>{p.category}</td>

                        <td style={{ ...td, color: "#374151", fontFamily: "monospace", fontSize: 11 }}>
                          {p.barcode || <span style={{ color: "#1f2937" }}>—</span>}
                        </td>

                        <td style={{ ...td, color: "#9ca3af", fontWeight: 600 }}>{p.quantity}</td>

                        <td style={{ ...td, fontFamily: "monospace", fontSize: 12, fontWeight: 600,
                          color: p.status === "expired" ? "#ef4444" : p.status === "urgent" ? "#ef4444" : p.status === "expiring_soon" ? "#ffffff" : "#6b7280"
                        }}>
                          {new Date(p.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>

                        <td style={td}><DaysLeftPill expiry={p.expiryDate} /></td>

                        <td style={td}><StatusBadge status={p.status} /></td>

                        <td style={td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Link to={`/products/edit/${p._id}`}
                              title="Edit"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b", textDecoration: "none", transition: "background 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.18)"}
                              onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,0.07)"}
                            ><Edit2 size={13} /></Link>
                            <button onClick={() => setDeleteTarget({ id: p._id, name: p.productName })}
                              title="Delete"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", transition: "background 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
                            ><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderTop: "1px solid #0e0e16" }}>
                <p style={{ color: "#374151", fontSize: 12, margin: 0 }}>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, pagination.total)} of <strong style={{ color: "#6b7280" }}>{pagination.total}</strong>
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ background: "#1a1a24", border: "1px solid #252535", color: page === 1 ? "#1f2937" : "#6b7280", borderRadius: 8, padding: "5px 10px", cursor: page === 1 ? "not-allowed" : "pointer", display: "flex" }}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const n = Math.max(1, Math.min(page - 2, pagination.pages - 4)) + i;
                    return (
                      <button key={n} onClick={() => setPage(n)} style={{
                        background: page === n ? "#f59e0b" : "#1a1a24",
                        border: `1px solid ${page === n ? "#f59e0b" : "#252535"}`,
                        color: page === n ? "#111" : "#6b7280",
                        borderRadius: 8, padding: "5px 11px",
                        fontSize: 13, fontWeight: page === n ? 700 : 400,
                        cursor: "pointer", minWidth: 34,
                      }}>{n}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    style={{ background: "#1a1a24", border: "1px solid #252535", color: page === pagination.pages ? "#1f2937" : "#6b7280", borderRadius: 8, padding: "5px 10px", cursor: page === pagination.pages ? "not-allowed" : "pointer", display: "flex" }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#111118", border: "1px solid #252535", borderRadius: 18, padding: 28, width: "100%", maxWidth: 400, animation: "popIn 0.2s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, margin: 0 }}>
                  {deleteTarget === "bulk" ? `Delete ${selected.size} Products?` : "Delete Product?"}
                </h3>
                <p style={{ color: "#4b5563", fontSize: 12, margin: "3px 0 0" }}>This cannot be undone.</p>
              </div>
            </div>
            <p style={{ color: "#374151", fontSize: 13, margin: "0 0 22px", lineHeight: 1.6 }}>
              {deleteTarget === "bulk"
                ? `All ${selected.size} selected products will be permanently removed.`
                : `"${deleteTarget.name}" will be permanently removed.`}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: 11, borderRadius: 10, background: "#1a1a24", border: "1px solid #252535", color: "#9ca3af", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={doDelete} style={{ flex: 1, padding: 11, borderRadius: 10, background: "#ef4444", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {bulkDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeRow   { from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes popIn     { from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)} }
        select option { background:#111118; color:#e5e7eb; }
      `}</style>
    </div>
  );
}
