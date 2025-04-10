import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import FormData from 'form-data'

export class TelegramService {
  private readonly botToken: string
  private readonly channelId: string
  private readonly baseUrl: string

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const channelId = process.env.TELEGRAM_CHANNEL_ID

    if (!botToken || !channelId) {
      throw new Error('TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID должны быть указаны в .env файле')
    }

    this.botToken = botToken
    this.channelId = channelId
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  /**
   * Отправляет текстовое сообщение в канал
   */
  async sendMessage(text: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.channelId,
        text,
        parse_mode: 'HTML'
      })
      console.log('Сообщение успешно отправлено в Telegram')
    } catch (error) {
      console.error('Ошибка при отправке сообщения в Telegram:', error)
      throw error
    }
  }

  /**
   * Отправляет файл в канал
   */
  async sendFile(filePath: string, caption?: string): Promise<void> {
    try {
      console.log(`Отправляем файл ${filePath} в Telegram...`)

      if (!fs.existsSync(filePath)) {
        throw new Error(`Файл не найден: ${filePath}`)
      }

      const stats = fs.statSync(filePath)
      if (stats.size > 50 * 1024 * 1024) {
        throw new Error('Файл слишком большой (более 50 МБ)')
      }

      const fileName = path.basename(filePath)
      const form = new FormData()

      form.append('chat_id', this.channelId)
      if (caption) {
        form.append('caption', caption)
      }

      // Добавляем файл в форму
      form.append('document', fs.createReadStream(filePath), {
        filename: fileName,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Отправляем запрос с form-data
      const response = await axios.post(`${this.baseUrl}/sendDocument`, form, {
        headers: {
          ...form.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data && response.data.ok) {
        console.log(`Файл ${fileName} успешно отправлен в Telegram`)
      } else {
        throw new Error(`Ошибка при отправке файла: ${JSON.stringify(response.data)}`)
      }
    } catch (error) {
      console.error('Ошибка при отправке файла в Telegram:', error)
      throw error
    }
  }
}
