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
  totalCash: string
  debtToEquity: string
  freeCashFlow: string
}

export interface YahooCompanyData {
  symbol: string
  statistics: Statistics
  valuation: Valuation
  financials: FinancialHighlights
}

export interface FinancialValue {
  fmt?: string
  raw?: number
}

export interface YahooFinanceResult {
  summaryDetail?: {
    marketCap?: { fmt?: string; raw?: number }
    trailingPE?: { fmt?: string; raw?: number }
    forwardPE?: { fmt?: string; raw?: number }
    priceToSalesTrailing12Months?: { fmt?: string; raw?: number }
    dividendRate?: { fmt?: string; raw?: number }
    exDividendDate?: { fmt?: string; raw?: Date }
  }
  defaultKeyStatistics?: {
    beta?: { fmt?: string; raw?: number }
    trailingEps?: { fmt?: string; raw?: number }
    enterpriseValue?: { fmt?: string; raw?: number }
    priceToBook?: { fmt?: string; raw?: number }
    enterpriseToRevenue?: { fmt?: string; raw?: number }
    enterpriseToEbitda?: { fmt?: string; raw?: number }
  }
  financialData?: {
    profitMargins?: { fmt?: string; raw?: number }
    returnOnAssets?: { fmt?: string; raw?: number }
    returnOnEquity?: { fmt?: string; raw?: number }
    totalRevenue?: { fmt?: string; raw?: number }
    totalCash?: { fmt?: string; raw?: number }
    debtToEquity?: { fmt?: string; raw?: number }
    freeCashflow?: { fmt?: string; raw?: number }
    targetMeanPrice?: { fmt?: string; raw?: number }
  }
  incomeStatementHistory?: {
    incomeStatementHistory?: Array<{
      operatingIncome?: { fmt?: string; raw?: number }
      ebit?: { fmt?: string; raw?: number }
      endDate?: { fmt?: string; raw?: number }
      totalRevenue?: { fmt?: string; raw?: number }
      costOfRevenue?: { fmt?: string; raw?: number }
      grossProfit?: { fmt?: string; raw?: number }
      totalOperatingExpenses?: { fmt?: string; raw?: number }
      netIncome?: { fmt?: string; raw?: number }
      sellingGeneralAdministrative?: { fmt?: string; raw?: number }
      researchDevelopment?: { fmt?: string; raw?: number }
    }>
  }
  incomeStatementHistoryQuarterly?: {
    incomeStatementHistory?: Array<{
      operatingIncome?: { fmt?: string; raw?: number }
      ebit?: { fmt?: string; raw?: number }
      endDate?: { fmt?: string; raw?: number }
      totalRevenue?: { fmt?: string; raw?: number }
      costOfRevenue?: { fmt?: string; raw?: number }
      grossProfit?: { fmt?: string; raw?: number }
      totalOperatingExpenses?: { fmt?: string; raw?: number }
      netIncome?: { fmt?: string; raw?: number }
      sellingGeneralAdministrative?: { fmt?: string; raw?: number }
      researchDevelopment?: { fmt?: string; raw?: number }
    }>
  }
  cashflowStatementHistory?: {
    cashflowStatements?: Array<{
      operatingCashflow?: { fmt?: string; raw?: number }
      endDate?: { fmt?: string; raw?: number }
    }>
  }
  balanceSheetHistory?: {
    balanceSheetStatements?: Array<{
      totalAssets?: { fmt?: string; raw?: number }
      endDate?: { fmt?: string; raw?: number }
    }>
  }
}
