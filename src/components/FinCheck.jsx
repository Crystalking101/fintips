import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const CREAM = "#FAF7F1";
const FOREST = "#1E3F2F";
const FRAUD_RED = "#991B1B";
const BORDER_GRAY = "#e5e5e5";
const FONT_SERIF = "'Instrument Serif', serif";
const FONT_BODY = "'Plus Jakarta Sans', sans-serif";

const SWIPE_COMMIT_PX = 100;

function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
}

function levelFromXp(totalXp) {
  if (totalXp <= 50) return "🌱 Financial Newbie";
  if (totalXp <= 150) return "💡 Money Aware";
  if (totalXp <= 300) return "📈 Wealth Builder";
  return "🏆 Money Master";
}

const FINCHECK_CARDS = [
  { id: 1, statement: "Carrying a credit card balance each month helps build your credit score.", cardType: "Financial Myth", isLeftSwipe: true, explanation: "You never need to carry a balance to build credit. Paying in full every month avoids interest entirely while still building an excellent credit history." },
  { id: 2, statement: "URGENT: Your Amazon account has been compromised. Click here to verify your identity and claim your $500 refund.", cardType: "Fraud Alert", isLeftSwipe: true, explanation: "This is a classic phishing scam. Legitimate companies never ask you to click unsolicited links to verify your account or claim refunds." },
  { id: 3, statement: "You need at least $1,000 saved before you can start investing.", cardType: "Financial Myth", isLeftSwipe: true, explanation: "You can start investing with as little as $1 through fractional shares on platforms like Fidelity or Robinhood. Starting early matters far more than starting big." },
  { id: 4, statement: "A bank will never ask for your full password or PIN over the phone or via email.", cardType: "Money Fact", isLeftSwipe: false, explanation: "This is true. If anyone calls or emails claiming to be your bank and asks for your full password or PIN, hang up and call your bank directly using the number on their official website." },
  { id: 5, statement: "Congratulations! You've been selected for a free government stimulus grant. Send $50 to cover processing fees to receive $5,000.", cardType: "Fraud Alert", isLeftSwipe: true, explanation: "This is a government grant scam. Real government programs never require upfront fees. If you pay, the money disappears and you receive nothing." },
  { id: 6, statement: "Renting a home is always throwing money away compared to buying.", cardType: "Financial Myth", isLeftSwipe: true, explanation: "Renting can be the smarter financial move, especially if you might move within 5 years. Renting avoids maintenance costs, property taxes, and housing market risk." },
  { id: 7, statement: "Paying yourself first — automating savings before spending — is one of the most effective ways to build wealth.", cardType: "Money Fact", isLeftSwipe: false, explanation: "Correct! Automating a savings transfer the moment your paycheck arrives removes the temptation to skip it. People who pay themselves first consistently save more." },
  { id: 8, statement: "Hi, this is the IRS. You owe back taxes and will be arrested within 24 hours unless you pay immediately via gift cards.", cardType: "Fraud Alert", isLeftSwipe: true, explanation: "The IRS never calls to demand immediate payment, threatens arrest, or asks for gift cards. This is one of the most common scams in the US. Hang up immediately." },
  { id: 9, statement: "You need a perfect 850 credit score to qualify for the best mortgage rates.", cardType: "Financial Myth", isLeftSwipe: true, explanation: "Most lenders offer their best rates to anyone above 760. Chasing a perfect 850 beyond that has virtually no financial benefit — focus on on-time payments and low utilization." },
  { id: 10, statement: "If an investment opportunity promises guaranteed returns of 30% or more with no risk, it is almost certainly a scam.", cardType: "Money Fact", isLeftSwipe: false, explanation: "Correct. No legitimate investment can guarantee high returns with zero risk. This is the hallmark of a Ponzi scheme or investment fraud. If it sounds too good to be true, it is." },
];

const LS_XP = "fincheck_xp";
const LS_LEVEL = "fincheck_level";
const LS_STREAK = "fincheck_streak";
const LS_LAST_WEEK = "fincheck_last_week";
const LS_COMPLETED_WEEK = "fincheck_completed_week";

/** Sync read localStorage on first paint so gamePhase is never stuck at "idle" before effects run */
function readFinCheckBootstrap() {
  if (typeof window === "undefined") {
    return "playing";
  }
  try {
    const w = getCurrentWeekNumber();
    const raw = localStorage.getItem(LS_COMPLETED_WEEK);
    const completed = raw == null || raw === "" ? NaN : Number.parseInt(raw, 10);
    if (!Number.isNaN(completed) && completed === w) return "blocked";
  } catch {
    //
  }
  return "playing";
}

function flyTranslate() {

  if (typeof window === "undefined") return 920;
  return Math.max(window.innerWidth, 560) * 1.35;
}

export default function FinCheck({ sectionId = "fincheck-section", onHome }) {
  const initialPhase = useMemo(() => readFinCheckBootstrap(), []);
  const [gamePhase, setGamePhase] = useState(initialPhase);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [userSwipedLeft, setUserSwipedLeft] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlyingOut, setIsFlyingOut] = useState(false);

  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const pendingSwipeLeftRef = useRef(null);
  const flyFallbackTimerRef = useRef(null);
  const dragPointerIdRef = useRef(null);
  const draggingRef = useRef(false);
  const flyCommitDoneRef = useRef(false);
  const flyRotationDegRef = useRef(0);
  const scoreRef = useRef(0);

  const [finalScore, setFinalScore] = useState(0);
  const [xpEarnedThisRound, setXpEarnedThisRound] = useState(0);
  const [totalXpDisplay, setTotalXpDisplay] = useState(0);
  const [levelDisplay, setLevelDisplay] = useState("🌱 Financial Newbie");
  const [streakDisplay, setStreakDisplay] = useState(1);
  const [shareCopied, setShareCopied] = useState(false);

  const [showFinePointerButtons, setShowFinePointerButtons] = useState(true);

  useEffect(() => {
    try {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      const update = () => setShowFinePointerButtons(mq.matches);
      update();
      mq.addEventListener?.("change", update);
      return () => mq.removeEventListener?.("change", update);
    } catch {
      setShowFinePointerButtons(true);
    }
  }, []);

  useEffect(() => () => {
    if (flyFallbackTimerRef.current) clearTimeout(flyFallbackTimerRef.current);
  }, []);

  const card = FINCHECK_CARDS[cardIndex];

  const applyRoundComplete = useCallback((correctCount) => {
    const currentWeek = getCurrentWeekNumber();
    const prevLastWeekRaw = localStorage.getItem(LS_LAST_WEEK);
    const prevLastWeek = prevLastWeekRaw == null ? null : parseInt(prevLastWeekRaw, 10);
    const prevStreak = parseInt(localStorage.getItem(LS_STREAK) ?? "1", 10);
    const hadCompletedBefore = localStorage.getItem(LS_COMPLETED_WEEK) !== null;

    let newStreak = 1;
    if (prevLastWeek !== null && !Number.isNaN(prevLastWeek)) {
      if (prevLastWeek === currentWeek - 1) newStreak = (Number.isNaN(prevStreak) ? 0 : prevStreak) + 1;
      else if (prevLastWeek < currentWeek - 1) newStreak = 1;
      else newStreak = Number.isNaN(prevStreak) ? 1 : prevStreak;
    }

    let earned = 10;
    if (correctCount >= 10) earned += 5;
    const firstEver = !hadCompletedBefore;
    if (firstEver) earned += 5;

    const prevXp = parseInt(localStorage.getItem(LS_XP) ?? "0", 10);
    const newTotal = (Number.isNaN(prevXp) ? 0 : prevXp) + earned;
    const newLevelName = levelFromXp(newTotal);

    localStorage.setItem(LS_XP, String(newTotal));
    localStorage.setItem(LS_LEVEL, newLevelName);
    localStorage.setItem(LS_STREAK, String(newStreak));
    localStorage.setItem(LS_LAST_WEEK, String(currentWeek));
    localStorage.setItem(LS_COMPLETED_WEEK, String(currentWeek));

    setFinalScore(correctCount);
    setXpEarnedThisRound(earned);
    setTotalXpDisplay(newTotal);
    setLevelDisplay(newLevelName);
    setStreakDisplay(newStreak);
    setGamePhase("results");
  }, []);

  const handleSwipeDecision = useCallback((swipedLeft) => {
    if (!card || revealed || gamePhase !== "playing") return;
    const correct = swipedLeft === card.isLeftSwipe;
    setUserSwipedLeft(swipedLeft);
    setRevealed(true);
    setDragX(0);
    setIsFlyingOut(false);
    scoreRef.current += correct ? 1 : 0;
  }, [card, revealed, gamePhase]);

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
    if (swipedLeft !== null && swipedLeft !== undefined) {
      handleSwipeDecision(swipedLeft);
    }
  }, [handleSwipeDecision]);

  function onPointerDown(e) {
    if (revealed || gamePhase !== "playing" || isFlyingOut) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragPointerIdRef.current = e.pointerId;
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      //
    }
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
    if (flyFallbackTimerRef.current) {
      clearTimeout(flyFallbackTimerRef.current);
      flyFallbackTimerRef.current = null;
    }
    flyRotationDegRef.current = swipedLeft ? -18 : 18;
    const dist = flyTranslate();
    const deltaSign = swipedLeft ? -1 : 1;
    pendingSwipeLeftRef.current = swipedLeft;
    draggingRef.current = false;
    setIsDragging(false);
    dragPointerIdRef.current = null;
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

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      //
    }

    draggingRef.current = false;
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
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      //
    }
    draggingRef.current = false;
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
      dragPointerIdRef.current = null;
      pendingSwipeLeftRef.current = null;
      draggingRef.current = false;
      flyCommitDoneRef.current = false;
    }
  }

  function finishRound() {
    applyRoundComplete(scoreRef.current);
  }

  async function handleShareCopy() {
    const text = `I scored ${finalScore}/10 on FinCheck by FinTips! Think you can beat me? → fintips.vercel.app`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  let rotateDeg = 0;
  if (!revealed && !isFlyingOut && (isDragging || Math.abs(dragX) > 0.01)) {
    rotateDeg = Math.max(Math.min(dragX * 0.07, 12), -12);
  } else if (isFlyingOut) {
    rotateDeg = flyRotationDegRef.current;
  }

  const stampStrength = revealed ? 0 : Math.min(Math.abs(dragX) / 175, 1);
  const stampLeftPx = stampStrength > 0 && dragX < -12 ? stampStrength : isFlyingOut && dragX < 0 ? 1 : 0;
  const stampRightPx = stampStrength > 0 && dragX > 12 ? stampStrength : isFlyingOut && dragX > 0 ? 1 : 0;

  const verdictLabel = card?.isLeftSwipe ? "Fraud/Myth" : "Legit";
  const verdictColor = "rgba(250,247,241,0.94)";

  let badgeRevealBg = "rgba(201,168,76,0.18)";
  let badgeRevealColor = "#C9A84C";
  if (revealed && card) {
    if (card.isLeftSwipe) {
      badgeRevealBg = "rgba(248,113,113,0.18)";
      badgeRevealColor = "#f87171";
    } else {
      badgeRevealBg = "rgba(201,168,76,0.22)";
      badgeRevealColor = "#C9A84C";
    }
  }

  const correctForCard = revealed && card && userSwipedLeft !== null ? userSwipedLeft === card.isLeftSwipe : false;

  const cardTransform = revealed ? undefined : `translateX(${dragX}px) translateZ(0) rotate(${rotateDeg}deg)`;

  let cardTransition = "transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)";
  if (isFlyingOut) cardTransition = "transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)";
  if (isDragging) cardTransition = "none";

  if (gamePhase === "blocked") {
    return (
      <section id={sectionId} style={{ scrollMarginTop: 24 }}>
        <div style={{ background: CREAM, padding: "40px 0 56px" }}>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 16, letterSpacing: -0.3 }}>FinCheck</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 500, color: "#1A1A18", textAlign: "center", lineHeight: 1.65, maxWidth: 400, margin: "0 auto 32px" }}>
            Come back tomorrow for a new round!
          </p>
          <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px" }}>
            <button
              type="button"
              onClick={onHome}
              style={{
                width: "100%",
                height: 48,
                background: "#fff",
                color: FOREST,
                border: `1px solid ${FOREST}`,
                borderRadius: 0,
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}>
              Back to Home
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (gamePhase === "results") {
    return (
      <section id={sectionId} style={{ scrollMarginTop: 24 }}>
        <div style={{ background: CREAM, padding: "40px 0 56px", fontFamily: FONT_BODY }}>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 24, letterSpacing: -0.3 }}>Round complete</h2>
          <div style={{ background: "#fff", border: `1px solid ${BORDER_GRAY}`, padding: 32, maxWidth: 440, margin: "0 auto" }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: "#555", marginBottom: 8, textAlign: "center" }}>Score</p>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 42, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 20 }}>{finalScore} / 10</p>

            <p style={{ fontSize: 34, fontWeight: 700, color: FOREST, textAlign: "center", marginBottom: 12 }}>+{xpEarnedThisRound} XP</p>
            <p style={{ fontSize: 14, color: "#555", textAlign: "center", marginBottom: 28 }}>Total XP <strong style={{ color: FOREST }}>{totalXpDisplay}</strong></p>

            <p style={{ fontSize: 15, fontWeight: 600, color: FOREST, textAlign: "center", marginBottom: 8 }}>Your level</p>
            <p style={{ fontSize: 18, textAlign: "center", marginBottom: 28, color: "#1A1A18" }}>{levelDisplay}</p>

            <p style={{ fontSize: 17, fontWeight: 600, color: FOREST, textAlign: "center" }}>{`🔥 ${streakDisplay}-week streak!`}</p>

            <button
              type="button"
              onClick={handleShareCopy}
              style={{
                marginTop: 32,
                width: "100%",
                height: 48,
                background: FOREST,
                color: "#fff",
                border: `1px solid ${FOREST}`,
                borderRadius: 0,
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}>
              {shareCopied ? "Copied! ✓" : "Share my score"}
            </button>
            <button
              type="button"
              onClick={onHome}
              style={{
                marginTop: 12,
                width: "100%",
                height: 48,
                background: "#fff",
                color: FOREST,
                border: `1px solid ${FOREST}`,
                borderRadius: 0,
                fontFamily: FONT_BODY,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}>
              Back to Home
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!card) return null;

  const progressHuman = revealed ? cardIndex + 1 : cardIndex + 1;
  const progressFill = `${(progressHuman / 10) * 100}%`;

  return (
    <section id={sectionId} style={{ scrollMarginTop: 24 }}>
      <div style={{ background: CREAM, padding: "36px 0 48px" }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 400, color: FOREST, textAlign: "center", marginBottom: 12, letterSpacing: -0.3 }}>FinCheck</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: "#6B6558", textAlign: "center", marginBottom: 20 }}>Swipe left for Fraud/Myth · Swipe right for Legit</p>

        <div style={{ height: 4, background: BORDER_GRAY, maxWidth: 440, margin: "0 auto 28px", borderRadius: 0, overflow: "hidden" }}>
          <div style={{ height: "100%", width: progressFill, background: FOREST, transition: "width 0.35s ease" }} />
        </div>

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
              position: "relative",
              background: FOREST,
              border: "none",
              padding: "44px 40px",
              minHeight: 320,
              touchAction: revealed ? "auto" : "none",
              userSelect: "none",
              transform: cardTransform,
              transition: cardTransition,
              willChange: isDragging || isFlyingOut ? "transform" : "auto",
            }}>
            {(stampLeftPx > 0 || stampRightPx > 0) && !revealed ? (
              <>
                <div
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    inset: 0,
                    background: stampLeftPx > 0 ? `rgba(100, 0, 0, ${0.35 + stampLeftPx * 0.45})` : `rgba(201, 168, 76, ${0.25 + stampRightPx * 0.5})`,
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {stampLeftPx > 0 ? (
                    <span
                      style={{
                        fontFamily: FONT_BODY,
                        fontWeight: 800,
                        fontSize: clampStr(stampLeftPx),
                        letterSpacing: 0.6,
                        color: "#fff",
                        textShadow: `0 0 2px ${FRAUD_RED}, 0 2px 12px rgba(0,0,0,0.35)`,
                        border: `3px solid rgba(255,255,255,${0.5 + stampLeftPx * 0.45})`,
                        padding: "10px 20px",
                        opacity: stampLeftPx,
                        transform: `scale(${0.85 + stampLeftPx * 0.2}) rotate(-8deg)`,
                      }}>
                      Fraud/Myth
                    </span>
                  ) : (
                    <span
                      style={{
                        fontFamily: FONT_BODY,
                        fontWeight: 800,
                        fontSize: clampStr(stampRightPx),
                        letterSpacing: 0.6,
                        color: "#fff",
                        textShadow: `0 0 2px ${FOREST}, 0 2px 12px rgba(0,0,0,0.35)`,
                        border: `3px solid rgba(255,255,255,${0.5 + stampRightPx * 0.45})`,
                        padding: "10px 20px",
                        opacity: stampRightPx,
                        transform: `scale(${0.85 + stampRightPx * 0.2}) rotate(8deg)`,
                      }}>
                      Legit
                    </span>
                  )}
                </div>
              </>
            ) : null}
            <div style={{ position: "relative", zIndex: 3 }}>
              <p style={{ fontFamily: FONT_SERIF, fontSize: 30, fontWeight: 400, color: "rgba(250,247,241,0.94)", lineHeight: 1.5, marginBottom: 0 }}>{card.statement}</p>

              {revealed ? (
                <div style={{ marginTop: 28 }}>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 22, fontWeight: 800, color: "#D4AF37", marginBottom: 10, letterSpacing: -0.2 }}>{verdictLabel}</p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 22, fontWeight: 800, color: "#D4AF37", marginBottom: 16, letterSpacing: -0.2 }}>
                    {correctForCard ? "Correct! ✓" : "Not quite"}
                  </p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: "#FAF7F1", lineHeight: 1.65 }}>{card.explanation}</p>

                  {cardIndex < FINCHECK_CARDS.length - 1 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      style={{
                        marginTop: 28,
                        width: "100%",
                        height: 48,
                        background: "transparent",
                        color: "#FAF7F1",
                        border: "1px solid #FAF7F1",
                        borderRadius: 0,
                        fontFamily: FONT_BODY,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}>
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finishRound}
                      style={{
                        marginTop: 28,
                        width: "100%",
                        height: 48,
                        background: "transparent",
                        color: "#FAF7F1",
                        border: "1px solid #FAF7F1",
                        borderRadius: 0,
                        fontFamily: FONT_BODY,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}>
                      See results →
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {!revealed && showFinePointerButtons ? (
          <div style={{ maxWidth: 520, margin: "20px auto 0", padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              onClick={() => handleSwipeDecision(true)}
              style={{
                width: "100%",
                height: 48,
                background: "#fff",
                color: FRAUD_RED,
                border: `1px solid ${BORDER_GRAY}`,
                borderRadius: 0,
                fontFamily: FONT_BODY,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}>
              Fraud/Myth
            </button>
            <button
              type="button"
              onClick={() => handleSwipeDecision(false)}
              style={{
                width: "100%",
                height: 48,
                background: "#fff",
                color: FOREST,
                border: `1px solid ${BORDER_GRAY}`,
                borderRadius: 0,
                fontFamily: FONT_BODY,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}>
              Legit
            </button>
          </div>
        ) : null}

        <div style={{ maxWidth: 520, margin: "36px auto 0", padding: "0 16px", textAlign: "center" }}>
          <button
            type="button"
            onClick={onHome}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 500,
              color: "#6B6558",
              padding: "10px 0",
              minHeight: 44,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = FOREST; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#6B6558"; }}>
            ← Back to Home
          </button>
        </div>
      </div>
    </section>
  );
}

function clampStr(strength) {
  const px = Math.round(16 + strength * 9);
  return `${px}px`;
}
