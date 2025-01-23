Yahoo Finance Scraper

Script for automatic collection of company valuation metrics from Yahoo Finance.

## FUNCTIONALITY

- Reading company tickers from file
- Automatic data collection from Yahoo Finance for each ticker
- Saving results to Excel file
- Collection of the following metrics:
  - Market Cap
  - Enterprise Value
  - Trailing P/E
  - Forward P/E
  - PEG Ratio
  - Price/Sales
  - Price/Book
  - EV/Revenue
  - EV/EBITDA

## INSTALLATION

1. Clone repository:
   git clone <repository-url>

2. Navigate to project directory:
   cd yahoo-finance-scraper

3. Install dependencies:
   npm install

## USAGE

1. Add company tickers to 'tickers.txt' file (one ticker per line)
2. Run the script:
   node scraper.js
3. Results will be saved to 'valuation_data_YYYY-MM-DD.xlsx'

## PROJECT STRUCTURE

- scraper.js - main script for data collection
- tickers.txt - file with list of tickers
- package.json - project dependencies file
- .gitignore - list of ignored files for Git

## DEPENDENCIES

- Playwright - for browser automation
- ExcelJS - for Excel file operations

## LICENSE

ISC
