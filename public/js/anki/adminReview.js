/* Admins: approve / reject groups waiting for publishing */
(() => {
  document.querySelectorAll('.review-item').forEach(item => {
    const id = item.dataset.groupId;
    const name = item.querySelector('.group-name').textContent;

    const done = res => {
      item.classList.add('removing');
      item.style.transition = 'opacity .3s';
      item.style.opacity = 0;
      setTimeout(() => {
        item.remove();
        if (!document.querySelector('.review-item') && !document.querySelector('.card-review')) location.reload();
      }, 300);
      Anki.toast(res.message);
    };

    item.querySelector('.approve-btn').addEventListener('click', async () => {
      let res;
      await Anki.confirm({
        title: 'الموافقة على النشر؟',
        text: `ستظهر "${name}" في المجتمع لجميع الطلاب.`,
        icon: 'fa-check',
        submitText: 'موافقة ونشر',
        onSubmit: async () => { res = await Anki.api(`/groups/${id}/review`, 'PATCH', { action: 'approve' }); }
      });
      if (res) done(res);
    });

    item.querySelector('.reject-btn').addEventListener('click', async () => {
      let res;
      await Anki.dialog({
        title: 'رفض المجموعة',
        text: 'سيظهر سبب الرفض لصاحب المجموعة ليعدلها ويعيد إرسالها.',
        icon: 'fa-xmark',
        danger: true,
        submitText: 'رفض',
        fields: [{ name: 'note', label: 'سبب الرفض', type: 'textarea', required: true, placeholder: 'مثال: بعض الإجابات غير صحيحة' }],
        onSubmit: async values => { res = await Anki.api(`/groups/${id}/review`, 'PATCH', { action: 'reject', note: values.note }); }
      });
      if (res) done(res);
    });
  });

  /* new cards in published groups */
  document.querySelectorAll('.card-review').forEach(section => {
    const send = async function (ids, action) {
      const approve = action === 'approve';
      let res;
      await Anki.confirm({
        title: approve ? (ids.length > 1 ? `الموافقة على ${ids.length} بطاقات؟` : 'الموافقة على البطاقة؟') : (ids.length > 1 ? `رفض ${ids.length} بطاقات؟` : 'رفض البطاقة؟'),
        text: approve ? 'ستظهر لكل من يدرس المجموعة.' : 'لن تظهر لغير صاحب المجموعة، ويمكنه تعديلها لإرسالها مرة أخرى.',
        icon: approve ? 'fa-check' : 'fa-xmark',
        danger: !approve,
        submitText: approve ? 'موافقة' : 'رفض',
        onSubmit: async () => { res = await Anki.api('/cards/approval', 'PATCH', { cardIds: ids, action }); }
      });
      if (!res) return;
      const done = new Set(res.data.cardIds.map(String));
      section.querySelectorAll('.card-item').forEach(item => { if (done.has(item.dataset.cardId)) item.remove(); });
      if (!section.querySelector('.card-item')) section.remove();
      Anki.toast(res.message);
    };

    section.addEventListener('click', e => {
      const item = e.target.closest('.card-item');
      const all = () => [...section.querySelectorAll('.card-item')].map(it => it.dataset.cardId);
      if (e.target.closest('.approve-card-btn')) send([item.dataset.cardId], 'approve');
      else if (e.target.closest('.reject-card-btn')) send([item.dataset.cardId], 'reject');
      else if (e.target.closest('.approve-all-btn')) send(all(), 'approve');
      else if (e.target.closest('.reject-all-btn')) send(all(), 'reject');
    });
  });
})();
