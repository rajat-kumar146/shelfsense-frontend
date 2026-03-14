/**
 * GPay-Style Instant Barcode Scanner — Final
 * Always shows camera picker FIRST so user explicitly selects DroidCam
 * Never auto-starts — waits for user to pick and press Start
 */

import { useEffect, useRef, useState } from "react";

const hasNativeDetector = () =>
  typeof window !== "undefined" && "BarcodeDetector" in window;

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const doneRef    = useRef(false);
  const mountedRef = useRef(true);
  const blackCount = useRef(0);

  const [phase, setPhase]       = useState("loading");
  const [cameras, setCameras]   = useState([]);
  const [selCam, setSelCam]     = useState(null);
  const [errMsg, setErrMsg]     = useState("");
  const [code, setCode]         = useState("");

  useEffect(() => {
    mountedRef.current = true;
    doneRef.current    = false;
    getCameras();
    return () => {
      mountedRef.current = false;
      stopAll();
    };
  }, []);

  // ─── Get camera list ─────────────────────────────────────────────────────
  const getCameras = async () => {
    setPhase("loading");
    try {
      // Get permission first so labels are not empty
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tmp.getTracks().forEach(t => t.stop());

      const all  = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === "videoinput");
      setCameras(cams);

      // Auto-select DroidCam if present
      const droid = cams.find(c => /droid/i.test(c.label));
      setSelCam((droid || cams[0]) ?? null);
      setPhase("pick");
    } catch (err) {
      setErrMsg(friendlyErr(err));
      setPhase("error");
    }
  };

  // ─── Stop everything ─────────────────────────────────────────────────────
  const stopAll = () => {
    if (rafRef.current)    { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  // ─── Start scanning with selected camera ─────────────────────────────────
  const startScan = async () => {
    if (!selCam) return;
    stopAll();
    doneRef.current  = false;
    blackCount.current = 0;
    setPhase("init");

    try {
      // IMPORTANT: use exact deviceId so we get DroidCam, not default webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selCam.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;

      await new Promise((res, rej) => {
        const t = setTimeout(() => rej(new Error("timeout")), 12000);
        video.onloadedmetadata = () => { clearTimeout(t); res(); };
        video.onerror = e => { clearTimeout(t); rej(e); };
      });

      await video.play();
      if (!mountedRef.current) return;

      setPhase("scanning");
      startDetection(video);
    } catch (err) {
      if (mountedRef.current) {
        setErrMsg(friendlyErr(err));
        setPhase("error");
      }
    }
  };

  // ─── Detection loop ───────────────────────────────────────────────────────
  const startDetection = async (video) => {
    if (!hasNativeDetector()) {
      // Fallback: just show video, user can't auto-scan (no BarcodeDetector)
      // This won't happen on Chrome
      return;
    }

    let formats = ["ean_13","ean_8","upc_a","upc_e","qr_code","code_128","code_39","data_matrix","pdf417","aztec"];
    try {
      const sup = await window.BarcodeDetector.getSupportedFormats();
      if (sup?.length) formats = sup;
    } catch {}

    const detector = new window.BarcodeDetector({ formats });

    const loop = async () => {
      if (!mountedRef.current || doneRef.current) return;

      if (video.readyState >= 2 && !video.paused && video.videoWidth > 0) {
        // Black frame detection
        if (isBlack(video)) {
          blackCount.current++;
          if (blackCount.current > 90) {
            if (mountedRef.current) setPhase("black");
            return;
          }
        } else {
          blackCount.current = 0;
        }

        // Barcode detection
        try {
          const res = await detector.detect(video);
          if (res.length > 0) {
            const val = res[0].rawValue?.trim();
            if (val) {
              drawBox(res[0].boundingBox);
              onFound(val);
              return;
            }
          }
        } catch {}
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  // ─── Check if frame is black ──────────────────────────────────────────────
  const isBlack = (video) => {
    try {
      const c = document.createElement("canvas");
      c.width = 16; c.height = 9;
      c.getContext("2d").drawImage(video, 0, 0, 16, 9);
      const px = c.getContext("2d").getImageData(0, 0, 16, 9).data;
      let s = 0;
      for (let i = 0; i < px.length; i += 4) s += px[i] + px[i+1] + px[i+2];
      return s < 300;
    } catch { return false; }
  };

  // ─── Draw green highlight on detected barcode ─────────────────────────────
  const drawBox = (box) => {
    const cv = canvasRef.current, vd = videoRef.current;
    if (!cv || !vd || !box) return;
    cv.width = vd.videoWidth; cv.height = vd.videoHeight;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 4;
    ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 16;
    ctx.strokeRect(box.x-8, box.y-8, box.width+16, box.height+16);
    ctx.fillStyle = "rgba(34,197,94,0.15)";
    ctx.fillRect(box.x-8, box.y-8, box.width+16, box.height+16);
  };

  // ─── Success ──────────────────────────────────────────────────────────────
  const onFound = (value) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
    setCode(value);
    setPhase("found");
    setTimeout(async () => {
      stopAll();
      if (mountedRef.current) onScan(value);
    }, 900);
  };

  const friendlyErr = (err) =>
    err?.name === "NotAllowedError"   ? "Camera permission denied.\nClick the 🔒 lock in address bar → allow Camera."
    : err?.name === "NotFoundError"   ? "Camera not found. Make sure DroidCam is connected via USB."
    : err?.name === "NotReadableError"? "Camera is busy. Close other apps using the camera."
    : err?.message?.includes("timeout")? "Camera timed out. Reconnect DroidCam and try again."
    : `Camera error: ${err?.message || err?.name || "Unknown"}`;

  const handleClose = async () => { stopAll(); onClose(); };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const fc = { position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" };

  const Spinner = () => (
    <div style={{ width:48, height:48, borderRadius:"50%",
      border:"3px solid rgba(245,158,11,0.15)", borderTopColor:"#f59e0b",
      animation:"spin 0.8s linear infinite", margin:"0 auto 16px"
    }}/>
  );

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:99999,
      background:"#000", display:"flex", flexDirection:"column",
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
    }}>

      {/* Top bar */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:30,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"44px 18px 18px",
        background:"linear-gradient(to bottom,rgba(0,0,0,0.88),transparent)",
      }}>
        <button onClick={handleClose} style={{
          width:44, height:44, borderRadius:"50%",
          background:"rgba(0,0,0,0.55)", border:"1px solid rgba(255,255,255,0.15)",
          color:"#fff", fontSize:18, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>✕</button>

        <div style={{
          display:"flex", alignItems:"center", gap:8,
          background:"rgba(0,0,0,0.55)", border:"1px solid rgba(255,255,255,0.12)",
          borderRadius:999, padding:"6px 16px",
        }}>
          <div style={{
            width:8, height:8, borderRadius:"50%",
            background: phase==="scanning"?"#f59e0b": phase==="found"?"#22c55e"
              : ["error","black"].includes(phase)?"#ef4444":"#9ca3af",
            animation: ["scanning","init","loading"].includes(phase)
              ? "blink 1.5s ease-in-out infinite" : "none",
          }}/>
          <span style={{color:"#fff", fontSize:12, fontWeight:500}}>
            { phase==="loading"  ? "Detecting cameras..."
            : phase==="pick"     ? "Select Camera"
            : phase==="init"     ? "Starting camera..."
            : phase==="scanning" ? "⚡ Scanning — point at barcode"
            : phase==="found"    ? "✅ Barcode Detected!"
            : phase==="black"    ? "⚠️ No Video Feed"
            :                      "Camera Error" }
          </span>
        </div>

        <div style={{width:44}}/>
      </div>

      {/* Camera viewport */}
      <div style={{flex:1, position:"relative", overflow:"hidden"}}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover"}}
        />
        <canvas ref={canvasRef}
          style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", pointerEvents:"none"}}
        />

        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div style={{...fc, background:"#000", zIndex:20}}>
            <div style={{textAlign:"center"}}>
              <Spinner/>
              <p style={{color:"#6b7280", fontSize:14, margin:0}}>Detecting cameras...</p>
            </div>
          </div>
        )}

        {/* ── CAMERA PICKER ── */}
        {phase === "pick" && (
          <div style={{...fc, background:"rgba(0,0,0,0.97)", zIndex:20, padding:20}}>
            <div style={{
              background:"#111118", border:"1px solid #252535",
              borderRadius:22, padding:"28px 22px",
              width:"100%", maxWidth:420,
            }}>
              <div style={{fontSize:40, textAlign:"center", marginBottom:10}}>📷</div>
              <h3 style={{color:"#fff", fontWeight:700, fontSize:19, textAlign:"center", margin:"0 0 6px"}}>
                Select Camera
              </h3>
              <p style={{color:"#6b7280", fontSize:13, textAlign:"center", margin:"0 0 20px", lineHeight:1.5}}>
                {cameras.length === 0
                  ? "No cameras found. Connect DroidCam via USB first."
                  : "Pick DroidCam to use your phone camera."}
              </p>

              {/* Camera list */}
              <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:18}}>
                {cameras.map((cam, i) => {
                  const isDroid  = /droid/i.test(cam.label);
                  const selected = selCam?.deviceId === cam.deviceId;
                  return (
                    <button key={cam.deviceId} onClick={() => setSelCam(cam)}
                      style={{
                        padding:"14px 16px", borderRadius:13, cursor:"pointer",
                        border: selected ? "2px solid #f59e0b" : "1px solid #252535",
                        background: selected ? "rgba(245,158,11,0.07)" : "#181824",
                        color: selected ? "#f59e0b" : "#d1d5db",
                        display:"flex", alignItems:"center", gap:12, textAlign:"left",
                      }}
                    >
                      <span style={{fontSize:28}}>{isDroid ? "📱" : "🖥️"}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600, fontSize:14, marginBottom:2}}>
                          {cam.label || `Camera ${i+1}`}
                        </div>
                        {isDroid && (
                          <div style={{fontSize:11, color:"#f59e0b", fontWeight:500}}>
                            ⭐ DroidCam — use this one
                          </div>
                        )}
                      </div>
                      {selected && <span style={{fontSize:22}}>✓</span>}
                    </button>
                  );
                })}

                {cameras.length === 0 && (
                  <div style={{
                    background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)",
                    borderRadius:12, padding:"14px", color:"#fbbf24", fontSize:13, lineHeight:1.6,
                  }}>
                    💡 Run <code style={{background:"rgba(0,0,0,0.3)", padding:"1px 6px", borderRadius:4}}>
                      adb forward tcp:4747 tcp:4747
                    </code> in PowerShell, then open DroidCam PC client → USB → Connect, then click Refresh.
                  </div>
                )}
              </div>

              <div style={{display:"flex", gap:10}}>
                <button onClick={getCameras} style={{
                  padding:"13px 16px", borderRadius:12,
                  background:"#181824", border:"1px solid #252535",
                  color:"#9ca3af", fontWeight:600, fontSize:14, cursor:"pointer",
                }}>
                  🔄 Refresh
                </button>
                <button
                  onClick={startScan}
                  disabled={!selCam}
                  style={{
                    flex:1, padding:"13px",
                    background: selCam ? "#f59e0b" : "#252535",
                    color: selCam ? "#111" : "#6b7280",
                    fontWeight:700, fontSize:15, borderRadius:12,
                    border:"none", cursor: selCam ? "pointer" : "not-allowed",
                    transition:"all 0.2s",
                  }}
                >
                  Start Scanning →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── INIT ── */}
        {phase === "init" && (
          <div style={{...fc, background:"#000", zIndex:20}}>
            <div style={{textAlign:"center"}}>
              <Spinner/>
              <p style={{color:"#6b7280", fontSize:14, margin:0}}>
                Opening {selCam?.label || "camera"}...
              </p>
            </div>
          </div>
        )}

        {/* ── SCANNING VIEWFINDER ── */}
        {phase === "scanning" && (
          <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none"}}>
            <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.38)"}}/>
            <div style={{position:"relative", zIndex:5, width:"min(310px,84vw)", height:"min(190px,48vw)"}}>
              <div style={{
                position:"absolute", inset:0, borderRadius:12,
                boxShadow:"0 0 0 4000px rgba(0,0,0,0.38)",
              }}/>
              {/* Scan line */}
              <div style={{
                position:"absolute", left:12, right:12, height:2, zIndex:10,
                borderRadius:2,
                background:"linear-gradient(90deg,transparent,#f59e0b,#fcd34d,#f59e0b,transparent)",
                boxShadow:"0 0 12px 4px rgba(245,158,11,0.55)",
                animation:"gpayScan 2s ease-in-out infinite",
              }}/>
              {/* Corners — top-left */}
              <div style={{position:"absolute",top:0,left:0}}>
                <div style={{width:36,height:5,background:"#fff",borderRadius:3}}/>
                <div style={{width:5,height:36,background:"#fff",borderRadius:3,marginTop:-5}}/>
              </div>
              {/* top-right */}
              <div style={{position:"absolute",top:0,right:0,display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
                <div style={{width:36,height:5,background:"#fff",borderRadius:3}}/>
                <div style={{width:5,height:36,background:"#fff",borderRadius:3,marginTop:-5}}/>
              </div>
              {/* bottom-left */}
              <div style={{position:"absolute",bottom:0,left:0}}>
                <div style={{width:5,height:36,background:"#fff",borderRadius:3}}/>
                <div style={{width:36,height:5,background:"#fff",borderRadius:3,marginTop:-5}}/>
              </div>
              {/* bottom-right */}
              <div style={{position:"absolute",bottom:0,right:0,display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
                <div style={{width:5,height:36,background:"#fff",borderRadius:3}}/>
                <div style={{width:36,height:5,background:"#fff",borderRadius:3,marginTop:-5}}/>
              </div>
            </div>
          </div>
        )}

        {/* ── BLACK FEED WARNING ── */}
        {phase === "black" && (
          <div style={{...fc, background:"rgba(0,0,0,0.96)", zIndex:25, padding:"0 24px"}}>
            <div style={{textAlign:"center", maxWidth:360}}>
              <div style={{fontSize:52, marginBottom:16}}>📵</div>
              <p style={{color:"#fff", fontWeight:700, fontSize:18, margin:"0 0 10px"}}>No Video Feed</p>
              <p style={{color:"#9ca3af", fontSize:14, lineHeight:1.6, margin:"0 0 18px"}}>
                Camera opened but showing a black screen.
              </p>
              <div style={{
                background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.22)",
                borderRadius:12, padding:"14px 16px", marginBottom:22, textAlign:"left",
              }}>
                {["Run: adb forward tcp:4747 tcp:4747 in PowerShell",
                  "Open DroidCam PC client → USB → Connect",
                  "Make sure phone shows live feed in DroidCam window",
                  "Then tap Try Again"].map((t, i) => (
                  <p key={i} style={{color:"#d1d5db", fontSize:13, margin:"5px 0", display:"flex", gap:8}}>
                    <span style={{color:"#f59e0b", fontWeight:700, flexShrink:0}}>{i+1}.</span>{t}
                  </p>
                ))}
              </div>
              <div style={{display:"flex", gap:10, justifyContent:"center"}}>
                <button onClick={() => { stopAll(); setPhase("pick"); }}
                  style={{padding:"12px 18px", borderRadius:12, border:"1px solid #252535",
                    background:"#181824", color:"#9ca3af", fontWeight:600, cursor:"pointer", fontSize:13}}>
                  ← Change Camera
                </button>
                <button onClick={startScan}
                  style={{padding:"12px 22px", borderRadius:12, border:"none",
                    background:"#f59e0b", color:"#111", fontWeight:700, cursor:"pointer", fontSize:13}}>
                  🔄 Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FOUND ── */}
        {phase === "found" && (
          <div style={{...fc, background:"rgba(0,0,0,0.78)", zIndex:30}}>
            <div style={{
              background:"rgba(12,12,18,0.98)", border:"1px solid rgba(34,197,94,0.3)",
              borderRadius:24, padding:"38px 32px",
              textAlign:"center", maxWidth:320, margin:"0 16px",
              animation:"popUp 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
            }}>
              <div style={{
                width:76, height:76, borderRadius:"50%", background:"#22c55e",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 18px", boxShadow:"0 0 36px rgba(34,197,94,0.5)",
              }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p style={{color:"#fff", fontWeight:700, fontSize:22, margin:"0 0 10px"}}>Detected!</p>
              <p style={{color:"#4ade80", fontFamily:"monospace", fontSize:16,
                fontWeight:600, wordBreak:"break-all", margin:"0 0 10px"}}>{code}</p>
              <p style={{color:"#6b7280", fontSize:12, margin:0}}>Looking up product...</p>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div style={{...fc, background:"rgba(0,0,0,0.96)", zIndex:30, padding:"0 24px"}}>
            <div style={{textAlign:"center", maxWidth:340}}>
              <div style={{
                width:68, height:68, borderRadius:"50%",
                background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 20px", fontSize:32,
              }}>📷</div>
              <p style={{color:"#fff", fontWeight:700, fontSize:18, margin:"0 0 10px"}}>Camera Error</p>
              <p style={{color:"#9ca3af", fontSize:14, lineHeight:1.7,
                margin:"0 0 24px", whiteSpace:"pre-line"}}>{errMsg}</p>
              <button onClick={getCameras} style={{
                background:"#f59e0b", color:"#111", fontWeight:700,
                padding:"13px 30px", borderRadius:12, border:"none",
                fontSize:15, cursor:"pointer",
              }}>🔄 Try Again</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, zIndex:20,
        padding:"52px 24px 36px",
        background:"linear-gradient(to top,rgba(0,0,0,0.9),transparent)",
        textAlign:"center", pointerEvents:"none",
      }}>
        <p style={{color:"rgba(255,255,255,0.45)", fontSize:13, margin:"0 0 10px"}}>
          Hold steady · Auto-detects instantly
        </p>
        <div style={{display:"flex", flexWrap:"wrap", justifyContent:"center", gap:5}}>
          {["EAN-13","EAN-8","QR Code","Code 128","UPC-A","Data Matrix"].map(f => (
            <span key={f} style={{
              fontSize:11, color:"rgba(255,255,255,0.28)",
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:999, padding:"2px 9px",
            }}>{f}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gpayScan {
          0%   { top: 6px;              opacity: 0; }
          8%   {                         opacity: 1; }
          92%  {                         opacity: 1; }
          100% { top: calc(100% - 6px); opacity: 0; }
        }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes popUp {
          from { opacity:0; transform: scale(0.4) translateY(24px); }
          to   { opacity:1; transform: scale(1)   translateY(0);    }
        }
      `}</style>
    </div>
  );
}