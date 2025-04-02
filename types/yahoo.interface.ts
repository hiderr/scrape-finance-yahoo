/**
 * Интерфейс статистики, используемый в Yahoo Finance скриптах
 */
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

/**
 * Интерфейс оценки компании, используемый в Yahoo Finance скриптах
 */
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

/**
 * Интерфейс для финансовых показателей компании
 */
export interface FinancialHighlights {
  /** Маржа прибыли */
  profitMargin: string
  /** Доходность на активы */
  returnOnAssets: string
  /** Доходность на капитал */
  returnOnEquity: string
  /** Выручка */
  revenue: string
  /** Чистая прибыль */
  netIncome: string
  /** Разводненная прибыль на акцию */
  dilutedEPS: string
  /** Общая денежная наличность */
  totalCash: string
  /** Отношение долга к собственному капиталу */
  debtToEquity: string
  /** Свободный денежный поток */
  freeCashFlow: string
}

/**
 * Интерфейс для хранения данных об операционном доходе компании
 * за различные временные периоды
 */
export interface OperatingIncome {
  /** Доход за Trailing Twelve Months (последние 12 месяцев) */
  ttm: string
  /** Доход за 2024 год */
  y2024: string
  /** Доход за 2023 год */
  y2023: string
  /** Доход за 2022 год */
  y2022: string
  /** Доход за 2021 год */
  y2021: string
}

/**
 * Интерфейс для полного набора данных компании с Yahoo Finance
 */
export interface YahooCompanyData {
  symbol: string
  statistics: Statistics
  valuation: Valuation
  financials: FinancialHighlights
  operatingIncome?: OperatingIncome
  payoutRatio?: string
}

/**
 * Тип для финансового значения из Yahoo Finance API
 */
export interface FinancialValue {
  fmt?: string
  raw?: number
}

/**
 * Интерфейс для результата запроса к Yahoo Finance API
 */
export interface YahooFinanceResult {
  summaryDetail?: {
    marketCap?: { fmt?: string; raw?: number }
    trailingPE?: { fmt?: string; raw?: number }
    forwardPE?: { fmt?: string; raw?: number }
    priceToSalesTrailing12Months?: { fmt?: string; raw?: number }
    dividendRate?: { fmt?: string; raw?: number }
    exDividendDate?: { fmt?: string; raw?: Date }
    payoutRatio?: { fmt?: string; raw?: number }
  }
  defaultKeyStatistics?: {
    beta?: { fmt?: string; raw?: number }
    trailingEps?: { fmt?: string; raw?: number }
    enterpriseValue?: { fmt?: string; raw?: number }
    pegRatio?: { fmt?: string; raw?: number }
    priceToBook?: { fmt?: string; raw?: number }
    enterpriseToRevenue?: { fmt?: string; raw?: number }
    enterpriseToEbitda?: { fmt?: string; raw?: number }
    payoutRatio?: { fmt?: string; raw?: number }
  }
  financialData?: {
    profitMargins?: { fmt?: string; raw?: number }
    returnOnAssets?: { fmt?: string; raw?: number }
    returnOnEquity?: { fmt?: string; raw?: number }
    totalRevenue?: { fmt?: string; raw?: number }
    netIncome?: { fmt?: string; raw?: number }
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
