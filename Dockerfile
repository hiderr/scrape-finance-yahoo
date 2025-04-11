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

# Создаем файл для логов
RUN touch /app/cron.log

# Создаем скрипт для настройки и запуска cron
COPY <<-"EOF" /app/entrypoint.sh
#!/bin/bash
DEFAULT_SCHEDULE="0 9 * * 5"
FINAL_SCHEDULE="${CRON_SCHEDULE:-$DEFAULT_SCHEDULE}"

# Удаляем кавычки из значения, если они есть
FINAL_SCHEDULE=$(echo "$FINAL_SCHEDULE" | tr -d '"'"'"')

echo "Используется расписание: $FINAL_SCHEDULE (из переменной окружения или значение по умолчанию)"
echo "$FINAL_SCHEDULE /app/run-scripts.sh >> /app/cron.log 2>&1" > /etc/cron.d/filter-dividend-champions
chmod 0644 /etc/cron.d/filter-dividend-champions
crontab /etc/cron.d/filter-dividend-champions
echo "Cron настроен с расписанием: $FINAL_SCHEDULE"
cron
tail -f /app/cron.log
EOF

RUN chmod +x /app/entrypoint.sh

# Команда для запуска cron и логирования
CMD ["/app/entrypoint.sh"] 