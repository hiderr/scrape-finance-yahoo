import { chromium, Page } from 'playwright'
import * as fs from 'fs/promises'
import ExcelJS from 'exceljs'
import { ValuationData, MarketCapMultiplier, MarketCapMultipliers, StockStatistics } from './types'
import { PageSelector, StatisticsLabel, DEFAULT_TIMEOUT_OPTIONS } from './constants'

export class YahooFinanceService {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  static async create(): Promise<YahooFinanceService> {
    try {
      const browser = await chromium.launch()
      const page = await browser.newPage()
      return new YahooFinanceService(page)
    } catch (error) {
      console.error('Ошибка при инициализации браузера:', (error as Error).message)
      throw error
    }
  }

  async run(): Promise<void> {
    try {
      console.log('Начинаю сбор данных с Yahoo Finance...')
      const tickers = await this.getTickers()
      console.log(`Загружено ${tickers.length} тикеров для обработки`)

      const results: ValuationData[] = []

      await this.page.goto(`https://finance.yahoo.com/quote/${tickers[0]}/`)
      await this.handleCookiePopup()

      for (const ticker of tickers) {
        console.log(`Обработка тикера: ${ticker}`)
        const data = await this.scrapeValuationData(ticker)
        if (data) {
          results.push(data)
          console.log(`✓ Данные для ${ticker} успешно получены`)
        } else {
          console.warn(`⚠ Не удалось получить данные для ${ticker}`)
        }
      }

      const fileName = await this.saveToExcel(results)
      console.log(`✓ Данные сохранены в файл: ${fileName}`)
      console.log(`Всего обработано тикеров: ${results.length}/${tickers.length}`)

      await this.close()
      process.exit(0)
    } catch (error) {
      console.error('Ошибка при выполнении скрипта:', (error as Error).message)
      await this.close()
      process.exit(1)
    }
  }

  private async scrapeWithTimeout(ticker: string): Promise<ValuationData | null> {
    try {
      await this.page.goto(`https://finance.yahoo.com/quote/${ticker}/`, DEFAULT_TIMEOUT_OPTIONS)

      if (!(await this.waitForPageLoad())) {
        console.warn(`Таймаут загрузки страницы для ${ticker}`)
        return null
      }

      const valuationSection = await this.page.$(PageSelector.VALUATION_SECTION)
      if (!valuationSection) {
        console.warn(`Не найдена секция оценки для ${ticker}`)
        return null
      }

      const marketCap = await this.getValuationMetric(1)
      const statistics = await this.getStatistics()

      return {
        ticker,
        date: await this.getDate(),
        marketCap,
        marketCapNumeric: this.convertMarketCap(marketCap),
        enterpriseValue: await this.getValuationMetric(2),
        trailingPE: await this.getValuationMetric(3),
        forwardPE: await this.getValuationMetric(4),
        pegRatio: await this.getValuationMetric(5),
        priceToSales: await this.getValuationMetric(6),
        priceToBook: await this.getValuationMetric(7),
        evToRevenue: await this.getValuationMetric(8),
        evToEBITDA: await this.getValuationMetric(9),
        statistics
      }
    } catch (error) {
      console.error(`Ошибка при обработке ${ticker}:`, (error as Error).message)
      return null
    }
  }

  private createTimeoutPromise(operation: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`Timeout during ${operation} after ${DEFAULT_TIMEOUT_OPTIONS.timeout}ms`)
          ),
        DEFAULT_TIMEOUT_OPTIONS.timeout
      )
    )
  }

  private async handleCookiePopup(): Promise<void> {
    try {
      const rejectButton = await this.page.waitForSelector(
        PageSelector.COOKIE_REJECT,
        DEFAULT_TIMEOUT_OPTIONS
      )

      if (rejectButton) {
        console.log('Обработка cookie-уведомления...')
        await rejectButton.click()
        await this.page.waitForSelector(PageSelector.COOKIE_WIZARD, {
          ...DEFAULT_TIMEOUT_OPTIONS,
          state: 'hidden'
        })
        console.log('✓ Cookie-уведомление закрыто')
      }
    } catch (error) {
      console.warn('Не удалось обработать cookie-уведомление:', (error as Error).message)
      return
    }
  }

  private async waitForPageLoad(): Promise<boolean> {
    try {
      await Promise.race([
        Promise.all([
          this.page.waitForLoadState('domcontentloaded'),
          this.page.waitForSelector(PageSelector.VALUATION_SECTION, {
            timeout: 5000
          }),
          this.page.waitForSelector(PageSelector.STATISTICS_SECTION, {
            timeout: 5000
          })
        ]),
        this.createTimeoutPromise('Page load')
      ])

      return true
    } catch (error) {
      console.warn('Ошибка при ожидании загрузки страницы:', (error as Error).message)
      return false
    }
  }

  private async getValuationMetric(index: number): Promise<string> {
    try {
      const element = await this.page.waitForSelector(
        `${PageSelector.VALUATION_BASE}(${index}) .value`,
        { timeout: 5000 }
      )

      return element ? (await element.textContent()) || 'N/A' : 'N/A'
    } catch (error) {
      console.warn(`Не удалось получить метрику оценки ${index}:`, (error as Error).message)
      return 'N/A'
    }
  }

  private async getStatistics(): Promise<StockStatistics> {
    const getValue = async (labelText: string): Promise<string> => {
      try {
        const element = await this.page
          .locator(
            `${PageSelector.STATISTICS_SECTION} span.label:text-is("${labelText}") + span.value`
          )
          .first()
        const value = await element.textContent()

        return value?.trim() || 'N/A'
      } catch (error) {
        console.warn(`Не удалось получить статистику для ${labelText}:`, (error as Error).message)
        return 'N/A'
      }
    }

    const result: StockStatistics = {} as StockStatistics
    for (const [key, label] of Object.entries(StatisticsLabel) as [
      keyof typeof StatisticsLabel,
      string
    ][]) {
      result[String(key).toLowerCase() as keyof StockStatistics] = await getValue(label)
    }

    return result
  }

  private async getDate(): Promise<string> {
    try {
      return (await this.page.locator(PageSelector.DATE).textContent()) || 'N/A'
    } catch (error) {
      console.warn('Не удалось получить дату:', (error as Error).message)
      return 'N/A'
    }
  }

  private convertMarketCap(marketCap: string): number | null {
    if (!marketCap || marketCap === 'N/A') {
      return null
    }

    try {
      const value = parseFloat(marketCap.replace(/[^\d.]/g, ''))
      const multiplier = marketCap.slice(-1).toUpperCase() as MarketCapMultiplier
      const multipliers: MarketCapMultipliers = {
        T: 1e12,
        B: 1e9,
        M: 1e6,
        K: 1e3
      }

      return value * (multipliers[multiplier] || 1)
    } catch (error) {
      console.warn('Ошибка при конвертации Market Cap:', (error as Error).message)
      return null
    }
  }

  async saveToExcel(data: ValuationData[]): Promise<string> {
    try {
      console.log('Сохранение результатов в Excel...')
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Valuation Data')

      const columns = [
        { header: 'Ticker', key: 'ticker', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Market Cap', key: 'marketCap', width: 15 },
        { header: 'Market Cap Numeric', key: 'marketCapNumeric', width: 20 },
        { header: 'Enterprise Value', key: 'enterpriseValue', width: 15 },
        { header: 'Trailing PE', key: 'trailingPE', width: 15 },
        { header: 'Forward PE', key: 'forwardPE', width: 15 },
        { header: 'PEG Ratio', key: 'pegRatio', width: 15 },
        { header: 'Price To Sales', key: 'priceToSales', width: 15 },
        { header: 'Price To Book', key: 'priceToBook', width: 15 },
        { header: 'EV To Revenue', key: 'evToRevenue', width: 15 },
        { header: 'EV To EBITDA', key: 'evToEBITDA', width: 15 }
      ]

      const statisticsColumns = (
        Object.entries(StatisticsLabel) as [keyof typeof StatisticsLabel, string][]
      ).map(([key, label]) => ({
        header: label,
        key: `statistics.${String(key).toLowerCase()}`,
        width: 15
      }))

      worksheet.columns = [...columns, ...statisticsColumns]

      const rowsData = data.map(item => {
        const { statistics, ...baseData } = item
        return {
          ...baseData,
          ...Object.keys(statistics).reduce(
            (acc, key) => ({
              ...acc,
              [`statistics.${key}`]: statistics[key as keyof StockStatistics]
            }),
            {}
          )
        }
      })

      worksheet.addRows(rowsData)
      worksheet.getRow(1).font = { bold: true }

      const marketCapNumericColumn = worksheet.getColumn('marketCapNumeric')
      marketCapNumericColumn.numFmt = '#,##0'

      const fileName = `valuation_data_${new Date().toISOString().split('T')[0]}.xlsx`
      await workbook.xlsx.writeFile(fileName)

      return fileName
    } catch (error) {
      console.error('Ошибка при сохранении в Excel:', (error as Error).message)
      throw error
    }
  }

  async scrapeValuationData(ticker: string): Promise<ValuationData | null> {
    try {
      return await Promise.race([this.scrapeWithTimeout(ticker), this.createTimeoutPromise(ticker)])
    } catch {
      return null
    }
  }

  async getTickers(): Promise<string[]> {
    try {
      const content = await fs.readFile('tickers.txt', 'utf-8')
      const tickers = content
        .split('\n')
        .filter(Boolean)
        .map(ticker => ticker.trim())

      if (tickers.length === 0) {
        throw new Error('Файл tickers.txt пуст или не содержит валидных тикеров')
      }

      return tickers
    } catch (error) {
      console.error('Ошибка при чтении тикеров:', (error as Error).message)
      throw error
    }
  }

  async close(): Promise<void> {
    try {
      const browser = this.page.context().browser()
      if (browser) {
        await browser.close()
        console.log('✓ Браузер успешно закрыт')
      }
    } catch (error) {
      console.error('Ошибка при закрытии браузера:', (error as Error).message)
    }
  }
}

async function main(): Promise<void> {
  try {
    console.log('Запуск сервиса Yahoo Finance...')
    const service = await YahooFinanceService.create()
    await service.run()
  } catch (error) {
    console.error('Критическая ошибка:', (error as Error).message)
    process.exit(1)
  }
}

process.on('unhandledRejection', (error: Error) => {
  console.error('Необработанная ошибка:', error)
  process.exit(1)
})

main()
