import * as fs from 'fs/promises'
import * as ExcelJS from 'exceljs'
import { YahooCompanyData } from './types/yahoo-api.types'
import { ChampionData } from './types/champion-data.interface'
import { YahooFinanceAPI } from './yahoo-finance-api'

enum YahooFinanceConfig {
  TICKERS_FILE = 'tickers.txt',
  EXCEL_FILE_PREFIX = 'yahoo-finance-data',
  SHEET_ALL_COMPANIES = 'All Companies',
  SHEET_HARD_FILTER = 'Hard Filter',
  SHEET_SOFT_FILTER = 'Soft Filter',
  CHAMPION_FILE = 'Filtered-Dividend-Champions.xlsx',
  CHAMPION_SHEET = 'Filtered Champions'
}

export class YahooFinanceService {
  private championData: Map<string, ChampionData>
  private yahooFinanceAPI: YahooFinanceAPI

  constructor() {
    this.championData = new Map()
    this.yahooFinanceAPI = new YahooFinanceAPI()
  }

  async run(): Promise<void> {
    try {
      await this.initialize()

      console.log('Запуск сбора данных с Yahoo Finance...')
      const content = await fs.readFile(YahooFinanceConfig.TICKERS_FILE, 'utf-8')
      const tickers = content
        .split('\n')
        .filter(Boolean)
        .map(ticker => ticker.trim())

      if (!tickers.length) {
        throw new Error('Файл tickers.txt пуст или не содержит валидных тикеров')
      }

      // Получаем данные через API вместо Playwright
      const allData: YahooCompanyData[] = await this.yahooFinanceAPI.getCompaniesData(tickers)
      console.log(`Получены данные для ${allData.length} компаний из ${tickers.length}`)

      // Фильтруем компании по критериям
      const filteredData: YahooCompanyData[] = allData.filter(data =>
        this.shouldIncludeCompany(data)
      )
      console.log(`Отфильтровано компаний: ${filteredData.length} из ${allData.length}`)

      // Сохраняем результаты в Excel
      const fileName = await this.yahooFinanceAPI.saveToExcel(
        allData,
        filteredData,
        this.championData
      )
      console.log(`Данные сохранены в файл: ${fileName}`)
      console.log(`Всего компаний: ${allData.length}`)
      console.log(`Компаний после фильтрации: ${filteredData.length}`)

      console.log('Обработка данных завершена!')
    } catch (error) {
      console.error('Ошибка при выполнении:', error)
      throw error
    }
  }

  private async initialize(): Promise<void> {
    try {
      console.log(`Чтение данных из ${YahooFinanceConfig.CHAMPION_FILE}...`)
      this.championData = await this.getDividendChampionsData()
      console.log(`Данные из ${YahooFinanceConfig.CHAMPION_FILE} успешно загружены`)
    } catch (error) {
      console.error('Ошибка при инициализации:', error)
      throw error
    }
  }

  private parseNumber(value: string): number {
    if (!value) return 0

    // Убираем все символы кроме цифр, точки и минуса
    const cleanValue = value.replace(/[^0-9.-]/g, '')

    // Парсим значение
    const number = parseFloat(cleanValue)

    // Проверяем на T (триллионы), B (миллиарды), M (миллионы)
    if (value.includes('T')) {
      return number * 1000000000000
    } else if (value.includes('B')) {
      return number * 1000000000
    } else if (value.includes('M')) {
      return number * 1000000
    }

    return number
  }

  /**
   * Форматирует число в читаемом для человека виде с разделителями тысяч и указанием единиц измерения
   */
  private formatNumberForHuman(value: number): string {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)} трлн`
    } else if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)} млрд`
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} млн`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} тыс`
    }

    return value.toString()
  }

  private shouldIncludeCompany(data: YahooCompanyData): boolean {
    try {
      const symbol = data.symbol
      let shouldInclude = true
      const filterReasons: string[] = []

      // Проверяем капитализацию
      const marketCap = this.parseNumber(data.statistics.marketCap)
      if (marketCap < 2000000000) {
        filterReasons.push(`малая капитализация: ${this.formatNumberForHuman(marketCap)}`)
        shouldInclude = false
      }

      // Проверяем P/E по сравнению с P/E сектора
      const championData = this.championData.get(symbol)

      if (championData && championData['Sector Average P/E'] !== 'N/A') {
        const peRatio = this.parseNumber(data.statistics.peRatio)
        const sectorPE = this.parseNumber(championData['Sector Average P/E'])

        if (peRatio > 0 && sectorPE > 0 && peRatio > sectorPE) {
          filterReasons.push(`P/E (${peRatio}) больше, чем P/E сектора (${sectorPE})`)
          shouldInclude = false
        }
      }

      // Проверяем Payout Ratio - коэффициент выплаты дивидендов
      const eps = this.parseNumber(data.statistics.eps)
      const dividend = this.parseNumber(data.statistics.dividend)

      if (eps <= 0) {
        filterReasons.push(`EPS равен нулю или отрицательный (${eps})`)
        shouldInclude = false
      } else if (dividend <= 0) {
        filterReasons.push(`дивиденд равен нулю или отрицательный (${dividend})`)
      } else {
        const payoutRatio = (dividend / eps) * 100

        if (payoutRatio > 70) {
          filterReasons.push(`Payout Ratio (${payoutRatio.toFixed(2)}%) больше 70%`)
          shouldInclude = false
        }
      }

      // Выводим результат проверки для каждой компании
      if (!shouldInclude || filterReasons.length > 0) {
        console.log(
          `Компания ${symbol} ${shouldInclude ? 'прошла фильтры' : 'отфильтрована'} по причинам: ${filterReasons.join(', ')}`
        )
      } else {
        console.log(`Компания ${symbol} прошла все фильтры`)
      }

      return shouldInclude
    } catch (error) {
      console.error(`Ошибка при проверке компании ${data.symbol}:`, error)
      return false
    }
  }

  private async getDividendChampionsData(): Promise<Map<string, ChampionData>> {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(YahooFinanceConfig.CHAMPION_FILE)

      const worksheet = workbook.getWorksheet(YahooFinanceConfig.CHAMPION_SHEET)
      if (!worksheet) {
        throw new Error(
          `Лист "${YahooFinanceConfig.CHAMPION_SHEET}" не найден в файле ${YahooFinanceConfig.CHAMPION_FILE}`
        )
      }

      const championsData = new Map<string, ChampionData>()
      const headers: { [key: string]: number } = {}

      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        if (cell.value) {
          headers[cell.value.toString()] = colNumber
        }
      })

      console.log('Найденные заголовки:', Object.keys(headers))

      // Проверяем наличие необходимых колонок
      if (!headers['Symbol']) {
        throw new Error(
          'Колонка "Symbol" не найдена в файле. Доступные заголовки: ' +
            Object.keys(headers).join(', ')
        )
      }

      // Читаем данные начиная со строки 2
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber)
        const symbol = row.getCell(headers['Symbol']).value?.toString()

        if (!symbol) continue

        const rowData: ChampionData = {
          Company: row.getCell(headers['Company'])?.value?.toString() || '',
          Sector: row.getCell(headers['Sector'])?.value?.toString() || '',
          'Sector Average P/E':
            row.getCell(headers['Sector Average P/E'])?.value?.toString() || 'N/A',
          'No Years': row.getCell(headers['No Years'])?.value?.toString() || '',
          'Payouts/ Year': row.getCell(headers['Payouts/ Year'])?.value?.toString() || '',
          'Div Yield': row.getCell(headers['Div Yield'])?.value?.toString() || '',
          Annualized: row.getCell(headers['Annualized'])?.value?.toString() || '',
          'EPS 1Y': row.getCell(headers['EPS 1Y'])?.value?.toString() || '',
          'Ex-Date': row.getCell(headers['Ex-Date'])?.value?.toString() || ''
        }

        championsData.set(symbol, rowData)
      }

      return championsData
    } catch (error) {
      console.error(`Ошибка при чтении ${YahooFinanceConfig.CHAMPION_FILE}:`, error)
      throw error
    }
  }
}

/**
 * Основная функция для запуска программы
 */
async function main(): Promise<void> {
  try {
    // Инициализируем сервисы
    const yahooFinanceService = new YahooFinanceService()

    // Запускаем обработку данных
    await yahooFinanceService.run()
  } catch (error) {
    console.error('Ошибка при выполнении программы:', error)
  }
}

// Запускаем программу
if (require.main === module) {
  main().catch(console.error)
}
