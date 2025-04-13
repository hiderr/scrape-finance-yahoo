FROM --platform=$BUILDPLATFORM node:18-slim

# Установка tzdata для работы с часовыми поясами
RUN apt-get update && apt-get install -y tzdata && rm -rf /var/lib/apt/lists/*

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

# Создаем директорию для данных
RUN mkdir -p /app/data

# Команда для запуска скрипта (запускается один раз и завершает работу)
CMD ["/bin/bash", "/app/run-scripts.sh"] 