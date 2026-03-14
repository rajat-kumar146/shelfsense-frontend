/**
 * ShelfSense — AI Assistant Widget
 * Rendered in Layout so it appears on ALL pages, not just Dashboard.
 * Fetches its own inventory stats independently.
 */

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Send, Loader2, RotateCcw, ChevronDown } from "lucide-react";
import api from "../../services/api";

const SUGGESTIONS = [
  "What products are expiring this week?",
  "How can I reduce food waste?",
  "Explain the status colors",
  "How do I set up email reminders?",
  "What does 'urgent' mean?",
  "Tips for managing inventory",
];

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display:"flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom:10, animation:"msgIn 0.2s ease-out both" }}>
      {!isUser && (
        <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#f59e0b,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", marginRight:8, marginTop:2 }}>
          <Sparkles size={13} color="#111" />
        </div>
      )}
      <div style={{
        maxWidth:"80%", padding:"10px 14px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "linear-gradient(135deg,#f59e0b,#f97316)" : "#1a1a2e",
        border: isUser ? "none" : "1px solid #252540",
        color: isUser ? "#111" : "#e5e7eb",
        fontSize:13, lineHeight:1.6,
        fontWeight: isUser ? 600 : 400,
        boxShadow: isUser ? "0 2px 12px rgba(245,158,11,0.25)" : "none",
        whiteSpace:"pre-wrap", wordBreak:"break-word",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I'm your ShelfSense AI assistant 👋\n\nAsk me anything about your inventory, expiry dates, or how to use the app.",
  }]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [pulse,    setPulse]    = useState(false);
  const [stats,    setStats]    = useState(null);
  const [products, setProducts] = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Pulse tooltip after 4s
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Fetch inventory context when opened for the first time
  useEffect(() => {
    if (open && !stats) {
      api.get("/products/stats").then(r => setStats(r.data)).catch(() => {});
      api.get("/products?limit=5&sort=expiryDate&order=asc").then(r => {
        const d = r.data;
        setProducts(Array.isArray(d) ? d : (d?.products ?? []));
      }).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const inventoryContext = stats
        ? `Current inventory:
- Total: ${stats.total ?? 0} | Expired: ${stats.expired ?? 0} | Urgent: ${stats.urgent ?? 0} | Expiring Soon: ${stats.expiringSoon ?? stats.expiring_soon ?? 0} | Safe: ${stats.safe ?? 0}
${products.length > 0 ? `\nSoonest expiring:\n${products.slice(0,5).map(p => `- ${p.name} (${p.category||"—"}) expires ${new Date(p.expiryDate).toLocaleDateString("en-IN")} [${p.status}]`).join("\n")}` : ""}`
        : "Inventory data not loaded yet.";

      const systemPrompt = `You are ShelfSense AI, a helpful assistant inside the ShelfSense inventory expiry tracking app.
Help users manage inventory, understand expiry dates, reduce waste, and navigate the app.

${inventoryContext}

App pages: Dashboard, Products, Add Product, Scanner (barcode), Reports (CSV/Excel), Reminder Settings, Account.
Status: Expired = past date | Urgent = ≤3 days | Expiring Soon = ≤7 days | Safe = >7 days.
Be concise, friendly, and actionable. Use bullet points for lists.`;

      const { data } = await api.post("/ai/chat", {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        systemPrompt,
      });

      setMessages(prev => [...prev, { role: "assistant", content: data.content || "No response received." }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ ${err.response?.data?.error || "Connection error. Make sure your backend is running and ANTHROPIC_API_KEY is set in .env"}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const reset = () => setMessages([{
    role: "assistant",
    content: "Hi! I'm your ShelfSense AI assistant 👋\n\nAsk me anything about your inventory, expiry dates, or how to use the app.",
  }]);

  return (
    <>
      {/* ── Floating button ── */}
      <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999 }}>

        {/* Tooltip */}
        {!open && pulse && (
          <div style={{
            position:"absolute", bottom:"calc(100% + 12px)", right:0,
            background:"#111118", border:"1px solid #2a2a3a",
            borderRadius:10, padding:"8px 14px", whiteSpace:"nowrap",
            color:"#e5e7eb", fontSize:12, fontWeight:600,
            boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
            animation:"tooltipIn 0.3s ease-out both",
            pointerEvents:"none",
          }}>
            Ask AI anything ✨
            <div style={{ position:"absolute", bottom:-5, right:20, width:10, height:10, background:"#111118", border:"1px solid #2a2a3a", borderTop:"none", borderLeft:"none", transform:"rotate(45deg)" }} />
          </div>
        )}

        {/* Button */}
        <button
          onClick={() => { setOpen(v => !v); setPulse(false); }}
          style={{
            width:56, height:56, borderRadius:"50%",
            background: open ? "#1a1a24" : "linear-gradient(135deg,#f59e0b 0%,#f97316 100%)",
            border: open ? "2px solid #2a2a3a" : "none",
            cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow: open
              ? "0 4px 20px rgba(0,0,0,0.5)"
              : "0 0 0 4px rgba(245,158,11,0.15), 0 4px 28px rgba(245,158,11,0.5)",
            transition:"all 0.25s ease",
            position:"relative",
            outline:"none",
          }}
        >
          {open
            ? <ChevronDown size={22} color="#9ca3af" />
            : <Sparkles size={22} color="#111" />
          }
          {/* Green dot when there are new AI messages */}
          {!open && messages.length > 1 && (
            <div style={{ position:"absolute", top:1, right:1, width:14, height:14, borderRadius:"50%", background:"#34d399", border:"2px solid #0a0a0f" }} />
          )}
        </button>
      </div>

      {/* ── Chat panel ── */}
      <div style={{
        position:"fixed",
        bottom: 96,
        right: 28,
        zIndex: 9998,
        width: 360,
        height: open ? 520 : 0,
        overflow: "hidden",
        borderRadius: 18,
        background: "#0d0d16",
        border: open ? "1px solid #1e1e30" : "1px solid transparent",
        boxShadow: open ? "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.06)" : "none",
        transition: "height 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Header */}
        <div style={{ padding:"16px 18px", background:"linear-gradient(135deg,#111118 0%,#1a1208 100%)", borderBottom:"1px solid #1e1e30", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#f59e0b,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(245,158,11,0.4)" }}>
            <Sparkles size={16} color="#111" />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ color:"#fff", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, margin:0 }}>ShelfSense AI</p>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", animation:"pulse 2s infinite" }} />
              <span style={{ color:"#34d399", fontSize:11 }}>Online · Powered by Claude</span>
            </div>
          </div>
          <button onClick={reset} title="New chat" style={{ background:"none", border:"none", cursor:"pointer", color:"#374151", padding:6, display:"flex", borderRadius:8, transition:"color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color="#9ca3af"}
            onMouseLeave={e => e.currentTarget.style.color="#374151"}
          ><RotateCcw size={14} /></button>
          <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#374151", padding:6, display:"flex", borderRadius:8, transition:"color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color="#9ca3af"}
            onMouseLeave={e => e.currentTarget.style.color="#374151"}
          ><X size={16} /></button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 14px", scrollbarWidth:"thin", scrollbarColor:"#1a1a24 transparent" }}>
          {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#f97316)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Sparkles size={13} color="#111" />
              </div>
              <div style={{ background:"#1a1a2e", border:"1px solid #252540", borderRadius:"16px 16px 16px 4px", padding:"10px 16px", display:"flex", gap:5, alignItems:"center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#f59e0b", animation:`dotBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions — only on first open */}
        {messages.length === 1 && !loading && (
          <div style={{ padding:"0 14px 10px", flexShrink:0 }}>
            <p style={{ color:"#2a2a3a", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 8px" }}>Try asking</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  style={{ padding:"5px 10px", borderRadius:99, background:"#111118", border:"1px solid #1e1e30", color:"#6b7280", fontSize:11, cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#f59e0b55"; e.currentTarget.style.color="#f59e0b"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#1e1e30"; e.currentTarget.style.color="#6b7280"; }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding:"12px 14px", borderTop:"1px solid #1e1e30", background:"#09090f", flexShrink:0, display:"flex", gap:8, alignItems:"flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your inventory…"
            rows={1}
            style={{ flex:1, background:"#111118", border:"1px solid #1e1e30", borderRadius:12, color:"#e5e7eb", fontSize:13, padding:"10px 14px", outline:"none", resize:"none", fontFamily:"'DM Sans',sans-serif", lineHeight:1.5, maxHeight:80, overflow:"auto", transition:"border-color 0.2s", colorScheme:"dark" }}
            onFocus={e => e.target.style.borderColor="#f59e0b55"}
            onBlur={e => e.target.style.borderColor="#1e1e30"}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{ width:38, height:38, borderRadius:11, flexShrink:0, background: input.trim() && !loading ? "linear-gradient(135deg,#f59e0b,#f97316)" : "#1a1a24", border:"none", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", boxShadow: input.trim() && !loading ? "0 2px 12px rgba(245,158,11,0.35)" : "none", outline:"none" }}
          >
            {loading
              ? <Loader2 size={16} color="#374151" style={{ animation:"spin 0.8s linear infinite" }} />
              : <Send size={15} color={input.trim() ? "#111" : "#374151"} />
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes msgIn     { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes tooltipIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse     { 0%,100%{opacity:1}50%{opacity:0.3} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)} }
      `}</style>
    </>
  );
}