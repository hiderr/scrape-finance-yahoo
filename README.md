Yahoo Finance Scraper

Скрипт для автоматического сбора данных о валюационных метриках компаний с Yahoo Finance.

## ФУНКЦИОНАЛЬНОСТЬ

- Чтение тикеров компаний из файла
- Автоматический сбор данных с Yahoo Finance для каждого тикера
- Сохранение результатов в Excel файл
- Сбор следующих метрик:
  - Market Cap
  - Enterprise Value
  - Trailing P/E
  - Forward P/E
  - PEG Ratio
  - Price/Sales
  - Price/Book
  - EV/Revenue
  - EV/EBITDA

## УСТАНОВКА

1. Клонировать репозиторий:
   git clone <repository-url>

2. Перейти в директорию проекта:
   cd yahoo-finance-scraper

3. Установить зависимости:
   npm install

## ИСПОЛЬЗОВАНИЕ

1. Добавьте тикеры компаний в файл 'tickers.txt' (по одному тикеру на строку)
2. Запустите скрипт:
   node scraper.js
3. Результаты будут сохранены в файл 'valuation_data_YYYY-MM-DD.xlsx'

## СТРУКТУРА ПРОЕКТА

- scraper.js - основной скрипт для сбора данных
- tickers.txt - файл со списком тикеров
- package.json - файл с зависимостями проекта
- .gitignore - список игнорируемых файлов для Git

## ЗАВИСИМОСТИ

- Playwright - для автоматизации браузера
- ExcelJS - для работы с Excel файлами

## ЛИЦЕНЗИЯ

ISC
