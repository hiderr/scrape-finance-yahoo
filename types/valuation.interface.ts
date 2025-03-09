import { StockStatistics } from './statistics.interface'

export interface ValuationData {
  /** Тикер компании */
  readonly ticker: string
  /** Дата получения данных */
  readonly date: string
  /** Рыночная капитализация (строковое представление) */
  readonly marketCap: string
  /** Рыночная капитализация (числовое значение) */
  readonly marketCapNumeric: number | null
  /** Стоимость предприятия */
  readonly enterpriseValue: string
  /** Trailing Price to Earnings Ratio (за последние 12 месяцев) */
  readonly trailingPE: string
  /** Forward Price to Earnings Ratio (прогнозный) */
  readonly forwardPE: string
  /** Price/Earnings to Growth Ratio */
  readonly pegRatio: string
  /** Price to Sales Ratio */
  readonly priceToSales: string
  /** Price to Book Ratio */
  readonly priceToBook: string
  /** Enterprise Value to Revenue Ratio */
  readonly evToRevenue: string
  /** Enterprise Value to EBITDA Ratio */
  readonly evToEBITDA: string
  /** Дополнительная статистика */
  readonly statistics: StockStatistics
}
