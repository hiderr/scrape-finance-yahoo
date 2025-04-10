FROM --platform=$BUILDPLATFORM node:18-slim

WORKDIR /app

# Копируем сначала package.json и package-lock.json
COPY package*.json ./
RUN npm install

# Копируем конфигурационные файлы
COPY tsconfig.json ./
COPY .env ./

# Копируем все исходные файлы
COPY *.ts ./
COPY tickers.txt ./
COPY U.S.DividendChampions-LIVE.xlsx ./
COPY types/ ./types/
COPY utils/ ./utils/
COPY constants/ ./constants/

# Создаем скрипт для запуска
COPY run-scripts.sh ./
RUN chmod +x run-scripts.sh

# Запускаем скрипты
CMD ["./run-scripts.sh"] 