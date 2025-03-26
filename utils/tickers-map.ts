export const tickersMap: Record<string, string> = {
  'ARTN.A': 'ARTNA',
  'BF.A': 'BF-A',
  'BF.B': 'BF-B',
  'AGM.A': 'AGM-A',
  'CWEN.A': 'CWEN-A',
  'DGIC.A': 'DGICA',
  'DGIC.B': 'DGICB',
  'FCNC.A': 'FCNCA',
  'MKC.V': 'MKC-V',
  'RUSH.A': 'RUSHA',
  'RUSH.B': 'RUSHB',
  'WSO.B': 'WSO-B'
}

/**
 * Конвертирует тикер из исходного формата в формат Yahoo Finance
 * @param ticker Тикер в исходном формате (например, 'ARTN.A')
 * @returns Тикер в формате Yahoo Finance (например, 'ARTNAA') или исходный тикер в верхнем регистре
 */
export function toYahooFormat(ticker: string): string {
  return tickersMap[ticker] || ticker
}

/**
 * Конвертирует тикер из формата Yahoo Finance в исходный формат
 * @param ticker Тикер в формате Yahoo Finance (например, 'ARTNAA')
 * @returns Тикер в исходном формате (например, 'ARTN.A') или исходный тикер
 */
export function toSourceFormat(ticker: string): string {
  for (const [source, yahoo] of Object.entries(tickersMap)) {
    if (yahoo === ticker) {
      return source
    }
  }
  return ticker
}

/**
 * Проверяет, нужно ли тикеру специальное преобразование для Yahoo Finance
 * @param ticker Тикер в исходном формате
 * @returns true, если тикер требует специального преобразования
 */
export function needsConversion(ticker: string): boolean {
  return ticker in tickersMap
}
