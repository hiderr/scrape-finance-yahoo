const { chromium } = require("playwright");
const fs = require("fs");
const ExcelJS = require("exceljs");

async function scrapeValuationData(ticker) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`https://finance.yahoo.com/quote/${ticker}/`, {
      waitUntil: "networkidle",
    });

    const data = {
      ticker,
      date: await page.locator(".asofdate").textContent(),
      marketCap: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(1) .value'
        )
        .textContent(),
      enterpriseValue: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(2) .value'
        )
        .textContent(),
      trailingPE: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(3) .value'
        )
        .textContent(),
      forwardPE: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(4) .value'
        )
        .textContent(),
      pegRatio: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(5) .value'
        )
        .textContent(),
      priceToSales: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(6) .value'
        )
        .textContent(),
      priceToBook: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(7) .value'
        )
        .textContent(),
      evToRevenue: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(8) .value'
        )
        .textContent(),
      evToEBITDA: await page
        .locator(
          'section[data-testid="valuation-measures"] li:nth-child(9) .value'
        )
        .textContent(),
    };

    return data;
  } catch (error) {
    console.error(`Ошибка при сборе данных для ${ticker}:`, error);
    return null;
  } finally {
    await browser.close();
  }
}

async function saveToExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Valuation Data");

  // Определяем заголовки
  worksheet.columns = [
    { header: "Ticker", key: "ticker" },
    { header: "Date", key: "date" },
    { header: "Market Cap", key: "marketCap" },
    { header: "Enterprise Value", key: "enterpriseValue" },
    { header: "Trailing P/E", key: "trailingPE" },
    { header: "Forward P/E", key: "forwardPE" },
    { header: "PEG Ratio", key: "pegRatio" },
    { header: "Price/Sales", key: "priceToSales" },
    { header: "Price/Book", key: "priceToBook" },
    { header: "EV/Revenue", key: "evToRevenue" },
    { header: "EV/EBITDA", key: "evToEBITDA" },
  ];

  // Добавляем данные
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Форматируем заголовки
  worksheet.getRow(1).font = { bold: true };
  worksheet.columns.forEach((column) => {
    column.width = 15;
  });

  const fileName = `valuation_data_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;
  await workbook.xlsx.writeFile(fileName);

  return fileName;
}

async function main() {
  const tickers = fs
    .readFileSync("tickers.txt", "utf-8")
    .split("\n")
    .filter(Boolean);
  const results = [];

  for (const ticker of tickers) {
    console.log(`Обработка тикера: ${ticker}`);
    const data = await scrapeValuationData(ticker.trim());

    if (data) {
      results.push(data);
    }
  }

  const fileName = await saveToExcel(results);
  console.log(`Данные сохранены в файл: ${fileName}`);
}

main().catch(console.error);
