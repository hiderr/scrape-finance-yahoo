FROM --platform=$BUILDPLATFORM node:18-slim

# Установка cron, tzdata для работы с часовыми поясами и базовых утилит
RUN apt-get update && apt-get install -y cron tzdata && rm -rf /var/lib/apt/lists/*

# Устанавливаем временную зону Europe/Berlin для CET/CEST
RUN ln -fs /usr/share/zoneinfo/Europe/Berlin /etc/localtime && dpkg-reconfigure -f noninteractive tzdata

WORKDIR /app

# Копируем сначала package.json и package-lock.json
COPY package*.json ./
RUN npm install

# Копируем конфигурационные файлы
COPY tsconfig.json ./

# Копируем все исходные файлы
COPY *.ts ./
COPY types/ ./types/
COPY utils/ ./utils/
COPY constants/ ./constants/

# Создаем скрипт для запуска
COPY run-scripts.sh ./
RUN chmod +x run-scripts.sh

# Создаем cron-задачу для запуска скрипта каждую пятницу в 9:00 утра
RUN echo "0 9 * * 5 /app/run-scripts.sh >> /var/log/cron.log 2>&1" > /etc/cron.d/filter-dividend-champions
RUN chmod 0644 /etc/cron.d/filter-dividend-champions
RUN crontab /etc/cron.d/filter-dividend-champions

# Создаем файл для логов
RUN touch /var/log/cron.log

# Запускаем cron в фоновом режиме и запускаем tail для вывода логов
CMD cron && tail -f /var/log/cron.log 