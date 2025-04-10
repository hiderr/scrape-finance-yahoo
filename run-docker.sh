#!/bin/bash
set -e

echo "🐳 Сборка Docker-образа для скриптов..."
docker-compose build

echo "🚀 Запуск Docker-контейнера..."
docker-compose up

echo "✅ Выполнение завершено!" 