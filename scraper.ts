import { chromium, Page } from "playwright";
import * as fs from "fs/promises";
import ExcelJS from "exceljs";
import {
  ValuationData,
  MarketCapMultiplier,
  MarketCapMultipliers,
  StockStatistics,
} from "./types";
import { SELECTORS, TIMEOUT_OPTIONS, STATISTICS_LABELS } from "./constants";

class YahooFinanceScraper {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  static async create(): Promise<YahooFinanceScraper> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    return new YahooFinanceScraper(page);
  }

  async run(): Promise<void> {
    try {
      const tickers = await this.getTickers();
      const results: ValuationData[] = [];

      await this.page.goto(`https://finance.yahoo.com/quote/${tickers[0]}/`);
      await this.handleCookiePopup();

      for (const ticker of tickers) {
        console.log(`Processing ticker: ${ticker}`);
        const data = await this.scrapeValuationData(ticker);
        if (data) {
          results.push(data);
        }
      }

      const fileName = await this.saveToExcel(results);
      console.log(`Data saved to file: ${fileName}`);
      await this.close();
      process.exit(0);
    } catch (error) {
      console.error("Script failed:", (error as Error).message);
      await this.close();
      process.exit(1);
    }
  }

  private async scrapeWithTimeout(
    ticker: string
  ): Promise<ValuationData | null> {
    console.log(`[${ticker}] Starting page navigation...`);
    await this.page.goto(
      `https://finance.yahoo.com/quote/${ticker}/`,
      TIMEOUT_OPTIONS
    );

    console.log(`[${ticker}] Waiting for page load...`);
    if (!(await this.waitForPageLoad())) {
      return null;
    }

    console.log(`[${ticker}] Checking valuation section...`);
    const valuationSection = await this.page.$(SELECTORS.VALUATION_SECTION);
    if (!valuationSection) {
      console.log(`[${ticker}] No valuation section found`);
      return null;
    }

    console.log(`[${ticker}] Getting market cap...`);
    const marketCap = await this.getValuationMetric(1);

    console.log(`[${ticker}] Getting statistics...`);
    const statistics = await this.getStatistics();

    console.log(`[${ticker}] Collecting all metrics...`);
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
      statistics,
    };
  }

  private createTimeoutPromise(operation: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Timeout during ${operation} after ${TIMEOUT_OPTIONS.timeout}ms`
            )
          ),
        TIMEOUT_OPTIONS.timeout
      )
    );
  }

  private async handleCookiePopup(): Promise<void> {
    try {
      const rejectButton = await this.page.waitForSelector(
        SELECTORS.COOKIE_REJECT,
        TIMEOUT_OPTIONS
      );

      if (rejectButton) {
        await rejectButton.click();
        await this.page.waitForSelector(SELECTORS.COOKIE_WIZARD, {
          ...TIMEOUT_OPTIONS,
          state: "hidden",
        });
      }
    } catch {
      console.log("Cookie popup not found, continuing...");
    }
  }

  private async waitForPageLoad(): Promise<boolean> {
    try {
      await Promise.race([
        Promise.all([
          this.page.waitForLoadState("domcontentloaded"),
          this.page.waitForSelector(SELECTORS.VALUATION_SECTION, {
            timeout: 5000,
          }),
          this.page.waitForSelector(SELECTORS.STATISTICS_SECTION, {
            timeout: 5000,
          }),
        ]),
        this.createTimeoutPromise("Page load"),
      ]);

      return true;
    } catch (error) {
      console.error(`Page load failed: ${(error as Error).message}`);
      return false;
    }
  }

  private async getValuationMetric(index: number): Promise<string> {
    try {
      const element = await this.page.waitForSelector(
        `${SELECTORS.VALUATION_BASE}(${index}) .value`,
        { timeout: 5000 }
      );
      return element ? (await element.textContent()) || "N/A" : "N/A";
    } catch {
      return "N/A";
    }
  }

  private async getStatistics(): Promise<StockStatistics> {
    const getValue = async (labelText: string): Promise<string> => {
      console.log(`[Statistics] Getting value for "${labelText}"...`);
      try {
        const element = await this.page
          .locator(
            `${SELECTORS.STATISTICS_SECTION} span.label:text-is("${labelText}") + span.value`
          )
          .first();
        const value = await element.textContent();

        if (!value) {
          console.log(
            `[Statistics] Failed to get "${labelText}", setting to N/A`
          );
          return "N/A";
        }
        return value.trim();
      } catch (error) {
        console.log(
          `[Statistics] Error getting "${labelText}": ${
            (error as Error).message
          }`
        );
        return "N/A";
      }
    };

    const result: StockStatistics = {} as StockStatistics;
    for (const [key, label] of Object.entries(STATISTICS_LABELS)) {
      result[key as keyof StockStatistics] = await getValue(label);
    }

    return result;
  }

  private async getDate(): Promise<string> {
    return (await this.page.locator(SELECTORS.DATE).textContent()) || "N/A";
  }

  private convertMarketCap(marketCap: string): number | null {
    if (!marketCap || marketCap === "N/A") return null;

    const value = parseFloat(marketCap.replace(/[^\d.]/g, ""));
    const multiplier = marketCap.slice(-1).toUpperCase() as MarketCapMultiplier;
    const multipliers: MarketCapMultipliers = {
      T: 1e12,
      B: 1e9,
      M: 1e6,
      K: 1e3,
    };

    return value * (multipliers[multiplier] || 1);
  }

  async saveToExcel(data: ValuationData[]): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Valuation Data");

    const columns = [
      { header: "Ticker", key: "ticker", width: 15 },
      { header: "Date", key: "date", width: 15 },
      { header: "Market Cap", key: "marketCap", width: 15 },
      { header: "Market Cap Numeric", key: "marketCapNumeric", width: 20 },
      { header: "Enterprise Value", key: "enterpriseValue", width: 15 },
      { header: "Trailing PE", key: "trailingPE", width: 15 },
      { header: "Forward PE", key: "forwardPE", width: 15 },
      { header: "PEG Ratio", key: "pegRatio", width: 15 },
      { header: "Price To Sales", key: "priceToSales", width: 15 },
      { header: "Price To Book", key: "priceToBook", width: 15 },
      { header: "EV To Revenue", key: "evToRevenue", width: 15 },
      { header: "EV To EBITDA", key: "evToEBITDA", width: 15 },
      { header: "Previous Close", key: "statistics.previousClose", width: 15 },
      { header: "Open", key: "statistics.open", width: 15 },
      { header: "Bid", key: "statistics.bid", width: 15 },
      { header: "Ask", key: "statistics.ask", width: 15 },
      { header: "Day's Range", key: "statistics.daysRange", width: 15 },
      { header: "52 Week Range", key: "statistics.weekRange52", width: 15 },
      { header: "Volume", key: "statistics.volume", width: 15 },
      { header: "Avg Volume", key: "statistics.avgVolume", width: 15 },
      { header: "Beta", key: "statistics.beta", width: 15 },
      { header: "EPS", key: "statistics.eps", width: 15 },
      { header: "Earnings Date", key: "statistics.earningsDate", width: 15 },
      {
        header: "Forward Dividend & Yield",
        key: "statistics.forwardDividendYield",
        width: 15,
      },
      {
        header: "Ex Dividend Date",
        key: "statistics.exDividendDate",
        width: 15,
      },
      { header: "1y Target Est", key: "statistics.targetEst1y", width: 15 },
    ];

    worksheet.columns = columns;

    const rowsData = data.map((item) => {
      const { statistics, ...baseData } = item;
      return {
        ...baseData,
        ...Object.keys(statistics).reduce(
          (acc, key) => ({
            ...acc,
            [`statistics.${key}`]: statistics[key as keyof StockStatistics],
          }),
          {}
        ),
      };
    });

    worksheet.addRows(rowsData);
    worksheet.getRow(1).font = { bold: true };

    const marketCapNumericColumn = worksheet.getColumn("marketCapNumeric");
    marketCapNumericColumn.numFmt = "#,##0";

    const fileName = `valuation_data_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    await workbook.xlsx.writeFile(fileName);

    return fileName;
  }

  async scrapeValuationData(ticker: string): Promise<ValuationData | null> {
    try {
      return await Promise.race([
        this.scrapeWithTimeout(ticker),
        this.createTimeoutPromise(ticker),
      ]);
    } catch (error) {
      console.error(
        `Error scraping data for ${ticker}:`,
        (error as Error).message
      );
      return null;
    }
  }

  async getTickers(): Promise<string[]> {
    const content = await fs.readFile("tickers.txt", "utf-8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((ticker) => ticker.trim());
  }

  async close(): Promise<void> {
    const browser = this.page.context().browser();
    if (browser) {
      await browser.close();
    }
  }
}

async function main() {
  const scraper = await YahooFinanceScraper.create();
  await scraper.run();
}

process.on("unhandledRejection", (error: Error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

main();
