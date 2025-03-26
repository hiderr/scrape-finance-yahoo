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
}
