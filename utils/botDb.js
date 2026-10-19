// Models for the Telegram bot's own database (repo Studyou-bot, db "sy-bot").
// BOT_DATABASE_CONNECT_LINK points to it; without it the site's cluster is reused with the db name BOT_DATABASE_NAME.
const mongoose = require('mongoose');

const BOT_DB_NAME = process.env.BOT_DATABASE_NAME || 'sy-bot';

const conn = process.env.BOT_DATABASE_CONNECT_LINK
  ? mongoose.createConnection(process.env.BOT_DATABASE_CONNECT_LINK, { dbName: BOT_DB_NAME })
  : mongoose.connection.useDb(BOT_DB_NAME, { useCache: true });

const timestamps = { createdAt: 'created_at', updatedAt: 'updated_at' };

const itemSchema = new mongoose.Schema({
  kind: { type: String, enum: ['text', 'photo', 'video', 'document'], required: true },
  text: { type: String, maxlength: 4096 },
  file_id: String,
  file_name: String,
  caption: { type: String, maxlength: 1024 }
}, { _id: false });

const buttonSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, default: null },
  label: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: ['menu', 'content', 'question'], required: true },
  message: { type: String, default: '', maxlength: 4096 },
  columns: { type: Number, default: 2, min: 1, max: 4 },
  items: { type: [itemSchema], default: [] },
  order: { type: Number, default: 0 },
  hidden: { type: Boolean, default: false }
}, { collection: 'bot_buttons', timestamps, versionKey: false });

const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'main' },
  start_message: String,
  main_message: String,
  main_columns: { type: Number, min: 1, max: 4 },
  back_label: String,
  unknown_message: String,
  question_thanks: String,
  answer_header: String,
  admin_chat_id: Number,
  seeded: Boolean
}, { collection: 'bot_settings', versionKey: false });

const subscriberSchema = new mongoose.Schema({
  chat_id: Number,
  first_name: String,
  last_name: String,
  username: String,
  started_at: Date,
  last_seen: Date,
  blocked: Boolean,
  menu_id: mongoose.Schema.Types.ObjectId,
  awaiting_question: Boolean
}, { collection: 'user_states', versionKey: false, strict: false });

const questionSchema = new mongoose.Schema({
  chat_id: Number,
  text: String,
  first_name: String,
  username: String,
  created_at: Date,
  answered: { type: Boolean, default: false },
  answer: String,
  answered_at: Date,
  admin_message_id: Number
}, { collection: 'bot_questions', versionKey: false });

const postSchema = new mongoose.Schema({
  items: { type: [itemSchema], default: [] },
  link_text: String,
  link_url: String,
  status: { type: String, enum: ['sending', 'done', 'failed'], default: 'sending' },
  total: { type: Number, default: 0 },
  sent: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  blocked: { type: Number, default: 0 },
  created_by: String,
  finished_at: Date,
  error: String
}, { collection: 'bot_posts', timestamps, versionKey: false });

module.exports = {
  BOT_DB_NAME,
  BotButton: conn.model('BotButton', buttonSchema),
  BotSettings: conn.model('BotSettings', settingsSchema),
  BotSubscriber: conn.model('BotSubscriber', subscriberSchema),
  BotQuestion: conn.model('BotQuestion', questionSchema),
  BotPost: conn.model('BotPost', postSchema)
};
