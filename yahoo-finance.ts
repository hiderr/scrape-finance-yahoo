import { chromium, Page } from 'playwright'
import * as fs from 'fs/promises'
import ExcelJS from 'exceljs'
import { Statistics, Valuation, FinancialHighlights } from './types'

export class YahooFinanceService {
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

  private shouldIncludeCompany(data: { statistics: Statistics }): boolean {
    try {
      // Проверяем капитализацию
      const marketCap = this.parseNumber(data.statistics.marketCap)
      if (marketCap < 2000000000) {
        // < 2 млрд
        console.log(`Пропускаем компанию с малой капитализацией: ${marketCap}`)
        return false
      }

      // Рассчитываем P/E
      const price = this.parseNumber(data.statistics.price)
      const eps = this.parseNumber(data.statistics.eps)

      if (eps <= 0) {
        console.log('Пропускаем компанию с отрицательным или нулевым EPS')
        return false
      }

      const pe = price / eps
      if (pe > 20) {
        console.log(`Пропускаем компанию с высоким P/E: ${pe.toFixed(2)}`)
        return false
      }

      return true
    } catch (error) {
      console.error('Ошибка при проверке компании:', error)
      return false
    }
  }

  private async getStatistics(page: Page): Promise<Statistics> {
    try {
      const stats = page.locator('[data-testid="quote-statistics"]')
      await stats.waitFor({ timeout: 5000 })

      const getValue = async (label: string): Promise<string> => {
        try {
          const value = await stats
            .locator(`li:has(span.label[title="${label}"]) span.value`)
            .textContent({ timeout: 2000 })
          return value?.trim() || ''
        } catch {
          return ''
        }
      }

      const price = await page
        .locator('[data-testid="qsp-price"]')
        .textContent({ timeout: 2000 })
        .then(value => value?.trim() || '')
        .catch(() => '')

      const [marketCap, beta, peRatio, eps, dividend, exDivDate, targetEst] = await Promise.all([
        getValue('Market Cap (intraday)'),
        getValue('Beta (5Y Monthly)'),
        getValue('PE Ratio (TTM)'),
        getValue('EPS (TTM)'),
        getValue('Forward Dividend & Yield'),
        getValue('Ex-Dividend Date'),
        getValue('1y Target Est')
      ])

      return {
        price,
        marketCap,
        beta,
        peRatio,
        eps,
        dividend,
        exDivDate,
        targetEst
      }
    } catch (error) {
      console.error('Ошибка при получении статистики:', error)
      throw error
    }
  }

  private async getValuation(page: Page): Promise<Valuation> {
    try {
      const valuation = page.locator('[data-testid="valuation-measures"]')
      await valuation.waitFor({ timeout: 5000 })

      const getValue = async (label: string): Promise<string> => {
        try {
          const value = await valuation
            .locator(`li:has(p.label:text-is("${label}")) p.value`)
            .textContent({ timeout: 2000 })
          return value?.trim() || ''
        } catch {
          return ''
        }
      }

      const [
        enterpriseValue,
        trailingPE,
        forwardPE,
        pegRatio,
        priceToSales,
        priceToBook,
        evToRevenue,
        evToEBITDA
      ] = await Promise.all([
        getValue('Enterprise Value'),
        getValue('Trailing P/E'),
        getValue('Forward P/E'),
        getValue('PEG Ratio (5yr expected)'),
        getValue('Price/Sales'),
        getValue('Price/Book'),
        getValue('Enterprise Value/Revenue'),
        getValue('Enterprise Value/EBITDA')
      ])

      return {
        enterpriseValue,
        trailingPE,
        forwardPE,
        pegRatio,
        priceToSales,
        priceToBook,
        evToRevenue,
        evToEBITDA
      }
    } catch (error) {
      console.error('Ошибка при получении оценки:', error)
      throw error
    }
  }

  private async getFinancials(page: Page): Promise<FinancialHighlights> {
    try {
      const financials = page.locator('[data-testid="financial-highlights"]')
      await financials.waitFor({ timeout: 5000 })

      const getValue = async (label: string): Promise<string> => {
        try {
          const value = await financials
            .locator(`li:has(p.label:text-is("${label}")) p.value`)
            .textContent({ timeout: 2000 })
          return value?.trim() || ''
        } catch {
          return ''
        }
      }

      const [
        profitMargin,
        returnOnAssets,
        returnOnEquity,
        revenue,
        netIncome,
        dilutedEPS,
        totalCash,
        debtToEquity,
        freeCashFlow
      ] = await Promise.all([
        getValue('Profit Margin'),
        getValue('Return on Assets'),
        getValue('Return on Equity'),
        getValue('Revenue'),
        getValue('Net Income Avi to Common'),
        getValue('Diluted EPS'),
        getValue('Total Cash'),
        getValue('Total Debt/Equity'),
        getValue('Levered Free Cash Flow')
      ])

      return {
        profitMargin,
        returnOnAssets,
        returnOnEquity,
        revenue,
        netIncome,
        dilutedEPS,
        totalCash,
        debtToEquity,
        freeCashFlow
      }
    } catch (error) {
      console.error('Ошибка при получении финансов:', error)
      throw error
    }
  }

  private async getCompanyData(
    page: Page,
    symbol: string
  ): Promise<{
    symbol: string
    statistics: Statistics
    valuation: Valuation
    financials: FinancialHighlights
  }> {
    try {
      await page.goto(`https://finance.yahoo.com/quote/${symbol}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      })

      try {
        const selectors = [
          'button[type="submit"][name="reject"]',
          'button[class*="reject"]',
          'button:has-text("Reject all")',
          'button:has-text("Reject")',
          '[data-click-id="reject"]'
        ]

        for (const selector of selectors) {
          const popup = page.locator(selector)
          const isVisible = await popup.isVisible().catch(() => false)

          if (isVisible) {
            await popup.click()
            break
          }
        }
      } catch (error) {
        // Игнорируем ошибку, если окно не найдено
      }

      const [statistics, valuation, financials] = await Promise.all([
        this.getStatistics(page),
        this.getValuation(page),
        this.getFinancials(page)
      ])

      return { symbol, statistics, valuation, financials }
    } catch (error) {
      console.error(`Ошибка при получении данных для ${symbol}:`, error)
      throw error
    }
  }

  private async saveToExcel(
    allData: Array<{
      symbol: string
      statistics: Statistics
      valuation: Valuation
      financials: FinancialHighlights
    }>,
    filteredData: Array<{
      symbol: string
      statistics: Statistics
      valuation: Valuation
      financials: FinancialHighlights
    }>
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook()

    // Функция для настройки колонок листа
    const setupWorksheet = (worksheet: ExcelJS.Worksheet): void => {
      worksheet.columns = [
        { header: 'Symbol', key: 'symbol', width: 10 },
        // Statistics
        { header: 'Price', key: 'price', width: 10 },
        { header: 'Market Cap', key: 'marketCap', width: 15 },
        { header: 'Beta', key: 'beta', width: 10 },
        { header: 'PE Ratio (TTM)', key: 'peRatio', width: 15 },
        { header: 'EPS (TTM)', key: 'eps', width: 15 },
        { header: 'Forward Dividend & Yield', key: 'dividend', width: 20 },
        { header: 'Ex-Dividend Date', key: 'exDivDate', width: 15 },
        { header: '1y Target Est', key: 'targetEst', width: 15 },
        // Valuation
        { header: 'Enterprise Value', key: 'enterpriseValue', width: 15 },
        { header: 'Trailing P/E', key: 'trailingPE', width: 15 },
        { header: 'Forward P/E', key: 'forwardPE', width: 15 },
        { header: 'PEG Ratio', key: 'pegRatio', width: 15 },
        { header: 'Price/Sales', key: 'priceToSales', width: 15 },
        { header: 'Price/Book', key: 'priceToBook', width: 15 },
        { header: 'EV/Revenue', key: 'evToRevenue', width: 15 },
        { header: 'EV/EBITDA', key: 'evToEBITDA', width: 15 },
        // Financials
        { header: 'Profit Margin', key: 'profitMargin', width: 15 },
        { header: 'Return on Assets', key: 'returnOnAssets', width: 15 },
        { header: 'Return on Equity', key: 'returnOnEquity', width: 15 },
        { header: 'Revenue', key: 'revenue', width: 15 },
        { header: 'Net Income', key: 'netIncome', width: 15 },
        { header: 'Diluted EPS', key: 'dilutedEPS', width: 15 },
        { header: 'Total Cash', key: 'totalCash', width: 15 },
        { header: 'Debt/Equity', key: 'debtToEquity', width: 15 },
        { header: 'Free Cash Flow', key: 'freeCashFlow', width: 15 }
      ]

      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
    }

    // Создаем и настраиваем лист со всеми компаниями
    const allCompaniesSheet = workbook.addWorksheet('All Companies')
    setupWorksheet(allCompaniesSheet)

    for (const item of allData) {
      allCompaniesSheet.addRow({
        symbol: item.symbol,
        ...item.statistics,
        ...item.valuation,
        ...item.financials
      })
    }

    // Создаем и настраиваем лист с отфильтрованными компаниями
    const filteredSheet = workbook.addWorksheet('Filtered Companies')
    setupWorksheet(filteredSheet)

    for (const item of filteredData) {
      filteredSheet.addRow({
        symbol: item.symbol,
        ...item.statistics,
        ...item.valuation,
        ...item.financials
      })
    }

    const fileName = `yahoo-finance-data-${new Date().toISOString().split('T')[0]}.xlsx`
    await workbook.xlsx.writeFile(fileName)
    return fileName
  }

  async run(): Promise<void> {
    try {
      console.log('Запуск сбора данных с Yahoo Finance...')
      const content = await fs.readFile('tickers.txt', 'utf-8')
      const tickers = content.split('\n').filter(Boolean)

      if (!tickers.length) {
        throw new Error('Файл tickers.txt пуст или не содержит валидных тикеров')
      }

      const browser = await chromium.launch({ headless: false })
      const page = await browser.newPage()

      try {
        await page.route('**/*', route => {
          const request = route.request()
          if (
            request.resourceType() === 'image' ||
            request.resourceType() === 'font' ||
            request.resourceType() === 'media'
          ) {
            route.abort()
          } else {
            route.continue()
          }
        })

        const allData = []
        const filteredData = []

        for (const ticker of tickers) {
          try {
            console.log(`Обработка тикера ${ticker}...`)
            const data = await this.getCompanyData(page, ticker)

            // Добавляем в общий список
            allData.push(data)
            console.log(`Данные для ${ticker} получены`)

            // Проверяем для фильтрованного списка
            if (this.shouldIncludeCompany(data)) {
              filteredData.push(data)
              console.log(
                `Данные для ${ticker} соответствуют критериям и добавлены в фильтрованный список`
              )
            } else {
              console.log(`Данные для ${ticker} не соответствуют критериям фильтрации`)
            }
          } catch (error) {
            console.error(`Ошибка при обработке ${ticker}:`, error)
          }
        }

        if (allData.length > 0) {
          const fileName = await this.saveToExcel(allData, filteredData)
          console.log(`Данные сохранены в файл: ${fileName}`)
          console.log(`Всего компаний: ${allData.length}`)
          console.log(`Компаний после фильтрации: ${filteredData.length}`)
        } else {
          console.error('Не удалось получить данные ни для одного тикера')
        }
      } finally {
        await browser.close()
      }
    } catch (error) {
      console.error('Ошибка:', error)
      process.exit(1)
    }
  }
}

async function main(): Promise<void> {
  const service = new YahooFinanceService()
  await service.run()
}

process.on('unhandledRejection', (error: Error) => {
  console.error('Необработанная ошибка:', error)
  process.exit(1)
})

main()
