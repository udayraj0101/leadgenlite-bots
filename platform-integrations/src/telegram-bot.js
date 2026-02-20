require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = process.env.TELEGRAM_BOT_TOKEN || '8522658409:AAEC0C_10KjDm71XxwmMA2ijIjNNAXaQrLw';
const API_BASE = process.env.PLATFORM_API_URL || 'http://localhost:3002';

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram bot started...');

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  const userId = `telegram_${chatId}`;

  console.log(`\n📨 Telegram Message - ChatID: ${chatId}, Message: ${messageText}`);

  if (messageText === '/start') {
    return bot.sendMessage(chatId, '👋 Welcome to LeadgenLite! How can I help you today?');
  }

  try {
    const platformData = {
      chat_id: chatId,
      username: msg.from.username || null,
      first_name: msg.from.first_name || null,
      last_name: msg.from.last_name || null,
      language_code: msg.from.language_code || null,
      is_bot: msg.from.is_bot || false,
      message_id: msg.message_id,
      date: msg.date
    };

    const response = await axios.post(`${API_BASE}/api/chat`, {
      user_id: userId,
      message: messageText,
      platform: 'telegram',
      platform_data: platformData
    });

    console.log(`✅ Response: ${response.data.response}`);
    bot.sendMessage(chatId, response.data.response);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    bot.sendMessage(chatId, '❌ Sorry, I encountered an error. Please try again.');
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});
