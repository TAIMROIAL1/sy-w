/* buy a course-linked official group with ATP (same popup as the main and courses pages) */
(() => {
  const layer = document.querySelector('.buy-backdrop');
  if (!layer) return;

  const agreeBtn = layer.querySelector('.confirm-btn');
  const cancelBtn = layer.querySelector('.cancel-btn');
  const detail = document.getElementById('buy-detail');
  const balance = document.getElementById('atp-balance');
  const notification = document.querySelector('.buy-notifi');
  const notificationMsg = notification.querySelector('.notifi-message');
  let notifiTimeout;
  let card;

  const showNotification = function (msg, type) {
    clearTimeout(notifiTimeout);
    notification.classList.remove('show-notifi', 'hide-notifi', 'green', 'red');
    void notification.offsetWidth; // restart animation
    notification.classList.add('show-notifi', type === 'success' ? 'green' : 'red');
    notificationMsg.textContent = msg;
    notifiTimeout = setTimeout(() => notification.classList.add('hide-notifi'), 2500);
  };

  const close = function () {
    layer.classList.add('hidden');
    document.body.style.overflow = '';
    card = null;
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('.buy-group-btn');
    if (!btn) return;
    card = btn.closest('.group-card');
    detail.textContent = `${card.dataset.name} مقابل ${btn.dataset.price} ATP`;
    layer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  cancelBtn.addEventListener('click', close);
  layer.addEventListener('click', e => { if (e.target === layer) close(); });

  agreeBtn.addEventListener('click', async () => {
    if (!card) return;
    const { groupId } = card.dataset;
    agreeBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    try {
      const res = await Anki.api(`/official/${groupId}/buy`, 'POST');
      balance.textContent = res.data.value;
      showNotification(res.message, 'success');
      setTimeout(() => location.assign(`/anki/official/${groupId}`), 1500);
    } catch (err) {
      showNotification(err.message, 'error');
    }
    agreeBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    close();
  });
})();
