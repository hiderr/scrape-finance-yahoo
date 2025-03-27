import yahooFinance from 'yahoo-finance2'
import ExcelJS from 'exceljs'
import { ChampionData } from './types/champion-data.interface'
import { toYahooFormat } from './utils/tickers-map'
import {
  YahooCompanyData,
  Statistics,
  Valuation,
  FinancialHighlights,
  YahooFinanceResult,
  FinancialValue
} from './types/yahoo-api.types'

/**
 * Класс для работы с Yahoo Finance API через пакет yahoo-finance2
 */
export class YahooFinanceAPI {
  /**
   * Получает данные для списка тикеров
   * @param tickers Список тикеров компаний
   * @param limit Ограничение на количество тикеров для обработки (для тестирования)
   * @returns Промис с данными компаний
   */
  async getCompaniesData(tickers: string[], limit?: number): Promise<YahooCompanyData[]> {
    try {
      console.log(`Получение данных для ${tickers.length} компаний...`)

      const tickersToProcess = limit ? tickers.slice(0, limit) : tickers
      const results: YahooCompanyData[] = []
      const batchSize = 5

      for (let i = 0; i < tickersToProcess.length; i += batchSize) {
        const batch = tickersToProcess.slice(i, i + batchSize)
        console.log(
          `Обработка пакета ${i / batchSize + 1} из ${Math.ceil(tickersToProcess.length / batchSize)}...`
        )

        const batchPromises = batch.map(symbol => this.getCompanyData(symbol))
        const batchResults = await Promise.allSettled(batchPromises)

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          } else {
            console.error(`Ошибка при получении данных для ${batch[index]}:`, result.reason)
          }
        })
      }

      console.log(`Получены данные для ${results.length} компаний из ${tickersToProcess.length}`)

      return results
    } catch (error) {
      console.error('Ошибка при получении данных из Yahoo Finance API:', error)

      throw error
    }
  }

  /**
   * Получает данные для одной компании
   * @param symbol Тикер компании
   * @returns Промис с данными компании
   */
  private async getCompanyData(symbol: string): Promise<YahooCompanyData> {
    try {
      const yahooSymbol = toYahooFormat(symbol)
      console.log(`Получение данных для ${symbol} (Yahoo: ${yahooSymbol})...`)

      const quote = await yahooFinance.quote(yahooSymbol)
      console.log(
        `Данные котировки для ${symbol}:`,
        JSON.stringify({
          regularMarketPrice: quote.regularMarketPrice
        })
      )

      const modulesResult = (await yahooFinance.quoteSummary(yahooSymbol, {
        modules: ['price', 'summaryDetail', 'financialData', 'defaultKeyStatistics']
      })) as YahooFinanceResult

      console.log(
        `Данные модулей для ${symbol}:`,
        JSON.stringify({
          marketCap: modulesResult.summaryDetail?.marketCap,
          trailingPE: modulesResult.summaryDetail?.trailingPE
        })
      )

      const statistics: Statistics = {
        price: (quote.regularMarketPrice || '').toString(),
        marketCap: this.getFormattedValue(modulesResult.summaryDetail?.marketCap),
        beta: this.getFormattedValue(modulesResult.defaultKeyStatistics?.beta),
        peRatio: this.getFormattedValue(modulesResult.summaryDetail?.trailingPE, 'peRatio'),
        eps: this.getFormattedValue(modulesResult.defaultKeyStatistics?.trailingEps),
        dividend: this.getFormattedValue(modulesResult.summaryDetail?.dividendRate),
        exDivDate: this.getFormattedValue(
          modulesResult.summaryDetail?.exDividendDate,
          'exDividendDate'
        ),
        targetEst: this.getFormattedValue(modulesResult.financialData?.targetMeanPrice)
      }

      const valuation: Valuation = {
        enterpriseValue: this.getFormattedValue(
          modulesResult.defaultKeyStatistics?.enterpriseValue
        ),
        trailingPE: this.getFormattedValue(modulesResult.summaryDetail?.trailingPE, 'trailingPE'),
        forwardPE: this.getFormattedValue(modulesResult.summaryDetail?.forwardPE),
        priceToSales: this.getFormattedValue(
          modulesResult.summaryDetail?.priceToSalesTrailing12Months
        ),
        priceToBook: this.getFormattedValue(modulesResult.defaultKeyStatistics?.priceToBook),
        evToRevenue: this.getFormattedValue(
          modulesResult.defaultKeyStatistics?.enterpriseToRevenue
        ),
        evToEBITDA: this.getFormattedValue(modulesResult.defaultKeyStatistics?.enterpriseToEbitda)
      }

      const financials: FinancialHighlights = {
        profitMargin: this.getFormattedValue(modulesResult.financialData?.profitMargins),
        returnOnAssets: this.getFormattedValue(modulesResult.financialData?.returnOnAssets),
        returnOnEquity: this.getFormattedValue(modulesResult.financialData?.returnOnEquity),
        revenue: this.getFormattedValue(modulesResult.financialData?.totalRevenue),
        totalCash: this.getFormattedValue(modulesResult.financialData?.totalCash),
        debtToEquity: this.getFormattedValue(modulesResult.financialData?.debtToEquity),
        freeCashFlow: this.getFormattedValue(modulesResult.financialData?.freeCashflow)
      }

      console.log(`Проверка данных для ${symbol}:`)
      console.log(`- Цена: ${statistics.price}`)
      console.log(`- P/E Ratio: ${statistics.peRatio}`)
      console.log(`- Market Cap: ${statistics.marketCap}`)

      return {
        symbol,
        statistics,
        valuation,
        financials
      }
    } catch (error) {
      console.error(`Ошибка при получении данных для ${symbol}:`, error)

      throw error
    }
  }

  /**
   * Форматирует число в читаемом для человека виде с разделителями тысяч и указанием единиц измерения
   */
  private formatNumberForHuman(value: number): string {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}T`
    } else if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`
    }

    return value.toString()
  }

  /**
   * Форматирует финансовое значение в строку
   * @param value Финансовое значение из API
   * @returns Отформатированная строка
   */
  private formatFinancialValue(value: FinancialValue | undefined): string {
    if (!value) return 'N/A'

    return value.fmt || value.raw?.toString() || 'N/A'
  }

  /**
   * Сохранение данных в Excel файл
   * @param allData Все данные компаний
   * @param filteredData Отфильтрованные данные компаний
   * @param championsData Данные компаний из файла чемпионов
   * @returns Имя созданного файла
   */
  async saveToExcel(
    allData: YahooCompanyData[],
    filteredData: YahooCompanyData[],
    championsData: Map<string, ChampionData>
  ): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook()
      const filteredSheet = workbook.addWorksheet('Filtered Companies')
      const allCompaniesSheet = workbook.addWorksheet('All Companies')

      this.setupWorksheets(filteredSheet, allCompaniesSheet)
      this.fillWorksheets(filteredSheet, allCompaniesSheet, filteredData, allData, championsData)

      this.applyExcelFormatting(filteredSheet)
      this.applyExcelFormatting(allCompaniesSheet)

      const fileName = `yahoo-finance-data-${new Date().toISOString().split('T')[0]}.xlsx`
      await workbook.xlsx.writeFile(fileName)

      return fileName
    } catch (error) {
      console.error('Ошибка при сохранении данных в Excel:', error)

      throw error
    }
  }

  /**
   * Настраивает структуру таблиц Excel
   * @param filteredSheet Лист с отфильтрованными компаниями
   * @param allCompaniesSheet Лист со всеми компаниями
   */
  private setupWorksheets(
    filteredSheet: ExcelJS.Worksheet,
    allCompaniesSheet: ExcelJS.Worksheet
  ): void {
    const columns = [
      { header: 'Symbol', key: 'symbol', width: 10 },
      { header: 'Company', key: 'Company', width: 30 },
      { header: 'Sector', key: 'Sector', width: 20 },
      { header: 'Sector Average P/E', key: 'sectorPE', width: 15 },
      { header: 'P/E actual', key: 'peActual', width: 15 },
      { header: 'Graham Price Diff (%)', key: 'grahamPriceDiff', width: 15 },
      { header: 'PE Ratio (TTM)', key: 'peRatio', width: 15 },
      { header: 'No Years', key: 'No Years', width: 10 },
      { header: 'Payouts/ Year', key: 'Payouts/ Year', width: 10 },
      { header: 'Div Yield', key: 'Div Yield', width: 10 },
      { header: 'Payout Ratio (%)', key: 'payoutRatio', width: 15 },
      { header: 'Graham Number', key: 'grahamNumber', width: 15 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Market Cap', key: 'marketCap', width: 15 },
      { header: 'Beta', key: 'beta', width: 10 },
      { header: 'EPS', key: 'eps', width: 10 },
      { header: 'Dividend', key: 'dividend', width: 10 },
      { header: 'Ex-Div Date', key: 'exDivDate', width: 15 },
      { header: 'Target Est', key: 'targetEst', width: 10 },
      { header: 'Enterprise Value', key: 'enterpriseValue', width: 20 },
      { header: 'Trailing P/E', key: 'trailingPE', width: 15 },
      { header: 'Forward P/E', key: 'forwardPE', width: 15 },
      { header: 'Price/Sales', key: 'priceToSales', width: 15 },
      { header: 'Price/Book', key: 'priceToBook', width: 15 },
      { header: 'EV/Revenue', key: 'evToRevenue', width: 15 },
      { header: 'EV/EBITDA', key: 'evToEBITDA', width: 15 },
      { header: 'Profit Margin', key: 'profitMargin', width: 15 },
      { header: 'ROA', key: 'returnOnAssets', width: 10 },
      { header: 'ROE', key: 'returnOnEquity', width: 10 },
      { header: 'Revenue', key: 'revenue', width: 15 },
      { header: 'Total Cash', key: 'totalCash', width: 15 },
      { header: 'Debt/Equity', key: 'debtToEquity', width: 15 },
      { header: 'Free Cash Flow', key: 'freeCashFlow', width: 15 }
    ]

    filteredSheet.columns = columns
    allCompaniesSheet.columns = columns
  }

  /**
   * Заполняет таблицы Excel данными
   * @param filteredSheet Лист с отфильтрованными компаниями
   * @param allCompaniesSheet Лист со всеми компаниями
   * @param filteredData Отфильтрованные данные компаний
   * @param allData Все данные компаний
   * @param championsData Данные компаний из файла чемпионов
   */
  private fillWorksheets(
    filteredSheet: ExcelJS.Worksheet,
    allCompaniesSheet: ExcelJS.Worksheet,
    filteredData: YahooCompanyData[],
    allData: YahooCompanyData[],
    championsData: Map<string, ChampionData>
  ): void {
    for (const company of filteredData) {
      const rowData = this.fillCompanyRow(company, championsData.get(company.symbol))
      filteredSheet.addRow(rowData)

      console.log(`Добавляем в Excel строку для ${company.symbol}: `, {
        price: rowData.price,
        marketCap: rowData.marketCap,
        peRatio: rowData.peRatio
      })
    }

    for (const company of allData) {
      allCompaniesSheet.addRow(this.fillCompanyRow(company, championsData.get(company.symbol)))
    }
  }

  /**
   * Применяет форматирование к таблице Excel
   * @param worksheet Лист Excel
   */
  private applyExcelFormatting(worksheet: ExcelJS.Worksheet): void {
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length }
    }

    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  }

  /**
   * Парсит числовое значение из строки
   * @param value Строковое представление числа
   * @returns Число или 0, если парсинг не удался
   */
  private parseNumber(value: string): number {
    if (!value || value === 'N/A') return 0

    const cleanValue = value.replace(/[^0-9.]/g, '')
    const number = parseFloat(cleanValue)

    return isNaN(number) ? 0 : number
  }

  /**
   * Извлекает форматированное значение из финансового значения
   * @param value Финансовое значение из API
   * @param key Опциональный ключ поля для специальной обработки
   * @returns Форматированная строка
   */
  private getFormattedValue(value: unknown, key?: string): string {
    if (!value) return 'N/A'

    if (typeof value === 'object' && value !== null) {
      return this.getFormattedObjectValue(value as Record<string, unknown>, key)
    }

    if (typeof value === 'number' || typeof value === 'string') {
      return this.getFormattedPrimitiveValue(value, key)
    }

    return 'N/A'
  }

  private getFormattedObjectValue(objValue: Record<string, unknown>, key?: string): string {
    if (key === 'peRatio' && objValue.raw !== undefined && typeof objValue.raw === 'number') {
      return objValue.raw.toFixed(2)
    }

    if (objValue.fmt && typeof objValue.fmt === 'string' && key === 'exDividendDate') {
      return this.formatDate(objValue.fmt)
    }

    if (objValue.fmt && typeof objValue.fmt === 'string') return objValue.fmt
    if (objValue.raw !== undefined) return String(objValue.raw)

    return 'N/A'
  }

  private getFormattedPrimitiveValue(value: number | string, key?: string): string {
    if (key === 'peRatio' && typeof value === 'number') {
      return value.toFixed(2)
    }

    if (typeof value === 'string' && key === 'exDividendDate') {
      return this.formatDate(value)
    }

    return value.toString()
  }

  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } catch (e) {
      console.log(`Ошибка преобразования даты: ${dateStr}`, e)
    }

    return dateStr
  }

  private formatExDivDate(exDivDate: string): string {
    if (exDivDate === 'N/A') return exDivDate

    try {
      const date = new Date(exDivDate)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } catch (e) {
      console.log(`Ошибка преобразования даты из файла чемпионов: ${exDivDate}`, e)
    }

    return exDivDate
  }

  private calculatePayoutRatio(
    championData: ChampionData | undefined,
    company: YahooCompanyData
  ): string {
    try {
      const eps = this.parseNumber(company.statistics.eps)
      const dividend = this.parseNumber(company.statistics.dividend)

      if (eps <= 0 || dividend <= 0) return 'N/A'

      return ((dividend / eps) * 100).toFixed(2)
    } catch (e) {
      console.log('Ошибка при расчете коэффициента выплаты дивидендов из данных Yahoo:', e)
      return 'N/A'
    }
  }

  /**
   * Расчет числа Грэма
   * Число Грэма = √(22.5 * EPS * Book Value per Share)
   * @param company Данные компании
   * @returns Число Грэма
   */
  private calculateGrahamNumber(company: YahooCompanyData): string {
    try {
      const eps = this.parseNumber(company.statistics.eps)
      const priceToBook = this.parseNumber(company.valuation.priceToBook)
      const price = this.parseNumber(company.statistics.price)

      // Если P/B доступно, рассчитаем Book Value per Share
      if (eps <= 0 || priceToBook <= 0 || price <= 0) {
        return 'N/A'
      }

      // Book Value per Share = Price / P/B
      const bookValuePerShare = price / priceToBook

      // Формула Грэма: √(22.5 * EPS * BVPS)
      // 22.5 = 15 * 1.5, где 15 - максимальный P/E, 1.5 - максимальный P/B
      const grahamNumber = Math.sqrt(22.5 * eps * bookValuePerShare)

      return grahamNumber.toFixed(2)
    } catch (e) {
      console.log('Ошибка при расчете числа Грэма:', e)
      return 'N/A'
    }
  }

  private fillCompanyRow(
    company: YahooCompanyData,
    championData: ChampionData | undefined
  ): Record<string, string | number> {
    const price = this.parseNumber(company.statistics.price)
    const eps = this.parseNumber(company.statistics.eps)
    const peActual = eps > 0 ? (price / eps).toFixed(2) : ''

    let peRatio = company.statistics.peRatio
    if (peRatio !== 'N/A' && !isNaN(Number(peRatio))) {
      peRatio = Number(peRatio).toFixed(2)
    }

    const exDivDate = championData?.['Ex-Date'] || company.statistics.exDivDate
    const formattedExDivDate = this.formatExDivDate(exDivDate)
    const payoutRatio = this.calculatePayoutRatio(championData, company)
    const grahamNumber = this.calculateGrahamNumber(company)

    // Расчет разницы между текущей ценой и числом Грэма (в процентах)
    let grahamPriceDiff = 'N/A'
    if (grahamNumber !== 'N/A' && price > 0) {
      const grahamValue = parseFloat(grahamNumber)
      // Положительное значение означает, что акция дороже, чем число Грэма (переоценена)
      // Отрицательное значение означает, что акция дешевле, чем число Грэма (недооценена)
      const diffPercent = ((price - grahamValue) / grahamValue) * 100
      grahamPriceDiff = diffPercent.toFixed(2)
    }

    // Форматируем рыночную капитализацию для человекочитаемого отображения
    const marketCap = this.parseNumber(company.statistics.marketCap)
    const formattedMarketCap = this.formatNumberForHuman(marketCap)

    return {
      symbol: company.symbol,
      price: company.statistics.price,
      marketCap: formattedMarketCap,
      beta: company.statistics.beta,
      peRatio: peRatio,
      eps: company.statistics.eps,
      dividend: company.statistics.dividend,
      exDivDate: formattedExDivDate,
      targetEst: company.statistics.targetEst,
      enterpriseValue: company.valuation.enterpriseValue,
      trailingPE: company.valuation.trailingPE,
      forwardPE: company.valuation.forwardPE,
      priceToSales: company.valuation.priceToSales,
      priceToBook: company.valuation.priceToBook,
      evToRevenue: company.valuation.evToRevenue,
      evToEBITDA: company.valuation.evToEBITDA,
      profitMargin: company.financials.profitMargin,
      returnOnAssets: company.financials.returnOnAssets,
      returnOnEquity: company.financials.returnOnEquity,
      revenue: company.financials.revenue,
      totalCash: company.financials.totalCash,
      debtToEquity: company.financials.debtToEquity,
      freeCashFlow: company.financials.freeCashFlow,
      peActual,
      payoutRatio,
      grahamNumber,
      grahamPriceDiff,
      Company: championData?.Company || '',
      Sector: championData?.Sector || '',
      sectorPE: championData?.['Sector Average P/E'] || '',
      'No Years': championData?.['No Years'] || '',
      'Payouts/ Year': championData?.['Payouts/ Year'] || '',
      'Div Yield': championData?.['Div Yield'] || ''
    }
  }
}
