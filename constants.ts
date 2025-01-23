export const SELECTORS = {
  COOKIE_REJECT: 'button[name="reject"]',
  COOKIE_WIZARD: "div.con-wizard",
  DATE: ".asofdate",
  VALUATION_BASE: 'section[data-testid="valuation-measures"] li:nth-child',
  QUOTE_HEADER: 'div[data-test="qsp-header"]',
  QUOTE_PRICE: 'fin-streamer[data-test="qsp-price"]',
  VALUATION_SECTION: 'section[data-testid="valuation-measures"]',
  STATISTICS_SECTION: 'div[data-testid="quote-statistics"]',
};

export const TIMEOUT_OPTIONS = {
  timeout: 15000,
  waitUntil: "domcontentloaded" as const,
};

export const STATISTICS_LABELS = {
  previousClose: "Previous Close",
  open: "Open",
  bid: "Bid",
  ask: "Ask",
  daysRange: "Day's Range",
  weekRange52: "52 Week Range",
  volume: "Volume",
  avgVolume: "Avg. Volume",
  beta: "Beta (5Y Monthly)",
  eps: "EPS (TTM)",
  earningsDate: "Earnings Date",
  forwardDividendYield: "Forward Dividend & Yield",
  exDividendDate: "Ex-Dividend Date",
  targetEst1y: "1y Target Est",
};
