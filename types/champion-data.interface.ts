/**
 * Интерфейс для данных из файла Dividend Champions
 */
export interface ChampionData {
  /** Название компании */
  Company: string
  /** Сектор */
  Sector: string
  /** Количество лет непрерывных выплат дивидендов */
  'No Years': string
  /** Количество выплат в год */
  'Payouts/ Year': string
  /** Дивидендная доходность */
  'Div Yield': string
  /** Среднее P/E отношение по сектору */
  'Sector Average P/E': string
  /** Другие возможные поля */
  [key: string]: string | undefined
}
