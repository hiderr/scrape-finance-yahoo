const { chromium } = require("playwright");
const fs = require("fs").promises;
const ExcelJS = require("exceljs");

const SELECTORS = {
  COOKIE_REJECT: 'button[name="reject"]',
  COOKIE_WIZARD: "div.con-wizard",
  DATE: ".asofdate",
  VALUATION_BASE: 'section[data-testid="valuation-measures"] li:nth-child',
  QUOTE_HEADER: 'div[data-test="qsp-header"]',
  QUOTE_PRICE: 'fin-streamer[data-test="qsp-price"]',
  VALUATION_SECTION: 'section[data-testid="valuation-measures"]',
};

const TIMEOUT_OPTIONS = {
  timeout: 15000,
  waitUntil: "domcontentloaded",
};

async function handleCookiePopup(page) {
  try {
    const rejectButton = await page.waitForSelector(
      SELECTORS.COOKIE_REJECT,
      TIMEOUT_OPTIONS
    );

    if (rejectButton) {
      await rejectButton.click();
      await page.waitForSelector(SELECTORS.COOKIE_WIZARD, {
        ...TIMEOUT_OPTIONS,
        state: "hidden",
      });
    }
  } catch {
    console.log("Cookie popup not found, continuing...");
  }
}

async function waitForPageLoad(page) {
  try {
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector(SELECTORS.VALUATION_SECTION, { timeout: 10000 });

    await page.waitForTimeout(2000);

    return true;
  } catch (error) {
    console.log(`Page load check failed: ${error.message}`);
    return false;
  }
}

async function getValuationMetric(page, index) {
  try {
    const element = await page.waitForSelector(
      `${SELECTORS.VALUATION_BASE}(${index}) .value`,
      { timeout: 5000 }
    );
    return element ? await element.textContent() : "N/A";
  } catch {
    return "N/A";
  }
}

async function scrapeValuationData(page, ticker) {
  try {
    await page.goto(
      `https://finance.yahoo.com/quote/${ticker}/`,
      TIMEOUT_OPTIONS
    );
    const isPageLoaded = await waitForPageLoad(page);

    if (!isPageLoaded) {
      console.log(`Failed to load page for ${ticker}, retrying...`);
      await page.reload();
      await waitForPageLoad(page);
    }

    const valuationSection = await page.$(SELECTORS.VALUATION_SECTION);
    if (!valuationSection) {
      console.log(`No valuation data available for ${ticker}, skipping...`);
      return null;
    }

    const data = {
      ticker,
      date: (await page.locator(SELECTORS.DATE).textContent()) || "N/A",
      marketCap: (await getValuationMetric(page, 1)) || "N/A",
      enterpriseValue: (await getValuationMetric(page, 2)) || "N/A",
      trailingPE: (await getValuationMetric(page, 3)) || "N/A",
      forwardPE: (await getValuationMetric(page, 4)) || "N/A",
      pegRatio: (await getValuationMetric(page, 5)) || "N/A",
      priceToSales: (await getValuationMetric(page, 6)) || "N/A",
      priceToBook: (await getValuationMetric(page, 7)) || "N/A",
      evToRevenue: (await getValuationMetric(page, 8)) || "N/A",
      evToEBITDA: (await getValuationMetric(page, 9)) || "N/A",
    };

    return data;
  } catch (error) {
    console.error(`Error scraping data for ${ticker}:`, error.message);
    return null;
  }
}

async function saveToExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Valuation Data");

  const columns = Object.keys(data[0]).map((key) => ({
    header:
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
    key,
    width: 15,
  }));

  worksheet.columns = columns;
  worksheet.addRows(data);
  worksheet.getRow(1).font = { bold: true };

  const fileName = `valuation_data_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;
  await workbook.xlsx.writeFile(fileName);

  return fileName;
}

async function getTickers() {
  const content = await fs.readFile("tickers.txt", "utf-8");
  return content
    .split("\n")
    .filter(Boolean)
    .map((ticker) => ticker.trim());
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });
  const page = await browser.newPage();

  try {
    const tickers = await getTickers();
    const results = [];

    await page.goto(`https://finance.yahoo.com/quote/${tickers[0]}/`);
    await handleCookiePopup(page);

    for (const ticker of tickers) {
      console.log(`Processing ticker: ${ticker}`);
      const data = await scrapeValuationData(page, ticker);

      if (data) {
        results.push(data);
      }
    }

    const fileName = await saveToExcel(results);
    console.log(`Data saved to file: ${fileName}`);
  } finally {
    await browser.close();
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
