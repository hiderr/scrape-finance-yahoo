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

# Копируем скрипт для запуска
COPY run-scripts.sh ./
RUN chmod +x run-scripts.sh

# Значение по умолчанию для CRON_SCHEDULE (переопределяется из .env через docker-compose)
ENV CRON_SCHEDULE="0 9 * * 5"

# Создаем файл для логов
RUN touch /app/cron.log

# Команда для запуска cron и логирования
CMD bash -c 'echo "$CRON_SCHEDULE /app/run-scripts.sh >> /app/cron.log 2>&1" > /etc/cron.d/filter-dividend-champions && chmod 0644 /etc/cron.d/filter-dividend-champions && crontab /etc/cron.d/filter-dividend-champions && echo "Cron настроен с расписанием: $CRON_SCHEDULE" && cron && tail -f /app/cron.log' 