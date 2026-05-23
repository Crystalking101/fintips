import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const CREAM      = "#FAF7F1";
const FOREST     = "#1E3F2F";
const GOLD       = "#D4AF37";
const FONT_SERIF = "'Instrument Serif', serif";
const FONT_BODY  = "'Plus Jakarta Sans', sans-serif";

const SWIPE_COMMIT_PX = 100;
const COIN_COLS       = 20;

function getCurrentWeekNumber() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7)) + 1;
}

function levelFromXp(totalXp) {
  if (totalXp <= 50)  return "Financial Newbie";
  if (totalXp <= 150) return "💡 Money Aware";
  if (totalXp <= 300) return "📈 Wealth Builder";
  return "🏆 Money Master";
}

const FINCHECK_CARDS = [
  { id: 1,  statement: "Carrying a credit card balance each month helps build your credit score.", isLeftSwipe: true,  explanation: "You never need to carry a balance to build credit. Paying in full every month avoids interest entirely while still building an excellent credit history." },
  { id: 2,  statement: "URGENT: Your Amazon account has been compromised. Click here to verify your identity and claim your $500 refund.", isLeftSwipe: true,  explanation: "This is a classic phishing scam. Legitimate companies never ask you to click unsolicited links to verify your account or claim refunds." },
  { id: 3,  statement: "You need at least $1,000 saved before you can start investing.", isLeftSwipe: true,  explanation: "You can start investing with as little as $1 through fractional shares on platforms like Fidelity or Robinhood. Starting early matters far more than starting big." },
  { id: 4,  statement: "A bank will never ask for your full password or PIN over the phone or via email.", isLeftSwipe: false, explanation: "This is true. If anyone calls or emails claiming to be your bank and asks for your full password or PIN, hang up and call your bank directly using the number on their official website." },
  { id: 5,  statement: "Congratulations! You've been selected for a free government stimulus grant. Send $50 to cover processing fees to receive $5,000.", isLeftSwipe: true,  explanation: "This is a government grant scam. Real government programs never require upfront fees. If you pay, the money disappears and you receive nothing." },
  { id: 6,  statement: "Renting a home is always throwing money away compared to buying.", isLeftSwipe: true,  explanation: "Renting can be the smarter financial move, especially if you might move within 5 years. Renting avoids maintenance costs, property taxes, and housing market risk." },
  { id: 7,  statement: "Automating your savings before you spend is one of the most effective ways to build wealth.", isLeftSwipe: false, explanation: "Correct! Automating a savings transfer the moment your paycheck arrives removes the temptation to skip it. People who pay themselves first consistently save more." },
  { id: 8,  statement: "Hi, this is the IRS. You owe back taxes and will be arrested within 24 hours unless you pay immediately via gift cards.", isLeftSwipe: true,  explanation: "The IRS never calls to demand immediate payment, threatens arrest, or asks for gift cards. This is one of the most common scams in the US. Hang up immediately." },
  { id: 9,  statement: "You need a perfect 850 credit score to qualify for the best mortgage rates.", isLeftSwipe: true,  explanation: "Most lenders offer their best rates to anyone above 760. Chasing a perfect 850 beyond that has virtually no financial benefit — focus on on-time payments and low utilization." },
  { id: 10, statement: "If an investment opportunity promises guaranteed returns of 30% or more with no risk, it is almost certainly a scam.", isLeftSwipe: false, explanation: "Correct. No legitimate investment can guarantee high returns with zero risk. This is the hallmark of a Ponzi scheme or investment fraud. If it sounds too good to be true, it is." },
];

const LS_XP             = "fincheck_xp";
const LS_LEVEL          = "fincheck_level";
const LS_STREAK         = "fincheck_streak";
const LS_LAST_WEEK      = "fincheck_last_week";
const LS_COMPLETED_WEEK = "fincheck_completed_week";

function readFinCheckBootstrap() {
  if (typeof window === "undefined") return "playing";
  try {
    const w         = getCurrentWeekNumber();
    const raw       = localStorage.getItem(LS_COMPLETED_WEEK);
    const completed = raw == null || raw === "" ? NaN : Number.parseInt(raw, 10);
    if (!Number.isNaN(completed) && completed === w) return "blocked";
  } catch { /* */ }
  return "playing";
}

function flyTranslate() {
  if (typeof window === "undefined") return 920;
  return Math.max(window.innerWidth, 560) * 1.35;
}

/** Inject a unique @keyframes rule for one coin and return the animation name. */
function injectCoinKeyframe(id, endBottomPx) {
  const name = `fc_coin_${id}`;
  const rule = `
    @keyframes ${name} {
      0%   { top: -60px;                         opacity: 0; transform: rotate(0deg);   }
      8%   { opacity: 1; }
      100% { top: calc(100vh - ${endBottomPx}px); opacity: 1; transform: rotate(540deg); }
    }`;
  const sheet = document.createElement("style");
  sheet.setAttribute("data-fc-coin", id);
  sheet.textContent = rule;
  document.head.appendChild(sheet);
  return name;
}

export default function FinCheck({ sectionId = "fincheck-section", onHome }) {
  const initialPhase = useMemo(() => readFinCheckBootstrap(), []);
  const [gamePhase,      setGamePhase]      = useState(initialPhase);
  const [cardIndex,      setCardIndex]      = useState(0);
  const [revealed,       setRevealed]       = useState(false);
  const [userSwipedLeft, setUserSwipedLeft] = useState(null);
  const [dragX,          setDragX]          = useState(0);
  const [isDragging,     setIsDragging]     = useState(false);
  const [isFlyingOut,    setIsFlyingOut]    = useState(false);

  const pointerStartX       = useRef(0);
  const pointerStartY       = useRef(0);
  const pendingSwipeLeftRef = useRef(null);
  const flyFallbackTimerRef = useRef(null);
  const dragPointerIdRef    = useRef(null);
  const draggingRef         = useRef(false);
  const flyCommitDoneRef    = useRef(false);
  const flyRotationDegRef   = useRef(0);
  const scoreRef            = useRef(0);

  const [finalScore,        setFinalScore]        = useState(0);
  const [xpEarnedThisRound, setXpEarnedThisRound] = useState(0);
  const [totalXpDisplay,    setTotalXpDisplay]    = useState(0);
  const [levelDisplay,      setLevelDisplay]      = useState(() => {
    try {
      const xp = parseInt(localStorage.getItem(LS_XP) ?? "0", 10);
      return levelFromXp(Number.isNaN(xp) ? 0 : xp);
    } catch { return "Financial Newbie"; }
  });
  const [streakDisplay, setStreakDisplay] = useState(1);
  const [shareCopied,   setShareCopied]   = useState(false);

  // ── coins ──────────────────────────────────────────────────────────────────
  const [coins,    setCoins]  = useState([]);
  const coinIdRef  = useRef(0);
  const colHeights = useRef(new Array(COIN_COLS).fill(0));

  // Clean up injected keyframe style tags on unmount
  useEffect(() => {
    return () => {
      document.querySelectorAll("[data-fc-coin]").forEach(el => el.remove());
    };
  }, []);

  function spawnCoins(count) {
    const symbols   = ["🪙", "$"];
    const newCoins  = Array.from({ length: count }, () => {
      const id      = ++coinIdRef.current;
      const symbol  = symbols[Math.floor(Math.random() * symbols.length)];
      const left    = 2 + Math.random() * 94;                          // 2–96 vw %
      const colIdx  = Math.min(Math.floor(left / (100 / COIN_COLS)), COIN_COLS - 1);
      const stackH  = colHeights.current[colIdx];
      colHeights.current[colIdx]++;
      const endBottomPx = 20 + stackH * 28;                           // pile grows up
      const duration    = 1.2 + Math.random() * 1.2;                  // 1.2 – 2.4 s
      const delay       = Math.random() * 0.8;
      const animName    = injectCoinKeyframe(id, endBottomPx);
      return { id, symbol, left, endBottomPx, duration, delay, animName };
    });
    setCoins(prev => [...prev, ...newCoins]);
  }

  useEffect(() => () => {
    if (flyFallbackTimerRef.current) clearTimeout(flyFallbackTimerRef.current);
  }, []);

  // Continuous coin rain on results screen
  const coinIntervalRef = useRef(null);
  useEffect(() => {
    if (gamePhase === "results") {
      coinIntervalRef.current = setInterval(() => {
        colHeights.current = new Array(COIN_COLS).fill(0);
        spawnCoins(20);
      }, 800);
    } else {
      if (coinIntervalRef.current) {
        clearInterval(coinIntervalRef.current);
        coinIntervalRef.current = null;
      }
    }
    return () => {
      if (coinIntervalRef.current) {
        clearInterval(coinIntervalRef.current);
        coinIntervalRef.current = null;
      }
    };
  }, [gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const card = FINCHECK_CARDS[cardIndex];

  const applyRoundComplete = useCallback((correctCount) => {
    const currentWeek     = getCurrentWeekNumber();
    const prevLastWeekRaw = localStorage.getItem(LS_LAST_WEEK);
    const prevLastWeek    = prevLastWeekRaw == null ? null : parseInt(prevLastWeekRaw, 10);
    const prevStreak      = parseInt(localStorage.getItem(LS_STREAK) ?? "1", 10);
    const hadCompletedBefore = localStorage.getItem(LS_COMPLETED_WEEK) !== null;

    let newStreak = 1;
    if (prevLastWeek !== null && !Number.isNaN(prevLastWeek)) {
      if      (prevLastWeek === currentWeek - 1) newStreak = (Number.isNaN(prevStreak) ? 0 : prevStreak) + 1;
      else if (prevLastWeek < currentWeek - 1)   newStreak = 1;
      else                                        newStreak = Number.isNaN(prevStreak) ? 1 : prevStreak;
    }

    let earned = 10;
    if (correctCount >= 10)  earned += 5;
    if (!hadCompletedBefore) earned += 5;

    const prevXp       = parseInt(localStorage.getItem(LS_XP) ?? "0", 10);
    const newTotal     = (Number.isNaN(prevXp) ? 0 : prevXp) + earned;
    const newLevelName = levelFromXp(newTotal);

    localStorage.setItem(LS_XP,             String(newTotal));
    localStorage.setItem(LS_LEVEL,          newLevelName);
    localStorage.setItem(LS_STREAK,         String(newStreak));
    localStorage.setItem(LS_LAST_WEEK,      String(currentWeek));
    localStorage.setItem(LS_COMPLETED_WEEK, String(currentWeek));

    setFinalScore(correctCount);
    setXpEarnedThisRound(earned);
    setTotalXpDisplay(newTotal);
    setLevelDisplay(newLevelName);
    setStreakDisplay(newStreak);
    colHeights.current = new Array(COIN_COLS).fill(0);
    spawnCoins(20);
    setGamePhase("results");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwipeDecision = useCallback((swipedLeft) => {
    if (!card || revealed || gamePhase !== "playing") return;
    const correct = swipedLeft === card.isLeftSwipe;
    setUserSwipedLeft(swipedLeft);
    setRevealed(true);
    setDragX(0);
    setIsFlyingOut(false);
    scoreRef.current += correct ? 1 : 0;
    if (correct) spawnCoins(10);
  }, [card, revealed, gamePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const completeFlyCommit = useCallback(() => {
    if (flyCommitDoneRef.current) return;
    flyCommitDoneRef.current = true;
    if (flyFallbackTimerRef.current) {
      clearTimeout(flyFallbackTimerRef.current);
      flyFallbackTimerRef.current = null;
    }
    const swipedLeft = pendingSwipeLeftRef.current;
    pendingSwipeLeftRef.current = null;
    setIsFlyingOut(false);
    if (swipedLeft !== null && swipedLeft !== undefined) handleSwipeDecision(swipedLeft);
  }, [handleSwipeDecision]);

  function onPointerDown(e) {
    if (revealed || gamePhase !== "playing" || isFlyingOut) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragPointerIdRef.current = e.pointerId;
    pointerStartX.current    = e.clientX;
    pointerStartY.current    = e.clientY;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* */ }
    draggingRef.current = true;
    setIsDragging(true);
    setDragX(0);
  }

  function onPointerMove(e) {
    if (!draggingRef.current || dragPointerIdRef.current !== e.pointerId || revealed || isFlyingOut) return;
    const dx = e.clientX - pointerStartX.current;
    const dy = e.clientY - pointerStartY.current;
    if (Math.abs(dx) > Math.abs(dy) || Math.abs(dx) > 12) e.preventDefault();
    setDragX(dx);
  }

  function flyOffCommit(swipedLeft) {
    if (flyFallbackTimerRef.current) { clearTimeout(flyFallbackTimerRef.current); flyFallbackTimerRef.current = null; }
    flyRotationDegRef.current   = swipedLeft ? -18 : 18;
    const dist      = flyTranslate();
    const deltaSign = swipedLeft ? -1 : 1;
    pendingSwipeLeftRef.current = swipedLeft;
    draggingRef.current         = false;
    setIsDragging(false);
    dragPointerIdRef.current    = null;
    setIsFlyingOut(true);
    requestAnimationFrame(() => setDragX(deltaSign * dist));
    flyFallbackTimerRef.current = setTimeout(() => {
      flyFallbackTimerRef.current = null;
      completeFlyCommit();
    }, 440);
  }

  function onPointerUp(e) {
    if (dragPointerIdRef.current !== e.pointerId || revealed || gamePhase !== "playing") return;
    const dx = e.clientX - pointerStartX.current;
    const dy = e.clientY - pointerStartY.current;
    if (isFlyingOut) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* */ }
    draggingRef.current      = false;
    setIsDragging(false);
    dragPointerIdRef.current = null;
    if (Math.abs(dx) < SWIPE_COMMIT_PX || Math.abs(dx) <= Math.abs(dy)) {
      requestAnimationFrame(() => setDragX(0));
      return;
    }
    flyOffCommit(dx < 0);
  }

  function onPointerCancel(e) {
    if (dragPointerIdRef.current !== e.pointerId) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* */ }
    draggingRef.current      = false;
    dragPointerIdRef.current = null;
    setIsDragging(false);
    if (!isFlyingOut && !revealed) requestAnimationFrame(() => setDragX(0));
  }

  function onCardTransitionEnd(e) {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (!isFlyingOut) return;
    completeFlyCommit();
  }

  function goNext() {
    if (cardIndex < FINCHECK_CARDS.length - 1) {
      setCardIndex(i => i + 1);
      setRevealed(false);
      setUserSwipedLeft(null);
      setDragX(0);
      setIsDragging(false);
      setIsFlyingOut(false);
      dragPointerIdRef.current    = null;
      pendingSwipeLeftRef.current = null;
      draggingRef.current         = false;
      flyCommitDoneRef.current    = false;
      colHeights.current          = new Array(COIN_COLS).fill(0);
    }
  }

  function finishRound() { applyRoundComplete(scoreRef.current); }

  async function handleShareCopy() {
    const text = `I scored ${finalScore}/10 on FinCheck by FinTips! Think you can beat me? → fintips.vercel.app`;
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  // ── derived drag values ────────────────────────────────────────────────────
  let rotateDeg = 0;
  if (!revealed && !isFlyingOut && (isDragging || Math.abs(dragX) > 0.01)) {
    rotateDeg = Math.max(Math.min(dragX * 0.07, 12), -12);
  } else if (isFlyingOut) {
    rotateDeg = flyRotationDegRef.current;
  }

  const stampStrength = revealed ? 0 : Math.min(Math.abs(dragX) / 175, 1);
  const stampLeftPx   = stampStrength > 0 && dragX < -12 ? stampStrength : isFlyingOut && dragX < 0 ? 1 : 0;
  const stampRightPx  = stampStrength > 0 && dragX > 12  ? stampStrength : isFlyingOut && dragX > 0 ? 1 : 0;

  const verdictLabel   = card?.isLeftSwipe ? "Fraud" : "Legit";
  const correctForCard = revealed && card && userSwipedLeft !== null ? userSwipedLeft === card.isLeftSwipe : false;

  const cardTransform = revealed ? undefined : `translateX(${dragX}px) translateZ(0) rotate(${rotateDeg}deg)`;
  let cardTransition  = "transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)";
  if (isFlyingOut) cardTransition = "transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)";
  if (isDragging)  cardTransition = "none";

  const progressFill = `${((cardIndex + 1) / 10) * 100}%`;

  // ── coin overlay — always rendered, z-index 1, behind all page content ─────
  const coinOverlay = (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999 }}>
      {coins.map(coin => (
        <span
          key={coin.id}
          style={{
            position:              "fixed",
            left:                  `${coin.left}%`,
            top:                   -60,
            fontSize:              coin.symbol === "$" ? 17 : 20,
            color:                 GOLD,
            lineHeight:            1,
            animationName:         coin.animName,
            animationDuration:     `${coin.duration}s`,
            animationDelay:        `${coin.delay}s`,
            animationTimingFunction: "ease-in",
            animationFillMode:     "forwards",
            pointerEvents:         "none",
            userSelect:            "none",
          }}>
          {coin.symbol}
        </span>
      ))}
    </div>
  );

  // ── BLOCKED ────────────────────────────────────────────────────────────────
  if (gamePhase === "blocked") {
    return (
      <>
        {coinOverlay}
        <section id={sectionId} style={{ scrollMarginTop: 24, position: "relative" }}>
          <div style={{ background: CREAM, padding: "40px 0 56px" }}>
            <h2 style={{ fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 16, letterSpacing: -0.3 }}>FinCheck</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 500, color: "#1A1A18", textAlign: "center", lineHeight: 1.65, maxWidth: 400, margin: "0 auto 32px" }}>
              Come back tomorrow for a new round!
            </p>
            <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px" }}>
              <button type="button" onClick={onHome} style={{ width: "100%", height: 48, background: CREAM, color: FOREST, border: `1px solid ${FOREST}`, borderRadius: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Back to Home
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (gamePhase === "results") {
    return (
      <>
        {coinOverlay}
        <section id={sectionId} style={{ scrollMarginTop: 24, position: "relative" }}>
          <div style={{ background: CREAM, padding: "40px 0 56px", fontFamily: FONT_BODY }}>
            <h2 style={{ fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 24, letterSpacing: -0.3 }}>Round complete</h2>
            <div style={{ background: CREAM, border: `1px solid ${GOLD}`, padding: 32, maxWidth: 440, margin: "0 auto" }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#6B6558", marginBottom: 6, textAlign: "center", letterSpacing: 1.5, textTransform: "uppercase" }}>Score</p>
              <p style={{ fontFamily: FONT_SERIF, fontSize: 48, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 4, letterSpacing: -0.5 }}>{finalScore} / 10</p>
              <div style={{ height: 1, background: "rgba(212,175,55,0.35)", margin: "20px 0" }} />
              <p style={{ fontSize: 32, fontWeight: 800, color: GOLD, textAlign: "center", marginBottom: 4 }}>+{xpEarnedThisRound} XP</p>
              <p style={{ fontSize: 13, color: "#6B6558", textAlign: "center", marginBottom: 24 }}>Total XP <strong style={{ color: FOREST }}>{totalXpDisplay}</strong></p>
              <p style={{ fontSize: 13, color: "#6B6558", textAlign: "center", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Level</p>
              <p style={{ fontSize: 18, textAlign: "center", marginBottom: 20, color: FOREST, fontWeight: 600 }}>{levelDisplay}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: GOLD, textAlign: "center", marginBottom: 24 }}>{`🔥 ${streakDisplay}-week streak!`}</p>
              <button type="button" onClick={handleShareCopy} style={{ width: "100%", height: 48, background: FOREST, color: CREAM, border: `1px solid ${FOREST}`, borderRadius: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {shareCopied ? "Copied! ✓" : "Share my score"}
              </button>
              <button type="button" onClick={onHome} style={{ marginTop: 12, width: "100%", height: 48, background: CREAM, color: FOREST, border: `1px solid ${FOREST}`, borderRadius: 0, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Back to Home
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!card) return null;

  // ── PLAYING ────────────────────────────────────────────────────────────────
  return (
    <>
      {coinOverlay}
      <section id={sectionId} style={{ scrollMarginTop: 24, position: "relative" }}>
        <div style={{ background: CREAM, padding: "36px 0 48px" }}>

          <h2 style={{ fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 8, letterSpacing: -0.3 }}>FinCheck</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#6B6558", textAlign: "center", marginBottom: 20 }}>Swipe left for Fraud · Swipe right for Legit</p>

          {/* counter + level + progress bar */}
          <div style={{ maxWidth: 520, margin: "0 auto 6px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: FOREST, fontWeight: 600 }}>{cardIndex + 1} / 10</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: FOREST, fontWeight: 600 }}>{levelDisplay}</span>
          </div>
          <div style={{ height: 2, background: "rgba(30,63,47,0.15)", maxWidth: 520, margin: "0 auto 24px", padding: "0 16px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: progressFill, background: FOREST, transition: "width 0.35s ease" }} />
          </div>

          {/* card */}
          <div style={{ position: "relative", maxWidth: 520, margin: "0 auto", padding: "0 16px", overflow: "visible" }}>
            <div
              id={`fincheck-card-${cardIndex}`}
              role="presentation"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onTransitionEnd={onCardTransitionEnd}
              style={{
                position:   "relative",
                background: CREAM,
                border:     `2px solid ${GOLD}`,
                padding:    "44px 40px",
                minHeight:  320,
                touchAction:  revealed ? "auto" : "none",
                userSelect:   "none",
                transform:    cardTransform,
                transition:   cardTransition,
                willChange:   isDragging || isFlyingOut ? "transform" : "auto",
              }}>

              {/* drag stamp overlays */}
              {(stampLeftPx > 0 || stampRightPx > 0) && !revealed ? (
                <>
                  <div style={{ pointerEvents: "none", position: "absolute", inset: 0, background: stampLeftPx > 0 ? `rgba(153,27,27,${0.12 + stampLeftPx * 0.3})` : `rgba(212,175,55,${0.1 + stampRightPx * 0.25})`, zIndex: 1 }} />
                  <div style={{ pointerEvents: "none", position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: FONT_BODY, fontWeight: 800, fontSize: clampStr(stampLeftPx > 0 ? stampLeftPx : stampRightPx), letterSpacing: 0.6, color: stampLeftPx > 0 ? "#991B1B" : GOLD, border: `2px solid ${stampLeftPx > 0 ? "#991B1B" : GOLD}`, padding: "10px 20px", opacity: stampLeftPx > 0 ? stampLeftPx : stampRightPx, transform: `scale(${0.85 + (stampLeftPx > 0 ? stampLeftPx : stampRightPx) * 0.2}) rotate(${stampLeftPx > 0 ? -8 : 8}deg)` }}>
                      {stampLeftPx > 0 ? "Fraud" : "Legit"}
                    </span>
                  </div>
                </>
              ) : null}

              <div style={{ position: "relative", zIndex: 3 }}>
                {/* statement */}
                <p style={{
                  fontFamily:   FONT_SERIF,
                  fontSize:     revealed ? 22 : 30,
                  fontWeight:   revealed ? 400 : 500,
                  color:        revealed ? "rgba(30,63,47,0.4)" : FOREST,
                  lineHeight:   1.5,
                  textAlign:    "center",
                  marginBottom: 0,
                  transition:   "font-size 0.3s ease, color 0.3s ease",
                }}>{card.statement}</p>

                {/* fraud / legit buttons */}
                {!revealed ? (
                  <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
                    <button type="button" onClick={() => handleSwipeDecision(true)}
                      style={{ flex: 1, height: 48, background: "#991B1B", color: "#fff", border: "none", borderRadius: 0, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                      Fraud
                    </button>
                    <button type="button" onClick={() => handleSwipeDecision(false)}
                      style={{ flex: 1, height: 48, background: FOREST, color: "#fff", border: "none", borderRadius: 0, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                      Legit
                    </button>
                  </div>
                ) : null}

                {/* reveal */}
                {revealed ? (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 48, fontWeight: 800, color: GOLD, textAlign: "center", marginBottom: 16, letterSpacing: 0.5 }}>
                      {verdictLabel}
                    </p>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 22, fontWeight: 800, color: FOREST, textAlign: "center", marginBottom: 20, letterSpacing: -0.2 }}>
                      {correctForCard ? "Correct ✓" : "Not quite"}
                    </p>
                    <div style={{ height: 1, background: "rgba(212,175,55,0.35)", marginBottom: 20 }} />
                    <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: FOREST, lineHeight: 1.75, textAlign: "center" }}>{card.explanation}</p>
                    {cardIndex < FINCHECK_CARDS.length - 1 ? (
                      <button type="button" onClick={goNext}
                        style={{ marginTop: 28, width: "100%", height: 48, background: "transparent", color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 0, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                        Next →
                      </button>
                    ) : (
                      <button type="button" onClick={finishRound}
                        style={{ marginTop: 28, width: "100%", height: 48, background: "transparent", color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 0, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                        See results →
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* back to home */}
          <div style={{ maxWidth: 520, margin: "36px auto 0", padding: "0 16px", textAlign: "center" }}>
            <button type="button" onClick={onHome}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: "#6B6558", padding: "10px 0", minHeight: 44 }}
              onMouseEnter={e => { e.currentTarget.style.color = FOREST; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#6B6558"; }}>
              ← Back to Home
            </button>
          </div>

        </div>
      </section>
    </>
  );
}

function clampStr(strength) {
  const px = Math.round(16 + strength * 9);
  return `${px}px`;
}
