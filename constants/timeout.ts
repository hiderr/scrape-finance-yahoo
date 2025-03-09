import { TimeoutOptions } from '../types'

/** Стандартные настройки таймаута для запросов к Yahoo Finance */
export const DEFAULT_TIMEOUT_OPTIONS: TimeoutOptions = {
  /** Максимальное время ожидания (15 секунд) */
  timeout: 15000,
  /** Ожидать загрузку DOM */
  waitUntil: 'domcontentloaded'
}
