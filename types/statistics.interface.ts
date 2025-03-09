export interface StockStatistics {
  /** Предыдущая цена закрытия */
  previousClose: string
  /** Цена открытия */
  open: string
  /** Цена покупки */
  bid: string
  /** Цена продажи */
  ask: string
  /** Диапазон цен за день */
  daysRange: string
  /** Диапазон цен за 52 недели */
  weekRange52: string
  /** Объем торгов */
  volume: string
  /** Средний объем торгов */
  avgVolume: string
  /** Рыночная капитализация */
  marketCap: string
  /** Коэффициент волатильности относительно рынка */
  beta: string
  /** Price to Earnings Ratio (TTM) */
  peRatio: string
  /** Earnings Per Share (TTM) */
  eps: string
  /** Дата отчета о прибыли */
  earningsDate: string
  /** Прогнозируемая дивидендная доходность */
  forwardDividendYield: string
  /** Дата без дивиденда */
  exDividendDate: string
  /** Целевая цена аналитиков на год вперед */
  targetEst1y: string
  /** Дополнительные поля */
  [key: string]: string
}
