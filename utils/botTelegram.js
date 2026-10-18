// Telegram Bot API calls for the bot admin page (BOT_TOKEN = token of the Studyou bot).
const AppError = require('./AppError');

const api = method => `${process.env.BOT_API_URL || 'https://api.telegram.org'}/bot${process.env.BOT_TOKEN}/${method}`;

class TelegramError extends Error {
  constructor(data) {
    super(`Telegram: ${data.description}`);
    this.code = data.error_code;
    this.retryAfter = data.parameters?.retry_after;
  }
}

const parse = async res => {
  const data = await res.json();
  if(!data.ok) throw new TelegramError(data);
  return data.result;
};

const ensureToken = () => {
  if(!process.env.BOT_TOKEN) throw new AppError('Validation Error: لم يتم ضبط BOT_TOKEN على السيرفر', 500, 'message');
};

exports.TelegramError = TelegramError;

exports.call = async (method, body) => {
  ensureToken();
  return parse(await fetch(api(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }));
};

const UPLOAD = {
  photo: ['sendPhoto', 'photo'],
  video: ['sendVideo', 'video'],
  document: ['sendDocument', 'document']
};

// Telegram only keeps files that were sent to a chat: send it to the admin chat, keep the file_id, delete the message.
exports.uploadFile = async (kind, file, chatId) => {
  ensureToken();
  const [method, field] = UPLOAD[kind];
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append(field, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  const message = await parse(await fetch(api(method), { method: 'POST', body: form }));

  const media = kind === 'photo' ? message.photo?.[message.photo.length - 1] : (message[field] || message.document || message.animation);
  if(!media) throw new AppError('Validation Error: لم يقبل تيليغرام هذا الملف', 400, 'message');
  exports.call('deleteMessage', { chat_id: chatId, message_id: message.message_id }).catch(() => {});
  return { file_id: media.file_id, file_name: file.originalname };
};

const SEND = {
  text: item => ['sendMessage', { text: item.text }],
  photo: item => ['sendPhoto', { photo: item.file_id, caption: item.caption || undefined }],
  video: item => ['sendVideo', { video: item.file_id, caption: item.caption || undefined }],
  document: item => ['sendDocument', { document: item.file_id, caption: item.caption || undefined }]
};

// sends a list of items as separate messages; the link button (inline) goes under the last one
exports.sendItems = async (chatId, items, replyMarkup) => {
  for(let i = 0; i < items.length; i++) {
    const [method, body] = SEND[items[i].kind](items[i]);
    if(i === items.length - 1 && replyMarkup) body.reply_markup = replyMarkup;
    await exports.call(method, { chat_id: chatId, ...body });
  }
};
