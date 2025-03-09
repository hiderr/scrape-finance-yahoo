/** Селекторы элементов страницы Yahoo Finance */
export enum PageSelector {
  /** Кнопка отклонения cookie */
  COOKIE_REJECT = 'button[name="reject"]',
  /** Окно с уведомлением о cookie */
  COOKIE_WIZARD = 'div.con-wizard',
  /** Дата данных */
  DATE = '.asofdate',
  /** Базовый селектор для метрик оценки */
  VALUATION_BASE = 'section[data-testid="valuation-measures"] li:nth-child',
  /** Заголовок котировки */
  QUOTE_HEADER = 'div[data-test="qsp-header"]',
  /** Цена котировки */
  QUOTE_PRICE = 'fin-streamer[data-test="qsp-price"]',
  /** Секция с метриками оценки */
  VALUATION_SECTION = 'section[data-testid="valuation-measures"]',
  /** Секция со статистикой */
  STATISTICS_SECTION = 'div[data-testid="quote-statistics"]'
}
