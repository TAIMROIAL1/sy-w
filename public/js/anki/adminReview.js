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
        if (!document.querySelector('.review-item')) location.reload();
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
})();
