import * as fs from 'fs'
import ExcelJS from 'exceljs'
import { DividendCompany, SectorPEData } from './types/dividend.interface'
import { FilterCriteria, ExcelFile } from './constants'
import axios from 'axios'
import { YahooFinanceAPI } from './yahoo-finance-api'
import { YahooCompanyData } from './types/yahoo-api.types'

export class DividendFilter {
  private readonly requiredHeaders = [
    'Symbol',
    'Company',
    'Sector',
    'P/E',
    'No Years',
    'Price',
    'Div Yield',
    'Current Div',
    'Payouts/ Year',
    'Annualized',
    'Previous Div',
    'Ex-Date',
    'Pay-Date',
    'DGR 1Y',
    'EPS 1Y'
  ]

  private sectorPEData: Map<string, SectorPEData> = new Map()
  private yahooFinanceAPI: YahooFinanceAPI
  private yahooData: Map<string, YahooCompanyData> = new Map()

  constructor() {
    this.yahooFinanceAPI = new YahooFinanceAPI()
  }

  private async downloadGoogleSheet(): Promise<void> {
    try {
      console.log('Скачивание файла из Google Sheets...')

      // Извлекаем ID файла из URL
      const fileId = '1D4H2OoHOFVPmCoyKBVCjxIl0Bt3RLYSz'

      // Формируем URL для скачивания
      const downloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`

      // Скачиваем файл
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'arraybuffer'
      })

      // Сохраняем файл
      fs.writeFileSync(ExcelFile.SOURCE, response.data)

      console.log('Файл успешно скачан')
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error)
      throw error
    }
  }

  async run(): Promise<void> {
    try {
      // Скачиваем актуальный файл
      await this.downloadGoogleSheet()

      // Сначала читаем компании из файла
      const companies = await this.readCompanies()

      // Получаем данные из Yahoo Finance для всех компаний
      await this.getYahooFinanceData(companies)

      // Расчет среднего P/E по секторам на основе данных Yahoo
      this.calculateSectorPEDataFromYahoo(companies)

      // Фильтруем компании с учетом данных из Yahoo Finance
      const filteredCompanies = this.filterCompanies(companies)

      await this.saveResults(filteredCompanies)
    } catch (error) {
      console.error('Ошибка:', (error as Error).message)
      process.exit(1)
    }
  }

  private async getYahooFinanceData(companies: DividendCompany[]): Promise<void> {
    try {
      console.log('Получение данных P/E из Yahoo Finance...')

      // Получаем список тикеров
      const tickers = companies.map(company => company.symbol)

      // Разбиваем тикеры на более мелкие пакеты для предотвращения ошибок API
      const chunkSize = 20 // Уменьшаем размер пакета для меньшей нагрузки на API
      const delay = 1000 // Задержка между запросами в миллисекундах

      // Функция для разбивки массива на части
      const chunkArray = <T>(array: T[], size: number): T[][] => {
        const chunkedArr: T[][] = []
        for (let i = 0; i < array.length; i += size) {
          chunkedArr.push(array.slice(i, i + size))
        }
        return chunkedArr
      }

      // Функция задержки
      const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

      // Разбиваем массив тикеров на пакеты
      const tickerChunks = chunkArray(tickers, chunkSize)
      console.log(
        `Разбиваем ${tickers.length} тикеров на ${tickerChunks.length} пакетов по ${chunkSize} тикеров`
      )

      // Обрабатываем каждый пакет с задержкой
      let processedCount = 0
      for (let i = 0; i < tickerChunks.length; i++) {
        console.log(`Обработка пакета ${i + 1} из ${tickerChunks.length}...`)

        try {
          // Обрабатываем пакет тикеров
          const chunkData = await this.yahooFinanceAPI.getCompaniesData(tickerChunks[i])

          // Сохраняем данные в Map для быстрого доступа и обновляем данные в массиве companies
          chunkData.forEach(data => {
            this.yahooData.set(data.symbol, data)

            // Обновляем данные компании из Yahoo Finance
            const companyIndex = companies.findIndex(c => c.symbol === data.symbol)
            if (companyIndex !== -1) {
              // Обновляем соответствующие поля из Yahoo Finance
              const company = companies[companyIndex]
              company.price = parseFloat(data.statistics.price) || company.price

              // Обновляем P/E из Yahoo Finance если доступно
              const peRatio = data.statistics.peRatio
              if (peRatio !== 'N/A') {
                company.yahooPE = parseFloat(peRatio)
              }
            }

            processedCount++
          })

          // Ждем перед следующим запросом, чтобы не превысить лимит API
          if (i < tickerChunks.length - 1) {
            await sleep(delay)
          }
        } catch (error) {
          console.error(`Ошибка при обработке пакета ${i + 1}:`, error)
          // Увеличиваем задержку после ошибки для снижения нагрузки на API
          await sleep(delay * 3)
          // Продолжаем со следующим пакетом
          continue
        }
      }

      console.log(
        `Получены данные из Yahoo Finance для ${processedCount} компаний из ${tickers.length}`
      )
    } catch (error) {
      console.error('Ошибка при получении данных из Yahoo Finance:', error)
      throw error
    }
  }

  private calculateSectorPEDataFromYahoo(companies: DividendCompany[]): void {
    const sectorPEData = new Map<string, SectorPEData>()

    // Группируем компании по секторам
    companies.forEach(company => {
      const sector = company.sector

      // Используем yahooPE вместо извлечения данных из yahooData
      if (company.yahooPE && company.yahooPE > 0) {
        if (!sectorPEData.has(sector)) {
          sectorPEData.set(sector, { sum: 0, count: 0, average: 0 })
        }

        const data = sectorPEData.get(sector)!
        data.sum += company.yahooPE
        data.count += 1
      }
    })

    // Вычисляем средние значения
    for (const [sector, data] of sectorPEData.entries()) {
      if (data.count > 0) {
        data.average = data.sum / data.count
        console.log(
          `Средний P/E для сектора ${sector} (Yahoo): ${data.average.toFixed(2)} (на основе ${data.count} компаний)`
        )
      }
    }

    this.sectorPEData = sectorPEData

    // Обновляем sectorPE в компаниях
    companies.forEach(company => {
      const sectorData = this.sectorPEData.get(company.sector)
      if (sectorData) {
        company.sectorPE = sectorData.average
      }
    })
  }

  private async readCompanies(): Promise<DividendCompany[]> {
    if (!fs.existsSync(ExcelFile.SOURCE)) {
      throw new Error(`Файл ${ExcelFile.SOURCE} не найден`)
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(ExcelFile.SOURCE)

    const worksheet = workbook.getWorksheet(ExcelFile.SHEET)
    if (!worksheet) {
      throw new Error(`Лист ${ExcelFile.SHEET} не найден в файле`)
    }

    const headers: { [key: string]: number } = {}
    const headerRow = worksheet.getRow(3)

    headerRow.eachCell((cell, colNumber) => {
      if (cell.value) {
        headers[cell.value.toString()] = colNumber
      }
    })

    for (const header of this.requiredHeaders) {
      if (!headers[header]) {
        throw new Error(`Заголовок "${header}" не найден в файле`)
      }
    }

    const companies: DividendCompany[] = []

    for (let rowNumber = 4; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      const symbolCell = row.getCell(headers['Symbol'])

      if (!symbolCell.value) {
        continue
      }

      const sector = row.getCell(headers['Sector']).value?.toString() || 'Unknown'

      const company: DividendCompany = {
        symbol: symbolCell.value?.toString() || '',
        company: row.getCell(headers['Company']).value?.toString() || '',
        sector: sector,
        sectorPE: 0, // Будет заполнено позже из Yahoo Finance
        yahooPE: undefined, // Будет заполнено из Yahoo Finance
        noYears: Number(row.getCell(headers['No Years']).value) || 0,
        price: Number(row.getCell(headers['Price']).value) || 0,
        divYield: Number(row.getCell(headers['Div Yield']).value) || 0,
        currentDiv: Number(row.getCell(headers['Current Div']).value) || 0,
        payoutsPerYear: Number(row.getCell(headers['Payouts/ Year']).value) || 0,
        annualized: Number(row.getCell(headers['Annualized']).value) || 0,
        previousDiv: Number(row.getCell(headers['Previous Div']).value) || 0,
        exDate: row.getCell(headers['Ex-Date']).value?.toString() || '',
        payDate: row.getCell(headers['Pay-Date']).value?.toString() || '',
        dgr1Y: Number(row.getCell(headers['DGR 1Y']).value) || 0,
        eps1Y: Number(row.getCell(headers['EPS 1Y']).value) || 0
      }

      Object.keys(headers).forEach(header => {
        const cellValue = row.getCell(headers[header]).value
        // Преобразуем различные типы в строку, число или булево значение
        if (cellValue !== null && cellValue !== undefined) {
          if (typeof cellValue === 'object') {
            // Для даты и других объектов
            if (cellValue instanceof Date) {
              company[header] = cellValue
            } else {
              // Для других объектов (например, ошибок) преобразуем в строку
              company[header] = cellValue.toString()
            }
          } else {
            company[header] = cellValue
          }
        }
      })

      companies.push(company)
    }

    return companies
  }

  private filterCompanies(companies: DividendCompany[]): DividendCompany[] {
    return companies.filter(company => {
      if (company.noYears < FilterCriteria.MIN_YEARS) {
        return false
      }

      if (company.divYield < FilterCriteria.MIN_YIELD) {
        return false
      }

      if (company.payoutsPerYear < FilterCriteria.MIN_PAYOUTS_PER_YEAR) {
        return false
      }

      if (company.dgr1Y < FilterCriteria.MIN_DGR_1Y) {
        return false
      }

      return true
    })
  }

  private extractMarketCap(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return value
    }

    if (!value || typeof value !== 'string') {
      return undefined
    }

    const match = value.match(/^([\d.]+)([KMBT])?$/i)
    if (!match) {
      return undefined
    }

    const num = parseFloat(match[1])
    const suffix = match[2]?.toUpperCase()

    if (isNaN(num)) {
      return undefined
    }

    const multipliers = {
      K: 1e3,
      M: 1e6,
      B: 1e9,
      T: 1e12
    }

    return suffix ? num * (multipliers[suffix as keyof typeof multipliers] || 1) : num
  }

  private async saveResults(companies: DividendCompany[]): Promise<void> {
    const outputWorkbook = new ExcelJS.Workbook()
    const outputWorksheet = outputWorkbook.addWorksheet('Filtered Champions')

    // Определяем заголовки для выходного файла
    const outputHeaders = [
      'Symbol',
      'Company',
      'Sector',
      'Sector Average P/E',
      'P/E',
      'No Years',
      'Price',
      'Div Yield',
      'Current Div',
      'Payouts/ Year',
      'Annualized',
      'Previous Div',
      'Ex-Date',
      'Pay-Date',
      'DGR 1Y',
      'EPS 1Y'
    ]

    outputWorksheet.addRow(outputHeaders)

    companies.forEach(company => {
      const rowData = outputHeaders.map(header => {
        if (header === 'Sector Average P/E') {
          return company.sectorPE?.toFixed(2) || ''
        }

        return company[header] || ''
      })

      outputWorksheet.addRow(rowData)
    })

    outputWorksheet.getRow(1).font = { bold: true }
    outputWorksheet.columns = outputHeaders.map(header => ({
      header,
      key: header,
      width: Math.max(header.length, 15)
    }))

    const fileName = `Filtered-Dividend-Champions.xlsx`
    await outputWorkbook.xlsx.writeFile(fileName)

    const tickers = companies.map(company => company.symbol).join('\n')
    await fs.promises.writeFile('tickers.txt', tickers)

    console.log(`Результаты сохранены в файлы:`)
    console.log(`- Excel: ${fileName}`)
    console.log(`- Тикеры: tickers.txt`)
  }
}

async function main(): Promise<void> {
  const filter = new DividendFilter()
  await filter.run()
}

main()
