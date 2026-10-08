/* Anki home: bottom navigation + library groups (create / edit name / publish / delete) */
(() => {
  const page = document.getElementById('anki-home');
  if (!page) return;

  const minCards = Number(page.dataset.minCards);
  const panels = [...page.querySelectorAll('[data-panel]')];
  const navItems = [...document.querySelectorAll('.bottom-nav-item')];
  const titles = { library: 'المكتبة', curriculum: 'المنهج', community: 'المجتمع' };

  /* --------------------------- bottom nav --------------------------- */
  const showTab = function (tab, push = true) {
    panels.forEach(p => p.hidden = p.dataset.panel !== tab);
    navItems.forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
    page.dataset.tab = tab;
    document.title = `${titles[tab]} | Studyou`;
    if (push) history.pushState({ tab }, '', navItems.find(a => a.dataset.tab === tab).getAttribute('href'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.addEventListener('click', e => {
    const link = e.target.closest('.bottom-nav-item, [data-tab-link]');
    if (!link || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    showTab(link.dataset.tab || link.dataset.tabLink);
  });

  window.addEventListener('popstate', () => {
    const tab = location.pathname.endsWith('/curriculum') ? 'curriculum' : location.pathname.endsWith('/community') ? 'community' : 'library';
    showTab(tab, false);
  });

  /* ----------------------------- search ----------------------------- */
  panels.forEach(panel => Anki.bindSearch(
    panel.querySelector('.group-search'),
    () => [...panel.querySelectorAll('.group-card')],
    panel.querySelector('.no-results')
  ));

  /* ------------------------- library groups ------------------------- */
  const libraryPanel = page.querySelector('[data-panel="library"]');
  const statGroups = document.getElementById('stat-groups');
  const statCards = document.getElementById('stat-cards');

  const refreshLibraryStats = function () {
    const cards = [...libraryPanel.querySelectorAll('.library-card')];
    statGroups.textContent = cards.length;
    statCards.textContent = cards.reduce((sum, c) => sum + Number(c.querySelector('.cards-count').textContent), 0);
    libraryPanel.querySelector('.library-content').hidden = !cards.length;
    libraryPanel.querySelector('.library-empty').hidden = !!cards.length;
  };

  const groupFields = (name = '', description = '') => [
    { name: 'name', label: 'اسم المجموعة', value: name, required: true, maxlength: 80, placeholder: 'مثال: مصطلحات الفصل الأول' },
    { name: 'description', label: 'الوصف (اختياري)', type: 'textarea', value: description, placeholder: 'ماذا تحتوي هذه المجموعة؟' }
  ];

  // create
  document.addEventListener('click', async e => {
    if (!e.target.closest('.create-group-btn')) return;

    let created;
    await Anki.dialog({
      title: 'إنشاء مجموعة جديدة',
      icon: 'fa-folder-plus',
      submitText: 'إنشاء',
      fields: groupFields(),
      onSubmit: async values => { created = await Anki.api('/groups', 'POST', values); }
    });
    if (!created) return;

    Anki.toastAfterReload(created.message);
    location.href = `/anki/library/${created.data.group._id}?tab=edit`;
  });

  libraryPanel.addEventListener('click', async e => {
    const card = e.target.closest('.library-card');
    if (!card) return;
    const id = card.dataset.groupId;

    // edit name (outer edit button)
    if (e.target.closest('.edit-group-btn')) {
      let edited;
      await Anki.dialog({
        title: 'تعديل المجموعة',
        icon: 'fa-pen',
        fields: groupFields(card.dataset.name, card.dataset.description),
        onSubmit: async values => { edited = await Anki.api(`/groups/${id}`, 'PATCH', values); }
      });
      if (!edited) return;

      const { name, description } = edited.data.group;
      card.dataset.name = name;
      card.dataset.description = description;
      card.dataset.search = name;
      card.querySelector('.group-name').textContent = name;
      card.querySelector('.group-avatar').textContent = name.trim().charAt(0);
      Anki.toast(edited.message);
    }

    // publish to community -> pending (admins approve)
    if (e.target.closest('.publish-btn')) {
      const count = Number(card.querySelector('.cards-count').textContent);
      if (count < minCards) {
        Anki.toast(`أضف ${minCards} بطاقات على الأقل قبل النشر (لديك ${count})`, 'error');
        return;
      }

      let published;
      await Anki.confirm({
        title: 'نشر المجموعة في المجتمع؟',
        text: `سيتم إرسال "${card.dataset.name}" للمشرفين للمراجعة، وبعد الموافقة ستظهر لجميع الطلاب.`,
        icon: 'fa-paper-plane',
        submitText: 'إرسال للمراجعة',
        onSubmit: async () => { published = await Anki.api(`/groups/${id}/publish`, 'POST'); }
      });
      if (!published) return;

      const btn = card.querySelector('.publish-btn');
      btn.disabled = true;
      btn.classList.add('is-pending');
      btn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i><span>قيد المراجعة</span>';
      const badge = card.querySelector('.status-badge');
      badge.className = 'status-badge pending';
      badge.innerHTML = '<i class="fa-solid fa-hourglass-half"></i>قيد المراجعة';
      card.dataset.status = 'pending';
      Anki.toast(published.message);
    }

    // delete
    if (e.target.closest('.delete-group-btn')) {
      let deleted;
      await Anki.confirm({
        title: 'حذف المجموعة؟',
        text: `سيتم حذف "${card.dataset.name}" وجميع بطاقاتها نهائياً.`,
        icon: 'fa-trash',
        danger: true,
        submitText: 'حذف',
        onSubmit: async () => { deleted = await Anki.api(`/groups/${id}`, 'DELETE'); }
      });
      if (!deleted) return;

      card.remove();
      refreshLibraryStats();
      Anki.toast(deleted.message);
    }
  });

  /* ------------------------ community sorting ------------------------ */
  const grid = document.getElementById('community-grid');
  if (grid) {
    const sortTitles = { score: 'الأفضل أولاً', rating: 'الأعلى تقييماً', users: 'الأكثر استخداماً', published: 'الأحدث' };
    const num = (card, key) => Number(card.dataset[key]) || 0;

    const sortCommunity = function (key) {
      const cards = [...grid.querySelectorAll('.community-card')];
      cards.sort((a, b) => key === 'rating'
        ? (num(b, 'rating') - num(a, 'rating')) || (num(b, 'ratings') - num(a, 'ratings'))
        : (num(b, key) - num(a, key)) || (num(b, 'score') - num(a, 'score')));

      cards.forEach((card, i) => {
        grid.appendChild(card);
        const badge = card.querySelector('.rank-badge');
        if (!badge) return;
        badge.className = `rank-badge rank-${i + 1}`;
        badge.innerHTML = `<i class="fa-solid fa-trophy"></i> ${i + 1}`;
        badge.hidden = key !== 'score' || i > 2;
      });

      page.querySelectorAll('.sort-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === key);
        btn.setAttribute('aria-pressed', String(btn.dataset.sort === key));
      });
      document.getElementById('community-sort-title').textContent = sortTitles[key];
    };

    page.querySelectorAll('.sort-chip').forEach(btn => btn.addEventListener('click', () => sortCommunity(btn.dataset.sort)));
    sortCommunity('score');
  }
  /* --------------------- official groups (admins) --------------------- */
  document.addEventListener('click', async e => {
    const btn = e.target.closest('.delete-official-btn');
    if (!btn) return;
    const card = btn.closest('.official-card');

    let deleted;
    await Anki.confirm({
      title: `حذف "${card.dataset.name}"؟`,
      text: 'سيتم حذف المجموعة وكل بطاقاتها وتقدم الطلاب فيها.',
      icon: 'fa-trash',
      danger: true,
      submitText: 'حذف',
      onSubmit: async () => { deleted = await Anki.api(`/groups/${card.dataset.groupId}`, 'DELETE'); }
    });
    if (!deleted) return;
    card.remove();
    Anki.toast(deleted.message);
  });
})();
