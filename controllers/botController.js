// Admin control of the Telegram bot (repo Studyou-bot): menus/buttons, posts to all subscribers, questions, settings.
const multer = require('multer');
const mongoose = require('mongoose');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const telegram = require('./../utils/botTelegram');
const { BotButton, BotSettings, BotSubscriber, BotQuestion, BotPost } = require('./../utils/botDb');

const DEFAULT_SETTINGS = {
  start_message: 'الصفحة الرئيسية',
  main_message: 'الصفحة الرئيسية',
  main_columns: 2,
  back_label: '🔙 العودة الى الخلف',
  unknown_message: 'اختر من الأزرار في الأسفل 👇',
  question_thanks: 'تم إيصال رسالتك إلى الفريق العلمي, سيتم الرد في أقرب وقت ممكن.',
  answer_header: 'ردا على سؤالك:',
  admin_chat_id: 7399110187,
  stats_description: '👥 {total} مشترك · {active} نشط هذا الشهر'
};
const SETTING_TEXTS = ['start_message', 'main_message', 'back_label', 'unknown_message', 'question_thanks', 'answer_header'];
const ITEM_KINDS = ['text', 'photo', 'video', 'document'];
const MAX_ITEMS = 10;
const SEND_DELAY_MS = 45; // stays under Telegram's ~30 messages/second

const fail = msg => new AppError(msg, 400, 'message');
const sleep = ms => new Promise(r => setTimeout(r, ms));
// xssClean turns "<" into "&lt;" in every body; bot messages are plain text, so undo it
const text = (value, max) => String(value ?? '').replace(/&lt;/g, '<').trim().slice(0, max);
const escapeHtml = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isId = id => mongoose.isValidObjectId(id);

const getSettings = async () => ({ ...DEFAULT_SETTINGS, ...((await BotSettings.findById('main').lean()) || {}) });

const cleanItems = items => {
  if(!Array.isArray(items)) throw fail('محتوى غير صالح');
  if(items.length > MAX_ITEMS) throw fail(`الحد الأقصى ${MAX_ITEMS} رسائل`);
  return items.map(item => {
    if(!ITEM_KINDS.includes(item?.kind)) throw fail('نوع رسالة غير صالح');
    if(item.kind === 'text') {
      const body = text(item.text, 4096);
      if(!body) throw fail('لا يمكن إرسال رسالة نصية فارغة');
      return { kind: 'text', text: body };
    }
    const fileId = text(item.file_id, 300);
    if(!fileId) throw fail('ارفع الملف قبل الحفظ');
    return { kind: item.kind, file_id: fileId, file_name: text(item.file_name, 200), caption: text(item.caption, 1024) };
  });
};

// ---------- overview ----------

exports.getOverview = catchAsync(async (req, res) => {
  const [settings, subscribers, blocked, openQuestions, buttons] = await Promise.all([
    getSettings(),
    BotSubscriber.countDocuments({ blocked: { $ne: true } }),
    BotSubscriber.countDocuments({ blocked: true }),
    BotQuestion.countDocuments({ answered: { $ne: true } }),
    BotButton.countDocuments()
  ]);
  res.status(200).json({
    status: 'success',
    data: { settings, subscribers, blocked, openQuestions, buttons, tokenSet: !!process.env.BOT_TOKEN }
  });
});

// ---------- buttons ----------

exports.getButtons = catchAsync(async (req, res) => {
  const buttons = await BotButton.find().sort({ order: 1, _id: 1 }).lean();
  res.status(200).json({ status: 'success', data: { buttons } });
});

const findMenu = async parent => {
  if(parent === null || parent === undefined || parent === '') return null;
  if(!isId(parent)) throw fail('القائمة غير موجودة');
  const menu = await BotButton.findById(parent);
  if(!menu || menu.type !== 'menu') throw fail('القائمة غير موجودة');
  return menu;
};

const checkLabel = async (label, parentId, exceptId) => {
  if(!label) throw fail('اكتب اسم الزر');
  const settings = await getSettings();
  if(label === settings.back_label) throw fail('هذا الاسم محجوز لزر الرجوع');
  const same = await BotButton.findOne({ parent: parentId, label, _id: { $ne: exceptId } });
  if(same) throw fail('يوجد زر بنفس الاسم في هذه القائمة');
};

const buttonFields = (body, type) => {
  const fields = { type, message: text(body.message, 4096), hidden: !!body.hidden };
  if(type === 'menu') fields.columns = Math.min(Math.max(parseInt(body.columns, 10) || 2, 1), 4);
  fields.items = type === 'content' ? cleanItems(body.items || []) : [];
  if(type === 'content' && !fields.items.length) throw fail('أضف رسالة واحدة على الأقل');
  return fields;
};

exports.createButton = catchAsync(async (req, res) => {
  const type = req.body.type;
  if(!['menu', 'content', 'question'].includes(type)) throw fail('نوع الزر غير صالح');
  const menu = await findMenu(req.body.parent);
  const parent = menu ? menu._id : null;
  const label = text(req.body.label, 120);
  await checkLabel(label, parent);

  const last = await BotButton.findOne({ parent }).sort({ order: -1 });
  const button = await BotButton.create({ ...buttonFields(req.body, type), parent, label, order: last ? last.order + 1 : 0 });
  res.status(201).json({ status: 'success', message: 'تمت إضافة الزر', data: { button } });
});

exports.updateButton = catchAsync(async (req, res) => {
  if(!isId(req.params.id)) throw fail('الزر غير موجود');
  const button = await BotButton.findById(req.params.id);
  if(!button) throw fail('الزر غير موجود');

  const type = req.body.type || button.type;
  if(!['menu', 'content', 'question'].includes(type)) throw fail('نوع الزر غير صالح');
  if(button.type === 'menu' && type !== 'menu' && await BotButton.exists({ parent: button._id }))
    throw fail('احذف الأزرار داخل هذه القائمة أولاً');

  const label = text(req.body.label ?? button.label, 120);
  await checkLabel(label, button.parent, button._id);

  Object.assign(button, buttonFields({ ...button.toObject(), ...req.body }, type), { label });
  await button.save();
  res.status(200).json({ status: 'success', message: 'تم حفظ التعديلات', data: { button } });
});

const subtreeIds = async rootId => {
  const ids = [rootId];
  for(let level = [rootId]; level.length;) {
    level = (await BotButton.find({ parent: { $in: level } }).select('_id').lean()).map(b => b._id);
    ids.push(...level);
  }
  return ids;
};

exports.deleteButton = catchAsync(async (req, res) => {
  if(!isId(req.params.id)) throw fail('الزر غير موجود');
  const button = await BotButton.findById(req.params.id);
  if(!button) throw fail('الزر غير موجود');
  const ids = await subtreeIds(button._id);
  await BotButton.deleteMany({ _id: { $in: ids } });
  res.status(200).json({ status: 'success', message: ids.length > 1 ? `تم حذف القائمة و${ids.length - 1} زر داخلها` : 'تم حذف الزر' });
});

// body: { parent, ids: [buttonId in the new order] }
exports.reorderButtons = catchAsync(async (req, res) => {
  const menu = await findMenu(req.body.parent);
  const parent = menu ? menu._id : null;
  const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(isId) : [];
  const siblings = await BotButton.find({ parent }).select('_id').lean();
  if(ids.length !== siblings.length || !siblings.every(s => ids.includes(String(s._id)))) throw fail('ترتيب غير صالح، حدّث الصفحة');
  await BotButton.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { order } } })));
  res.status(200).json({ status: 'success', message: 'تم حفظ الترتيب' });
});

// body: { parent } — moves the button (and everything inside it) to another menu
exports.moveButton = catchAsync(async (req, res) => {
  if(!isId(req.params.id)) throw fail('الزر غير موجود');
  const button = await BotButton.findById(req.params.id);
  if(!button) throw fail('الزر غير موجود');
  const menu = await findMenu(req.body.parent);
  const parent = menu ? menu._id : null;
  if(parent && (await subtreeIds(button._id)).some(id => id.equals(parent))) throw fail('لا يمكن نقل القائمة إلى داخل نفسها');
  await checkLabel(button.label, parent, button._id);

  const last = await BotButton.findOne({ parent, _id: { $ne: button._id } }).sort({ order: -1 });
  button.parent = parent;
  button.order = last ? last.order + 1 : 0;
  await button.save();
  res.status(200).json({ status: 'success', message: 'تم نقل الزر' });
});

// ---------- files ----------

const MAX_FILE_MB = 50; // Bot API upload limit

exports.uploadMiddleware = (req, res, next) => multer({
  storage: multer.memoryStorage(),
  defParamCharset: 'utf8',
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 1, fields: 3 }
}).single('file')(req, res, err => {
  if(err instanceof multer.MulterError)
    return next(fail(err.code === 'LIMIT_FILE_SIZE' ? `حجم الملف يجب ألا يتجاوز ${MAX_FILE_MB}MB` : 'طلب رفع غير صحيح'));
  next(err);
});

exports.uploadFile = catchAsync(async (req, res) => {
  const kind = req.body?.kind;
  if(!['photo', 'video', 'document'].includes(kind)) throw fail('نوع الملف غير صالح');
  if(!req.file) throw fail('اختر ملفاً');
  const { admin_chat_id } = await getSettings();
  if(!admin_chat_id) throw fail('حدد حساب الإدارة في الإعدادات أولاً');
  try {
    const file = await telegram.uploadFile(kind, req.file, admin_chat_id);
    res.status(200).json({ status: 'success', data: file });
  } catch(err) {
    if(err instanceof telegram.TelegramError) throw fail(`تعذر رفع الملف إلى تيليغرام (${err.message.replace('Telegram: ', '')})`);
    throw err;
  }
});

// ---------- settings ----------

exports.getSettings = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', data: { settings: await getSettings() } });
});

const refreshDescription = async template => {
  let description = '';
  if(template) {
    const [total, active] = await Promise.all([
      BotSubscriber.countDocuments({ chat_id: { $ne: null }, blocked: { $ne: true } }),
      BotSubscriber.countDocuments({ active_months: new Date().toISOString().slice(0, 7) })
    ]);
    description = template.replace(/\{total\}/g, total.toLocaleString('en-US'))
      .replace(/\{active\}/g, active.toLocaleString('en-US')).slice(0, 120);
  }
  await telegram.call('setMyShortDescription', { short_description: description });
  await BotSettings.updateOne({ _id: 'main' }, { description_updated_at: new Date() });
};

exports.updateSettings = catchAsync(async (req, res) => {
  const update = {};
  SETTING_TEXTS.forEach(key => {
    if(req.body[key] === undefined) return;
    update[key] = text(req.body[key], key === 'back_label' ? 120 : 4096);
    if(!update[key]) throw fail('لا يمكن ترك النصوص فارغة');
  });
  if(req.body.main_columns !== undefined) update.main_columns = Math.min(Math.max(parseInt(req.body.main_columns, 10) || 2, 1), 4);
  if(req.body.admin_chat_id !== undefined) {
    const chatId = Number(String(req.body.admin_chat_id).trim());
    if(!Number.isSafeInteger(chatId) || chatId === 0) throw fail('رقم حساب الإدارة غير صالح');
    update.admin_chat_id = chatId;
  }
  if(req.body.stats_description !== undefined) update.stats_description = text(req.body.stats_description, 120);
  if(update.back_label && await BotButton.exists({ label: update.back_label })) throw fail('يوجد زر بنفس اسم زر الرجوع');
  const settings = await BotSettings.findByIdAndUpdate('main', { $set: update }, { new: true, upsert: true, lean: true });
  let message = 'تم حفظ الإعدادات';
  if(update.stats_description !== undefined) {
    try {
      await refreshDescription(update.stats_description);
    } catch(err) {
      message = `تم حفظ الإعدادات، لكن تعذر تحديث وصف البوت: ${err.message}`;
    }
  }
  res.status(200).json({ status: 'success', message, data: { settings: { ...DEFAULT_SETTINGS, ...settings } } });
});

// ---------- subscribers ----------

const PAGE_SIZE = 50;

const countByMonth = async pipeline => {
  const rows = await BotSubscriber.aggregate([...pipeline, { $group: { _id: '$month', n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map(r => [r._id, r.n]));
};
const dateMonth = field => [
  { $match: { [field]: { $type: 'date' } } },
  { $project: { month: { $dateToString: { format: '%Y-%m', date: `$${field}` } } } }
];

exports.getMonthlyStats = catchAsync(async (req, res) => {
  const [active, added] = await Promise.all([
    countByMonth([{ $unwind: '$active_months' }, { $project: { month: '$active_months' } }]),
    countByMonth(dateMonth('started_at'))
  ]);
  const months = [...new Set([...Object.keys(active), ...Object.keys(added)])]
    .sort().reverse().slice(0, 12)
    .map(month => ({ month, active: active[month] || 0, new: added[month] || 0 }));
  res.status(200).json({ status: 'success', data: { months } });
});

exports.getSubscribers = catchAsync(async (req, res) => {
  const filter = { chat_id: { $ne: null } };
  const q = text(req.query.q, 60);
  if(q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ first_name: re }, { last_name: re }, { username: re }];
    if(/^-?\d+$/.test(q)) filter.$or.push({ chat_id: Number(q) });
  }
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const [subscribers, total] = await Promise.all([
    BotSubscriber.find(filter).select('chat_id first_name last_name username started_at last_seen blocked')
      .sort({ last_seen: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    BotSubscriber.countDocuments(filter)
  ]);
  res.status(200).json({ status: 'success', data: { subscribers, total, page, pages: Math.max(Math.ceil(total / PAGE_SIZE), 1) } });
});

// ---------- questions ----------

exports.getQuestions = catchAsync(async (req, res) => {
  const filter = req.query.status === 'answered' ? { answered: true } : req.query.status === 'all' ? {} : { answered: { $ne: true } };
  const questions = await BotQuestion.find(filter).sort({ created_at: -1 }).limit(100).lean();
  res.status(200).json({ status: 'success', data: { questions } });
});

exports.answerQuestion = catchAsync(async (req, res) => {
  if(!isId(req.params.id)) throw fail('السؤال غير موجود');
  const question = await BotQuestion.findById(req.params.id);
  if(!question) throw fail('السؤال غير موجود');
  const answer = text(req.body.answer, 3500);
  if(!answer) throw fail('اكتب الرد أولاً');

  const settings = await getSettings();
  try {
    await telegram.call('sendMessage', { chat_id: question.chat_id, text: `${settings.answer_header}\n${question.text}\n-----------\n${answer}` });
  } catch(err) {
    if(err instanceof telegram.TelegramError) throw fail(err.code === 403 ? 'الطالب أوقف البوت، لا يمكن إرسال الرد' : 'تعذر إرسال الرد عبر تيليغرام');
    throw err;
  }
  // cross the question out in the admin chat, like a reply sent from Telegram
  if(question.admin_message_id && settings.admin_chat_id) {
    telegram.call('editMessageText', {
      chat_id: settings.admin_chat_id,
      message_id: question.admin_message_id,
      text: `<s>${escapeHtml(`${question.chat_id}\n${question.text}`)}</s>`,
      parse_mode: 'HTML'
    }).catch(() => {});
  }
  Object.assign(question, { answered: true, answer, answered_at: new Date() });
  await question.save();
  res.status(200).json({ status: 'success', message: 'تم إرسال الرد', data: { question } });
});

exports.deleteQuestion = catchAsync(async (req, res) => {
  if(!isId(req.params.id)) throw fail('السؤال غير موجود');
  await BotQuestion.deleteOne({ _id: req.params.id });
  res.status(200).json({ status: 'success', message: 'تم حذف السؤال' });
});

// ---------- posts (broadcast) ----------

const postMarkup = post => post.link_text && post.link_url
  ? { inline_keyboard: [[{ text: post.link_text, url: post.link_url }]] }
  : undefined;

const cleanPost = body => {
  const items = cleanItems(body.items || []);
  if(!items.length) throw fail('اكتب المنشور أولاً');
  const linkText = text(body.link_text, 60);
  const linkUrl = text(body.link_url, 500);
  if(!!linkText !== !!linkUrl) throw fail('اكتب نص الرابط والرابط معاً');
  if(linkUrl && !/^https?:\/\/\S+$/i.test(linkUrl)) throw fail('الرابط يجب أن يبدأ بـ https://');
  return { items, link_text: linkText, link_url: linkUrl };
};

const sendWithRetry = async (chatId, post) => {
  for(let attempt = 0; ; attempt++) {
    try {
      return await telegram.sendItems(chatId, post.items, postMarkup(post));
    } catch(err) {
      if(err instanceof telegram.TelegramError && err.code === 429 && attempt < 3) {
        await sleep((err.retryAfter || 1) * 1000 + 200);
        continue;
      }
      throw err;
    }
  }
};

const runPost = async post => {
  const chatIds = await BotSubscriber.find({ blocked: { $ne: true }, chat_id: { $ne: null } }).distinct('chat_id');
  const counts = { total: chatIds.length, sent: 0, failed: 0, blocked: 0 };
  await BotPost.updateOne({ _id: post._id }, { total: counts.total });

  for(let i = 0; i < chatIds.length; i++) {
    try {
      await sendWithRetry(chatIds[i], post);
      counts.sent++;
    } catch(err) {
      if(err instanceof telegram.TelegramError && err.code === 403) {
        counts.blocked++;
        await BotSubscriber.updateOne({ chat_id: chatIds[i] }, { blocked: true, blocked_at: new Date() });
      } else counts.failed++;
    }
    if(i % 10 === 9) await BotPost.updateOne({ _id: post._id }, counts);
    await sleep(SEND_DELAY_MS * post.items.length);
  }
  await BotPost.updateOne({ _id: post._id }, { ...counts, status: 'done', finished_at: new Date() });
};

exports.getPosts = catchAsync(async (req, res) => {
  const posts = await BotPost.find().sort({ created_at: -1 }).limit(30).lean();
  res.status(200).json({ status: 'success', data: { posts } });
});

exports.createPost = catchAsync(async (req, res) => {
  if(!process.env.BOT_TOKEN) throw fail('لم يتم ضبط BOT_TOKEN على السيرفر');
  if(await BotPost.exists({ status: 'sending', updated_at: { $gt: new Date(Date.now() - 5 * 60 * 1000) } }))
    throw fail('يوجد منشور قيد الإرسال، انتظر حتى ينتهي');

  const post = await BotPost.create({ ...cleanPost(req.body), created_by: req.user?.name ?? res.locals.user?.name });
  runPost(post).catch(async err => {
    console.error('Bot post failed:', err);
    await BotPost.updateOne({ _id: post._id }, { status: 'failed', error: err.message, finished_at: new Date() }).catch(() => {});
  });
  res.status(201).json({ status: 'success', message: 'بدأ إرسال المنشور', data: { post } });
});

// sends the post only to the admin chat to check how it looks
exports.previewPost = catchAsync(async (req, res) => {
  const post = cleanPost(req.body);
  const { admin_chat_id } = await getSettings();
  if(!admin_chat_id) throw fail('حدد حساب الإدارة في الإعدادات أولاً');
  try {
    await telegram.sendItems(admin_chat_id, post.items, postMarkup(post));
  } catch(err) {
    if(err instanceof telegram.TelegramError) throw fail(`تعذر الإرسال (${err.message.replace('Telegram: ', '')})`);
    throw err;
  }
  res.status(200).json({ status: 'success', message: 'تم إرسال نسخة تجريبية إلى حساب الإدارة' });
});
