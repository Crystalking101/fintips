import { useState, useEffect, useRef } from "react";

// ─── GEMINI CONFIG ────────────────────────────────────────────────────────────
// In Vite: add VITE_GEMINI_API_KEY to your .env file
const GEMINI_API_KEY = "AIzaSyB-_NWYe5hdkvMuJd93tm3kBggV3YHWz8c";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// In Vite: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
// Use the Publishable key (sb_publishable_...) as VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || "YOUR_PUBLISHABLE_KEY";

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "",
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Helper to extract project ref from either URL format
// Old: https://xxxx.supabase.co
// New: works the same — publishable key is just passed as apikey header

// ─── DATA ─────────────────────────────────────────────────────────────────────
const ALL_TIPS = [
  { id: "c1", category: "Credit", tip: "Paying just $25 extra on your minimum credit card payment each month can save you hundreds in interest over time.", fact: "Interest compounds daily on most cards." },
  { id: "c2", category: "Budgeting", tip: "The 50/30/20 rule: spend 50% on needs, 30% on wants, and save 20% of your income.", fact: "Even starting at 5% makes a real difference." },
  { id: "c3", category: "Savings", tip: "A high-yield savings account can earn 4-5x more interest than a traditional savings account.", fact: "Your bank is probably not offering you the best rate." },
  { id: "c4", category: "Investing", tip: "Investing $100/month starting at 25 vs 35 can result in over $100,000 more by retirement.", fact: "Time in the market beats timing the market." },
  { id: "c5", category: "Emergency Fund", tip: "Keep 3-6 months of expenses in an emergency fund before investing.", fact: "Most financial crises are temporary if you are prepared." },
  { id: "c6", category: "Debt", tip: "The avalanche method (highest interest first) saves the most money overall.", fact: "Minimum payments are designed to keep you in debt longer." },
  { id: "c7", category: "Travel", tip: "A travel rewards credit card paid in full monthly can earn hundreds in free flights each year.", fact: "Never carry a balance — the interest erases the rewards." },
  { id: "c8", category: "Taxes", tip: "Contributing to a 401k or IRA reduces your taxable income every year.", fact: "Many employers match contributions — that is an instant 100% return." },
  { id: "c9", category: "Mindset", tip: "Automating your savings removes the temptation to spend it and builds wealth on autopilot.", fact: "Automation is the secret weapon of the financially disciplined." },
  { id: "c10", category: "Small Wins", tip: "Skipping one $6 coffee per day adds up to $2,190 saved per year.", fact: "Small habits compound into big results." },
  { id: "c11", category: "Credit", tip: "Keep your credit utilization below 30% to maintain a healthy credit score.", fact: "Below 10% is even better for your score." },
  { id: "c12", category: "Budgeting", tip: "Track every expense for one month — most people discover $200-$400 in forgotten subscriptions.", fact: "Awareness is the first step to change." },
  { id: "c13", category: "Savings", tip: "Round up every purchase to the nearest dollar and save the difference — apps like Acorns do this automatically.", fact: "Most people save $30-$50 per month this way without noticing." },
  { id: "c14", category: "Investing", tip: "Index funds beat 90% of actively managed funds over 10+ years.", fact: "Lower fees = more money staying in your pocket." },
  { id: "c15", category: "Debt", tip: "The snowball method — paying smallest balances first — keeps you motivated with quick wins.", fact: "Momentum matters as much as math." },
  { id: "c16", category: "Credit", tip: "Never close your oldest credit card — it helps your credit history length.", fact: "Credit history length accounts for 15% of your score." },
  { id: "c17", category: "Budgeting", tip: "Pay yourself first — transfer savings before spending anything else on payday.", fact: "What you do not see, you do not spend." },
  { id: "c18", category: "Savings", tip: "Open a separate savings account for each goal so you can track progress clearly.", fact: "Named accounts like Travel Fund make saving feel real." },
  { id: "c19", category: "Investing", tip: "Reinvesting dividends automatically can double your portfolio growth over 20 years.", fact: "Compound interest is the eighth wonder of the world." },
  { id: "c20", category: "Emergency Fund", tip: "Start your emergency fund with just $500 — that covers most unexpected expenses.", fact: "Something is always better than nothing." },
  { id: "c21", category: "Mindset", tip: "Comparing yourself to others financially is a trap — focus on your own progress.", fact: "Most people are worse off financially than they appear." },
  { id: "c22", category: "Taxes", tip: "Keep receipts for home office, business meals, and education — they may be deductible.", fact: "The average American overpays taxes by $400 per year." },
  { id: "c23", category: "Credit", tip: "Dispute errors on your credit report — 1 in 5 Americans has a mistake that hurts their score.", fact: "Fixing errors is free and can raise your score 50+ points." },
  { id: "c24", category: "Budgeting", tip: "The envelope method — cash in physical envelopes per category — reduces overspending by 20%.", fact: "Spending cash feels more real than swiping a card." },
  { id: "c25", category: "Investing", tip: "Max out your 401k match before investing anywhere else — it is free money.", fact: "Only 1 in 3 employees takes full advantage of employer matching." },
  { id: "c26", category: "Savings", tip: "Saving just $1 a day as a habit is more valuable than the dollar — it builds discipline.", fact: "Financial discipline is a muscle that grows with use." },
  { id: "c27", category: "Debt", tip: "Consolidating high-interest debt into a personal loan at a lower rate can save thousands.", fact: "Always compare APR, not just monthly payments." },
  { id: "c28", category: "Travel", tip: "Booking flights on Tuesdays and Wednesdays is typically 15-20% cheaper.", fact: "Flexibility on travel dates can save $200+ per trip." },
  { id: "c29", category: "Mindset", tip: "A spending audit every 3 months keeps your budget aligned with your actual priorities.", fact: "Your spending shows your real values, not your stated ones." },
  { id: "c30", category: "Taxes", tip: "A Health Savings Account (HSA) is triple tax-advantaged — contributions, growth, and withdrawals are all tax-free.", fact: "It is the most tax-efficient account available." },
  { id: "c31", category: "Credit", tip: "Asking for a credit limit increase (without spending more) lowers your utilization and boosts your score.", fact: "Request every 6-12 months for best results." },
  { id: "c32", category: "Budgeting", tip: "Use a zero-based budget — assign every dollar a job so nothing is left to impulse spending.", fact: "Zero-based budgeters save 18% more on average." },
  { id: "c33", category: "Investing", tip: "Dollar-cost averaging — investing a fixed amount monthly regardless of market — reduces risk over time.", fact: "It removes the stress of trying to time the market." },
  { id: "c34", category: "Savings", tip: "The 24-hour rule: wait a day before any non-essential purchase over $50.", fact: "Most impulse urges disappear within 24 hours." },
  { id: "c35", category: "Debt", tip: "Refinancing your mortgage at 1% lower can save $200+ per month on a $300k loan.", fact: "Even half a percent matters over 30 years." },
  { id: "c36", category: "Small Wins", tip: "Negotiating your cable, phone, or insurance bill annually can save $500-$1,000 per year.", fact: "Companies often have unpublished retention deals." },
  { id: "c37", category: "Mindset", tip: "Lifestyle inflation — spending more as you earn more — is the biggest wealth killer.", fact: "The secret to wealth is not earning more, it is keeping more." },
  { id: "c38", category: "Taxes", tip: "Contributing to a Roth IRA means tax-free withdrawals in retirement — pay taxes now, never again.", fact: "Best for people who expect to be in a higher tax bracket later." },
  { id: "c39", category: "Investing", tip: "REITs (Real Estate Investment Trusts) let you invest in real estate with as little as $10.", fact: "They must pay out 90% of income as dividends." },
  { id: "c40", category: "Credit", tip: "Paying your credit card balance twice a month can lower your average daily balance and improve your score.", fact: "Timing payments strategically costs nothing." },
  { id: "c41", category: "Budgeting", tip: "Meal planning and cooking at home saves the average person $200-$300 per month.", fact: "The average American spends $3,000/year eating out." },
  { id: "c42", category: "Savings", tip: "I-Bonds from the US Treasury offer inflation-protected returns with zero risk.", fact: "You can buy up to $10,000 per year at TreasuryDirect.gov." },
  { id: "c43", category: "Debt", tip: "If you have student loans, income-driven repayment plans cap payments at 10% of your discretionary income.", fact: "Many borrowers qualify but never apply." },
  { id: "c44", category: "Small Wins", tip: "Switching to a no-fee checking account saves the average American $144 per year in bank fees.", fact: "Online banks typically charge zero monthly fees." },
  { id: "c45", category: "Investing", tip: "A target-date retirement fund automatically adjusts risk as you age — set it and forget it.", fact: "Perfect for people who do not want to manage investments actively." },
  { id: "c46", category: "Travel", tip: "Travel credit card points can be worth 2-3 cents each when transferred to airline partners.", fact: "Most people redeem points at 1 cent — leaving value on the table." },
  { id: "c47", category: "Mindset", tip: "Financial stress is the #1 cause of relationship conflict — open money conversations with your partner monthly.", fact: "Couples who discuss finances regularly have 30% less conflict." },
  { id: "c48", category: "Taxes", tip: "Charitable donations are deductible if you itemize — keep records of everything you donate.", fact: "Non-cash donations like clothing and furniture count too." },
  { id: "c49", category: "Credit", tip: "A secured credit card is the fastest way to build credit from scratch.", fact: "With on-time payments, you can build a good score in 12 months." },
  { id: "c50", category: "Savings", tip: "Laddering CDs — opening multiple CDs with staggered maturity dates — maximizes returns while keeping cash accessible.", fact: "Rates are currently 4-5% on 1-year CDs." },
  { id: "c51", category: "Budgeting", tip: "Unsubscribe from retail emails — the average person saves $1,000/year by reducing marketing exposure.", fact: "You cannot buy what you do not see." },
  { id: "c52", category: "Investing", tip: "Never invest money you will need in the next 3 years — markets can drop 30%+ in the short term.", fact: "Time in the market smooths out volatility." },
  { id: "c53", category: "Debt", tip: "Balance transfer cards with 0% APR for 12-18 months can save hundreds in credit card interest.", fact: "Always pay it off before the promotional period ends." },
  { id: "c54", category: "Small Wins", tip: "Buying generic brands instead of name brands saves the average household $600/year on groceries.", fact: "Most generics are made in the same factories as name brands." },
  { id: "c55", category: "Emergency Fund", tip: "Keep your emergency fund in a high-yield savings account, not your checking — earn interest while it sits.", fact: "Every $10,000 earns $400-$500/year at current rates." },
  { id: "c56", category: "Mindset", tip: "Financial goals without a deadline are just wishes — give every goal a specific date.", fact: "Deadline-driven goals are 3x more likely to be achieved." },
  { id: "c57", category: "Taxes", tip: "If you work from home, you may deduct a portion of your rent, utilities, and internet.", fact: "The simplified method allows $5 per square foot up to 300 sq ft." },
  { id: "c58", category: "Credit", tip: "Hard inquiries stay on your credit report for 2 years but only affect your score for 12 months.", fact: "Multiple mortgage or auto loan inquiries in 14 days count as one." },
  { id: "c59", category: "Savings", tip: "Save your tax refund instead of spending it — the average refund is $2,700.", fact: "That is a 3-month emergency fund for many people." },
  { id: "c60", category: "Investing", tip: "Crypto should be no more than 5% of your investment portfolio due to extreme volatility.", fact: "Even Bitcoin has dropped 80%+ multiple times." },
  { id: "c61", category: "Debt", tip: "Call your credit card company and ask for a lower interest rate — 70% of people who ask get one.", fact: "The worst they can say is no." },
  { id: "c62", category: "Travel", tip: "Setting a fare alert on Google Flights for your destination can save 20-40% by buying at the right time.", fact: "Prices fluctuate dozens of times per day." },
  { id: "c63", category: "Small Wins", tip: "Using cashback apps like Rakuten for online shopping gives you 1-10% back on purchases you were already making.", fact: "The average user earns $150/year doing nothing extra." },
  { id: "c64", category: "Budgeting", tip: "The latte factor is real — small daily luxuries add up to $1,000-$3,000 per year.", fact: "The goal is not to stop enjoying life, but to make conscious choices." },
  { id: "c65", category: "Investing", tip: "Bonds provide stability in your portfolio — a 60/40 stocks-to-bonds split is a classic balanced approach.", fact: "As you age, shifting toward bonds reduces risk." },
  { id: "c66", category: "Mindset", tip: "Rich people buy assets. Middle class buy liabilities thinking they are assets.", fact: "A car loses 20% of its value the moment you drive it off the lot." },
  { id: "c67", category: "Emergency Fund", tip: "If you are self-employed, aim for 9-12 months of expenses instead of the standard 3-6.", fact: "Irregular income requires a bigger financial cushion." },
  { id: "c68", category: "Taxes", tip: "529 plans let you save for education with tax-free growth — contributions may also be state-tax deductible.", fact: "Funds can now be used for K-12 tuition and even student loan repayment." },
  { id: "c69", category: "Credit", tip: "Becoming an authorized user on someone else's good credit card can instantly boost your score.", fact: "You do not even need to use the card for it to help." },
  { id: "c70", category: "Savings", tip: "Windfalls like bonuses and gifts — save at least 50% before spending any of it.", fact: "You were living without it before, you can keep living without half of it." },
  { id: "c71", category: "Investing", tip: "ETFs (exchange-traded funds) offer diversification like mutual funds but with lower fees and more flexibility.", fact: "The average ETF fee is 0.44% vs 0.67% for mutual funds." },
  { id: "c72", category: "Debt", tip: "Pay biweekly instead of monthly on your mortgage — you make one extra payment per year and save years of interest.", fact: "On a 30-year mortgage, this can shave off 4-6 years." },
  { id: "c73", category: "Small Wins", tip: "Buying a coffee maker and making coffee at home saves $1,000-$1,500 per year for daily coffee drinkers.", fact: "A good coffee maker pays for itself in 2 weeks." },
  { id: "c74", category: "Budgeting", tip: "A no-spend week once a month can save $200-$400 and reset your spending habits.", fact: "It also shows you what you actually need vs want." },
  { id: "c75", category: "Mindset", tip: "Surround yourself with people who talk openly about money, saving, and investing.", fact: "Your financial habits mirror those of the 5 people you spend the most time with." },
  { id: "c76", category: "Taxes", tip: "If your employer offers a Dependent Care FSA, use it — you can set aside $5,000 tax-free for childcare.", fact: "That saves $1,000-$2,000 depending on your tax bracket." },
  { id: "c77", category: "Credit", tip: "Check your credit report for free at AnnualCreditReport.com — you are entitled to one free report per bureau per year.", fact: "1 in 4 reports has an error significant enough to affect the score." },
  { id: "c78", category: "Investing", tip: "Investing in yourself — education, skills, health — often has the highest ROI of any investment.", fact: "A $1,000 course that gets you a $10,000 raise is a 1,000% return." },
  { id: "c79", category: "Savings", tip: "Direct deposit splitting — sending part of each paycheck directly to savings — makes saving invisible and automatic.", fact: "Set it up once and never think about it again." },
  { id: "c80", category: "Debt", tip: "Avoid payday loans at all costs — they carry interest rates of 300-400% APR.", fact: "A $300 payday loan can cost $450 to repay two weeks later." },
  { id: "c81", category: "Travel", tip: "Travel during shoulder season (just before or after peak) for 30-50% lower prices with nearly identical weather.", fact: "September in Europe is cheaper and less crowded than August." },
  { id: "c82", category: "Small Wins", tip: "Switching to LED bulbs throughout your home saves $200-$400 per year in electricity.", fact: "They also last 25 times longer than incandescent bulbs." },
  { id: "c83", category: "Budgeting", tip: "Grocery shopping with a list reduces impulse spending by 23% on average.", fact: "Never shop hungry — it increases spending by up to 65%." },
  { id: "c84", category: "Investing", tip: "Never try to time the market — missing just the 10 best trading days in a decade cuts returns in half.", fact: "The best days often come right after the worst days." },
  { id: "c85", category: "Emergency Fund", tip: "Do not use your emergency fund for non-emergencies — create a separate fun fund for irregular expenses.", fact: "Car registration, holidays, and vacations are predictable — budget for them separately." },
  { id: "c86", category: "Mindset", tip: "Financial freedom is not about being rich — it is about having enough saved that work becomes a choice.", fact: "The FI (Financial Independence) number is typically 25x your annual expenses." },
  { id: "c87", category: "Taxes", tip: "Loss harvesting — selling losing investments to offset gains — can reduce your tax bill legally.", fact: "You can offset up to $3,000 of ordinary income per year with investment losses." },
  { id: "c88", category: "Credit", tip: "Setting up autopay for the minimum on all cards prevents missed payments and credit score damage.", fact: "Payment history is 35% of your credit score — the single biggest factor." },
  { id: "c89", category: "Savings", tip: "The rule of 72: divide 72 by your interest rate to find how many years to double your money.", fact: "At 6%, your money doubles every 12 years." },
  { id: "c90", category: "Debt", tip: "Negotiating a settlement for less than you owe is possible on old debt — creditors often accept 40-60 cents on the dollar.", fact: "Always get any agreement in writing before paying." },
  { id: "c91", category: "Travel", tip: "Using points for business class instead of economy gets 4-6 cents per point value vs 1 cent for cash.", fact: "A business class ticket to Europe worth $4,000 might cost 60,000 points." },
  { id: "c92", category: "Small Wins", tip: "Refinancing your auto loan if rates have dropped can save $50-$100 per month.", fact: "Banks will not contact you to offer a better rate — you have to ask." },
  { id: "c93", category: "Budgeting", tip: "Review recurring subscriptions every 6 months — the average American pays for 4 services they forgot about.", fact: "That is $50-$100/month in invisible waste." },
  { id: "c94", category: "Investing", tip: "Small-cap stocks have historically outperformed large-cap stocks over 20+ year periods.", fact: "Higher risk in the short term, higher reward over decades." },
  { id: "c95", category: "Mindset", tip: "Every $100/month you save in your 20s is worth $350+ in your 60s with average market returns.", fact: "The best time to start investing was yesterday. The second best is today." },
  { id: "c96", category: "Taxes", tip: "If you have a side hustle, set aside 25-30% of every payment for taxes — self-employment tax is 15.3%.", fact: "Quarterly estimated tax payments prevent a big surprise in April." },
  { id: "c97", category: "Credit", tip: "A credit score above 740 qualifies you for the best mortgage rates — the difference from 680 can be $200/month.", fact: "Over 30 years, that is $72,000 in extra interest." },
  { id: "c98", category: "Savings", tip: "Saving $3/day from age 25 to 65 at 7% average return gives you over $200,000.", fact: "That is just the cost of a daily snack." },
  { id: "c99", category: "Investing", tip: "Avoid individual stock picking unless you have hours to research — 80% of stock pickers underperform the index.", fact: "Even professional fund managers fail to beat the market consistently." },
  { id: "c100", category: "Small Wins", tip: "Paying annual subscriptions instead of monthly saves 15-20% — Amazon Prime, apps, and insurance often offer this.", fact: "If you use it year-round, paying annually almost always wins." },
];

// Shuffle tips once per session
const CURATED_TIPS = [...ALL_TIPS].sort(() => Math.random() - 0.5);

const GOALS = [
  { id: "save", label: "Build Savings", emoji: "🏦" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "debt", label: "Pay Off Debt", emoji: "💳" },
  { id: "invest", label: "Start Investing", emoji: "📈" },
  { id: "emergency", label: "Emergency Fund", emoji: "🛡️" },
  { id: "home", label: "Buy a Home", emoji: "🏠" },
];
const CATEGORIES = ["Credit", "Budgeting", "Savings", "Investing", "Debt", "Emergency Fund", "Travel", "Taxes", "Mindset", "Small Wins", "Other"];
const LOADING_STEPS = [
  { emoji: "🔍", text: "Reading your goals..." },
  { emoji: "🧠", text: "Thinking like a financial advisor..." },
  { emoji: "✍️", text: "Writing your personalized advice..." },
  { emoji: "✨", text: "Almost ready..." },
];

// Floating money particles for splash
const MONEY_SYMBOLS = ["$", "$", "$", "¢", "%", "$", "💵", "$", "¢", "$", "%", "$", "💰", "$", "$"];

// Goal SVG icons — solid monochrome style
const IconSavings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);
const IconTravel = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconDebt = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconInvest = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const GOAL_ICONS = {
  save: IconSavings,
  travel: IconTravel,
  debt: IconDebt,
  invest: IconInvest,
  emergency: IconShield,
  home: IconHome,
};
const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconTrendUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// Social share icons
const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IconShare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #FAF7F1; --forest: #1E3F2F; --forest-mid: #2A5440;
    --sage: #D4ECD8; --sage-dark: #A8D4B0; --gold: #C9A84C;
    --ink: #1A1A18; --muted: #6B6558; --border: rgba(30,63,47,0.11);
    --font-d: 'Outfit', sans-serif; --font-b: 'Plus Jakarta Sans', sans-serif;
    --r: 0px; --rs: 0px;
    --sh: 0 2px 20px rgba(30,63,47,0.07);
    --sh-lg: 0 8px 40px rgba(30,63,47,0.14);
  }
  html, body { height: 100%; background: var(--cream); overflow-x: hidden; }
  .app { min-height: 100vh; width: 100%; background: var(--cream); font-family: var(--font-b); display: flex; flex-direction: column; align-items: center; position: relative; overflow-x: hidden; }

  /* ── Splash ────────────────────────────────────────────────────────────────── */
  .splash {
    position: fixed; inset: 0; background: #FAF7F1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 1000; overflow: hidden;
  }
  .splash.exit { animation: splashExit 0.65s cubic-bezier(0.4,0,0.2,1) forwards; }
  @keyframes splashExit {
    0%   { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.03); pointer-events: none; }
  }

  /* Money rain particles */
  .money-particle {
    position: absolute; color: rgba(30,63,47,0.45);
    font-family: var(--font-d); font-weight: 700;
    pointer-events: none; user-select: none;
    animation: moneyFall linear infinite;
  }
  @keyframes moneyFall {
    0%   { transform: translateY(-60px) rotate(0deg); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.6; }
    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
  }

  /* Floating coins (horizontal drift) */
  .money-coin {
    position: absolute; pointer-events: none;
    animation: coinFloat linear infinite;
    color: rgba(30,63,47,0.35);
    font-family: var(--font-d); font-weight: 700;
  }
  @keyframes coinFloat {
    0%   { transform: translateX(-80px) translateY(0) scale(0.8); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 0.7; }
    100% { transform: translateX(110vw) translateY(-40px) scale(1.1); opacity: 0; }
  }

  /* Splash headline — single line */
  .splash-h1 {
    font-family: 'Instrument Serif', serif; color: var(--forest);
    text-align: center; line-height: 1.15; letter-spacing: -0.5px;
    font-size: 36px; font-weight: 400;
    opacity: 0; animation: splashLineIn 0.8s 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
    white-space: nowrap; padding: 0 16px;
  }
  .splash-h1 em { font-style: italic; font-weight: 400; color: var(--forest); }
  .splash-sub {
    font-family: var(--font-b); font-size: 14px; color: var(--muted);
    text-align: center; margin-top: 48px; letter-spacing: 0.2px;
    opacity: 0; animation: splashLineIn 0.7s 0.9s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  @keyframes splashLineIn  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

  /* ── Orbs ─────────────────────────────────────────────────────────────────── */
  .orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; }
  .orb-1 { top: -100px; right: -80px; width: 320px; height: 320px; background: radial-gradient(circle, rgba(201,168,76,0.13) 0%, transparent 70%); animation: orbFloat 9s ease-in-out infinite; }
  .orb-2 { bottom: -120px; left: -80px; width: 360px; height: 360px; background: radial-gradient(circle, rgba(30,63,47,0.08) 0%, transparent 70%); animation: orbFloat 11s ease-in-out infinite -4s; }
  .orb-3 { top: 40%; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(59,123,168,0.07) 0%, transparent 70%); animation: orbFloat 7s ease-in-out infinite -2s; }
  @keyframes orbFloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-18px) scale(1.03); } }

  /* ── Nav ──────────────────────────────────────────────────────────────────── */
  .nav { width: 100%; max-width: 560px; padding: 20px 24px 0; display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 10; }
  .logo { display: flex; align-items: center; gap: 9px; cursor: pointer; background: none; border: none; padding: 0; transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1); }
  .logo:hover { transform: translateY(-1px) scale(1.02); }
  .logo:active { transform: scale(0.97); transition-duration: 0.08s; }
  .logo-icon { width: 34px; height: 34px; background: var(--forest); border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; transition: box-shadow 0.2s; }
  .logo:hover .logo-icon { box-shadow: 0 4px 16px rgba(30,63,47,0.28); }
  .logo-text { font-family: var(--font-d); font-size: 16px; font-weight: 600; color: var(--forest); letter-spacing: -0.3px; }
  .main { width: 100%; max-width: 560px; padding: 60px 32px 80px; flex: 1; position: relative; z-index: 1; }

  /* ── Screen transitions ───────────────────────────────────────────────────── */
  @keyframes slideInR { from { opacity:0; transform:translateX(44px); } to { opacity:1; transform:translateX(0); } }
  @keyframes slideInL { from { opacity:0; transform:translateX(-44px); } to { opacity:1; transform:translateX(0); } }
  .enter-right { animation: slideInR 0.42s cubic-bezier(0.22,1,0.36,1) forwards; }
  .enter-left  { animation: slideInL 0.42s cubic-bezier(0.22,1,0.36,1) forwards; }

  /* Stagger */
  .sg > * { opacity: 0; animation: sgUp 0.52s cubic-bezier(0.22,1,0.36,1) forwards; }
  .sg > *:nth-child(1){animation-delay:.04s} .sg > *:nth-child(2){animation-delay:.10s}
  .sg > *:nth-child(3){animation-delay:.16s} .sg > *:nth-child(4){animation-delay:.22s}
  .sg > *:nth-child(5){animation-delay:.28s} .sg > *:nth-child(6){animation-delay:.34s}
  @keyframes sgUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }

  /* ── Buttons ──────────────────────────────────────────────────────────────── */
  .btn-p { font-family:var(--font-d); font-size:15px; font-weight:600; background:var(--forest); color:var(--cream); border:none; padding:14px 32px; border-radius:100px; cursor:pointer; letter-spacing:0.1px; display:inline-flex; align-items:center; gap:6px; transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, background 0.15s ease; }
  .btn-p:hover { background:var(--forest-mid); transform:translateY(-2px) scale(1.02); box-shadow:0 6px 24px rgba(30,63,47,0.28); }
  .btn-p:active { transform:translateY(0) scale(0.96); box-shadow:0 2px 8px rgba(30,63,47,0.18); transition-duration:0.08s; }
  .btn-p:disabled { opacity:0.32; cursor:not-allowed; transform:none; box-shadow:none; }
  .btn-g { font-family:var(--font-d); font-size:14px; font-weight:500; background:transparent; color:var(--forest); border:1.5px solid var(--border); padding:12px 28px; border-radius:100px; cursor:pointer; transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1); display:inline-flex; align-items:center; gap:6px; }
  .btn-g:hover { border-color:var(--forest); background:rgba(30,63,47,0.05); transform:translateY(-1px); }
  .btn-g:active { transform:scale(0.96); transition-duration:0.08s; }
  .btn-g:disabled { opacity:0.3; cursor:not-allowed; transform:none; }

  /* ── Chips ────────────────────────────────────────────────────────────────── */
  .chip { font-family:var(--font-b); font-size:14px; font-weight:500; padding:10px 18px; border-radius:100px; border:1.5px solid var(--border); background:transparent; color:var(--ink); cursor:pointer; display:inline-flex; align-items:center; gap:6px; white-space:nowrap; transition:transform 0.24s cubic-bezier(0.34,1.56,0.64,1), background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s; }
  .chip:hover { border-color:var(--forest); background:rgba(30,63,47,0.04); }
  .chip:active { transform:scale(0.94); transition-duration:0.07s; }
  .chip.on { background:var(--forest); color:var(--cream); border-color:var(--forest); transform:scale(1.05); box-shadow:0 4px 14px rgba(30,63,47,0.22); }
  .chip.on:hover { transform:scale(1.07); }

  /* ── Feature icons (monochrome) ───────────────────────────────────────────── */
  .feat-icon { width: 40px; height: 40px; background: rgba(30,63,47,0.08); border-radius: 11px; display: flex; align-items: center; justify-content: center; color: var(--forest); flex-shrink: 0; transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.2s; cursor: default; }
  .feat-icon:hover { transform: scale(1.12) rotate(-5deg); background: var(--sage); }

  /* ── Tip card ─────────────────────────────────────────────────────────────── */
  .tip-card { background:var(--forest); border-radius:var(--r); padding:32px 28px; color:var(--cream); cursor:grab; user-select:none; position:relative; overflow:hidden; min-height:210px; }
  .tip-card:active { cursor:grabbing; }
  .tip-card::before { content:''; position:absolute; top:-50px; right:-50px; width:200px; height:200px; background:rgba(255,255,255,0.04); border-radius:50%; pointer-events:none; }
  .tip-card::after  { content:''; position:absolute; bottom:-30px; left:-30px; width:140px; height:140px; background:rgba(201,168,76,0.06); border-radius:50%; pointer-events:none; }
  @keyframes cardIn { from { opacity:0; transform:translateY(22px) scale(0.96) rotateX(3deg); } to { opacity:1; transform:translateY(0) scale(1) rotateX(0); } }
  .card-in { animation:cardIn 0.42s cubic-bezier(0.22,1,0.36,1) forwards; transform-style:preserve-3d; }

  /* ── Social share bar ─────────────────────────────────────────────────────── */
  .share-bar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:12px; }
  .share-btn { display:inline-flex; align-items:center; gap:5px; font-family:var(--font-b); font-size:12px; font-weight:600; padding:7px 14px; border-radius:100px; border:none; cursor:pointer; transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1); }
  .share-btn:hover { transform:translateY(-1px) scale(1.04); }
  .share-btn:active { transform:scale(0.95); transition-duration:0.07s; }
  .share-fb  { background:#1877F2; color:#fff; }
  .share-fb:hover { background:#166FE5; box-shadow:0 4px 14px rgba(24,119,242,0.3); }
  .share-native { background:var(--forest); color:var(--cream); }
  .share-native:hover { background:var(--forest-mid); box-shadow:0 4px 14px rgba(30,63,47,0.25); }
  .share-copy { background:rgba(30,63,47,0.08); color:var(--forest); }
  .share-copy:hover { background:var(--sage); box-shadow:0 4px 14px rgba(30,63,47,0.12); }
  .share-label { font-family:var(--font-b); font-size:11px; font-weight:600; color:var(--muted); letter-spacing:1px; text-transform:uppercase; }

  /* ── Community card ───────────────────────────────────────────────────────── */
  .com-card { background:#fff; border-radius:var(--r); border:1px solid var(--border); padding:20px 22px; transition:box-shadow 0.2s, transform 0.2s; }
  .com-card:hover { box-shadow:var(--sh); transform:translateY(-1px); }
  @keyframes cardSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  .card-slide { animation:cardSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Upvote ───────────────────────────────────────────────────────────────── */
  .upvote { display:flex; align-items:center; gap:5px; font-family:var(--font-d); font-size:13px; font-weight:600; color:var(--muted); background:rgba(30,63,47,0.06); border:none; padding:7px 14px; border-radius:100px; cursor:pointer; flex-shrink:0; transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1); }
  .upvote:hover { background:var(--sage); color:var(--forest); transform:scale(1.08); }
  .upvote:active { transform:scale(0.92); transition-duration:0.07s; }
  .upvote.voted { background:var(--sage); color:var(--forest); box-shadow:0 2px 10px rgba(30,63,47,0.14); }
  .upvote.voted:hover { transform:none; }

  /* ── Loading ──────────────────────────────────────────────────────────────── */
  .load-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center; animation:fadeIn 0.4s ease; }
  .ring-wrap { width:84px; height:84px; position:relative; margin-bottom:28px; }
  .ring { position:absolute; inset:0; border-radius:50%; border:2.5px solid transparent; border-top-color:var(--forest); animation:spin 1s linear infinite; }
  .ring2 { inset:9px; border-top-color:var(--gold); animation:spin 1.5s linear infinite reverse; }
  .ring3 { inset:18px; border-top-color:var(--sage-dark); animation:spin 0.75s linear infinite; }
  .ring-center { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:22px; animation:loadPulse 1.2s ease-in-out infinite; }
  .load-step { font-family:var(--font-d); font-size:17px; font-weight:500; color:var(--forest); min-height:28px; }
  .load-sub { font-size:13px; color:var(--muted); margin-top:6px; }
  .load-dots { display:flex; gap:7px; margin-top:28px; }
  .ldot { width:7px; height:7px; border-radius:50%; animation:ldotBounce 1.2s ease-in-out infinite; }
  .ldot:nth-child(1){background:var(--sage-dark);} .ldot:nth-child(2){background:var(--gold);animation-delay:.15s;} .ldot:nth-child(3){background:var(--forest);animation-delay:.30s;}
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes loadPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.18);} }
  @keyframes ldotBounce { 0%,100%{transform:translateY(0);opacity:0.5;} 50%{transform:translateY(-9px);opacity:1;} }
  @keyframes stepIn { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
  .step-in { animation:stepIn 0.38s cubic-bezier(0.22,1,0.36,1); }

  /* ── Progress ─────────────────────────────────────────────────────────────── */
  .prog-bar { display:flex; gap:6px; margin-bottom:36px; }
  .prog-dot { height:5px; border-radius:3px; background:rgba(30,63,47,0.13); flex:0 0 6px; transition:all 0.36s cubic-bezier(0.34,1.56,0.64,1); }
  .prog-dot.done { background:var(--sage-dark); flex:0 0 18px; }
  .prog-dot.active { background:var(--forest); flex:0 0 28px; }

  /* ── Nav dots ─────────────────────────────────────────────────────────────── */
  .ndots { display:flex; align-items:center; justify-content:center; gap:7px; margin-top:18px; }
  .ndot { width:7px; height:7px; border-radius:50%; background:rgba(30,63,47,0.15); transition:all 0.28s cubic-bezier(0.34,1.56,0.64,1); cursor:pointer; border:none; padding:0; }
  .ndot.on { background:var(--forest); transform:scale(1.45); }
  .ndot:hover:not(.on) { background:rgba(30,63,47,0.35); transform:scale(1.2); }

  /* ── Misc ─────────────────────────────────────────────────────────────────── */
  .eyebrow { font-family:var(--font-b); font-size:10px; font-weight:600; letter-spacing:2.5px; text-transform:uppercase; color:var(--gold); }
  .card { background:#fff; border-radius:var(--r); border:1px solid var(--border); box-shadow:var(--sh); }
  .tag { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:100px; background:var(--sage); color:var(--forest); font-size:12px; font-weight:600; font-family:var(--font-b); }
  .divider { height:1px; background:var(--border); margin:28px 0; }
  .form-label { font-family:var(--font-b); font-size:13px; font-weight:600; color:var(--forest); display:block; margin-bottom:8px; }
  textarea, select { font-family:var(--font-b); font-size:14px; width:100%; border:1.5px solid var(--border); border-radius:var(--rs); padding:12px 14px; background:var(--cream); color:var(--ink); outline:none; resize:none; transition:border-color 0.2s, box-shadow 0.2s; }
  textarea:focus, select:focus { border-color:var(--forest); box-shadow:0 0 0 3px rgba(30,63,47,0.08); }
  select { appearance:none; cursor:pointer; padding-right:36px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%236B6558' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; }
  .char-count { font-size:12px; color:var(--muted); text-align:right; margin-top:4px; }
  .empty { text-align:center; padding:56px 24px; color:var(--muted); }
  .toast { position:fixed; bottom:32px; left:50%; transform:translateX(-50%); background:var(--forest); color:var(--cream); font-family:var(--font-b); font-size:14px; font-weight:500; padding:12px 24px; border-radius:100px; box-shadow:var(--sh-lg); z-index:100; white-space:nowrap; animation:toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(16px) scale(0.88);} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1);} }
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  @keyframes sheetUp { from{opacity:0;transform:translateY(100%);} to{opacity:1;transform:translateY(0);} }
  @keyframes popIn { from{opacity:0;transform:scale(0.9) translateY(10px);} to{opacity:1;transform:scale(1) translateY(0);} }
  .pop-in { animation:popIn 0.32s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes adviceIn { from{opacity:0;transform:translateY(26px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
  .advice-in { animation:adviceIn 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
  @keyframes spinSm { to{transform:rotate(360deg);} }
  .spinner { width:30px; height:30px; border:2.5px solid rgba(30,63,47,0.12); border-top-color:var(--forest); border-radius:50%; animation:spinSm 0.8s linear infinite; margin:0 auto; }
`;

// ─── HOME SCREEN (formerly splash) ───────────────────────────────────────────
function HomeScreen({ onGetAdvice, onWriteAdvice, onViewAdvice }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    symbol: MONEY_SYMBOLS[i % MONEY_SYMBOLS.length],
    left: `${(i * 5.5 + Math.sin(i) * 8) % 95}%`,
    size: `${13 + (i % 5) * 5}px`,
    duration: `${4 + (i % 4) * 1.5}s`,
    delay: `${(i * 0.4) % 5}s`,
  }));

  const coins = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    symbol: ["$", "¢", "%", "$"][i % 4],
    top: `${15 + i * 10}%`,
    size: `${12 + (i % 3) * 7}px`,
    duration: `${6 + i * 0.8}s`,
    delay: `${i * 0.7}s`,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FAF7F1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", zIndex: 1000, overflow: "hidden", padding: "0 24px 48px" }}>
      {/* Money particles */}
      {particles.map(p => (
        <div key={p.id} className="money-particle" style={{ left: p.left, top: "-60px", fontSize: p.size, animationDuration: p.duration, animationDelay: p.delay }}>{p.symbol}</div>
      ))}
      {coins.map(c => (
        <div key={c.id} className="money-coin" style={{ top: c.top, left: "-80px", fontSize: c.size, animationDuration: c.duration, animationDelay: c.delay }}>{c.symbol}</div>
      ))}

      {/* Top — headline centered */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", zIndex: 2 }}>
        <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, color: "var(--forest)", marginBottom: 12, letterSpacing: -0.5 }}>FinTips</p>
        <h1 className="splash-h1" style={{ marginBottom: 0 }}>
          Money advice <em>made for you</em> by you
        </h1>
        <p className="splash-sub" style={{ marginTop: 20 }}>
          Personalized · Anonymous · Community-powered
        </p>
      </div>

      {/* Bottom — 3 action cards */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "row", gap: 10, position: "relative", zIndex: 2 }}>
        {[
          { label: "Get Advice", fn: onGetAdvice, primary: true },
          { label: "Write Advice", fn: onWriteAdvice, primary: false },
          { label: "View all Advice", fn: onViewAdvice, primary: false },
        ].map(({ label, fn, primary }) => (
          <button key={label} onClick={fn} style={{
            flex: 1, padding: "12px 8px", borderRadius: 0, cursor: "pointer",
            background: primary ? "#1E3F2F" : "#fff",
            color: primary ? "#FAF7F1" : "#1E3F2F",
            textAlign: "center",
            border: "1.5px solid #1E3F2F",
            transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12, fontWeight: 600,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1E3F2F"; e.currentTarget.style.color = "#FAF7F1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = primary ? "#1E3F2F" : "#fff"; e.currentTarget.style.color = primary ? "#FAF7F1" : "#1E3F2F"; }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SHARE SHEET ─────────────────────────────────────────────────────────────
function ShareSheet({ text, label, isAdvice = false, hideHeart = false }) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 20) + 3);
  const [copied, setCopied] = useState(false);

  const shareText = isAdvice
    ? `💡 My personalized money advice from FinTips:\n\n"${text.slice(0, 200)}..."\n\nGet yours free at FinTips 🌿`
    : `💡 ${label} tip from FinTips:\n\n"${text}"\n\nGet yours free at FinTips 🌿`;

  function handleLike() {
    if (!liked) { setLiked(true); setLikes(l => l + 1); }
    else { setLiked(false); setLikes(l => l - 1); }
  }

  function handleReport(reason) {
    setReported(true);
    setReportOpen(false);
    // Store report in Supabase silently
    try {
      supabaseFetch("/reports", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ tip_text: text.slice(0, 200), reason, reported_at: new Date().toISOString() }) });
    } catch { /* silent */ }
  }

  function shareNative() {
    if (navigator.share) navigator.share({ title: "FinTips", text: shareText }).catch(() => {});
    setOpen(false);
  }

  function copyText() {
    navigator.clipboard.writeText(shareText).then(() => { setCopied(true); setTimeout(() => { setCopied(false); setOpen(false); }, 1500); });
  }

  function shareX() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank", "width=600,height=400");
    setOpen(false);
  }

  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`, "_blank", "width=600,height=400");
    setOpen(false);
  }

  function shareInstagram() {
    navigator.clipboard.writeText(shareText).then(() => {
      alert("Text copied! Open Instagram and paste in your story or post.");
      setOpen(false);
    });
  }

  function downloadImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext("2d");

    // Cream background
    ctx.fillStyle = "#FAF7F1";
    ctx.fillRect(0, 0, 1080, 1080);

    // White card
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(80, 80, 920, 920);

    // Forest green border
    ctx.strokeStyle = "#1E3F2F";
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 80, 920, 920);

    // FinTips app name
    ctx.fillStyle = "#1E3F2F";
    ctx.font = "bold 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("FinTips", 540, 160);

    // Divider line
    ctx.strokeStyle = "rgba(30,63,47,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 185);
    ctx.lineTo(960, 185);
    ctx.stroke();

    // Tip text
    ctx.fillStyle = "#1A1A18";
    ctx.font = "28px Georgia, serif";
    ctx.textAlign = "center";
    const maxWidth = 820;
    const lineHeight = 46;
    const words = text.split(" ");
    let line = "";
    let y = 280;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trim(), 540, y);
        line = word + " ";
        y += lineHeight;
      } else line = test;
    }
    if (line) ctx.fillText(line.trim(), 540, y);

    // Divider line bottom
    ctx.strokeStyle = "rgba(30,63,47,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 900);
    ctx.lineTo(960, 900);
    ctx.stroke();

    // fintips.vercel.app
    ctx.fillStyle = "#1E3F2F";
    ctx.font = "bold 24px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("fintips.vercel.app", 540, 960);

    const link = document.createElement("a");
    link.download = "fintips-advice.png";
    link.href = canvas.toDataURL();
    link.click();
    setOpen(false);
  }

  return (
    <>
      {/* Heart + Share + Report row */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "0", marginTop: 0 }}>
        {!hideHeart && (
          <button onClick={handleLike} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = ""}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "#1E3F2F" : "none"} stroke="#1E3F2F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--forest)" }}>{likes}</span>
          </button>
        )}

        {/* Share button */}
        <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = ""}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3F2F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          <span style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--forest)" }}>Share</span>
        </button>

        {/* Report button */}
        <button onClick={() => !reported && setReportOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: reported ? "default" : "pointer", padding: 0, transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)", opacity: reported ? 0.4 : 1 }}
          onMouseEnter={e => { if (!reported) e.currentTarget.style.transform = "scale(1.1)"; }}
          onMouseLeave={e => e.currentTarget.style.transform = ""}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3F2F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          <span style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--forest)" }}>{reported ? "Reported" : "Report"}</span>
        </button>
      </div>

      {/* Share bottom sheet */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn 0.2s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FAF7F1", borderRadius: 0, padding: "28px 24px 40px", width: "100%", maxWidth: 560, animation: "sheetUp 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, color: "var(--forest)", marginBottom: 10 }}>Share this {isAdvice ? "advice" : "tip"}</p>
            <p style={{ fontFamily: "var(--font-b)", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24, fontStyle: "italic" }}>
              "{text.slice(0, 120)}{text.length > 120 ? "…" : ""}"
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {navigator.share && (
                <button onClick={shareNative} style={{ width: "100%", padding: "15px", borderRadius: 0, background: "var(--forest)", color: "var(--cream)", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  Share via...
                </button>
              )}
              <button onClick={copyText} style={{ width: "100%", padding: "15px", borderRadius: 0, background: "#fff", color: "var(--forest)", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 500, border: "1.5px solid var(--border)", cursor: "pointer" }}>
                {copied ? "Copied!" : "Copy text"}
              </button>
              <button onClick={downloadImage} style={{ width: "100%", padding: "15px", borderRadius: 0, background: "#fff", color: "var(--forest)", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 500, border: "1.5px solid var(--border)", cursor: "pointer" }}>
                Download as image
              </button>
              <button onClick={shareX} style={{ width: "100%", padding: "15px", borderRadius: 0, background: "#fff", color: "var(--forest)", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 500, border: "1.5px solid var(--border)", cursor: "pointer" }}>
                Share on X
              </button>
              <button onClick={shareFacebook} style={{ width: "100%", padding: "15px", borderRadius: 0, background: "#fff", color: "var(--forest)", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 500, border: "1.5px solid var(--border)", cursor: "pointer" }}>
                Share on Facebook
              </button>
              <button onClick={shareInstagram} style={{ width: "100%", padding: "15px", borderRadius: 0, background: "#fff", color: "var(--forest)", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 500, border: "1.5px solid var(--border)", cursor: "pointer" }}>
                Share on Instagram
              </button>
              <button onClick={() => setOpen(false)} style={{ width: "100%", padding: "14px", background: "none", border: "none", fontFamily: "var(--font-b)", fontSize: 14, color: "var(--muted)", cursor: "pointer", marginTop: 4 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report bottom sheet */}
      {reportOpen && (
        <div onClick={() => setReportOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn 0.2s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FAF7F1", borderRadius: 0, padding: "28px 24px 40px", width: "100%", maxWidth: 560, animation: "sheetUp 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, color: "var(--forest)", marginBottom: 6 }}>Report this content</p>
            <p style={{ fontFamily: "var(--font-b)", fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>Why are you reporting this?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Inappropriate content", "Spam", "Harmful or dangerous advice"].map(reason => (
                <button key={reason} onClick={() => handleReport(reason)} style={{ width: "100%", padding: "15px", borderRadius: 0, background: "#fff", color: "var(--forest)", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 500, border: "1.5px solid var(--border)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1E3F2F"; e.currentTarget.style.color = "#FAF7F1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "var(--forest)"; }}>
                  {reason}
                </button>
              ))}
              <button onClick={() => setReportOpen(false)} style={{ width: "100%", padding: "14px", background: "none", border: "none", fontFamily: "var(--font-b)", fontSize: 14, color: "var(--muted)", cursor: "pointer", marginTop: 4 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function FinTips() {
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState("home");
  const [dir, setDir] = useState("right");
  const [screenKey, setScreenKey] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [form, setForm] = useState({ goals: [] });
  const [quizAnswers, setQuizAnswers] = useState({ goal: "", startingPoint: "", challenge: "" });
  const [advice, setAdvice] = useState("");
  const [tipIndex, setTipIndex] = useState(0);
  const [tipKey, setTipKey] = useState(0);
  const [communityTips, setCommunityTips] = useState([]);
  const [votedIds, setVotedIds] = useState(new Set());
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  // ─── ADMIN STATE ───────────────────────────────────────────────────────────
  const ADMIN_PASSWORD = "fintips2026admin";
  const ADMIN_URL_KEY = "admin-fintips";
  const [showAdmin, setShowAdmin] = useState(() => window.location.hash === `#${ADMIN_URL_KEY}`);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminTab, setAdminTab] = useState("tips");
  const [adminTips, setAdminTips] = useState([]);
  const [adminReports, setAdminReports] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("Most loved");
  const [submitForm, setSubmitForm] = useState({ tip: "", category: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [loadStep, setLoadStep] = useState(0);
  const [dragStart, setDragStart] = useState(null);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  useEffect(() => {
    if (screen !== "loading") return;
    setLoadStep(0);
    const t = setInterval(() => setLoadStep(s => s < LOADING_STEPS.length - 1 ? s + 1 : s), 1100);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => { if (screen === "community") loadCommunityTips(); }, [screen]);

  function go(to, direction = "right") {
    setDir(direction); setScreenKey(k => k + 1); setScreen(to);
  }
  function goHome() {
    setShowSplash(true);
    setForm({ goals: [] });
    setAdvice("");
    setQuizAnswers({ goal: "", startingPoint: "", challenge: "" });
  }

  async function loadAdminData() {
    setAdminLoading(true);
    try {
      const [tips, reports] = await Promise.all([
        supabaseFetch("/community_tips?select=*&order=created_at.desc&limit=100"),
        supabaseFetch("/reports?select=*&order=reported_at.desc&limit=100"),
      ]);
      setAdminTips(tips || []);
      setAdminReports(reports || []);
    } catch { showToast("Failed to load admin data"); }
    setAdminLoading(false);
  }

  async function adminDeleteTip(id) {
    if (!window.confirm("Delete this tip?")) return;
    try {
      await supabaseFetch(`/community_tips?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      setAdminTips(p => p.filter(t => t.id !== id));
      showToast("✅ Tip deleted");
    } catch { showToast("Failed to delete"); }
  }

  async function adminDeleteReport(id) {
    if (!window.confirm("Delete this report?")) return;
    try {
      await supabaseFetch(`/reports?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      setAdminReports(p => p.filter(r => r.id !== id));
      showToast("✅ Report deleted");
    } catch { showToast("Failed to delete"); }
  }

  async function loadCommunityTips() {
    setLoadingCommunity(true);
    try { const data = await supabaseFetch("/community_tips?select=*&order=vote_count.desc&limit=50"); setCommunityTips(data || []); }
    catch { setCommunityTips([]); }
    finally { setLoadingCommunity(false); }
  }

  async function upvote(tip) {
    if (votedIds.has(tip.id)) return;
    setVotedIds(p => new Set([...p, tip.id]));
    setCommunityTips(p => p.map(t => t.id === tip.id ? { ...t, vote_count: (t.vote_count || 0) + 1 } : t));
    try { await supabaseFetch(`/community_tips?id=eq.${tip.id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ vote_count: (tip.vote_count || 0) + 1 }) }); }
    catch { /* silent */ }
  }

  async function submitTip() {
    if (!submitForm.tip.trim() || !submitForm.category || submitForm.tip.length < 20) return;
    setSubmitting(true);
    try {
      await supabaseFetch("/community_tips", { method: "POST", prefer: "return=representation", body: JSON.stringify({ tip_text: submitForm.tip.trim(), category: submitForm.category, vote_count: 0 }) });
      setSubmitForm({ tip: "", category: "" }); setShowSubmit(false);
      showToast("✨ Tip shared with the community!"); loadCommunityTips();
    } catch {
      setCommunityTips(p => [{ id: Date.now(), tip_text: submitForm.tip.trim(), category: submitForm.category, vote_count: 0 }, ...p]);
      setSubmitForm({ tip: "", category: "" }); setShowSubmit(false); showToast("✨ Tip shared!");
    }
    setSubmitting(false);
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function getAdvice() { await getAdviceWithAnswers(quizAnswers); }

  async function getAdviceWithAnswers(answers) {
    setAdvice("");
    // Auto-tag category from goal answer
    const categoryMap = {
      "Paying off debt": "Debt",
      "Building my savings": "Savings",
      "Starting to invest": "Investing",
      "Rebuilding my credit": "Credit",
    };
    setSubmitForm(f => ({ ...f, category: categoryMap[answers.goal] || "General" }));
    go("loading");
    await new Promise(r => setTimeout(r, 100));
    const prompt = `You are a direct, no-nonsense money coach. Here is what this person shared:
- Goal: ${answers.goal}
- Where they are: ${answers.startingPoint}
- Biggest challenge: ${answers.challenge}

Write exactly 3 tips. Each tip is 1-2 short sentences max. Be direct and specific — real numbers only (dollars, %, timeframes). No intros, no fluff, no "great question!", no encouragement filler. Just the advice. Always complete every sentence fully. Plain paragraphs, no bullet points or headers.`;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1500 },
          }),
        }
      );
      const data = await res.json();
      setAdvice(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
    } catch { setAdvice("Start small and stay consistent. Even $25 a week adds up to $1,300 a year. The best financial decision is always the one you will actually stick with."); }
    go("advice");
  }

  function changeTip(i) { setTipIndex(i); setTipKey(k => k + 1); }
  const drag = e => setDragStart(e.clientX ?? e.touches?.[0]?.clientX);
  const drop = e => {
    if (!dragStart) return;
    const end = e.clientX ?? e.changedTouches?.[0]?.clientX;
    const diff = dragStart - end;
    if (diff > 50 && tipIndex < CURATED_TIPS.length - 1) changeTip(tipIndex + 1);
    if (diff < -50 && tipIndex > 0) changeTip(tipIndex - 1);
    setDragStart(null);
  };

  const isCoach = ["home","quiz3","loading","advice"].includes(screen);

  return (
    <div className="app">
      {showSplash && (
        <HomeScreen
          onGetAdvice={() => { setShowSplash(false); setQuizAnswers({ goal: "", startingPoint: "", challenge: "" }); go("quiz3"); }}
          onWriteAdvice={() => { setShowSplash(false); go("writeadvice"); }}
          onViewAdvice={() => { setShowSplash(false); go("community"); }}
        />
      )}

      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      <main className="main" style={{ marginLeft: "auto", marginRight: "auto" }}>
        <div key={screenKey} className={dir === "right" ? "enter-right" : "enter-left"}>

          {/* LOADING — rendered outside transition wrapper, see below */}

          {/* ADVICE */}
          {screen === "advice" && advice && (
            <div className="sg">
              <div>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, color: "var(--forest)", letterSpacing: -0.5, textAlign: "center" }}>Your Tips</h2>
              </div>
              <div className="card advice-in" style={{ padding: "32px 28px", position: "relative" }}>
                <div style={{ position: "absolute", top: 18, right: 22, fontSize: 28, opacity: 0.07 }}>🌿</div>
                {advice.split("\n\n").filter(Boolean).map((para, i, arr) => (
                  <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: "var(--ink)", marginBottom: i < arr.length - 1 ? 16 : 0 }}>{para}</p>
                ))}
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {form.goals.map(g => {
                    const goal = GOALS.find(x => x.id === g);
                    const Icon = GOAL_ICONS[g];
                    return goal ? (
                      <span key={g} className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {Icon && <Icon />} {goal.label}
                      </span>
                    ) : null;
                  })}
                </div>
                <ShareSheet text={advice} label="advice" isAdvice={true} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 40 }}>
                <button onClick={() => go("tips")} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 0, cursor: "pointer",
                  background: "#1E3F2F", color: "#FAF7F1", textAlign: "center",
                  border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                  Browse daily tips
                </button>
                <button onClick={goHome} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 0, cursor: "pointer",
                  background: "#fff", color: "#1E3F2F", textAlign: "center",
                  border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1E3F2F"; e.currentTarget.style.color = "#FAF7F1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1E3F2F"; }}>
                  Start over
                </button>
              </div>
            </div>
          )}

          {/* 3 QUICK QUESTIONS */}
          {screen === "quiz3" && (
            <div className="sg">
              {/* Progress indicator */}
              <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, background: i <= quizStep ? "#1E3F2F" : "rgba(30,63,47,0.15)", transition: "background 0.3s" }} />
                ))}
              </div>

              {/* Q1 — Goal */}
              {quizStep === 0 && (
                <div key="q1" className="sg">
                  <div>
                    <h2 style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 700, color: "var(--forest)", marginBottom: 8, letterSpacing: -0.5 }}>What are you working on right now?</h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {["Paying off debt", "Building my savings", "Starting to invest", "Rebuilding my credit"].map(opt => (
                      <button key={opt} onClick={() => { setQuizAnswers(a => ({ ...a, goal: opt })); setQuizStep(1); }}
                        style={{ padding: "16px 20px", textAlign: "left", background: quizAnswers.goal === opt ? "#1E3F2F" : "#fff", color: quizAnswers.goal === opt ? "#FAF7F1" : "#1A1A18", border: `1.5px solid ${quizAnswers.goal === opt ? "#1E3F2F" : "rgba(30,63,47,0.15)"}`, borderRadius: 0, cursor: "pointer", fontFamily: "var(--font-b)", fontSize: 15, fontWeight: 500, transition: "all 0.18s" }}
                        onMouseEnter={e => { if (quizAnswers.goal !== opt) { e.currentTarget.style.borderColor = "#1E3F2F"; e.currentTarget.style.background = "rgba(30,63,47,0.04)"; }}}
                        onMouseLeave={e => { if (quizAnswers.goal !== opt) { e.currentTarget.style.borderColor = "rgba(30,63,47,0.15)"; e.currentTarget.style.background = "#fff"; }}}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Q2 — Starting Point */}
              {quizStep === 1 && (
                <div key="q2" className="sg">
                  <div>
                    <h2 style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 700, color: "var(--forest)", marginBottom: 8, letterSpacing: -0.5 }}>Where would you say you are?</h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {["Just getting started", "I have made some progress", "Getting back on track"].map(opt => (
                      <button key={opt} onClick={() => { setQuizAnswers(a => ({ ...a, startingPoint: opt })); setQuizStep(2); }}
                        style={{ padding: "16px 20px", textAlign: "left", background: quizAnswers.startingPoint === opt ? "#1E3F2F" : "#fff", color: quizAnswers.startingPoint === opt ? "#FAF7F1" : "#1A1A18", border: `1.5px solid ${quizAnswers.startingPoint === opt ? "#1E3F2F" : "rgba(30,63,47,0.15)"}`, borderRadius: 0, cursor: "pointer", fontFamily: "var(--font-b)", fontSize: 15, fontWeight: 500, transition: "all 0.18s" }}
                        onMouseEnter={e => { if (quizAnswers.startingPoint !== opt) { e.currentTarget.style.borderColor = "#1E3F2F"; e.currentTarget.style.background = "rgba(30,63,47,0.04)"; }}}
                        onMouseLeave={e => { if (quizAnswers.startingPoint !== opt) { e.currentTarget.style.borderColor = "rgba(30,63,47,0.15)"; e.currentTarget.style.background = "#fff"; }}}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Q3 — Biggest Challenge */}
              {quizStep === 2 && (
                <div key="q3" className="sg">
                  <div>
                    <h2 style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 700, color: "var(--forest)", marginBottom: 8, letterSpacing: -0.5 }}>What trips you up most?</h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {["Understanding financial terms", "Staying consistent", "Knowing where to start", "Making my money stretch"].map(opt => (
                      <button key={opt} onClick={() => {
                        const updated = { ...quizAnswers, challenge: opt };
                        setQuizAnswers(updated);
                        getAdviceWithAnswers(updated);
                      }}
                        style={{ padding: "16px 20px", textAlign: "left", background: quizAnswers.challenge === opt ? "#1E3F2F" : "#fff", color: quizAnswers.challenge === opt ? "#FAF7F1" : "#1A1A18", border: `1.5px solid ${quizAnswers.challenge === opt ? "#1E3F2F" : "rgba(30,63,47,0.15)"}`, borderRadius: 0, cursor: "pointer", fontFamily: "var(--font-b)", fontSize: 15, fontWeight: 500, transition: "all 0.18s" }}
                        onMouseEnter={e => { if (quizAnswers.challenge !== opt) { e.currentTarget.style.borderColor = "#1E3F2F"; e.currentTarget.style.background = "rgba(30,63,47,0.04)"; }}}
                        onMouseLeave={e => { if (quizAnswers.challenge !== opt) { e.currentTarget.style.borderColor = "rgba(30,63,47,0.15)"; e.currentTarget.style.background = "#fff"; }}}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Back button */}
              <button onClick={() => quizStep === 0 ? setShowSplash(true) : setQuizStep(s => s - 1)}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-b)", fontSize: 13, color: "var(--muted)", padding: 0, marginTop: 8, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--forest)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}>
                ← Back
              </button>
            </div>
          )}

          {/* TIPS */}
          {screen === "tips" && (
            <div className="sg">
              <div>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 42, fontWeight: 400, color: "var(--forest)", marginBottom: 20, letterSpacing: -0.5, textAlign: "center" }}>FinTips</h2>
              </div>
              <div style={{ perspective: "1000px" }}>
                <div key={tipKey} className="tip-card card-in" onMouseDown={drag} onMouseUp={drop} onTouchStart={drag} onTouchEnd={drop}>
                  <p className="eyebrow" style={{ color: "var(--gold)", marginBottom: 12 }}>{CURATED_TIPS[tipIndex].category}</p>
                  <p style={{ fontSize: 17, lineHeight: 1.75, color: "rgba(250,247,241,0.94)", marginBottom: 20 }}>{CURATED_TIPS[tipIndex].tip}</p>
                  <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 0, borderLeft: "3px solid var(--gold)" }}>
                    <p style={{ fontSize: 13, color: "rgba(212,236,216,0.82)", lineHeight: 1.6 }}>{CURATED_TIPS[tipIndex].fact}</p>
                  </div>
                </div>
              </div>
              <ShareSheet text={CURATED_TIPS[tipIndex].tip} label={CURATED_TIPS[tipIndex].category} />

              {/* Bottom nav buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => go("quiz3")} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 0, cursor: "pointer",
                  background: "#1E3F2F", color: "#FAF7F1", textAlign: "center",
                  border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                  Get Advice
                </button>
                <button onClick={() => go("writeadvice")} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 0, cursor: "pointer",
                  background: "#fff", color: "#1E3F2F", textAlign: "center",
                  border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1E3F2F"; e.currentTarget.style.color = "#FAF7F1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1E3F2F"; }}>
                  Write Advice
                </button>
                <button onClick={() => go("community")} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 0, cursor: "pointer",
                  background: "#fff", color: "#1E3F2F", textAlign: "center",
                  border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1E3F2F"; e.currentTarget.style.color = "#FAF7F1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1E3F2F"; }}>
                  View all Advice
                </button>
              </div>
            </div>
          )}

          {/* WRITE ADVICE */}
          {screen === "writeadvice" && (
            <div className="sg">
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, color: "var(--forest)", lineHeight: 1.3, marginBottom: 10 }}>
                  Money advice made for you by you
                </h2>
                <p style={{ fontFamily: "var(--font-b)", fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
                  What's the best money advice you'd pass on to someone else?
                </p>
              </div>

              <div style={{ background: "#fff", border: "1.5px solid #1E3F2F", padding: "24px" }}>
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ fontSize: 15, marginBottom: 10 }}>Your name <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label>
                  <input
                    type="text"
                    placeholder=""
                    value={submitForm.name || ""}
                    onChange={e => setSubmitForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: "100%", padding: "12px 14px", border: "1.5px solid var(--border)", fontFamily: "var(--font-b)", fontSize: 14, background: "var(--cream)", color: "var(--ink)", outline: "none", borderRadius: 0 }}
                  />
                </div>

                {/* Category tags */}
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ fontSize: 15, marginBottom: 10 }}>Category</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["Debt", "Savings", "Investing", "Credit", "General"].map(cat => (
                      <button key={cat} onClick={() => setSubmitForm(f => ({ ...f, category: cat }))} style={{
                        padding: "8px 16px", borderRadius: 0, cursor: "pointer",
                        background: submitForm.category === cat ? "#1E3F2F" : "#fff",
                        color: submitForm.category === cat ? "#FAF7F1" : "#1E3F2F",
                        border: `1.5px solid ${submitForm.category === cat ? "#1E3F2F" : "rgba(30,63,47,0.25)"}`,
                        fontFamily: "var(--font-b)", fontSize: 13, fontWeight: 600,
                        transition: "all 0.18s",
                      }}
                        onMouseEnter={e => { if (submitForm.category !== cat) { e.currentTarget.style.borderColor = "#1E3F2F"; }}}
                        onMouseLeave={e => { if (submitForm.category !== cat) { e.currentTarget.style.borderColor = "rgba(30,63,47,0.25)"; }}}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label className="form-label" style={{ fontSize: 15, marginBottom: 10 }}>Your advice</label>
                  <textarea
                    rows={6}
                    maxLength={500}
                    placeholder="Share something that changed how you think about money..."
                    value={submitForm.tip}
                    onChange={e => setSubmitForm(f => ({ ...f, tip: e.target.value }))}
                    style={{ borderRadius: 0 }}
                  />
                  <p className="char-count">{submitForm.tip.length}/500</p>
                </div>
              </div>

              {/* Bottom buttons — smaller */}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={goHome} style={{
                  flex: 1, padding: "12px 8px", borderRadius: 0, cursor: "pointer",
                  background: "#fff", color: "#1E3F2F", textAlign: "center",
                  border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1E3F2F"; e.currentTarget.style.color = "#FAF7F1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1E3F2F"; }}>
                  Back
                </button>
                <button
                  disabled={submitForm.tip.length < 20 || !submitForm.category || submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      await supabaseFetch("/community_tips", { method: "POST", prefer: "return=representation", body: JSON.stringify({ tip_text: submitForm.tip.trim(), category: submitForm.category || "General", author_name: submitForm.name || "Anonymous", vote_count: 0 }) });
                      setSubmitForm({ tip: "", category: "", name: "" });
                      showToast("✨ Sent to a stranger!");
                      go("community");
                    } catch {
                      setCommunityTips(p => [{ id: Date.now(), tip_text: submitForm.tip.trim(), category: "General", vote_count: 0 }, ...p]);
                      setSubmitForm({ tip: "", category: "", name: "" });
                      showToast("✨ Sent to a stranger!");
                      go("community");
                    }
                    setSubmitting(false);
                  }}
                  style={{
                    flex: 2, padding: "12px 8px", borderRadius: 0, cursor: submitForm.tip.length < 20 ? "not-allowed" : "pointer",
                    background: submitForm.tip.length >= 20 && submitForm.category ? "#1E3F2F" : "rgba(30,63,47,0.3)",
                    color: "#FAF7F1", textAlign: "center",
                    border: "none", fontFamily: "'Outfit', sans-serif",
                    fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                  }}>
                  {submitting ? "Sending..." : "Send it to a stranger"}
                </button>
              </div>
            </div>
          )}
          {/* COMMUNITY */}
          {screen === "community" && (
            <div className="sg">

              {/* Headline */}
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, color: "var(--forest)", textAlign: "center", marginBottom: 24, lineHeight: 1.3 }}>
                Money advice made for you by you
              </h2>

              {/* Top action buttons */}
              <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
                <button onClick={() => go("quiz3")} style={{
                  flex: 1, padding: "16px 8px", borderRadius: 0, cursor: "pointer",
                  background: "#1E3F2F", color: "#FAF7F1", textAlign: "center",
                  border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                  Get an advice
                </button>
                <button onClick={() => go("writeadvice")} style={{
                  flex: 1, padding: "16px 8px", borderRadius: 0, cursor: "pointer",
                  background: "#fff", color: "#1E3F2F", textAlign: "center",
                  border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1E3F2F"; e.currentTarget.style.color = "#FAF7F1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1E3F2F"; }}>
                  Write an advice
                </button>
              </div>

              {/* Category filter */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["All", "Debt", "Savings", "Investing", "Credit", "General"].map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                      padding: "7px 14px", borderRadius: 0, cursor: "pointer",
                      background: activeCategory === cat ? "#1E3F2F" : "#fff",
                      color: activeCategory === cat ? "#FAF7F1" : "#1E3F2F",
                      border: "1.5px solid #1E3F2F",
                      fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600,
                      transition: "all 0.18s",
                    }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontFamily: "var(--font-b)", fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Sort:</p>
                {["Most loved", "Newest"].map(s => (
                  <button key={s} onClick={() => setActiveSort(s)} style={{
                    padding: "6px 14px", borderRadius: 0, cursor: "pointer",
                    background: activeSort === s ? "#1E3F2F" : "#fff",
                    color: activeSort === s ? "#FAF7F1" : "#1E3F2F",
                    border: "1.5px solid #1E3F2F",
                    fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600,
                    transition: "all 0.18s",
                  }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Tips list */}
              {loadingCommunity ? (
                <div style={{ padding: "56px 0", textAlign: "center" }}>
                  <div className="spinner" />
                  <p style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>Loading...</p>
                </div>
              ) : communityTips.length === 0 ? (
                <div className="empty">
                  <p style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600, color: "var(--forest)", marginBottom: 8 }}>Be the first to share</p>
                  <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, marginBottom: 20 }}>No advice yet. Share something that has helped you.</p>
                  <button onClick={() => go("writeadvice")} style={{ padding: "12px 24px", background: "#1E3F2F", color: "#FAF7F1", border: "none", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Write advice →
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {communityTips
                    .filter(tip => activeCategory === "All" || tip.category === activeCategory)
                    .sort((a, b) => activeSort === "Most loved"
                      ? (b.vote_count || 0) - (a.vote_count || 0)
                      : new Date(b.created_at) - new Date(a.created_at))
                    .map((tip, i) => (
                    <div key={tip.id} className="com-card card-slide" style={{ animationDelay: `${i * 0.05}s`, padding: "20px" }}>
                      {tip.category && (
                        <span className="tag" style={{ marginBottom: 10, display: "inline-flex" }}>{tip.category}</span>
                      )}
                      <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--ink)", marginBottom: 4, textAlign: "left" }}>{tip.tip_text}</p>
                      {tip.author_name && tip.author_name !== "Anonymous" && (
                        <p style={{ fontSize: 12, color: "#1E3F2F", marginTop: 8, textAlign: "center", fontWeight: 600 }}>{tip.author_name}</p>
                      )}
                      {/* Like + Share row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                        {/* Heart / upvote */}
                        <button onClick={() => upvote(tip)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
                          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                          onMouseLeave={e => e.currentTarget.style.transform = ""}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={votedIds.has(tip.id) ? "#1E3F2F" : "none"} stroke="#1E3F2F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          <span style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--forest)", lineHeight: 1 }}>{tip.vote_count || 0}</span>
                        </button>
                        {/* Share button — opens sheet */}
                        <ShareSheet text={tip.tip_text} label={tip.category} hideHeart={true} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Back to home */}
              <div style={{ marginTop: 32, textAlign: "center" }}>
                <button onClick={goHome} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-b)", fontSize: 13, color: "var(--muted)", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--forest)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}>
                  ← Back to home
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* LOADING SCREEN — fixed fullscreen, outside transition wrapper */}
      {screen === "loading" && (
        <div style={{ position: "fixed", inset: 0, background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 50, overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
          {/* Falling money */}
          {Array.from({ length: 18 }, (_, i) => (
            <div key={`lp-${i}`} className="money-particle" style={{
              left: `${(i * 5.5 + Math.sin(i) * 8) % 95}%`,
              top: "-60px",
              fontSize: `${13 + (i % 5) * 5}px`,
              animationDuration: `${4 + (i % 4) * 1.5}s`,
              animationDelay: `${(i * 0.4) % 5}s`,
            }}>{MONEY_SYMBOLS[i % MONEY_SYMBOLS.length]}</div>
          ))}
          {/* Horizontal coins */}
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`lc-${i}`} className="money-coin" style={{
              top: `${15 + i * 10}%`,
              left: "-80px",
              fontSize: `${12 + (i % 3) * 7}px`,
              animationDuration: `${6 + i * 0.8}s`,
              animationDelay: `${i * 0.7}s`,
            }}>{["$", "¢", "%", "$"][i % 4]}</div>
          ))}
          {/* Center content */}
          <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
            <p key={loadStep} className="step-in" style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700, color: "var(--forest)", letterSpacing: -0.5, marginBottom: 8 }}>
              {LOADING_STEPS[loadStep].text}
            </p>
            <div className="load-dots" style={{ justifyContent: "center", marginTop: 24 }}>
              <div className="ldot" /><div className="ldot" /><div className="ldot" />
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {/* ADMIN PANEL */}
      {showAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "#FAF7F1", zIndex: 500, overflowY: "auto", padding: "32px 24px" }}>
          {!adminAuthed ? (
            <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: "#1E3F2F", marginBottom: 8 }}>FinTips Admin</p>
              <p style={{ fontFamily: "var(--font-b)", fontSize: 14, color: "var(--muted)", marginBottom: 32 }}>Enter your admin password to continue</p>
              <input
                type="password"
                placeholder="Password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && adminPass === ADMIN_PASSWORD) { setAdminAuthed(true); loadAdminData(); } }}
                style={{ width: "100%", padding: "14px", border: "1.5px solid #1E3F2F", fontFamily: "var(--font-b)", fontSize: 14, background: "#fff", marginBottom: 12, borderRadius: 0, outline: "none" }}
              />
              <button onClick={() => { if (adminPass === ADMIN_PASSWORD) { setAdminAuthed(true); loadAdminData(); } else showToast("Wrong password"); }}
                style={{ width: "100%", padding: "14px", background: "#1E3F2F", color: "#FAF7F1", border: "none", fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Enter
              </button>
              <button onClick={() => { setShowAdmin(false); window.location.hash = ""; }}
                style={{ marginTop: 16, background: "none", border: "none", fontFamily: "var(--font-b)", fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
                ← Back to app
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: "#1E3F2F" }}>FinTips Admin</p>
                <button onClick={() => { setShowAdmin(false); setAdminAuthed(false); setAdminPass(""); window.location.hash = ""; }}
                  style={{ background: "none", border: "none", fontFamily: "var(--font-b)", fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
                  ← Exit admin
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {["tips", "reports"].map(tab => (
                  <button key={tab} onClick={() => setAdminTab(tab)} style={{
                    padding: "10px 24px", borderRadius: 0, cursor: "pointer",
                    background: adminTab === tab ? "#1E3F2F" : "#fff",
                    color: adminTab === tab ? "#FAF7F1" : "#1E3F2F",
                    border: "1.5px solid #1E3F2F",
                    fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600,
                  }}>
                    {tab === "tips" ? `All Tips (${adminTips.length})` : `Reports (${adminReports.length})`}
                  </button>
                ))}
                <button onClick={loadAdminData} style={{ marginLeft: "auto", padding: "10px 18px", borderRadius: 0, cursor: "pointer", background: "#fff", color: "#1E3F2F", border: "1.5px solid #1E3F2F", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600 }}>
                  ↻ Refresh
                </button>
              </div>

              {adminLoading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)", fontFamily: "var(--font-b)", fontSize: 14 }}>Loading...</div>
              ) : adminTab === "tips" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {adminTips.length === 0 ? <p style={{ fontFamily: "var(--font-b)", fontSize: 14, color: "var(--muted)" }}>No tips yet.</p> : adminTips.map(tip => (
                    <div key={tip.id} style={{ background: "#fff", border: "1px solid var(--border)", padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, background: "#D4ECD8", color: "#1E3F2F", padding: "3px 10px", fontFamily: "var(--font-b)", marginBottom: 8, display: "inline-block" }}>{tip.category || "General"}</span>
                          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink)", marginBottom: 6 }}>{tip.tip_text}</p>
                          <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-b)" }}>
                            {tip.author_name || "Anonymous"} · ♥ {tip.vote_count || 0} · {tip.created_at ? new Date(tip.created_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <button onClick={() => adminDeleteTip(tip.id)} style={{ flexShrink: 0, padding: "8px 14px", background: "#fff", color: "#c0392b", border: "1.5px solid #c0392b", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 0, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#c0392b"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#c0392b"; }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {adminReports.length === 0 ? <p style={{ fontFamily: "var(--font-b)", fontSize: 14, color: "var(--muted)" }}>No reports yet.</p> : adminReports.map(report => (
                    <div key={report.id} style={{ background: "#fff", border: "1.5px solid #c0392b", padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, background: "#fdecea", color: "#c0392b", padding: "3px 10px", fontFamily: "var(--font-b)", marginBottom: 8, display: "inline-block" }}>{report.reason}</span>
                          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink)", marginBottom: 6 }}>"{report.tip_text}"</p>
                          <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-b)" }}>
                            Reported {report.reported_at ? new Date(report.reported_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <button onClick={() => adminDeleteReport(report.id)} style={{ flexShrink: 0, padding: "8px 14px", background: "#fff", color: "#c0392b", border: "1.5px solid #c0392b", fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 0, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#c0392b"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#c0392b"; }}>
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!showSplash && (
        <footer style={{
          width: "100%", maxWidth: 560, padding: "24px 32px 32px",
          textAlign: "center", position: "relative", zIndex: 1,
        }}>
          <p style={{ fontFamily: "var(--font-b)", fontSize: 11, color: "var(--muted)", lineHeight: 1.6, marginBottom: 6 }}>
            FinTips is for informational purposes only and is not professional financial advice.
          </p>
          <p style={{ fontFamily: "var(--font-b)", fontSize: 11, color: "var(--muted)" }}>
            © {new Date().getFullYear()} FinTips. All rights reserved.
          </p>
        </footer>
      )}
    </div>
  );
}
