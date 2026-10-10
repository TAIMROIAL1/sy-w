const mongoose = require('mongoose');
const AnkiGroup = require('./../models/ankiGroupModel');
const AnkiCard = require('./../models/ankiCardModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const { uploadCardImage, uploadGroupPhoto, deleteCardImages } = require('./../utils/ankiImageStorage');
const scheduler = require('./../utils/ankiScheduler');
const ankiSocket = require('./../utils/ankiSocket');

const MIN_CARDS_TO_PUBLISH = 5;
const MAX_MASKS = 30;
const CARD_TYPES = ['basic', 'reverse', 'cloze', 'image'];
const CLOZE_REGEX = /\[\$([\s\S]+?)\$\]/g;

exports.MIN_CARDS_TO_PUBLISH = MIN_CARDS_TO_PUBLISH;

const isEmpty = value => value === undefined || value === null || String(value).trim() === '';
const clean = value => isEmpty(value) ? '' : String(value).trim();
const round = n => Math.round(n * 100) / 100;

const MAX_BATCH = 500;
const PENDING_NOTE = 'وستظهر للآخرين بعد موافقة المشرف';

const toIds = value => [...new Set((Array.isArray(value) ? value : []).filter(id => mongoose.isValidObjectId(id)).map(String))];
// a reverse pair is always handled as one card
const pairFilter = card => card.pairId ? { pairId: card.pairId } : { _id: card._id };
// the group + its parents, used for the socket rooms
const lineageOf = group => [...group.ancestors, group._id].map(String);

const groupNotFound = () => new AppError('هذه المجموعة غير موجودة', 404, 'message');
const cardNotFound = () => new AppError('هذه البطاقة غير موجودة', 404, 'message');

const findGroup = async function(groupId) {
  if(!mongoose.isValidObjectId(groupId)) return null;
  return AnkiGroup.findById(groupId);
};

// group the logged in user can manage (own library group, or official group for admins)
const findOwnedGroup = async function(req) {
  const group = await findGroup(req.params.groupId);
  return group && group.canBeManagedBy(req.user) ? group : null;
};

// card + its group, only if the user owns the group. Reversed copies are edited through the original
const findOwnedCard = async function(req) {
  if(!mongoose.isValidObjectId(req.params.cardId)) return {};
  const card = await AnkiCard.findById(req.params.cardId);
  if(!card || card.isReversed) return {};

  const group = await AnkiGroup.findById(card.group);
  if(!group || !group.canBeManagedBy(req.user)) return {};

  return { card, group };
};

// validates the body for every card type, returns { data } or { error }
// image cards: the file comes from multer (req.file), never as a url in the body
const buildCardData = function(body, hasImage) {
  const { type } = body;
  if(!CARD_TYPES.includes(type)) return { error: 'نوع البطاقة غير صحيح' };

  const extra = clean(body.extra);

  if(type === 'basic' || type === 'reverse') {
    const front = clean(body.front);
    const back = clean(body.back);

    if(!front) return { error: 'الرجاء كتابة الوجه الأول (السؤال)' };
    if(!back) return { error: 'الرجاء كتابة الوجه الثاني (الإجابة)' };

    return { data: { type, front, back, extra } };
  }

  if(type === 'cloze') {
    const text = clean(body.text);
    if(!text) return { error: 'الرجاء كتابة نص البطاقة' };

    const hiddenParts = [...text.matchAll(CLOZE_REGEX)].filter(match => match[1].trim());
    if(!hiddenParts.length) return { error: 'أخفِ جزءاً واحداً على الأقل بكتابته بين [$ و $]' };

    return { data: { type, text, extra } };
  }

  // image
  if(!hasImage) return { error: 'الرجاء رفع صورة' };

  const masks = Array.isArray(body.masks) ? body.masks : [];
  if(!masks.length) return { error: 'ارسم مستطيلاً واحداً على الأقل لإخفاء جزء من الصورة' };
  if(masks.length > MAX_MASKS) return { error: `لا يمكن إضافة أكثر من ${MAX_MASKS} مستطيلاً` };

  const cleanMasks = [];
  for(const mask of masks) {
    const [x, y, w, h] = ['x', 'y', 'w', 'h'].map(key => Number(mask && mask[key]));
    const valid = [x, y, w, h].every(Number.isFinite) &&
      x >= 0 && y >= 0 && w >= 0.5 && h >= 0.5 && x + w <= 100.5 && y + h <= 100.5;

    if(!valid) return { error: 'إحداثيات المستطيلات غير صحيحة' };
    cleanMasks.push({ x: round(x), y: round(y), w: round(w), h: round(h) });
  }

  return { data: { type, masks: cleanMasks, extra } };
};

/* =========================================
   GROUPS
========================================= */

exports.createGroup = catchAsync(async function(req, res, next) {
  const name = clean(req.body.name);
  const description = clean(req.body.description);

  if(!name) return next(new AppError('الرجاء ادخال اسم المجموعة', 400, 'message'));
  if(name.length > 80) return next(new AppError('اسم المجموعة يجب ألا يتجاوز 80 حرفاً', 400, 'message'));

  if(isEmpty(req.body.parent)) {
    const group = await AnkiGroup.create({ name, description, owner: req.user._id });
    return res.status(201).json({ status: 'success', message: 'تم إنشاء المجموعة بنجاح', data: { group } });
  }

  // inner group (library or, for admins, official): same owner / type / status as its parent
  const parent = await findGroup(req.body.parent);
  if(!parent || !parent.canBeManagedBy(req.user)) return next(groupNotFound());
  if(parent.ancestors.length + 1 >= AnkiGroup.MAX_DEPTH)
    return next(new AppError(`لا يمكن إنشاء أكثر من ${AnkiGroup.MAX_DEPTH} مستويات من المجموعات`, 400, 'message'));

  const group = await AnkiGroup.create({
    name,
    description,
    owner: parent.owner,
    isOfficial: parent.isOfficial,
    status: parent.status,
    publishedAt: parent.publishedAt,
    parent: parent._id,
    ancestors: [...parent.ancestors, parent._id]
  });

  // a group holds cards or inner groups: the cards of the parent move to its first inner group
  const movedCount = await AnkiCard.countDocuments({ group: parent._id, isReversed: false });
  if(movedCount) {
    await AnkiCard.updateMany({ group: parent._id }, { $set: { group: group._id } });
    await scheduler.moveProgress({ group: parent._id }, group._id);
  }
  await AnkiGroup.updateTreeCounts(group.rootId);

  res.status(201).json({
    status: 'success',
    message: movedCount ? `تم إنشاء المجموعة ونقل ${movedCount} بطاقة إليها` : 'تم إنشاء المجموعة بنجاح',
    data: { group, movedCount }
  });
});

exports.editGroup = catchAsync(async function(req, res, next) {
  const group = await findOwnedGroup(req);
  if(!group) return next(groupNotFound());

  const name = clean(req.body.name);
  const description = req.body.description === undefined ? group.description : clean(req.body.description);

  if(!name) return next(new AppError('الرجاء ادخال اسم المجموعة', 400, 'message'));
  if(name.length > 80) return next(new AppError('اسم المجموعة يجب ألا يتجاوز 80 حرفاً', 400, 'message'));

  if(name === group.name && description === group.description)
    return next(new AppError('لم تقم بتعديل اي شيء', 400, 'message'));

  group.name = name;
  group.description = description;
  await group.save();

  res.status(200).json({
    status: 'success',
    message: 'تم تعديل المجموعة بنجاح',
    data: { group }
  });
});

exports.deleteGroup = catchAsync(async function(req, res, next) {
  const group = await findOwnedGroup(req);
  if(!group) return next(groupNotFound());

  // the group + all of its inner groups
  const ids = await AnkiGroup.subtreeIds(group._id);
  const [imageCards, photos] = await Promise.all([
    AnkiCard.find({ group: { $in: ids }, $or: [{ imagePath: { $exists: true } }, { 'pendingEdit.imagePath': { $exists: true } }] }).select('imagePath pendingEdit'),
    AnkiGroup.find({ _id: { $in: ids }, photoPath: { $exists: true } }).select('photoPath')
  ]);

  await AnkiCard.deleteMany({ group: { $in: ids } });
  await scheduler.deleteProgress({ group: { $in: ids } });
  await AnkiGroup.deleteMany({ _id: { $in: ids } });
  if(group.parent) await AnkiGroup.updateTreeCounts(group.rootId);
  await deleteCardImages([...new Set(imageCards.flatMap(card => [card.imagePath, card.pendingEdit && card.pendingEdit.imagePath]).filter(Boolean))], photos.map(g => g.photoPath));

  res.status(200).json({
    status: 'success',
    message: 'تم حذف المجموعة بنجاح'
  });
});

// stage 1: send to admins for approval
exports.publishGroup = catchAsync(async function(req, res, next) {
  const group = await findOwnedGroup(req);
  if(!group || group.isOfficial) return next(groupNotFound());

  if(group.parent) return next(new AppError('النشر يتم من المجموعة الرئيسية، وتُنشر المجموعات الداخلية معها', 400, 'message'));
  if(group.status === 'pending') return next(new AppError('المجموعة قيد المراجعة بالفعل', 400, 'message'));
  if(group.status === 'published') return next(new AppError('المجموعة منشورة بالفعل', 400, 'message'));
  if(group.cardsCount < MIN_CARDS_TO_PUBLISH)
    return next(new AppError(`يجب أن تحتوي المجموعة على ${MIN_CARDS_TO_PUBLISH} بطاقات على الأقل قبل النشر`, 400, 'message'));
  if(!group.description)
    return next(new AppError('أضف وصفاً للمجموعة قبل النشر حتى يعرف الآخرون محتواها', 400, 'message'));

  group.status = 'pending';
  group.submittedAt = Date.now();
  group.reviewNote = undefined;
  await group.save();
  await AnkiGroup.syncTreeStatus(group);

  res.status(200).json({
    status: 'success',
    message: 'تم إرسال المجموعة للمراجعة، ستُنشر بعد موافقة المشرفين',
    data: { group }
  });
});

// cancel a pending request or unpublish
exports.unpublishGroup = catchAsync(async function(req, res, next) {
  const group = await findOwnedGroup(req);
  if(!group || group.isOfficial) return next(groupNotFound());

  if(group.parent) return next(new AppError('النشر يتم من المجموعة الرئيسية، وتُنشر المجموعات الداخلية معها', 400, 'message'));
  if(group.status !== 'pending' && group.status !== 'published')
    return next(new AppError('المجموعة غير منشورة', 400, 'message'));

  const message = group.status === 'pending' ? 'تم إلغاء طلب النشر' : 'تم إلغاء نشر المجموعة';

  group.status = 'private';
  group.publishedAt = undefined;
  group.submittedAt = undefined;
  await group.save();
  await AnkiGroup.syncTreeStatus(group);

  res.status(200).json({ status: 'success', message, data: { group } });
});

/* =========================================
   OFFICIAL GROUPS (admins) – multipart: data = JSON, image = photo
========================================= */

const buildOfficialData = function(body) {
  const name = clean(body.name);
  const description = clean(body.description);
  const subject = clean(body.subject);
  const level = clean(body.level);
  const topics = [...new Set((Array.isArray(body.topics) ? body.topics : []).map(clean).filter(Boolean))];

  if(!name) return { error: 'الرجاء ادخال اسم المجموعة' };
  if(name.length > 80) return { error: 'اسم المجموعة يجب ألا يتجاوز 80 حرفاً' };
  if(!description) return { error: 'الرجاء كتابة وصف للمجموعة' };
  if(subject.length > 60 || level.length > 60) return { error: 'المادة والمرحلة يجب ألا تتجاوز 60 حرفاً' };
  if(topics.length > 12) return { error: 'لا يمكن إضافة أكثر من 12 موضوعاً' };
  if(topics.some(topic => topic.length > 80)) return { error: 'كل موضوع يجب ألا يتجاوز 80 حرفاً' };

  return { data: { name, description, subject, level, topics }, published: body.published === true || body.published === 'true' };
};

// new official groups start as a draft (status private): add the cards, then publish
exports.createOfficialGroup = catchAsync(async function(req, res, next) {
  const { data, error } = buildOfficialData(req.body);
  if(error) return next(new AppError(error, 400, 'message'));
  if(!req.file) return next(new AppError('الرجاء رفع صورة للمجموعة', 400, 'message'));

  const _id = new mongoose.Types.ObjectId();
  const { image, imagePath } = await uploadGroupPhoto(req.file.buffer, _id);

  let group;
  try {
    group = await AnkiGroup.create({ _id, ...data, isOfficial: true, status: 'private', photo: image, photoPath: imagePath, owner: req.user._id });
  } catch (err) {
    await deleteCardImages(imagePath);
    throw err;
  }

  res.status(201).json({
    status: 'success',
    message: 'تم إنشاء المجموعة كمسودة، أضف البطاقات ثم انشرها في المنهج',
    data: { group }
  });
});

exports.editOfficialGroup = catchAsync(async function(req, res, next) {
  const group = await findGroup(req.params.groupId);
  if(!group || !group.isOfficial) return next(groupNotFound());
  if(group.parent) return next(new AppError('المجموعات الداخلية تُعدل من زر التعديل بجانب الاسم', 400, 'message'));

  const { data, published, error } = buildOfficialData(req.body);
  if(error) return next(new AppError(error, 400, 'message'));
  if(published && !group.cardsCount) return next(new AppError('أضف بطاقة واحدة على الأقل قبل نشر المجموعة في المنهج', 400, 'message'));

  const oldPhotoPath = group.photoPath;
  let uploaded;
  if(req.file) {
    uploaded = await uploadGroupPhoto(req.file.buffer, group._id);
    group.photo = uploaded.image;
    group.photoPath = uploaded.imagePath;
  }

  Object.assign(group, data);
  if(published && group.status !== 'published') group.publishedAt = Date.now();
  if(!published) group.publishedAt = undefined;
  group.status = published ? 'published' : 'private';

  try {
    await group.save();
  } catch (err) {
    if(uploaded) await deleteCardImages(uploaded.imagePath);
    throw err;
  }
  if(uploaded) await deleteCardImages(oldPhotoPath);
  await AnkiGroup.syncTreeStatus(group);

  res.status(200).json({
    status: 'success',
    message: 'تم حفظ المجموعة بنجاح',
    data: { group }
  });
});

// stage 2 (admins): approve -> published, reject -> rejected (with a note)
exports.reviewGroup = catchAsync(async function(req, res, next) {
  const group = await findGroup(req.params.groupId);
  if(!group || group.isOfficial || group.parent) return next(groupNotFound());
  if(group.status !== 'pending') return next(new AppError('هذه المجموعة ليست قيد المراجعة', 400, 'message'));

  const { action } = req.body;
  const note = clean(req.body.note);

  if(action === 'approve') {
    group.status = 'published';
    group.publishedAt = Date.now();
    group.reviewNote = undefined;
  } else if(action === 'reject') {
    if(!note) return next(new AppError('الرجاء كتابة سبب الرفض', 400, 'message'));
    group.status = 'rejected';
    group.reviewNote = note;
  } else {
    return next(new AppError('الإجراء غير صحيح', 400, 'message'));
  }

  await group.save();
  await AnkiGroup.syncTreeStatus(group);
  // the admin reviewed the whole group, so the cards still waiting are approved with it
  if(action === 'approve') {
    await AnkiCard.updateMany({ group: { $in: await AnkiGroup.subtreeIds(group._id) }, approval: 'pending' }, { $set: { approval: 'approved' } });
    await AnkiGroup.updateTreeCounts(group._id);
    await applyEdits(await AnkiCard.find({ group: { $in: await AnkiGroup.subtreeIds(group._id) }, isReversed: false, ...WAITING_EDIT }));
  }

  res.status(200).json({
    status: 'success',
    message: action === 'approve' ? 'تمت الموافقة على المجموعة ونشرها' : 'تم رفض المجموعة',
    data: { group }
  });
});

// community groups: rating from 1 to 5 (one rating per user, can be changed)
exports.rateGroup = catchAsync(async function(req, res, next) {
  if(!mongoose.isValidObjectId(req.params.groupId)) return next(groupNotFound());
  const group = await AnkiGroup.findById(req.params.groupId).select('+ratings +users');

  if(!group || group.isOfficial || group.status !== 'published') return next(groupNotFound());
  if(group.isOwnedBy(req.user)) return next(new AppError('لا يمكنك تقييم مجموعتك', 400, 'message'));
  if(!group.users.some(id => id.toString() === req.user._id.toString()))
    return next(new AppError('ادرس المجموعة أولاً ثم قيّمها', 400, 'message'));

  const value = Number(req.body.rating);
  if(!Number.isInteger(value) || value < 1 || value > 5)
    return next(new AppError('التقييم يجب أن يكون من 1 إلى 5', 400, 'message'));

  const existing = group.ratings.find(r => r.user.toString() === req.user._id.toString());
  if(existing) existing.value = value;
  else group.ratings.push({ user: req.user._id, value });

  group.ratingsQuantity = group.ratings.length;
  group.ratingsAverage = Math.round(group.ratings.reduce((sum, r) => sum + r.value, 0) / group.ratings.length * 10) / 10;
  await group.save();

  res.status(200).json({
    status: 'success',
    message: 'شكراً لتقييمك',
    data: { ratingsAverage: group.ratingsAverage, ratingsQuantity: group.ratingsQuantity, rating: value }
  });
});

/* =========================================
   CARDS
========================================= */

exports.createCard = catchAsync(async function(req, res, next) {
  const group = await findOwnedGroup(req);
  if(!group) return next(groupNotFound());
  if(group.childrenCount) return next(new AppError('هذه المجموعة تحتوي على مجموعات داخلية، أضف البطاقة داخل إحداها', 400, 'message'));

  const { data, error } = buildCardData(req.body, !!req.file);
  if(error) return next(new AppError(error, 400, 'message'));
  data.order = await AnkiCard.nextOrder(group._id);
  data.approval = group.needsCardApproval() ? 'pending' : 'approved';

  if(data.type === 'image') {
    const { image, imagePath } = await uploadCardImage(req.file.buffer, group._id);
    Object.assign(data, { image, imagePath });
  }

  const cards = [];

  try {
    if(data.type === 'reverse') {
      const pairId = new mongoose.Types.ObjectId();
      cards.push(await AnkiCard.create({ ...data, group: group._id, pairId }));
      cards.push(await AnkiCard.create({ ...data, front: data.back, back: data.front, group: group._id, pairId, isReversed: true }));
    } else {
      cards.push(await AnkiCard.create({ ...data, group: group._id }));
    }
  } catch (err) {
    await deleteCardImages(data.imagePath);
    throw err;
  }

  const cardsCount = await AnkiGroup.updateCardsCount(group._id);
  ankiSocket.cardsAdded(lineageOf(group), cards);

  const message = data.type === 'reverse' ? 'تمت إضافة بطاقتين (الأصلية والمعكوسة)' : 'تمت إضافة البطاقة بنجاح';
  res.status(201).json({
    status: 'success',
    message: data.approval === 'pending' ? `${message} ${PENDING_NOTE}` : message,
    data: { cards, cardsCount }
  });
});

exports.editCard = catchAsync(async function(req, res, next) {
  const { card, group } = await findOwnedCard(req);
  if(!card) return next(cardNotFound());

  if(req.body.type && req.body.type !== card.type)
    return next(new AppError('لا يمكن تغيير نوع البطاقة بعد إنشائها', 400, 'message'));

  // what the owner sees now: the edit waiting for the admin, if there is one
  const current = card.pendingEdit ? Object.assign(card.toObject(), card.pendingEdit.toObject()) : card.toObject();

  const newImage = card.type === 'image' && req.file;
  const { data, error } = buildCardData({ ...req.body, type: card.type }, !!newImage || !!current.image);
  if(error) return next(new AppError(error, 400, 'message'));

  const fields = ['front', 'back', 'text', 'extra'];
  const sameFields = fields.every(key => data[key] === undefined || (current[key] || '') === data[key]);
  const sameMasks = !data.masks || JSON.stringify((current.masks || []).map(({ x, y, w, h }) => ({ x, y, w, h }))) === JSON.stringify(data.masks);

  if(sameFields && sameMasks && !newImage) return next(new AppError('لم تقم بتعديل اي شيء', 400, 'message'));

  if(newImage) {
    const { image, imagePath } = await uploadCardImage(req.file.buffer, group._id);
    Object.assign(data, { image, imagePath });
  }
  const draft = card.pendingEdit;
  const draftImage = draft && draft.imagePath && draft.imagePath !== card.imagePath ? draft.imagePath : undefined;

  // others keep studying the approved version until an admin accepts the edit
  if(group.needsCardApproval() && card.approval === 'approved') {
    card.pendingEdit = {
      ...Object.fromEntries(fields.map(key => [key, data[key] !== undefined ? data[key] : current[key]])),
      masks: data.masks || (current.masks || []).map(({ x, y, w, h }) => ({ x, y, w, h })),
      image: data.image || current.image,
      imagePath: data.imagePath || current.imagePath,
      rejected: false,
      submittedAt: Date.now()
    };
    try {
      await card.save();
    } catch (err) {
      if(newImage) await deleteCardImages(data.imagePath);
      throw err;
    }
    if(newImage && draftImage) await deleteCardImages(draftImage);
    await AnkiGroup.findByIdAndUpdate(group._id, { updatedAt: Date.now() });

    return res.status(200).json({
      status: 'success',
      message: 'تم حفظ التعديل، وسيظهر للآخرين بعد موافقة المشرف',
      data: { card }
    });
  }

  // a direct edit replaces any edit that was waiting
  let replacedImage = newImage ? card.imagePath : undefined;
  if(!newImage && draftImage) {
    Object.assign(data, { image: draft.image, imagePath: draft.imagePath });
    replacedImage = card.imagePath;
  }

  // an edited refused card goes back to the admins
  const resubmit = card.approval === 'rejected' && group.needsCardApproval();
  if(resubmit) data.approval = 'pending';

  card.set(data);
  card.pendingEdit = undefined;
  try {
    await card.save();
  } catch (err) {
    if(newImage) await deleteCardImages(data.imagePath);
    throw err;
  }
  if(replacedImage) await deleteCardImages(replacedImage);
  if(newImage && draftImage) await deleteCardImages(draftImage);

  const updated = [card];
  if(card.type === 'reverse') {
    const reversed = await AnkiCard.findOneAndUpdate({ pairId: card.pairId, isReversed: true }, { front: card.back, back: card.front, extra: card.extra, approval: card.approval }, { new: true });
    if(reversed) updated.push(reversed);
  }
  ankiSocket.cardsUpdated(lineageOf(group), updated);
  if(resubmit) await AnkiGroup.updateCardsCount(group._id);

  await AnkiGroup.findByIdAndUpdate(group._id, { updatedAt: Date.now() });

  res.status(200).json({
    status: 'success',
    message: resubmit ? `تم تعديل البطاقة وإرسالها للمراجعة مرة أخرى` : 'تم تعديل البطاقة بنجاح',
    data: { card }
  });
});

// admin accepted edits: they replace the live version (and the reversed copy)
const applyEdits = async function(cards) {
  const updated = [];
  const oldImages = [];
  for(const card of cards) {
    const edit = card.pendingEdit.toObject();
    if(edit.imagePath && card.imagePath && edit.imagePath !== card.imagePath) oldImages.push(card.imagePath);
    ['front', 'back', 'text', 'extra', 'image', 'imagePath'].forEach(key => { if(edit[key] !== undefined) card[key] = edit[key]; });
    if(card.type === 'image' && edit.masks) card.masks = edit.masks;
    card.pendingEdit = undefined;
    await card.save();
    updated.push(card);
    if(card.type === 'reverse') {
      const reversed = await AnkiCard.findOneAndUpdate({ pairId: card.pairId, isReversed: true }, { front: card.back, back: card.front, extra: card.extra }, { new: true });
      if(reversed) updated.push(reversed);
    }
  }
  if(oldImages.length) await deleteCardImages(oldImages);
  return updated;
};
const WAITING_EDIT = { approval: 'approved', pendingEdit: { $exists: true }, 'pendingEdit.rejected': false };

exports.deleteCard = catchAsync(async function(req, res, next) {
  const { card, group } = await findOwnedCard(req);
  if(!card) return next(cardNotFound());

  const removed = card.pairId ? (await AnkiCard.find({ pairId: card.pairId }).select('_id')).map(c => c._id) : [card._id];
  await AnkiCard.deleteMany({ _id: { $in: removed } });
  await scheduler.deleteProgress({ card: { $in: removed } });
  await deleteCardImages([card.imagePath, card.pendingEdit && card.pendingEdit.imagePath].filter(p => p && p !== undefined));
  ankiSocket.cardsRemoved(lineageOf(group), removed);

  const cardsCount = await AnkiGroup.updateCardsCount(group._id);

  res.status(200).json({
    status: 'success',
    message: card.type === 'reverse' ? 'تم حذف البطاقتين' : 'تم حذف البطاقة',
    data: { cardsCount }
  });
});

/* =========================================
   STUDY
========================================= */

// ?mode=study    -> every card of the group
// ?mode=revision -> only the cards that are due now (+ new cards), needs at least one study first
exports.getStudyCards = catchAsync(async function(req, res, next) {
  const group = await findGroup(req.params.groupId);
  if(!group || !group.canBeStudiedBy(req.user)) return next(groupNotFound());

  const mode = req.query.mode === 'revision' ? 'revision' : 'study';
  const now = Date.now();

  // cards waiting for an admin: only for the owner and admins
  const options = { includeHidden: req.user.role === 'admin' || group.canBeManagedBy(req.user) };

  let cards;
  if(mode === 'revision') {
    const progress = await scheduler.getProgress(req.user, group);
    if(!progress.started) return next(new AppError('ادرس المجموعة مرة واحدة أولاً ثم يمكنك المراجعة', 400, 'message'));
    cards = await scheduler.getRevisionCards(req.user._id, group._id, now, options);
  } else {
    cards = await scheduler.getStudyCards(group, options);
  }

  if(!group.isOwnedBy(req.user)) await AnkiGroup.addUser(group._id, req.user._id);

  res.status(200).json({
    status: 'success',
    data: {
      group: { _id: group._id, name: group.name },
      mode,
      cards,
      // the socket only sends cards that become due after this moment
      serverTime: now,
      nextDueAt: await scheduler.getNextDueAt(req.user._id, group._id, now)
    }
  });
});

// easy = 3 days, medium = 1 day, hard = 1 minute
exports.reviewCard = catchAsync(async function(req, res, next) {
  const { difficulty } = req.body;
  if(!Object.keys(scheduler.INTERVALS).includes(difficulty))
    return next(new AppError('درجة الصعوبة غير صحيحة', 400, 'message'));

  const card = mongoose.isValidObjectId(req.params.cardId) && await AnkiCard.findById(req.params.cardId).select('group approval');
  if(!card) return next(cardNotFound());
  const group = await AnkiGroup.findById(card.group);
  if(!group || !group.canBeStudiedBy(req.user)) return next(cardNotFound());
  if(AnkiCard.HIDDEN.includes(card.approval) && req.user.role !== 'admin' && !group.canBeManagedBy(req.user)) return next(cardNotFound());

  const progress = await scheduler.recordReview(req.user._id, card, difficulty);
  ankiSocket.reschedule(req.user._id.toString(), lineageOf(group));

  res.status(200).json({
    status: 'success',
    data: { difficulty, dueAt: progress.dueAt, reviews: progress.reviews }
  });
});

exports.getGroupProgress = catchAsync(async function(req, res, next) {
  const group = await findGroup(req.params.groupId);
  if(!group || !group.canBeStudiedBy(req.user)) return next(groupNotFound());

  res.status(200).json({
    status: 'success',
    data: { progress: await scheduler.getProgress(req.user, group) }
  });
});

/* =========================================
   MOVE / ORDER / APPROVE CARDS
========================================= */

// move cards (and the other card of their reverse pair) to another group of the same library (or official, for admins)
exports.moveCards = catchAsync(async function(req, res, next) {
  const ids = toIds(req.body.cardIds);
  if(!ids.length) return next(new AppError('اختر بطاقة واحدة على الأقل', 400, 'message'));
  if(ids.length > MAX_BATCH) return next(new AppError(`لا يمكن نقل أكثر من ${MAX_BATCH} بطاقة مرة واحدة`, 400, 'message'));

  const target = await findGroup(req.body.groupId);
  if(!target || !target.canBeManagedBy(req.user)) return next(groupNotFound());
  if(target.childrenCount)
    return next(new AppError('لا يمكن نقل البطاقات إلى مجموعة تحتوي على مجموعات داخلية، اختر إحدى المجموعات الداخلية', 400, 'message'));

  const selected = await AnkiCard.find({ _id: { $in: ids }, isReversed: false }).sort(AnkiCard.SORT);
  if(selected.length !== ids.length) return next(cardNotFound());

  const sources = await AnkiGroup.find({ _id: { $in: [...new Set(selected.map(c => c.group.toString()))] } });
  const sourceById = new Map(sources.map(g => [g._id.toString(), g]));
  if(selected.some(c => !sourceById.has(c.group.toString()))) return next(cardNotFound());
  if(sources.some(g => !g.canBeManagedBy(req.user))) return next(cardNotFound());
  if(sources.some(g => g.isOfficial !== target.isOfficial))
    return next(new AppError('لا يمكن نقل البطاقات بين المجموعات الرسمية ومجموعات المكتبة', 400, 'message'));

  const moving = selected.filter(c => !c.group.equals(target._id));
  if(!moving.length) return next(new AppError('البطاقات موجودة في هذه المجموعة بالفعل', 400, 'message'));

  // a published community group only shows the cards coming from another group after an admin approves them
  let order = await AnkiCard.nextOrder(target._id);
  let pending = 0;
  const ops = moving.map(card => {
    const sameTree = sourceById.get(card.group.toString()).rootId.equals(target.rootId);
    const approval = !target.needsCardApproval() ? 'approved' : sameTree ? (card.approval || 'approved') : 'pending';
    if(approval === 'pending') pending++;
    return { updateMany: { filter: pairFilter(card), update: { $set: { group: target._id, order: order++, approval } } } };
  });
  await AnkiCard.bulkWrite(ops);

  const moved = await AnkiCard.find({ $or: moving.map(pairFilter) }).select(`${scheduler.CARD_FIELDS} group`);
  await scheduler.moveProgress({ card: { $in: moved.map(c => c._id) } }, target._id);

  const roots = new Set([target.rootId.toString(), ...sources.map(g => g.rootId.toString())]);
  for(const rootId of roots) await AnkiGroup.updateTreeCounts(rootId);

  // live revision: removed from the old groups, added to the new one (rooms of shared parents are skipped)
  const keyOf = card => card.pairId ? `pair:${card.pairId}` : `card:${card._id}`;
  const sourceOf = new Map(moving.map(c => [keyOf(c), c.group.toString()]));
  const targetRooms = lineageOf(target);
  sources.forEach(source => {
    const sourceRooms = lineageOf(source);
    const cards = moved.filter(m => sourceOf.get(keyOf(m)) === source._id.toString());
    if(!cards.length) return;
    ankiSocket.cardsRemoved(sourceRooms.filter(id => !targetRooms.includes(id)), cards.map(c => c._id));
    ankiSocket.cardsAdded(targetRooms.filter(id => !sourceRooms.includes(id)), cards);
  });

  res.status(200).json({
    status: 'success',
    message: `تم نقل ${moving.length} بطاقة إلى "${target.name}"${pending ? ` ${PENDING_NOTE}` : ''}`,
    data: { moved: moving.map(c => c._id), pending }
  });
});

// body: { cardIds } = every card of the group (reversed copies excluded) in the new order
exports.reorderCards = catchAsync(async function(req, res, next) {
  const group = await findOwnedGroup(req);
  if(!group) return next(groupNotFound());

  const ids = toIds(req.body.cardIds);
  const cards = await AnkiCard.find({ group: group._id, isReversed: false }).select('pairId');
  const byId = new Map(cards.map(c => [c._id.toString(), c]));
  if(ids.length !== cards.length || ids.some(id => !byId.has(id)))
    return next(new AppError('تغيرت بطاقات المجموعة، أعد تحميل الصفحة ثم حاول مرة أخرى', 400, 'message'));

  if(ids.length) await AnkiCard.bulkWrite(ids.map((id, order) => ({ updateMany: { filter: pairFilter(byId.get(id)), update: { $set: { order } } } })));

  res.status(200).json({ status: 'success', message: 'تم حفظ ترتيب البطاقات' });
});

// admins: cards waiting in published community groups
exports.reviewCards = catchAsync(async function(req, res, next) {
  const { action } = req.body;
  if(action !== 'approve' && action !== 'reject') return next(new AppError('الإجراء غير صحيح', 400, 'message'));

  const ids = toIds(req.body.cardIds);
  if(!ids.length || ids.length > MAX_BATCH) return next(new AppError('اختر بطاقة واحدة على الأقل', 400, 'message'));

  // new cards waiting, and edits waiting on cards others already see
  const cards = await AnkiCard.find({ _id: { $in: ids }, isReversed: false, $or: [{ approval: 'pending' }, WAITING_EDIT] });
  if(!cards.length) return next(new AppError('هذه البطاقات ليست بانتظار المراجعة', 400, 'message'));
  const newCards = cards.filter(c => c.approval === 'pending');
  const edits = cards.filter(c => c.approval !== 'pending');

  const groups = await AnkiGroup.find({ _id: { $in: [...new Set(cards.map(c => c.group.toString()))] } });

  if(newCards.length) {
    const filter = { $or: newCards.map(pairFilter) };
    await AnkiCard.updateMany(filter, { $set: { approval: action === 'approve' ? 'approved' : 'rejected' } });
    for(const rootId of new Set(groups.map(g => g.rootId.toString()))) await AnkiGroup.updateTreeCounts(rootId);
    if(action === 'approve') {
      const approved = await AnkiCard.find(filter).select(`${scheduler.CARD_FIELDS} group`);
      groups.forEach(g => ankiSocket.cardsAdded(lineageOf(g), approved.filter(c => c.group.equals(g._id))));
    }
  }

  if(edits.length) {
    if(action === 'approve') {
      const updated = await applyEdits(edits);
      groups.forEach(g => ankiSocket.cardsUpdated(lineageOf(g), updated.filter(c => c.group.equals(g._id))));
    } else {
      await AnkiCard.updateMany({ _id: { $in: edits.map(c => c._id) } }, { $set: { 'pendingEdit.rejected': true } });
    }
  }

  res.status(200).json({
    status: 'success',
    message: action === 'approve' ? `تمت الموافقة على ${cards.length} بطاقة` : `تم رفض ${cards.length} بطاقة`,
    data: { cardIds: cards.map(c => c._id) }
  });
});
