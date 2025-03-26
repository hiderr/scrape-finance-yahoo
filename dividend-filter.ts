import * as fs from 'fs'
import ExcelJS from 'exceljs'
import { subYears, isBefore } from 'date-fns'
import { DividendCompany, SectorPEData } from './types'
import { FilterCriteria, ExcelFile } from './constants'
import axios from 'axios'

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

      const companies = await this.readCompanies()
      const filteredCompanies = this.filterCompanies(companies)
      // console.log('filteredCompanies', filteredCompanies)
      await this.saveResults(filteredCompanies)
    } catch (error) {
      console.error('Ошибка:', (error as Error).message)
      process.exit(1)
    }
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
    this.calculateSectorPEData(worksheet, headers)

    for (let rowNumber = 4; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      const symbolCell = row.getCell(headers['Symbol'])

      if (!symbolCell.value) {
        continue
      }

      const sector = row.getCell(headers['Sector']).value?.toString() || 'Unknown'
      const sectorPE = this.sectorPEData.get(sector)?.average || 0

      const company: DividendCompany = {
        symbol: symbolCell.value?.toString() || '',
        company: row.getCell(headers['Company']).value?.toString() || '',
        sector: sector,
        sectorPE: sectorPE,
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
        company[header] = cellValue
      })

      companies.push(company)
    }

    return companies
  }

  /**
   * Рассчитывает средний P/E по каждому сектору
   */
  private calculateSectorPEData(
    worksheet: ExcelJS.Worksheet,
    headers: { [key: string]: number }
  ): void {
    const sectorPEData = new Map<string, SectorPEData>()

    for (let rowNumber = 4; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      const symbolCell = row.getCell(headers['Symbol'])

      if (!symbolCell.value) {
        continue
      }

      const sector = row.getCell(headers['Sector']).value?.toString() || 'Unknown'
      const peCell = row.getCell(headers['P/E']).value
      let pe = 0

      if (typeof peCell === 'number') {
        pe = peCell
      } else if (typeof peCell === 'string') {
        pe = parseFloat(peCell) || 0
      }

      // Учитываем только положительные P/E для расчета среднего
      if (pe > 0) {
        if (!sectorPEData.has(sector)) {
          sectorPEData.set(sector, { sum: 0, count: 0, average: 0 })
        }

        const data = sectorPEData.get(sector)!
        data.sum += pe
        data.count += 1
      }
    }

    // Вычисляем средние значения
    for (const [sector, data] of sectorPEData.entries()) {
      if (data.count > 0) {
        data.average = data.sum / data.count
        console.log(
          `Средний P/E для сектора ${sector}: ${data.average.toFixed(2)} (на основе ${data.count} компаний)`
        )
      }
    }

    this.sectorPEData = sectorPEData
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

      if (!this.isExDateCurrent(company.exDate)) {
        return false
      }

      return true
    })
  }

  private isExDateCurrent(exDateStr: string): boolean {
    if (!exDateStr) {
      return false
    }

    const exDate = new Date(exDateStr)
    if (isNaN(exDate.getTime())) {
      return false
    }

    const oneYearAgo = subYears(new Date(), 1)
    return !isBefore(exDate, oneYearAgo)
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
