import { TelegramService } from './utils/telegram'
import * as fs from 'fs'
import { format } from 'date-fns'

// Убедимся, что мы находимся в правильной директории
const checkAndFixPaths = (): string => {
  const possiblePaths = [
    './yahoo-finance-data.xlsx',
    '/app/yahoo-finance-data.xlsx',
    '/app/data/yahoo-finance-data.xlsx'
  ]
  let foundPath = ''

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      foundPath = path
      console.log(`Найден файл по пути: ${path}`)
      break
    }
  }

  if (!foundPath) {
    throw new Error('Файл yahoo-finance-data.xlsx не найден ни в одном из ожидаемых мест')
  }

  return foundPath
}

async function main(): Promise<void> {
  try {
    console.log('Запуск отправки данных в Telegram...')

    // Проверяем и находим файл
    const fileName = checkAndFixPaths()

    // Получаем статистику по файлу
    const stats = fs.statSync(fileName)
    const fileSize = (stats.size / 1024 / 1024).toFixed(2) // размер в МБ

    // Форматируем дату
    const currentDate = format(new Date(), 'dd.MM.yyyy HH:mm')

    // Формируем сообщение
    const caption = `📊 Анализ дивидендных данных от ${currentDate}\nРазмер файла: ${fileSize} МБ`

    // Отправляем файл в Telegram
    const telegramService = new TelegramService()
    await telegramService.sendMessage(
      `🤖 Завершена автоматическая обработка данных дивидендов\n📅 Дата: ${currentDate}`
    )
    await telegramService.sendFile(fileName, caption)

    console.log('Данные успешно отправлены в Telegram')
  } catch (error) {
    console.error('Ошибка при отправке данных в Telegram:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Необработанная ошибка:', error)
  process.exit(1)
})
