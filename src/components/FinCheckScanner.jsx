import { useState, useRef } from "react";

const CREAM      = "#FAF7F1";
const FOREST     = "#1E3F2F";
const GOLD       = "#D4AF37";
const FRAUD_RED  = "#991B1B";
const FONT_SERIF = "'Instrument Serif', serif";
const FONT_BODY  = "'Plus Jakarta Sans', sans-serif";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const SYSTEM_PROMPT = `You are a cybersecurity analyst specializing in phishing and financial fraud detection. Analyze the following message and return your response in this exact format with these exact labels on separate lines:
VERDICT: [write only FRAUD or LEGIT]
RISK_SCORE: [write only a number like 8.5]
RISK_LABEL: [write only one of: Low risk, Moderate risk, High risk, Highly likely fraud]
RED_FLAGS: [list each flag on its own line starting with a dash]
WHAT_TO_DO: [list each step on its own line starting with a number and period]
Write in plain English for a non-technical audience. Never use jargon.`;

function stripMarkdown(str) {
  return str.replace(/\*+/g, "").trim();
}

function parseAIResponse(text) {
  const section = (label) => {
    const re = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`);
    const m  = text.match(re);
    return m ? m[1].trim() : "";
  };

  const verdict   = section("VERDICT").toUpperCase().includes("FRAUD") ? "FRAUD" : "LEGIT";
  const riskLabel = stripMarkdown(section("RISK_LABEL")) || "Unknown risk";

  // grab only the first number found
  const rawScore  = section("RISK_SCORE");
  const scoreMatch = rawScore.match(/[\d.]+/);
  const riskScore  = scoreMatch ? scoreMatch[0] : "—";

  const redFlags = section("RED_FLAGS")
    .split("\n")
    .map(l => stripMarkdown(l.replace(/^[-•*]\s*/, "").replace(/^\d+[.)]\s*/, "")))
    .filter(l => l.length > 0);

  const whatToDo = section("WHAT_TO_DO")
    .split("\n")
    .map(l => stripMarkdown(l.replace(/^\d+[.)]\s*/, "").replace(/^[-•*]\s*/, "")))
    .filter(l => l.length > 0);

  return { verdict, riskScore, riskLabel, redFlags, whatToDo };
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 26V14M14 20l6-6 6 6" stroke={FOREST} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="28" width="28" height="4" rx="0" fill={FOREST} opacity="0.15" />
      <path d="M8 28v2h24v-2" stroke={FOREST} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function FinCheckScanner({ onBack }) {
  const [activeTab,   setActiveTab]   = useState("paste");   // "paste" | "upload"
  const [pasteText,   setPasteText]   = useState("");
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);      // parsed AI result
  const [error,       setError]       = useState("");
  const [copied,      setCopied]      = useState(false);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleScan() {
    setError("");
    setResult(null);

    if (activeTab === "paste" && !pasteText.trim()) {
      setError("Please paste a message to scan.");
      return;
    }
    if (activeTab === "upload" && !imageFile) {
      setError("Please upload an image to scan.");
      return;
    }

    setLoading(true);
    try {
      let messages;

      if (activeTab === "paste") {
        messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: `Analyze this message:\n\n${pasteText.trim()}` },
        ];
      } else {
        // base64 image — use vision-capable model
        const base64 = imagePreview; // already data URL from FileReader
        messages = [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: base64 } },
              { type: "text",      text: "Analyze all text visible in this screenshot for fraud or scam indicators." },
            ],
          },
        ];
      }

      const model = activeTab === "upload"
        ? "anthropic/claude-haiku-4-5"
        : "meta-llama/llama-3.1-8b-instruct";

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://fintips.vercel.app",
          "X-Title":      "FinTips",
        },
        body: JSON.stringify({ model, messages }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error: ${res.status} — ${errText}`);
      }

      const data    = await res.json();
      const rawText = data.choices?.[0]?.message?.content ?? "";
      const parsed  = parseAIResponse(rawText);
      setResult(parsed);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!result) return;
    const text = `I just scanned a suspicious message with FinCheck by FinTips — it came back ${result.verdict}. Protect yourself: fintips.vercel.app`;
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleScanAnother() {
    setResult(null);
    setError("");
    setPasteText("");
    setImageFile(null);
    setImagePreview(null);
    setActiveTab("paste");
  }

  const isFraud = result?.verdict === "FRAUD";

  // ── RESULTS VIEW ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <section style={{ background: CREAM, minHeight: "100vh", padding: "48px 0 64px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px" }}>

          {/* header */}
          <h1 style={{ fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 10, letterSpacing: -0.3 }}>FinCheck ✓</h1>
          <p style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 17, color: FOREST, textAlign: "center", marginBottom: 32, lineHeight: 1.5 }}>Don't click. Scan first.</p>

          {/* verdict banner */}
          <div style={{ background: isFraud ? FRAUD_RED : FOREST, padding: "28px 20px 20px", textAlign: "center", marginBottom: 0 }}>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 44, fontWeight: 400, color: "#fff", marginBottom: 6, letterSpacing: -0.5 }}>
              {result.verdict}
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
              {result.riskLabel}
            </p>
          </div>

          {/* details card */}
          <div style={{ border: `1px solid ${GOLD}`, borderTop: "none", background: CREAM, padding: "28px 28px 24px" }}>

            {/* risk score */}
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#6B6558", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Risk score</p>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 34, color: GOLD, marginBottom: 20, letterSpacing: -0.5 }}>{result.riskScore} / 10</p>

            <div style={{ height: 1, background: `rgba(212,175,55,0.35)`, marginBottom: 20 }} />

            {/* red flags */}
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: FRAUD_RED, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Red flags</p>
            {result.redFlags.length > 0
              ? result.redFlags.map((flag, i) => (
                  <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: FOREST, lineHeight: 1.65, marginBottom: 6 }}>• {flag}</p>
                ))
              : <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#6B6558" }}>No red flags detected.</p>
            }

            <div style={{ height: 1, background: `rgba(212,175,55,0.35)`, margin: "20px 0" }} />

            {/* what to do */}
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: FOREST, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>What to do</p>
            {result.whatToDo.map((step, i) => (
              <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, color: FOREST, lineHeight: 1.65, marginBottom: 6 }}>{i + 1}. {step}</p>
            ))}

            {/* disclaimer */}
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#6B6558", fontStyle: "italic", lineHeight: 1.6, marginTop: 20 }}>
              FinCheck Scanner uses AI and may not catch every threat. When in doubt do not click links.
            </p>
          </div>

          {/* action buttons */}
          <button type="button" onClick={handleShare}
            style={{ marginTop: 16, width: "100%", height: 48, background: FOREST, color: "#fff", border: "none", borderRadius: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "Copied! ✓" : "Share verdict"}
          </button>
          <button type="button" onClick={handleScanAnother}
            style={{ marginTop: 10, width: "100%", height: 48, background: "transparent", color: FOREST, border: `1px solid ${FOREST}`, borderRadius: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Scan another
          </button>

          {/* back link */}
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button type="button" onClick={onBack}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: "#6B6558", padding: "10px 0" }}
              onMouseEnter={e => { e.currentTarget.style.color = FOREST; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6B6558"; }}>
              ← Back to FinCheck
            </button>
          </div>

        </div>
      </section>
    );
  }

  // ── INPUT VIEW ────────────────────────────────────────────────────────────
  return (
    <section style={{ background: CREAM, minHeight: "100vh", padding: "48px 0 64px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px" }}>

        {/* header */}
        <h1 style={{ fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 10, letterSpacing: -0.3 }}>FinCheck ✓</h1>
        <p style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 22, color: FOREST, textAlign: "center", marginBottom: 36, lineHeight: 1.5 }}>Don't click. Scan first.</p>

        {/* tabs */}
        <div style={{ display: "flex", border: `1px solid ${FOREST}`, marginBottom: 0 }}>
          {["paste", "upload"].map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex:        1,
                height:      44,
                background:  activeTab === tab ? FOREST : "transparent",
                color:       activeTab === tab ? "#fff" : FOREST,
                border:      "none",
                borderRight: tab === "paste" ? `1px solid ${FOREST}` : "none",
                fontFamily:  FONT_BODY,
                fontSize:    14,
                fontWeight:  500,
                cursor:      "pointer",
              }}>
              {tab === "paste" ? "Paste text" : "Upload photo"}
            </button>
          ))}
        </div>

        {/* paste tab */}
        {activeTab === "paste" && (
          <div style={{ border: `1px solid ${FOREST}`, borderTop: "none", padding: "20px 20px 16px", background: CREAM }}>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Paste a suspicious email or text message here..."
              style={{
                width:        "100%",
                minHeight:    220,
                background:   CREAM,
                border:       `1px solid ${FOREST}`,
                borderRadius: 0,
                padding:      "12px 14px",
                fontFamily:   FONT_BODY,
                fontSize:     14,
                color:        FOREST,
                resize:       "vertical",
                boxSizing:    "border-box",
                outline:      "none",
                lineHeight:   1.65,
              }}
            />
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#6B6558", marginTop: 8 }}>
              Your message is never stored · Private
            </p>
          </div>
        )}

        {/* upload tab */}
        {activeTab === "upload" && (
          <div style={{ border: `1px solid ${FOREST}`, borderTop: "none", background: CREAM }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: "40px 20px", textAlign: "center", cursor: "pointer", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", border: `1px solid ${FOREST}` }} />
              ) : (
                <>
                  <UploadIcon />
                  <p style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 500, color: FOREST, margin: 0 }}>Tap to upload a screenshot</p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#6B6558", margin: 0 }}>(JPG, PNG or HEIC · Max 5MB)</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* error */}
        {error && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: FRAUD_RED, marginTop: 12, lineHeight: 1.5 }}>{error}</p>
        )}

        {/* scan button */}
        <button
          type="button"
          onClick={handleScan}
          disabled={loading}
          style={{
            marginTop:    16,
            width:        "100%",
            height:       52,
            background:   loading ? "#4a7a5a" : FOREST,
            color:        "#fff",
            border:       "none",
            borderRadius: 0,
            fontFamily:   FONT_BODY,
            fontSize:     15,
            fontWeight:   500,
            cursor:       loading ? "not-allowed" : "pointer",
            transition:   "background 0.2s",
          }}>
          {loading ? "Scanning..." : "Scan now →"}
        </button>

        {/* back link */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button type="button" onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: "#6B6558", padding: "10px 0" }}
            onMouseEnter={e => { e.currentTarget.style.color = FOREST; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#6B6558"; }}>
            ← Back to FinCheck
          </button>
        </div>

      </div>
    </section>
  );
}
