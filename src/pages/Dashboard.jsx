/**
 * ShelfSense — Dashboard
 * Fully null-safe: never crashes if API is slow or returns nothing.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, AlertTriangle, XCircle, CheckCircle,
  RefreshCw, Plus, ScanLine, ArrowRight, TrendingUp,
} from "lucide-react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from "chart.js";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import AIAssistant from "../components/AIAssistant/AIAssistant";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ─── Status badge ──────────────────────────────────────────────────────────────
function statusColor(s) {
  return { expired:"#ef4444", urgent:"#f97316", expiring_soon:"#f59e0b", safe:"#34d399" }[s] || "#6b7280";
}
function StatusBadge({ status }) {
  const labels = { expired:"Expired", urgent:"Urgent", expiring_soon:"Expiring Soon", safe:"Safe" };
  const c = statusColor(status);
  return (
    <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700, background:`${c}18`, border:`1px solid ${c}40`, color:c }}>
      {labels[status] || status || "—"}
    </span>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, delay=0 }) {
  return (
    <div style={{ background:"#111118", border:"1px solid #1a1a24", borderRadius:14, padding:20, animation:`fadeUp 0.4s ease-out ${delay}ms both`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${color}08`, pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <p style={{ color:"#6b7280", fontSize:11, fontWeight:600, margin:0, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</p>
        <div style={{ width:34, height:34, borderRadius:10, background:`${color}15`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, margin:0, lineHeight:1 }}>{value ?? 0}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [stats,      setStats]      = useState({});
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else { setLoading(true); setError(null); }

    try {
      const [sRes, pRes] = await Promise.all([
        api.get("/products/stats").catch(() => ({ data: {} })),
        api.get("/products?limit=6&sort=expiryDate&order=asc").catch(() => ({ data: [] })),
      ]);
      setStats(sRes.data || {});
      const raw = pRes.data;
      setProducts(Array.isArray(raw) ? raw : (raw?.products ?? []));
    } catch (e) {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:14 }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #1a1a24", borderTopColor:"#f59e0b", animation:"spin 0.8s linear infinite" }} />
      <p style={{ color:"#374151", fontSize:12, fontFamily:"monospace", margin:0 }}>LOADING DASHBOARD…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16, textAlign:"center" }}>
      <XCircle size={40} color="#ef4444" />
      <p style={{ color:"#ef4444", fontSize:14, fontWeight:600, margin:0 }}>{error}</p>
      <button onClick={() => fetchData()} style={{ padding:"10px 22px", borderRadius:10, background:"#f59e0b", border:"none", color:"#111", fontWeight:700, cursor:"pointer" }}>Retry</button>
    </div>
  );

  // Safe reads
  const total        = Number(stats.total        ?? 0);
  const expired      = Number(stats.expired      ?? 0);
  const urgent       = Number(stats.urgent       ?? 0);
  const expiringSoon = Number(stats.expiringSoon ?? stats.expiring_soon ?? 0);
  const safe         = Number(stats.safe         ?? 0);
  const categories   = Array.isArray(stats.categories) ? stats.categories : [];
  const monthly      = Array.isArray(stats.monthly)    ? stats.monthly    : [];

  // Charts
  const doughnutData = {
    labels: ["Expired","Urgent","Expiring Soon","Safe"],
    datasets: [{ data:[expired,urgent,expiringSoon,safe], backgroundColor:["#ef444430","#f9731630","#f59e0b30","#34d39930"], borderColor:["#ef4444","#f97316","#f59e0b","#34d399"], borderWidth:2 }],
  };

  const now = new Date();
  const barLabels = monthly.length
    ? monthly.map(m => m.month || m._id || "")
    : Array.from({length:6},(_,i) => new Date(now.getFullYear(), now.getMonth()+i, 1).toLocaleString("default",{month:"short"}));
  const barValues = monthly.length ? monthly.map(m => m.count ?? 0) : [0,0,0,0,0,0];

  const barData = {
    labels: barLabels,
    datasets: [{ label:"Expiring", data:barValues, backgroundColor:"rgba(245,158,11,0.15)", borderColor:"#f59e0b", borderWidth:2, borderRadius:6 }],
  };

  const barOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false}, tooltip:{backgroundColor:"#1a1a24",titleColor:"#e5e7eb",bodyColor:"#9ca3af"} },
    scales:{ x:{ticks:{color:"#4b5563",font:{size:11}},grid:{color:"#111118"}}, y:{ticks:{color:"#4b5563",font:{size:11},stepSize:1},grid:{color:"#1a1a24"}} },
  };

  const dOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false}, tooltip:{backgroundColor:"#1a1a24",titleColor:"#e5e7eb",bodyColor:"#9ca3af"} },
    cutout:"72%",
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, gap:12, flexWrap:"wrap", animation:"fadeUp 0.3s ease-out" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d399", animation:"pulse 2s infinite" }} />
            <span style={{ color:"#252535", fontSize:10, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.12em" }}>LIVE · DASHBOARD</span>
          </div>
          <h1 style={{ color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:24, margin:0 }}>
            Good {greeting}, {(user?.name || "there").split(" ")[0]} 👋
          </h1>
          <p style={{ color:"#374151", fontSize:13, margin:"5px 0 0" }}>Here's your inventory at a glance.</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => fetchData(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:10, background:"#111118", border:"1px solid #1a1a24", color:"#6b7280", fontSize:13, cursor:"pointer" }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} /> Refresh
          </button>
          <button onClick={() => navigate("/products/add")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:"#f59e0b", border:"none", color:"#111", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {(expired > 0 || urgent > 0) && (
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", marginBottom:20, animation:"fadeUp 0.4s ease-out 50ms both" }}>
          <AlertTriangle size={16} color="#ef4444" style={{ flexShrink:0 }} />
          <p style={{ color:"#fca5a5", fontSize:13, margin:0 }}>
            <strong>{expired+urgent} product{expired+urgent>1?"s":""}</strong> need attention —{" "}
            {expired>0 && `${expired} expired`}{expired>0&&urgent>0&&", "}{urgent>0 && `${urgent} urgent`}.
          </p>
          <button onClick={() => navigate("/products")} style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, background:"none", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
            View <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
        <StatCard label="Total"        value={total}        icon={Package}       color="#6b7280" delay={0}   />
        <StatCard label="Expired"      value={expired}      icon={XCircle}       color="#ef4444" delay={50}  />
        <StatCard label="Urgent"       value={urgent}       icon={AlertTriangle} color="#f97316" delay={100} />
        <StatCard label="Expiring Soon"value={expiringSoon} icon={TrendingUp}    color="#f59e0b" delay={150} />
        <StatCard label="Safe"         value={safe}         icon={CheckCircle}   color="#34d399" delay={200} />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:14, marginBottom:20 }} className="charts-row">
        {/* Doughnut */}
        <div style={{ background:"#111118", border:"1px solid #1a1a24", borderRadius:14, padding:"18px 20px", animation:"fadeUp 0.4s ease-out 200ms both" }}>
          <p style={{ color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, margin:"0 0 14px" }}>Status Split</p>
          <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {total > 0
              ? <Doughnut data={doughnutData} options={dOpts} />
              : <p style={{ color:"#252535", fontSize:11, fontFamily:"monospace", textAlign:"center" }}>ADD PRODUCTS<br/>TO SEE CHART</p>
            }
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:14 }}>
            {[["Expired",expired,"#ef4444"],["Urgent",urgent,"#f97316"],["Expiring",expiringSoon,"#f59e0b"],["Safe",safe,"#34d399"]].map(([l,v,c])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:c }} />
                  <span style={{ color:"#4b5563", fontSize:11 }}>{l}</span>
                </div>
                <span style={{ color:"#e5e7eb", fontSize:11, fontFamily:"monospace", fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
        <div style={{ background:"#111118", border:"1px solid #1a1a24", borderRadius:14, padding:"18px 20px", animation:"fadeUp 0.4s ease-out 250ms both" }}>
          <p style={{ color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, margin:"0 0 14px" }}>6-Month Expiry Forecast</p>
          <div style={{ height:220 }}>
            <Bar data={barData} options={barOpts} />
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div style={{ background:"#111118", border:"1px solid #1a1a24", borderRadius:14, padding:"18px 20px", marginBottom:20, animation:"fadeUp 0.4s ease-out 280ms both" }}>
          <p style={{ color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, margin:"0 0 14px" }}>Category Breakdown</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {categories.slice(0,6).map(({ _id, count })=>{
              const pct = total>0 ? Math.round((count/total)*100) : 0;
              return (
                <div key={_id} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ color:"#6b7280", fontSize:12, width:110, flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{_id||"Uncategorized"}</span>
                  <div style={{ flex:1, height:5, borderRadius:99, background:"#1a1a24" }}>
                    <div style={{ height:"100%", borderRadius:99, width:`${pct}%`, background:"linear-gradient(90deg,#f59e0b,#f97316)", transition:"width 1s ease" }} />
                  </div>
                  <span style={{ color:"#4b5563", fontSize:11, fontFamily:"monospace", width:24, textAlign:"right" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products table */}
      <div style={{ background:"#111118", border:"1px solid #1a1a24", borderRadius:14, padding:"18px 20px", marginBottom:20, animation:"fadeUp 0.4s ease-out 300ms both" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <p style={{ color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, margin:0 }}>Upcoming Expirations</p>
          <button onClick={()=>navigate("/products")} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", color:"#f59e0b", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            View all <ArrowRight size={12} />
          </button>
        </div>
        {products.length === 0 ? (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <p style={{ color:"#252535", fontSize:12, fontFamily:"monospace", margin:0 }}>NO PRODUCTS YET — ADD ONE TO GET STARTED</p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Product","Category","Qty","Expiry Date","Status"].map(h=>(
                    <th key={h} style={{ color:"#374151", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", textAlign:"left", padding:"0 12px 10px 0", borderBottom:"1px solid #1a1a24", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p,i)=>{
                  const daysLeft = p.daysUntilExpiry ?? Math.ceil((new Date(p.expiryDate)-new Date())/86400000);
                  return (
                    <tr key={p._id||i} style={{ borderBottom:"1px solid #0e0e16" }}>
                      <td style={{ padding:"11px 12px 11px 0" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          {daysLeft<=7 && daysLeft>=0 && <div style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444", boxShadow:"0 0 5px #ef4444", flexShrink:0, animation:"pulse 1.5s infinite" }} />}
                          <span style={{ color:"#e5e7eb", fontSize:13, fontWeight:600, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>{p.name||"—"}</span>
                        </div>
                      </td>
                      <td style={{ padding:"11px 12px 11px 0" }}><span style={{ color:"#4b5563", fontSize:12 }}>{p.category||"—"}</span></td>
                      <td style={{ padding:"11px 12px 11px 0" }}><span style={{ color:"#6b7280", fontSize:12, fontFamily:"monospace" }}>{p.quantity??"—"}</span></td>
                      <td style={{ padding:"11px 12px 11px 0", whiteSpace:"nowrap" }}><span style={{ color:"#6b7280", fontSize:12 }}>{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—"}</span></td>
                      <td style={{ padding:"11px 0" }}><StatusBadge status={p.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, animation:"fadeUp 0.4s ease-out 350ms both" }}>
        {[
          { label:"Add Product",  sub:"Manually or by barcode",  icon:Plus,     action:()=>navigate("/products/add"), color:"#f59e0b" },
          { label:"Scan Barcode", sub:"Open camera scanner",     icon:ScanLine, action:()=>navigate("/scanner"),     color:"#3b82f6" },
        ].map(({label,sub,icon:Icon,action,color})=>(
          <button key={label} onClick={action}
            style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", borderRadius:12, background:"#111118", border:"1px solid #1a1a24", cursor:"pointer", textAlign:"left", transition:"border-color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=color+"50"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#1a1a24"}
          >
            <div style={{ width:38, height:38, borderRadius:10, background:`${color}15`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <p style={{ color:"#e5e7eb", fontWeight:700, fontSize:14, margin:0, fontFamily:"'Syne',sans-serif" }}>{label}</p>
              <p style={{ color:"#374151", fontSize:12, margin:"2px 0 0" }}>{sub}</p>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @media(max-width:700px){ .charts-row{ grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  );
}