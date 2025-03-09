export interface TimeoutOptions {
  /** Время ожидания в миллисекундах */
  readonly timeout: number
  /** Событие, которое считается завершением загрузки страницы */
  readonly waitUntil: 'domcontentloaded' | 'load' | 'networkidle'
}
