# Инвестиционные скрипты

Этот проект содержит набор скриптов для анализа инвестиционных данных.

## Инструменты

### 1. Фильтр дивидендных компаний

Скрипт для фильтрации компаний из списка U.S. Dividend Champions по определенным критериям.

#### Критерии фильтрации

Скрипт отбирает компании, которые соответствуют следующим критериям:

1. Выплачивают дивиденды не менее 15 лет
2. Текущая дивидендная доходность не менее 2,5%
3. Выплачивают дивиденды не реже 4 раз в год
4. Рост дивидендов за последний год не менее 2%
5. Увеличивали дивиденды в последний год (проверка по дате ex-div)
6. Выплатили на дивиденды не более 70% от прибыли
7. Рыночная капитализация не менее 2 млрд долларов

#### Использование

```bash
# Запуск фильтра дивидендных компаний
npm run filter-dividends
```

Результаты фильтрации будут сохранены в файл `Filtered-Dividend-Champions.xlsx` в корневой директории проекта.

### 2. Скрапер Yahoo Finance

Скрипт для сбора данных о компаниях с сайта Yahoo Finance.

#### Функциональность

- Сбор данных о рыночной капитализации, мультипликаторах и других финансовых показателях
- Обработка данных и сохранение в Excel-файл
- Поддержка списка тикеров из файла tickers.txt

#### Использование

```bash
# Запуск скрапера Yahoo Finance
npm run scrape-yahoo
```

Результаты будут сохранены в файл `yahoo-finance-data.xlsx` в корневой директории проекта.

### 3. Отправка результатов в Telegram

Скрипт для отправки результатов анализа в Telegram канал.

#### Функциональность

- Отправка сообщения с сводкой результатов
- Отправка Excel-файла с полными результатами
- Поддержка форматирования сообщений и метаданных

#### Использование

```bash
# Отправка результатов в Telegram
npm run send-to-telegram
```

## Запуск в Docker

Проект настроен для последовательного запуска всех скриптов в Docker с последующей отправкой результатов в Telegram.

### Последовательность выполнения

1. Запуск `filter-dividends` - фильтрация дивидендных чемпионов
2. Запуск `scrape-yahoo` - получение данных с Yahoo Finance
3. Отправка результатов в Telegram-канал

### Предварительные требования

- Docker и Docker Compose
- Токен бота Telegram и ID канала (в файле `.env`)

### Настройка

1. Убедитесь, что файл `.env` содержит следующие переменные:

   ```
   TELEGRAM_BOT_TOKEN=ваш_токен_бота
   TELEGRAM_CHANNEL_ID=идентификатор_канала
   ```

2. Настройте права на выполнение скриптов:
   ```bash
   chmod +x run-docker.sh
   ```

### Запуск в Docker

Для запуска последовательности скриптов в Docker выполните:

```bash
./run-docker.sh
```

## Требования

- Node.js (версия 14 или выше)
- TypeScript
- Для фильтра дивидендных компаний: файл `U.S.DividendChampions-LIVE.xlsx` в корневой директории проекта
- Для скрапера Yahoo Finance: файл `tickers.txt` со списком тикеров в корневой директории проекта
- Для отправки в Telegram: переменные окружения в файле `.env`

## Установка

```bash
# Установка зависимостей
npm install
```

## Настройка параметров

### Фильтр дивидендных компаний

Вы можете изменить параметры фильтрации, отредактировав следующие константы в файле `dividend-filter.ts`:

```typescript
const MIN_YEARS = 15 // Минимальное количество лет выплаты дивидендов
const MIN_YIELD = 2.5 // Минимальная дивидендная доходность (%)
const MIN_PAYOUTS_PER_YEAR = 4 // Минимальное количество выплат в год
const MIN_DGR_1Y = 2 // Минимальный рост дивидендов за 1 год (%)
const MAX_PAYOUT_RATIO = 70 // Максимальный коэффициент выплат (%)
const MIN_MARKET_CAP = 2e9 // Минимальная рыночная капитализация (2 млрд)
```

## Структура проекта

- `dividend-filter.ts` - Скрипт для фильтрации дивидендных данных
- `yahoo-finance.ts` - Скрипт для получения данных с Yahoo Finance
- `send-to-telegram.ts` - Скрипт для отправки результатов в Telegram
- `utils/telegram.ts` - Утилита для работы с Telegram API
- `run-scripts.sh` - Скрипт для последовательного запуска в Docker
- `run-docker.sh` - Скрипт для сборки и запуска Docker-контейнера
- `Dockerfile` - Конфигурация Docker образа
- `docker-compose.yml` - Конфигурация Docker Compose
