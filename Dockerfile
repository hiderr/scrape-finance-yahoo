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

# Создаем файл для настройки cron
RUN echo "#!/bin/bash\n\
CRON_SCHEDULE=\${CRON_SCHEDULE:-\"0 9 * * 5\"}\n\
echo \"\$CRON_SCHEDULE /app/run-scripts.sh >> /app/cron.log 2>&1\" > /etc/cron.d/filter-dividend-champions\n\
chmod 0644 /etc/cron.d/filter-dividend-champions\n\
crontab /etc/cron.d/filter-dividend-champions\n\
echo \"Cron настроен с расписанием: \$CRON_SCHEDULE\"\n\
cron\n\
tail -f /app/cron.log\n" > /app/start.sh
RUN chmod +x /app/start.sh

# Устанавливаем значение по умолчанию
ENV CRON_SCHEDULE="0 9 * * 5"

# Запускаем скрипт настройки cron и мониторинга логов
CMD ["/app/start.sh"] 