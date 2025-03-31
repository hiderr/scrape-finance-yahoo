export interface DividendCompany {
  [key: string]: string | number | boolean | undefined | null | Date
  symbol: string
  company: string
  sector: string
  sectorPE: number
  yahooPE?: number
  noYears: number
  price: number
  divYield: number
  currentDiv: number
  payoutsPerYear: number
  annualized: number
  previousDiv: number
  exDate: string
  payDate: string
  dgr1Y: number
  eps1Y: number
  marketCap?: number
}

export interface SectorPEData {
  sum: number
  count: number
  average: number
}
