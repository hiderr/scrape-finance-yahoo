export interface Selectors {
  COOKIE_REJECT: string;
  COOKIE_WIZARD: string;
  DATE: string;
  VALUATION_BASE: string;
  QUOTE_HEADER: string;
  QUOTE_PRICE: string;
  VALUATION_SECTION: string;
  STATISTICS_SECTION: string;
  PREVIOUS_CLOSE: string;
  OPEN: string;
  BID: string;
  ASK: string;
  DAYS_RANGE: string;
  WEEK_RANGE_52: string;
  VOLUME: string;
  AVG_VOLUME: string;
  BETA: string;
  EPS: string;
  EARNINGS_DATE: string;
  DIVIDEND_YIELD: string;
  EX_DIVIDEND_DATE: string;
  TARGET_EST: string;
}

export interface TimeoutOptions {
  timeout: number;
  waitUntil: "domcontentloaded" | "load" | "networkidle";
}

export interface StockStatistics {
  previousClose: string;
  open: string;
  bid: string;
  ask: string;
  daysRange: string;
  weekRange52: string;
  volume: string;
  avgVolume: string;
  beta: string;
  eps: string;
  earningsDate: string;
  forwardDividendYield: string;
  exDividendDate: string;
  targetEst1y: string;
}

export interface ValuationData {
  ticker: string;
  date: string;
  marketCap: string;
  marketCapNumeric: number | null;
  enterpriseValue: string;
  trailingPE: string;
  forwardPE: string;
  pegRatio: string;
  priceToSales: string;
  priceToBook: string;
  evToRevenue: string;
  evToEBITDA: string;
  statistics: StockStatistics;
}

export type MarketCapMultiplier = "T" | "B" | "M" | "K";

export interface MarketCapMultipliers {
  [key: string]: number;
}
