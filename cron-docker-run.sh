#!/bin/bash
# Скрипт для запуска docker-compose по cron

# Устанавливаем рабочую директорию
cd /root/work/tg-channels/filter-dividend-champions

# Задаем время начала для логов
START_TIME=$(date "+%Y-%m-%d %H:%M:%S")

# Лог-файл для вывода
LOG_FILE="./data/docker-cron.log"

# Создаем директорию для логов, если её нет
mkdir -p ./data

# Записываем время запуска в лог
echo "[$START_TIME] Запуск контейнера filter-dividend-champions" >> $LOG_FILE

# Запускаем контейнер
docker-compose up --force-recreate --no-deps

# Записываем окончание работы в лог
END_TIME=$(date "+%Y-%m-%d %H:%M:%S")
echo "[$END_TIME] Контейнер filter-dividend-champions завершил работу" >> $LOG_FILE

# Удаляем контейнер после завершения
docker-compose down
echo "[$END_TIME] Контейнер остановлен и удален" >> $LOG_FILE 