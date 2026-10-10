/* Main / courses / settings pages: banner when a general test is live and the user has not finished it */
(() => {
  const domain = document.body.dataset.domain || '';
  const KEY = 'dismissedLiveTests';
  const pad = n => String(n).padStart(2, '0');
  const left = function (ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    if (h >= 24) return `${Math.floor(h / 24)} يوم`;
    return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
  };

  fetch(`${domain}/api/v1/tests/live`, { credentials: 'include' })
    .then(res => res.ok ? res.json() : null)
    .then(body => {
      const tests = body && body.data ? body.data.tests : [];
      let dismissed = [];
      try { dismissed = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { /* private mode */ }
      const shown = tests.filter(t => !dismissed.includes(t._id));
      if (!shown.length) return;
      const test = shown[0];
      const offset = new Date(body.data.now).getTime() - Date.now();

      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/css/liveBanner.css';
      document.head.appendChild(css);

      const banner = document.createElement('div');
      banner.className = 'live-test-banner';
      banner.setAttribute('role', 'status');
      banner.innerHTML = `
        <a class="ltb-link" href="${shown.length > 1 ? '/tests' : `/tests/${test._id}`}">
          <span class="ltb-dot" aria-hidden="true"></span>
          <span class="ltb-text"><strong>اختبار مباشر الآن</strong><span class="ltb-title"></span></span>
          <span class="ltb-time"></span>
          <span class="ltb-go">${test.started ? 'متابعة' : 'ابدأ'} ←</span>
        </a>
        <button class="ltb-close" type="button" aria-label="إخفاء">×</button>`;
      banner.querySelector('.ltb-title').textContent = shown.length > 1 ? `${test.title} و${shown.length - 1} غيره` : test.title;
      const time = banner.querySelector('.ltb-time');
      const end = new Date(test.endAt).getTime();
      const tick = () => {
        const ms = end - (Date.now() + offset);
        if (ms <= 0) { clearInterval(timer); return banner.remove(); }
        time.textContent = `ينتهي بعد ${left(ms)}`;
      };
      const timer = setInterval(tick, 1000);
      tick();

      banner.querySelector('.ltb-close').addEventListener('click', () => {
        try { sessionStorage.setItem(KEY, JSON.stringify([...dismissed, ...shown.map(t => t._id)])); } catch (e) { /* ignore */ }
        clearInterval(timer);
        banner.remove();
      });
      document.body.appendChild(banner);
    })
    .catch(() => {});
})();
