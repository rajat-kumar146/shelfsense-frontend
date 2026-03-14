/**
 * ShelfSense — Add / Edit Product (Upgraded)
 * Features:
 *  - Open Food Facts barcode auto-fill (name, category, image)
 *  - Manual barcode entry with lookup button
 *  - Scanner modal integration
 *  - Polished dark form UI
 *  - Edit mode support
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Save, ScanLine, Search,
  Package, Loader2, CheckCircle, XCircle,
  Calendar, Tag, Hash, FileText, Boxes,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import BarcodeScanner from "../components/Scanner/BarcodeScanner";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Food & Beverages",
  "Pharmaceuticals",
  "Cosmetics & Personal Care",
  "Cleaning Products",
  "Electronics",
  "Industrial",
  "Other",
];

const EMPTY_FORM = {
  productName:    "",
  barcode:        "",
  batchNumber:    "",
  manufactureDate:"",
  expiryDate:     "",
  quantity:       "",
  category:       "",
  notes:          "",
};

// ─── Open Food Facts lookup ───────────────────────────────────────────────────
async function lookupBarcode(barcode) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  );
  if (!res.ok) throw new Error("Network error");
  const data = await res.json();
  if (data.status !== 1) throw new Error("Product not found");
  return data.product;
}

function mapOFFCategory(product) {
  const cats = (product.categories || "").toLowerCase();
  const name = (product.product_name || "").toLowerCase();
  if (cats.includes("pharma") || cats.includes("medicine") || name.includes("tablet") || name.includes("capsule")) return "Pharmaceuticals";
  if (cats.includes("cosmetic") || cats.includes("beauty") || cats.includes("personal care")) return "Cosmetics & Personal Care";
  if (cats.includes("cleaning") || cats.includes("detergent")) return "Cleaning Products";
  if (cats.includes("electronic")) return "Electronics";
  if (cats.includes("industrial")) return "Industrial";
  // Default: Food & Beverages for Open Food Facts products
  return "Food & Beverages";
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color="#f59e0b" />
      </div>
      <div>
        <p style={{ color: "#e5e7eb", fontWeight: 700, fontSize: 14, margin: 0, fontFamily: "'Syne',sans-serif" }}>{title}</p>
        {subtitle && <p style={{ color: "#4b5563", fontSize: 12, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }) {
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

const inputStyle = {
  width: "100%", background: "#0e0e16",
  border: "1px solid #252535", borderRadius: 10,
  color: "#e5e7eb", fontSize: 14, padding: "10px 14px",
  outline: "none", fontFamily: "'DM Sans',sans-serif",
  boxSizing: "border-box", transition: "border-color 0.2s",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddProduct() {
  const [form, setForm]             = useState(EMPTY_FORM);
  const [showScanner, setShowScanner] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [lookupState, setLookupState] = useState("idle"); // idle | loading | found | not_found | error
  const [productImage, setProductImage] = useState(null);
  const [productBrand, setProductBrand] = useState(null);

  const navigate = useNavigate();
  const { id }   = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  // Pre-fill barcode from scanner page redirect
  useEffect(() => {
    const bc = searchParams.get("barcode");
    if (bc) {
      setForm(f => ({ ...f, barcode: bc }));
      doLookup(bc);
    }
  }, []);

  // Load existing product for edit mode
  useEffect(() => {
    if (!isEditing) return;
    api.get(`/products/${id}`)
      .then(({ data }) => setForm({
        productName:     data.productName     || "",
        barcode:         data.barcode         || "",
        batchNumber:     data.batchNumber     || "",
        manufactureDate: data.manufactureDate ? data.manufactureDate.slice(0,10) : "",
        expiryDate:      data.expiryDate      ? data.expiryDate.slice(0,10)      : "",
        quantity:        data.quantity        ?? "",
        category:        data.category        || "",
        notes:           data.notes           || "",
      }))
      .catch(() => toast.error("Could not load product"));
  }, [id, isEditing]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // ── Barcode lookup ──────────────────────────────────────────────────────────
  const doLookup = async (barcode) => {
    if (!barcode?.trim()) return;
    setLookupState("loading");
    setProductImage(null);
    setProductBrand(null);
    try {
      const product = await lookupBarcode(barcode.trim());
      const name     = product.product_name || product.product_name_en || "";
      const category = mapOFFCategory(product);
      const brand    = product.brands || "";
      const image    = product.image_front_small_url || product.image_url || null;

      setForm(f => ({
        ...f,
        productName: name || f.productName,
        category:    f.category || category,
      }));
      setProductImage(image);
      setProductBrand(brand);
      setLookupState(name ? "found" : "not_found");
      if (name) toast.success(`Found: ${name}`);
      else      toast("Product found but no name — please fill manually.", { icon: "ℹ️" });
    } catch (err) {
      setLookupState(err.message === "Product not found" ? "not_found" : "error");
      if (err.message === "Product not found")
        toast("Barcode not in Open Food Facts — fill manually.", { icon: "ℹ️" });
      else
        toast.error("Lookup failed — check your connection.");
    }
  };

  // ── Scanner callback ────────────────────────────────────────────────────────
  const handleScan = (barcode) => {
    setShowScanner(false);
    setForm(f => ({ ...f, barcode }));
    toast.success(`Scanned: ${barcode}`);
    doLookup(barcode);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/products/${id}`, form);
        toast.success("Product updated!");
      } else {
        await api.post("/products", form);
        toast.success("Product added!");
      }
      navigate("/products");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  // ── Lookup status badge ─────────────────────────────────────────────────────
  const LookupBadge = () => {
    if (lookupState === "idle") return null;
    const configs = {
      loading:   { bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)",  color:"#f59e0b", icon:<Loader2 size={13} style={{animation:"spin 0.8s linear infinite"}}/>, text:"Looking up barcode…"     },
      found:     { bg:"rgba(52,211,153,0.08)", border:"rgba(52,211,153,0.2)",  color:"#34d399", icon:<CheckCircle size={13}/>,                                              text:"Product info auto-filled!" },
      not_found: { bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.2)",  color:"#f59e0b", icon:<XCircle size={13}/>,                                                 text:"Not in database — fill manually" },
      error:     { bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.2)",   color:"#ef4444", icon:<XCircle size={13}/>,                                                 text:"Lookup failed"                   },
    };
    const c = configs[lookupState];
    if (!c) return null;
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, background:c.bg, border:`1px solid ${c.border}`, color:c.color, fontSize:12, fontWeight:500, marginTop:8 }}>
        {c.icon}{c.text}
      </div>
    );
  };

  // ── Card style ──────────────────────────────────────────────────────────────
  const card = { background:"#111118", border:"1px solid #1a1a24", borderRadius:16, padding:"24px 26px", marginBottom:16 };
  const grid2 = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* ── Page header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <Link to="/products" style={{ display:"flex", padding:8, borderRadius:10, background:"#1a1a24", border:"1px solid #252535", color:"#6b7280", textDecoration:"none", transition:"color 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.color="#e5e7eb"}
          onMouseLeave={e=>e.currentTarget.style.color="#6b7280"}
        >
          <ArrowLeft size={18}/>
        </Link>
        <div>
          <h1 style={{ color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, margin:0 }}>
            {isEditing ? "Edit Product" : "Add New Product"}
          </h1>
          <p style={{ color:"#374151", fontSize:13, margin:"4px 0 0" }}>
            {isEditing ? "Update product details below" : "Fill in details or scan a barcode to auto-fill"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Barcode section ── */}
        <div style={card}>
          <SectionHeader icon={ScanLine} title="Barcode Lookup" subtitle="Scan or enter a barcode to auto-fill product info" />

          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1, position:"relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: 14 }}
                placeholder="Enter barcode (EAN-13, UPC, etc.)"
                value={form.barcode}
                onChange={set("barcode")}
              />
            </div>
            {/* Lookup button */}
            <button type="button" onClick={() => doLookup(form.barcode)}
              disabled={lookupState === "loading" || !form.barcode}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px", borderRadius:10, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", color:"#f59e0b", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", opacity: (!form.barcode || lookupState==="loading") ? 0.5 : 1 }}>
              {lookupState === "loading" ? <Loader2 size={15} style={{animation:"spin 0.8s linear infinite"}}/> : <Search size={15}/>}
              Lookup
            </button>
            {/* Scan button */}
            <button type="button" onClick={() => setShowScanner(true)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px", borderRadius:10, background:"#1a1a24", border:"1px solid #252535", color:"#9ca3af", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
              <ScanLine size={15}/> Scan
            </button>
          </div>

          <LookupBadge />

          {/* Product preview card (when found) */}
          {(lookupState === "found" && (productImage || productBrand)) && (
            <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:14, padding:"12px 16px", background:"rgba(52,211,153,0.04)", border:"1px solid rgba(52,211,153,0.12)", borderRadius:12, animation:"fadeIn 0.3s ease-out" }}>
              {productImage && (
                <img src={productImage} alt="product" style={{ width:52, height:52, objectFit:"contain", borderRadius:8, background:"#fff", padding:4, flexShrink:0 }} />
              )}
              <div>
                <p style={{ color:"#34d399", fontWeight:600, fontSize:13, margin:0 }}>{form.productName}</p>
                {productBrand && <p style={{ color:"#4b5563", fontSize:12, margin:"3px 0 0" }}>{productBrand}</p>}
                <p style={{ color:"#374151", fontSize:11, margin:"3px 0 0" }}>Source: Open Food Facts</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Product info ── */}
        <div style={card}>
          <SectionHeader icon={Package} title="Product Information" subtitle="Core product details" />
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Field label="Product Name" required>
              <input style={inputStyle} placeholder="e.g. Milk Powder 2kg"
                value={form.productName} onChange={set("productName")} required
                onFocus={e=>e.target.style.borderColor="#f59e0b"}
                onBlur={e=>e.target.style.borderColor="#252535"}
              />
            </Field>

            <div style={grid2}>
              <Field label="Category" required>
                <select style={{ ...inputStyle, cursor:"pointer" }}
                  value={form.category} onChange={set("category")} required
                  onFocus={e=>e.target.style.borderColor="#f59e0b"}
                  onBlur={e=>e.target.style.borderColor="#252535"}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Quantity" required hint="Number of units">
                <input style={inputStyle} type="number" min="0" placeholder="e.g. 100"
                  value={form.quantity} onChange={set("quantity")} required
                  onFocus={e=>e.target.style.borderColor="#f59e0b"}
                  onBlur={e=>e.target.style.borderColor="#252535"}
                />
              </Field>
            </div>

            <Field label="Batch Number" hint="Optional — for tracking specific batches">
              <input style={inputStyle} placeholder="e.g. BATCH-2024-001"
                value={form.batchNumber} onChange={set("batchNumber")}
                onFocus={e=>e.target.style.borderColor="#f59e0b"}
                onBlur={e=>e.target.style.borderColor="#252535"}
              />
            </Field>
          </div>
        </div>

        {/* ── Dates ── */}
        <div style={card}>
          <SectionHeader icon={Calendar} title="Dates" subtitle="Manufacture and expiry dates" />
          <div style={grid2}>
            <Field label="Manufacture Date">
              <input style={inputStyle} type="date"
                value={form.manufactureDate} onChange={set("manufactureDate")}
                onFocus={e=>e.target.style.borderColor="#f59e0b"}
                onBlur={e=>e.target.style.borderColor="#252535"}
              />
            </Field>
            <Field label="Expiry Date" required>
              <input style={inputStyle} type="date"
                value={form.expiryDate} onChange={set("expiryDate")} required
                onFocus={e=>e.target.style.borderColor="#f59e0b"}
                onBlur={e=>e.target.style.borderColor="#252535"}
              />
            </Field>
          </div>

          {/* Shelf life preview */}
          {form.manufactureDate && form.expiryDate && (() => {
            const mfg = new Date(form.manufactureDate);
            const exp = new Date(form.expiryDate);
            const totalDays = Math.ceil((exp - mfg) / (1000*60*60*24));
            const daysLeft  = Math.ceil((exp - new Date()) / (1000*60*60*24));
            if (totalDays <= 0) return null;
            const pct = Math.min(100, Math.max(0, Math.round((daysLeft / totalDays) * 100)));
            const barColor = pct > 60 ? "#34d399" : pct > 30 ? "#f59e0b" : "#ef4444";
            return (
              <div style={{ marginTop:16, padding:"14px 16px", background:"#0e0e16", borderRadius:10, border:"1px solid #1a1a24" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ color:"#4b5563", fontSize:12 }}>Shelf life remaining</span>
                  <span style={{ color:barColor, fontSize:12, fontWeight:700 }}>{pct}% · {Math.max(0,daysLeft)} days left</span>
                </div>
                <div style={{ height:6, background:"#1a1a24", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:barColor, borderRadius:99, transition:"width 0.6s" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  <span style={{ color:"#1f2937", fontSize:11 }}>Manufactured</span>
                  <span style={{ color:"#1f2937", fontSize:11 }}>{totalDays} day shelf life</span>
                  <span style={{ color:"#1f2937", fontSize:11 }}>Expires</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Notes ── */}
        <div style={card}>
          <SectionHeader icon={FileText} title="Notes" subtitle="Optional additional information" />
          <textarea
            style={{ ...inputStyle, resize:"vertical", minHeight:90 }}
            placeholder="Storage instructions, supplier info, internal notes…"
            value={form.notes} onChange={set("notes")}
            onFocus={e=>e.target.style.borderColor="#f59e0b"}
            onBlur={e=>e.target.style.borderColor="#252535"}
          />
        </div>

        {/* ── Actions ── */}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Link to="/products" style={{
            display:"flex", alignItems:"center", gap:6, padding:"11px 20px",
            borderRadius:10, background:"#1a1a24", border:"1px solid #252535",
            color:"#9ca3af", fontSize:14, fontWeight:600, textDecoration:"none",
          }}>
            Cancel
          </Link>
          <button type="submit" disabled={saving} style={{
            display:"flex", alignItems:"center", gap:8, padding:"11px 24px",
            borderRadius:10, background:"#f59e0b", border:"none",
            color:"#111", fontSize:14, fontWeight:700, cursor:"pointer",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving
              ? <><Loader2 size={16} style={{animation:"spin 0.8s linear infinite"}}/> Saving…</>
              : <><Save size={16}/> {isEditing ? "Save Changes" : "Add Product"}</>
            }
          </button>
        </div>
      </form>

      {/* ── Scanner modal ── */}
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        select option { background:#111118; color:#e5e7eb; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
      `}</style>
    </div>
  );
}