import { useState, useEffect } from "react";

const CREAM      = "#FAF7F1";
const FOREST     = "#1E3F2F";
const GOLD       = "#D4AF37";
const FONT_SERIF = "'Instrument Serif', serif";
const FONT_BODY  = "'Plus Jakarta Sans', sans-serif";

const LS_LEVEL  = "fincheck_level";
const LS_STREAK = "fincheck_streak";

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10h12M12 6l4 4-4 4" stroke={CREAM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FinCheckHub({ onPlayGame, onScanner, onHome }) {
  const [level,  setLevel]  = useState("Financial Newbie");
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    try {
      const savedLevel  = localStorage.getItem(LS_LEVEL);
      const savedStreak = localStorage.getItem(LS_STREAK);
      if (savedLevel)  setLevel(savedLevel);
      if (savedStreak) setStreak(parseInt(savedStreak, 10) || 1);
    } catch { /* */ }
  }, []);

  const cardBase = {
    background:   CREAM,
    border:       `1px solid ${FOREST}`,
    borderRadius: 0,
    padding:      "28px 28px 28px 28px",
    display:      "flex",
    alignItems:   "flex-start",
    justifyContent: "space-between",
    gap:          16,
    width:        "100%",
    boxSizing:    "border-box",
  };

  return (
    <section style={{ background: CREAM, minHeight: "100vh", padding: "48px 0 64px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 20px" }}>

        {/* header */}
        <h1 style={{ fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 10, letterSpacing: -0.3 }}>
          FinCheck ✓
        </h1>
        <p style={{ fontFamily: FONT_SERIF, fontStyle: "italic", fontSize: 19, color: FOREST, textAlign: "center", marginBottom: 40, lineHeight: 1.5 }}>
          Learn to spot fraud. Then protect yourself for real.
        </p>

        {/* Card 1 — Play the game */}
        <div style={{ ...cardBase, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 17, fontWeight: 500, color: FOREST, marginBottom: 8 }}>
              Play the game
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#6B6558", lineHeight: 1.65, marginBottom: 16 }}>
              Swipe left for Fraud, right for Legit. 10 cards, weekly refresh. Earn XP and build your streak.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#6B6558", marginBottom: 2, letterSpacing: 0.8, textTransform: "uppercase" }}>Level</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: FOREST }}>{level}</p>
              </div>
              <div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#6B6558", marginBottom: 2, letterSpacing: 0.8, textTransform: "uppercase" }}>Streak</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: FOREST }}>🔥 {streak}-week</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onPlayGame}
            aria-label="Play the game"
            style={{ flexShrink: 0, width: 44, height: 44, background: FOREST, border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
            <ArrowRight />
          </button>
        </div>

        {/* Card 2 — Is this a scam? */}
        <div style={{ ...cardBase, position: "relative" }}>
          {/* New badge — filled gold */}
          <span style={{ position: "absolute", top: 16, right: 28, fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: "#1E3F2F", background: "#D4AF37", border: "none", padding: "4px 12px", letterSpacing: 1, textTransform: "uppercase" }}>
            New
          </span>

          <div style={{ flex: 1, paddingRight: 8, display: "flex", flexDirection: "column" }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 17, fontWeight: 500, color: FOREST, marginBottom: 8 }}>
              Is this a scam?
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#6B6558", lineHeight: 1.65, marginBottom: 14 }}>
              Upload a screenshot or paste any email. We'll analyze it and explain any signs of fraud.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
              {[
                "Instant fraud analysis",
                "Scam risk score",
                "Explanation of warning signs",
                "Your messages are never stored",
              ].map(line => (
                <p key={line} style={{ fontFamily: FONT_BODY, fontSize: 13, color: FOREST, margin: 0 }}>
                  ✓ {line}
                </p>
              ))}
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#6B6558", fontStyle: "italic", margin: 0 }}>
              3.4B phishing emails are sent daily.
            </p>
          </div>
          {/* Arrow pinned to bottom-right */}
          <button
            type="button"
            onClick={onScanner}
            aria-label="Go to scam scanner"
            style={{ flexShrink: 0, width: 44, height: 44, background: FOREST, border: "none", borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" }}>
            <ArrowRight />
          </button>
        </div>

        {/* back to home */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button
            type="button"
            onClick={onHome}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: "#6B6558", padding: "10px 0" }}
            onMouseEnter={e => { e.currentTarget.style.color = FOREST; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#6B6558"; }}>
            ← Back to Home
          </button>
        </div>

      </div>
    </section>
  );
}
