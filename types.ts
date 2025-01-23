export interface Selectors {
  COOKIE_REJECT: string;
  COOKIE_WIZARD: string;
  DATE: string;
  VALUATION_BASE: string;
  QUOTE_HEADER: string;
  QUOTE_PRICE: string;
  VALUATION_SECTION: string;
}

export interface TimeoutOptions {
  timeout: number;
  waitUntil: "domcontentloaded" | "load" | "networkidle";
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
}

export type MarketCapMultiplier = "T" | "B" | "M" | "K";

export interface MarketCapMultipliers {
  [key: string]: number;
}
