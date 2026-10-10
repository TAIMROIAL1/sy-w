// Live revision: while a student is revising a group, every card that becomes due
// (e.g. one answered "hard" a minute ago) or that the owner adds is pushed to the page.
// Usage (server.js):  const server = app.listen(...);  require('./utils/ankiSocket').init(server);
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const AnkiGroup = require('./../models/ankiGroupModel');
const AnkiCard = require('./../models/ankiCardModel');
const scheduler = require('./ankiScheduler');

const MAX_DELAY = 6 * 60 * 60 * 1000;
const NAMESPACE = '/anki';

let nsp;
// `${userId}:${groupId}` -> { userId, groupId, since, timer, chain }
const revisions = new Map();

const userRoom = (userId, groupId) => `revision:${userId}:${groupId}`;
const groupRoom = groupId => `group:${groupId}`;

const parseCookies = header => Object.fromEntries((header || '').split(';').map(part => {
  const i = part.indexOf('=');
  return i < 0 ? [] : [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
}).filter(pair => pair.length));

// same idea as checkJWT: the `jwt` cookie holds { id } signed with JWT_SECRET. Change it if your checkJWT differs
const defaultAuthenticate = async function(socket) {
  const jwt = require('jsonwebtoken');
  const token = parseCookies(socket.handshake.headers.cookie).jwtStudyou;
  if(!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return mongoose.model('User').findById(decoded.id);
};

// sends the cards that became due since the last check, then waits for the next due card
const check = async function(key) {
  const state = revisions.get(key);
  if(!state) return;
  clearTimeout(state.timer);

  const now = Date.now();
  const cards = await scheduler.getCardsDueBetween(state.userId, state.groupId, state.since, now, { includeHidden: state.includeHidden });
  state.since = now;
  if(cards.length) nsp.to(userRoom(state.userId, state.groupId)).emit('cards:due', { groupId: state.groupId, cards });

  const next = await scheduler.getNextDueAt(state.userId, state.groupId, now);
  if(!revisions.has(key)) return;
  if(next) state.timer = setTimeout(() => queue(key), Math.min(MAX_DELAY, Math.max(0, next.getTime() - Date.now()) + 50));
};

// one check at a time per user+group
const queue = function(key) {
  const state = revisions.get(key);
  if(!state) return Promise.resolve();
  state.chain = state.chain.then(() => check(key)).catch(err => console.error('anki socket:', err.message));
  return state.chain;
};

const leave = function(key) {
  const state = revisions.get(key);
  if(!state) return;
  const room = nsp.adapter.rooms.get(userRoom(state.userId, state.groupId));
  if(room && room.size) return;
  clearTimeout(state.timer);
  revisions.delete(key);
};

exports.init = function(server, authenticate = defaultAuthenticate) {
  const io = new Server(server);
  nsp = io.of(NAMESPACE);

  nsp.use(async (socket, next) => {
    try {
      const user = await authenticate(socket);
      if(!user) return next(new Error('unauthorized'));
      socket.data.user = user;
      socket.data.revisions = new Set();
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  nsp.on('connection', socket => {
    // since = server time when the page loaded its revision cards
    socket.on('revision:join', async ({ groupId, since } = {}, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if(!mongoose.isValidObjectId(groupId)) return reply({ ok: false });
        const group = await AnkiGroup.findById(groupId);
        if(!group || !group.canBeStudiedBy(socket.data.user)) return reply({ ok: false });

        const userId = socket.data.user._id.toString();
        const key = `${userId}:${groupId}`;
        const sinceTime = Math.min(Number(since) || Date.now(), Date.now());

        socket.join(userRoom(userId, groupId));
        socket.join(groupRoom(groupId));
        socket.data.revisions.add(key);

        const state = revisions.get(key);
        if(state) state.since = Math.min(state.since, sinceTime);
        else revisions.set(key, {
          userId,
          groupId: String(groupId),
          since: sinceTime,
          timer: null,
          chain: Promise.resolve(),
          includeHidden: socket.data.user.role === 'admin' || group.canBeManagedBy(socket.data.user)
        });

        await queue(key);
        reply({ ok: true });
      } catch (err) {
        reply({ ok: false });
      }
    });

    socket.on('disconnect', () => socket.data.revisions.forEach(leave));
  });

  return io;
};

// groupIds: the group of the cards + its parents (someone may be revising a parent group)
const toRooms = groupIds => [...new Set((Array.isArray(groupIds) ? groupIds : [groupIds]).map(String))];
// cards waiting for an admin are never pushed to the other users
const visibleCards = cards => cards.filter(c => !AnkiCard.HIDDEN.includes(c.approval));
const emit = function(groupIds, event, payload) {
  if(!nsp) return;
  toRooms(groupIds).forEach(groupId => nsp.to(groupRoom(groupId)).emit(event, { groupId, ...payload }));
};

// call after a review changed when the user's next card is due
exports.reschedule = function(userId, groupIds) {
  if(!nsp) return;
  toRooms(groupIds).forEach(groupId => {
    const key = `${userId}:${groupId}`;
    if(revisions.has(key)) queue(key);
  });
};

// new cards are due right away for everyone revising the group
exports.cardsAdded = function(groupIds, cards) {
  const visible = visibleCards(cards);
  if(visible.length) emit(groupIds, 'cards:new', { cards: visible });
};

exports.cardsRemoved = function(groupIds, cardIds) {
  if(cardIds.length) emit(groupIds, 'cards:removed', { cardIds: cardIds.map(String) });
};

exports.cardsUpdated = function(groupIds, cards) {
  const visible = visibleCards(cards);
  if(visible.length) emit(groupIds, 'cards:updated', { cards: visible });
};
