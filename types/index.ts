export * from './market-cap.interface'
export * from './statistics.interface'
export * from './timeout.interface'
export * from './valuation.interface'
export * from './dividend.interface'

export interface Statistics {
  price: string
  marketCap: string
  beta: string
  peRatio: string
  eps: string
  dividend: string
  exDivDate: string
  targetEst: string
}

export interface Valuation {
  enterpriseValue: string
  trailingPE: string
  forwardPE: string
  pegRatio: string
  priceToSales: string
  priceToBook: string
  evToRevenue: string
  evToEBITDA: string
}

export interface FinancialHighlights {
  profitMargin: string
  returnOnAssets: string
  returnOnEquity: string
  revenue: string
  netIncome: string
  dilutedEPS: string
  totalCash: string
  debtToEquity: string
  freeCashFlow: string
}
