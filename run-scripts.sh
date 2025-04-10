#!/bin/bash
set -e

echo "🚀 Начинаем выполнение скриптов..."

# Запускаем фильтрацию дивидендных данных
echo "📊 Запуск фильтрации дивидендов..."
npm run filter-dividends
if [ $? -eq 0 ]; then
  echo "✅ Фильтрация дивидендов успешно завершена"
else
  echo "❌ Ошибка при фильтрации дивидендов"
  exit 1
fi

# Запускаем сбор данных с Yahoo Finance
echo "📈 Запуск сбора данных с Yahoo Finance..."
npm run scrape-yahoo
if [ $? -eq 0 ]; then
  echo "✅ Сбор данных с Yahoo Finance успешно завершен"
else
  echo "❌ Ошибка при сборе данных с Yahoo Finance"
  exit 1
fi

# Отправляем результаты в Telegram
echo "📤 Отправляем результаты в Telegram..."
# Компилируем TypeScript в JavaScript и запускаем
npx tsc send-to-telegram.ts --esModuleInterop --resolveJsonModule
node send-to-telegram.js
if [ $? -eq 0 ]; then
  echo "✅ Данные успешно отправлены в Telegram"
else
  echo "❌ Ошибка при отправке данных в Telegram"
  exit 1
fi

echo "🎉 Все задачи успешно выполнены!" 