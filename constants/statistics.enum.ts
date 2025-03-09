/** Метки статистических показателей на Yahoo Finance */
export enum StatisticsLabel {
  /** Предыдущая цена закрытия */
  PREVIOUS_CLOSE = 'Previous Close',
  /** Цена открытия */
  OPEN = 'Open',
  /** Цена покупки */
  BID = 'Bid',
  /** Цена продажи */
  ASK = 'Ask',
  /** Диапазон цен за день */
  DAYS_RANGE = "Day's Range",
  /** Диапазон цен за 52 недели */
  WEEK_RANGE_52 = '52 Week Range',
  /** Объем торгов */
  VOLUME = 'Volume',
  /** Средний объем торгов */
  AVG_VOLUME = 'Avg. Volume',
  /** Рыночная капитализация */
  MARKET_CAP = 'Market Cap',
  /** Бета-коэффициент (5 лет, месячный) */
  BETA = 'Beta (5Y Monthly)',
  /** Коэффициент P/E (TTM) */
  PE_RATIO = 'PE Ratio (TTM)',
  /** Прибыль на акцию (TTM) */
  EPS = 'EPS (TTM)',
  /** Дата отчета о прибыли */
  EARNINGS_DATE = 'Earnings Date',
  /** Прогнозируемый дивиденд и доходность */
  FORWARD_DIVIDEND_YIELD = 'Forward Dividend & Yield',
  /** Дата без дивиденда */
  EX_DIVIDEND_DATE = 'Ex-Dividend Date',
  /** Целевая цена на 1 год */
  TARGET_EST_1Y = '1y Target Est'
}
