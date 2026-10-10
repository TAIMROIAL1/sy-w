/* Study page
   ?mode=study    -> every card of the group once (each answer schedules the card)
   ?mode=revision -> only the due cards. Cards that become due while revising (or that the owner adds)
                     are pushed by the socket and appended to the end, no reload needed
   easy = 3 days, medium = 1 day, hard = 1 minute (server side: utils/ankiScheduler.js) */
(() => {
  const page = document.getElementById('study');
  if (!page) return;

  const { groupId, mode } = page.dataset;
  const isRevision = mode === 'revision';
  const $ = id => document.getElementById(id);

  const cardEl = $('study-card');
  const loading = $('study-loading');
  const doneEl = $('study-done');
  const emptyEl = $('study-empty');
  const actions = $('study-actions');
  const revealBtn = $('reveal-btn');
  const diffBtns = $('difficulty-btns');
  const counter = $('study-counter');
  const progressBar = $('progress-bar');
  const livePill = $('live-pill');
  const nextDueText = $('next-due-text');

  let cards = [];
  let index = 0;
  let revealed = false;
  let finished = false;
  let stats = { easy: 0, medium: 0, hard: 0 };
  let startedAt = Date.now();
  let serverTime = Date.now();
  let live = false;
  let nextDueAt = null;
  let countdown = null;
  let polling = false;
  let lastReview = Promise.resolve();

  const updateProgress = function () {
    const shown = finished ? index : Math.min(index + 1, cards.length);
    counter.textContent = `${shown} / ${cards.length}`;
    progressBar.style.width = `${cards.length ? (index / cards.length) * 100 : 100}%`;
  };

  const bumpCounter = function () {
    counter.classList.remove('bump');
    void counter.offsetWidth;
    counter.classList.add('bump');
  };

  /* --------------------------- countdown --------------------------- */
  const formatLeft = function (ms) {
    const s = Math.ceil(ms / 1000);
    if (s >= 86400) return `بعد ${Math.ceil(s / 86400)} يوم`;
    if (s >= 3600) return `بعد ${Math.floor(s / 3600)} ساعة و${Math.floor((s % 3600) / 60)} دقيقة`;
    return `بعد ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const stopCountdown = () => { clearInterval(countdown); countdown = null; };

  const renderCountdown = function () {
    if (!nextDueText) return;
    if (!nextDueAt) { nextDueText.textContent = 'لا توجد بطاقات قادمة'; return; }
    const left = nextDueAt - Date.now();
    if (left > 0) { nextDueText.textContent = `البطاقة التالية ${formatLeft(left)}`; return; }
    nextDueText.textContent = 'البطاقة التالية جاهزة الآن…';
    if (!live) pollDue(); // fallback when the socket is not connected
  };

  const startCountdown = function () {
    stopCountdown();
    renderCountdown();
    countdown = setInterval(renderCountdown, 1000);
  };

  const refreshNextDue = async function () {
    try {
      const res = await Anki.api(`/groups/${groupId}/progress`);
      const next = res.data.progress.nextDueAt;
      nextDueAt = next ? new Date(next).getTime() : null;
    } catch (err) { /* keep the old value */ }
    if (finished) startCountdown();
  };

  /* ----------------------------- cards ----------------------------- */
  const showCard = function () {
    const card = cards[index];
    finished = false;
    revealed = false;
    stopCountdown();
    doneEl.hidden = true;
    actions.hidden = false;
    cardEl.className = 'study-card enter';
    cardEl.innerHTML = Anki.renderCard(card, false);
    cardEl.hidden = false;
    revealBtn.hidden = false;
    diffBtns.hidden = true;
    updateProgress();
    revealBtn.focus({ preventScroll: true });
  };

  const reveal = function () {
    if (revealed || finished) return;
    revealed = true;
    cardEl.className = 'study-card is-revealed';
    cardEl.innerHTML = Anki.renderCard(cards[index], true);
    revealBtn.hidden = true;
    diffBtns.hidden = false;
  };

  const finish = function () {
    finished = true;
    cardEl.hidden = true;
    actions.hidden = true;
    doneEl.hidden = false;
    updateProgress();

    $('done-total').textContent = index;
    $('done-time').textContent = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    ['easy', 'medium', 'hard'].forEach(d => $(`done-${d}`).textContent = stats[d]);

    if (isRevision) {
      $('done-title').textContent = index ? 'أنهيت البطاقات الجاهزة' : 'لا توجد بطاقات جاهزة الآن';
      $('done-summary').hidden = !index;
      $('done-stats').hidden = !index;
      $('done-icon').innerHTML = `<i class="fa-solid ${index ? 'fa-trophy' : 'fa-mug-hot'}"></i>`;
      nextDueText.textContent = '…';
      lastReview.finally(refreshNextDue);
    }
  };

  const answer = function (difficulty) {
    if (!revealed || finished) return;
    const card = cards[index];
    stats[difficulty]++;

    lastReview = Anki.api(`/cards/${card._id}/review`, 'POST', { difficulty })
      .catch(err => Anki.toast(err.message, 'error'));

    index++;
    if (index >= cards.length) finish();
    else showCard();
  };

  const start = function () {
    index = 0;
    stats = { easy: 0, medium: 0, hard: 0 };
    startedAt = Date.now();
    if (cards.length) showCard();
    else finish();
  };

  /* ------------------ live changes (revision only) ------------------ */
  // the 2 cards of a reverse pair never come one after the other (the card on screen is not moved)
  const separatePairs = function (from) {
    const fits = (j, key) => (j === 0 || cards[j - 1].pairId !== key) && (j === cards.length || cards[j].pairId !== key);
    for (let i = Math.max(1, from); i < cards.length; i++) {
      const key = cards[i].pairId;
      if (!key || key !== cards[i - 1].pairId) continue;
      const [card] = cards.splice(i, 1);
      let j = i - 1;
      while (j >= Math.max(1, from) && !fits(j, key)) j--;
      cards.splice(j >= Math.max(1, from) ? j : i, 0, card);
    }
  };

  const addCards = function (list, reason) {
    const pending = new Set(cards.slice(index).map(c => c._id));
    const fresh = list.filter(c => !pending.has(c._id) && pending.add(c._id));
    if (!fresh.length) return;

    cards.push(...fresh);
    separatePairs(finished ? index : index + 1);
    bumpCounter();
    if (finished) showCard();
    else updateProgress();

    const n = fresh.length;
    Anki.toast(reason === 'new'
      ? (n === 1 ? 'أُضيفت بطاقة جديدة إلى المجموعة' : `أُضيفت ${n} بطاقات جديدة إلى المجموعة`)
      : (n === 1 ? 'بطاقة أصبحت جاهزة وأُضيفت إلى المراجعة' : `${n} بطاقات أصبحت جاهزة وأُضيفت إلى المراجعة`));
  };

  const removeCards = function (ids) {
    const removed = new Set(ids);
    const current = cards[index];
    cards = [...cards.slice(0, index), ...cards.slice(index).filter(c => !removed.has(c._id))];
    if (!finished && current && removed.has(current._id)) {
      if (index < cards.length) showCard();
      else finish();
    } else updateProgress();
  };

  const updateCards = function (list) {
    const byId = new Map(list.map(c => [c._id, c]));
    for (let i = index; i < cards.length; i++) if (byId.has(cards[i]._id)) cards[i] = byId.get(cards[i]._id);
    if (!finished && !revealed && cards[index] && byId.has(cards[index]._id))
      cardEl.innerHTML = Anki.renderCard(cards[index], false);
  };

  // no socket: ask the API for the due cards when the countdown ends
  const pollDue = async function () {
    if (polling) return;
    polling = true;
    try {
      const res = await Anki.api(`/groups/${groupId}/study?mode=revision`);
      addCards(res.data.cards, 'due');
      nextDueAt = res.data.nextDueAt ? new Date(res.data.nextDueAt).getTime() : null;
    } catch (err) { nextDueAt = null; }
    polling = false;
    if (finished) startCountdown();
  };

  const connect = function () {
    if (!window.io) return;
    const socket = window.io('/anki');
    const setLive = on => {
      live = on;
      if (livePill) livePill.hidden = !on;
    };
    const forThisGroup = fn => data => data && data.groupId === groupId && fn(data);

    socket.on('connect', () => socket.emit('revision:join', { groupId, since: serverTime }, res => setLive(!!(res && res.ok))));
    socket.on('disconnect', () => setLive(false));
    socket.on('connect_error', () => setLive(false));
    socket.on('cards:due', forThisGroup(d => addCards(d.cards, 'due')));
    socket.on('cards:new', forThisGroup(d => addCards(d.cards, 'new')));
    socket.on('cards:removed', forThisGroup(d => removeCards(d.cardIds)));
    socket.on('cards:updated', forThisGroup(d => updateCards(d.cards)));
  };

  /* ----------------------------- events ----------------------------- */
  revealBtn.addEventListener('click', reveal);
  // cloze / image card: opening the last hidden part by tapping shows the answer
  cardEl.addEventListener('anki:all-parts-revealed', reveal);
  diffBtns.addEventListener('click', e => {
    const btn = e.target.closest('[data-difficulty]');
    if (btn) answer(btn.dataset.difficulty);
  });
  const restartBtn = $('restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', start);

  // keyboard: space / enter = reveal, 1 hard, 2 medium, 3 easy
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea') || cardEl.hidden) return;
    if ((e.code === 'Space' || e.key === 'Enter') && !revealed) { e.preventDefault(); reveal(); }
    else if (revealed && ['1', '2', '3'].includes(e.key)) answer({ 1: 'hard', 2: 'medium', 3: 'easy' }[e.key]);
  });

  (async () => {
    try {
      const res = await Anki.api(`/groups/${groupId}/study${isRevision ? '?mode=revision' : ''}`);
      cards = res.data.cards;
      serverTime = res.data.serverTime;
      loading.hidden = true;
      if (!cards.length && !isRevision) {
        emptyEl.hidden = false;
        counter.textContent = '0 / 0';
        return;
      }
      start();
      if (isRevision) connect();
    } catch (err) {
      loading.hidden = true;
      Anki.toast(err.message, 'error');
    }
  })();
})();
