export interface DividendCompany {
  symbol: string
  company: string
  sector: string
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
  [key: string]: unknown
}
