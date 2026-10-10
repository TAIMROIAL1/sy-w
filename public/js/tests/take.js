/* Taking a test: timer (server time), autosave, auto submit at the deadline */
(() => {
  const page = document.getElementById('test-take');
  const startBtn = document.getElementById('start-test-btn');
  if (!page || !startBtn) return;

  const testId = page.dataset.testId;
  const intro = document.getElementById('test-intro');
  const runner = document.getElementById('test-runner');
  const done = document.getElementById('test-done');
  const list = document.getElementById('question-list');
  const timerBox = document.getElementById('runner-timer');
  const timerText = document.getElementById('timer-text');
  const progress = document.getElementById('runner-progress');
  const saveState = document.getElementById('save-state');

  let deadline, offset = 0, questions = [], answers = [], dirty = {};
  let timer, saveTimer, finished = false;
  const now = () => Date.now() + offset;
  const pad = n => String(n).padStart(2, '0');
  const clock = function (ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
  };
  const warnLeave = e => { e.preventDefault(); e.returnValue = ''; };

  const render = function () {
    list.innerHTML = questions.map((q, i) => `
      <li class="question card-box" data-q="${q.index}">
        <div class="q-head"><span class="q-num">${i + 1}</span><p class="q-text">${Anki.escapeHtml(q.text)}</p></div>
        <div class="choices">${q.choices.map(c => `
          <label class="choice"><input type="radio" name="q${q.index}" value="${c.index}" ${answers[q.index] === c.index ? 'checked' : ''}><span>${Anki.escapeHtml(c.text)}</span></label>`).join('')}
        </div>
      </li>`).join('');
    updateProgress();
  };

  const updateProgress = function () {
    const answered = questions.filter(q => answers[q.index] >= 0).length;
    progress.textContent = `${answered} / ${questions.length} مُجاب`;
    list.querySelectorAll('.question').forEach(li => li.classList.toggle('is-answered', answers[li.dataset.q] >= 0));
  };

  const save = async function () {
    if (finished || !Object.keys(dirty).length) return;
    const batch = dirty;
    dirty = {};
    try {
      await Anki.api(`/api/v1/tests/${testId}/attempt`, 'PATCH', { answers: batch });
      saveState.textContent = 'تم حفظ الإجابات';
    } catch (err) {
      dirty = { ...batch, ...dirty };
      saveState.textContent = 'تعذر الحفظ، ستتم المحاولة مرة أخرى';
      if (now() < deadline) saveTimer = setTimeout(save, 3000);
    }
  };

  list.addEventListener('change', e => {
    if (e.target.type !== 'radio' || finished) return;
    const qi = Number(e.target.name.slice(1));
    answers[qi] = Number(e.target.value);
    dirty[qi] = answers[qi];
    updateProgress();
    saveState.textContent = 'جارٍ الحفظ…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 700);
  });

  const submit = async function (auto) {
    if (finished) return;
    if (!auto) {
      const unanswered = questions.filter(q => !(answers[q.index] >= 0)).length;
      let confirmed = false;
      await Anki.confirm({
        title: 'تسليم الاختبار؟',
        text: unanswered ? `لم تجب عن ${unanswered} سؤال. لا يمكن تعديل الإجابات بعد التسليم.` : 'لا يمكن تعديل الإجابات بعد التسليم.',
        icon: 'fa-paper-plane',
        submitText: 'تسليم',
        onSubmit: async () => { confirmed = true; }
      });
      if (!confirmed || finished) return;
    }

    finished = true;
    clearInterval(timer);
    clearTimeout(saveTimer);
    try {
      await Anki.api(`/api/v1/tests/${testId}/submit`, 'POST', { answers: Object.fromEntries(questions.map(q => [q.index, answers[q.index]])) });
    } catch (err) {
      // time is over: the answers saved before the deadline count
      if (!auto) {
        finished = false;
        timer = setInterval(tick, 500);
        return Anki.toast(err.message, 'error');
      }
    }
    window.removeEventListener('beforeunload', warnLeave);
    runner.hidden = true;
    done.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tick = function () {
    const ms = deadline - now();
    timerText.textContent = clock(ms);
    timerBox.classList.toggle('is-low', ms < 60000);
    if (ms <= 0) submit(true);
  };

  page.querySelectorAll('.submit-test-btn').forEach(btn => btn.addEventListener('click', () => submit(false)));

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    let res;
    try {
      res = await Anki.api(`/api/v1/tests/${testId}/start`, 'POST');
    } catch (err) {
      startBtn.disabled = false;
      return Anki.toast(err.message, 'error');
    }
    const data = res.data;
    offset = new Date(data.now).getTime() - Date.now();
    deadline = new Date(data.deadline).getTime();
    questions = data.questions;
    answers = data.answers;
    render();
    intro.hidden = true;
    runner.hidden = false;
    tick();
    timer = setInterval(tick, 500);
    window.addEventListener('beforeunload', warnLeave);
  });
})();
