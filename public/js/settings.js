// Variables Definitions

const sections = document.querySelectorAll('section');
const menuBtns = document.querySelectorAll('.menu-item');
const menu = document.querySelector('.sidebar');


const layer = document.querySelector(".layer");

const toggle = document.getElementById("dark-toggle");

const notification = document.querySelector('.notifi');
const notificationMsg = document.querySelector('.notifi-message')

const domain = document.body.dataset.domain;

const coursesSection = document.querySelector('.section-2');
// Inputs
const resetPasswordInput = document.querySelector('.reset-password-input');
const activateCodeInput = document.querySelector('.activate-code-input');
const listToggleInput = document.getElementById('menu-toggle');

// Buttons
const resetPasswordBtn = document.querySelector('.reset-password-btn');
const activateCodeBtn = document.querySelector('.activate-code-btn');
const acceptLogoutBtn = document.querySelector(".logout-accept");
const cancelLogoutBtn = document.querySelector(".logout-cancel");

// Helper Functions

const showNotification = function (msg, type) {
  notification.classList.add("hidden");
  notification.classList.remove('hidden');

  notification.classList.remove("green");
  notification.classList.remove("red");

  if (type === "success") notification.classList.add("green");
  else notification.classList.add("red");

  notificationMsg.textContent = msg;
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 5000);
};

const ajaxCall = async function (url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
};

// Action Handle Functions

function closeList () {
    listToggleInput.checked = false;
}

function handleLogout() {
  closeList();

  document.body.style.overflow = 'hidden';
    layer.style.overflow = 'hidden';
    return layer.classList.remove("hidden");

}

// Listeners

// Menu Bubble listener
menu.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('.menu-item');

    if(!menuBtn || menuBtn.classList.contains('active')) return;
    // plain links (anki, tests) just navigate
    if(menuBtn.classList.contains('menu-link')) return;

    if(menuBtn.classList.contains("logout-btn")) {
      return handleLogout();
    }

    const itemNumber = Number([...menuBtn.classList].find(className => className.startsWith('item-number')).split('-')[2]);


    menuBtns.forEach(mb => mb.classList.contains(`item-number-${itemNumber}`) ? mb.classList.add('active') : mb.classList.remove('active'));
    sections.forEach(sec => sec.classList.add('hidden'));

    sections.forEach(sec => sec.classList.contains(`section-${itemNumber}`)? sec.classList.remove('hidden') : sec.classList.add('hidden'));
    
    closeList();
})

coursesSection.addEventListener('click', (e) => {
  const clicked = e.target.closest('.enter-course-btn');

  if(!clicked) return;

  const { courseId }= clicked.closest('article').dataset;
  location.assign(`${domain}/subcourses/${courseId}/lessons`)
})

// Dark mode Toggle Listener
toggle.addEventListener("change", () => {
    document.body.classList.toggle("page-dark-mode");

    if(toggle.checked) {
        localStorage.setItem("darkMode", "active");
    } else {
        localStorage.removeItem("darkMode");
    }
});

resetPasswordBtn.addEventListener("click", async (e) => {
  const password = resetPasswordInput.value;
  if (!password) return showNotification("الرجاء ادحال كلمة السر الجديدة", "fail");
  

  const data = await ajaxCall(`${domain}/api/v1/users/update-password`, {
    password,
  });

  if (data.status === "success") {
    showNotification(data.message, data.status);
    setTimeout(() => location.reload(true), 2000);

    resetPasswordInput.value = "";
  }

  if (data.status === "fail") {
    const errorMsg = data.message.startsWith("Validation Error")
    ? data.message.split(":")[1].split(",")[0]
    : data.message;
    showNotification(errorMsg, "fail");
  }
});

activateCodeBtn.addEventListener("click", async (e) => {
  activateCodeBtn.classList.add('hidden');
  const code = activateCodeInput.value;
  if (!code) {
    showNotification('الرجاء ادخال الكود', "fail");
    return activateCodeBtn.classList.remove('hidden');
  }
  const data = await ajaxCall(`${domain}/api/v1/codes/activate-code`, { code });

  if (data.status === "success") {
    showNotification(data.message, data.status);
    activateCodeInput.value = "";
  }

  if (data.status === "fail") {
    const errorMsg = data.message.startsWith("Validation Error")
    ? data.message.split(":")[1].split(",")[0]
    : data.message;
    showNotification(errorMsg, "fail");
  }
  activateCodeBtn.classList.remove('hidden');
});

cancelLogoutBtn.addEventListener("click", () => {
  layer.classList.add("hidden");
  document.body.style.overflow = 'auto';
});

acceptLogoutBtn.addEventListener("click", async () => {
  await ajaxCall(`${domain}/api/v1/users/logout`, {});
  location.assign("/");
});
// Init

// Checks dark mode
(() => {
    const darkMode = localStorage.getItem('darkMode');
    if(darkMode) {
        toggle.checked = true;
        document.body.classList.toggle("page-dark-mode");
    }

})();

// ================= Saved Notes (server) =================

const notesCard = document.querySelector('.notes-card');
const notesPreview = document.querySelector('.notes-preview');
const notesEmptyMsg = notesCard && notesCard.querySelector('.saved-empty');
const notesLoadingEl = notesCard && notesCard.querySelector('.notes-loading');
let notesRequestId = 0;

const notesFetch = async function (url, options) {
  const response = await fetch(url, options);
  let json = {};
  try {
    json = await response.json();
  } catch (e) {}

  if (!response.ok || json.status === 'fail' || json.status === 'error') {
    throw new Error(json.message || 'حدث خطأ، حاول مرة أخرى');
  }
  return json;
};

function getSubcourseIds() {
  const ids = [...document.querySelectorAll('article.course')].map(c => c.dataset.courseId).filter(Boolean);
  return [...new Set(ids)];
}

function formatNoteDate(date) {
  const d = new Date(date);
  if (!date || isNaN(d)) return '';
  return d.toLocaleDateString('ar') + ' - ' + d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
}

function setNotesLoading(isLoading) {
  notesLoadingEl.classList.toggle('hidden', !isLoading);
  if (isLoading) {
    notesPreview.innerHTML = '';
    notesEmptyMsg.classList.add('hidden');
  }
}

function showNotesError(message) {
  notesPreview.innerHTML = '';
  notesEmptyMsg.classList.add('hidden');

  const box = document.createElement('div');
  box.className = 'notes-error';

  const text = document.createElement('p');
  text.textContent = message || 'تعذّر تحميل الملاحظات';

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'notes-retry';
  retry.textContent = 'إعادة المحاولة';
  retry.addEventListener('click', () => loadSavedNotes());

  box.appendChild(text);
  box.appendChild(retry);
  notesPreview.appendChild(box);
}

function renderSavedNotes(notes) {
  notesPreview.innerHTML = '';
  notesEmptyMsg.classList.toggle('hidden', notes.length > 0);

  notes.forEach(note => {
    const rect = document.createElement('div');
    rect.className = 'note-rect';
    rect.dataset.id = note._id;
    rect.title = 'فتح الفيديو';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'note-rect-delete';
    del.setAttribute('aria-label', 'حذف الملاحظة');
    del.innerHTML = '&times;';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSavedNote(note);
    });

    const text = document.createElement('p');
    text.className = 'note-rect-text';
    text.textContent = note.noteText || '';

    const video = document.createElement('span');
    video.className = 'note-rect-video';
    video.textContent = [note.courseTitle, note.videoTitle].filter(Boolean).join(' • ');

    const meta = document.createElement('div');
    meta.className = 'note-rect-meta';

    const lesson = document.createElement('span');
    lesson.className = 'note-rect-lesson';
    lesson.textContent = `الدرس: ${note.lessonTitle || ''}`;

    const time = document.createElement('span');
    time.className = 'note-rect-time';
    time.textContent = formatNoteDate(note.date);

    meta.appendChild(lesson);
    meta.appendChild(time);

    rect.appendChild(del);
    rect.appendChild(text);
    if (video.textContent) rect.appendChild(video);
    rect.appendChild(meta);

    rect.addEventListener('click', () => {
      location.assign(`${domain}/subcourses/${note.subcourseId}/lessons?resNum=${note.videoNum}&lessonNum=${note.lessonNum}`);
    });

    notesPreview.appendChild(rect);
  });
}

async function loadSavedNotes() {
  if (!notesPreview || !notesLoadingEl) return;

  const token = ++notesRequestId;
  setNotesLoading(true);

  try {
    const results = await Promise.all(
      getSubcourseIds().map(id => notesFetch(`${domain}/api/v1/notes/${id}/all-notes`))
    );
    if (token !== notesRequestId) return;

    const notes = results
      .flatMap(res => (Array.isArray(res.data) ? res.data : []))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    setNotesLoading(false);
    renderSavedNotes(notes);
  } catch (err) {
    if (token !== notesRequestId) return;
    setNotesLoading(false);
    showNotesError(err.message);
  }
}

async function deleteSavedNote(note) {
  setNotesLoading(true);

  try {
    await notesFetch(`${domain}/api/v1/notes/${note.subcourseId}/delete-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: note._id }),
    });
    loadSavedNotes();
  } catch (err) {
    showNotification(err.message, 'fail');
    loadSavedNotes();
  }
}

// تحميل الملاحظات عند فتح قسم الملاحظات المحفوظة
menuBtns.forEach(btn => {
  if (btn.classList.contains('item-number-5')) btn.addEventListener('click', () => loadSavedNotes());
});

// ================= Saved Videos (server) =================

const savedCard = document.querySelector('.saved-videos-card');
const savedGrid = savedCard && savedCard.querySelector('.saved-videos-grid');
const savedEmptyMsg = savedCard && savedCard.querySelector('.saved-empty');
const savedLoadingEl = savedCard && savedCard.querySelector('.saved-loading');
let savedRequestId = 0;

function setSavedLoading(isLoading) {
  savedLoadingEl.classList.toggle('hidden', !isLoading);
  if (isLoading) {
    savedGrid.innerHTML = '';
    savedEmptyMsg.classList.add('hidden');
  }
}

function showSavedError(message) {
  savedGrid.innerHTML = '';
  savedEmptyMsg.classList.add('hidden');

  const box = document.createElement('div');
  box.className = 'notes-error';

  const text = document.createElement('p');
  text.textContent = message || 'تعذّر تحميل الفيديوهات المحفوظة';

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'notes-retry';
  retry.textContent = 'إعادة المحاولة';
  retry.addEventListener('click', () => loadSavedVideos());

  box.appendChild(text);
  box.appendChild(retry);
  savedGrid.appendChild(box);
}

function renderSavedVideos(videos) {
  savedGrid.innerHTML = '';
  savedEmptyMsg.classList.toggle('hidden', videos.length > 0);

  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'sv-card';
    card.dataset.id = video._id;
    card.title = 'فتح الفيديو';

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'sv-delete';
    del.setAttribute('aria-label', 'إزالة الفيديو');
    del.innerHTML = '&times;';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      removeSavedVideo(video);
    });

    const play = document.createElement('div');
    play.className = 'sv-play';
    play.textContent = '▶';

    const name = document.createElement('h4');
    name.className = 'sv-name';
    name.textContent = video.videoTitle || 'فيديو';

    const course = document.createElement('p');
    course.className = 'saved-video-course';
    course.textContent = [video.courseTitle, video.lessonTitle].filter(Boolean).join(' • ');

    const reason = document.createElement('p');
    reason.className = 'sv-reason';
    const label = document.createElement('span');
    label.className = 'sv-label';
    label.textContent = 'سبب الحفظ:';
    reason.appendChild(label);
    reason.appendChild(document.createTextNode(' ' + (video.reason || 'بدون سبب')));

    const meta = document.createElement('div');
    meta.className = 'sv-meta';
    const d = new Date(video.date);
    const valid = video.date && !isNaN(d);
    const dateEl = document.createElement('span');
    dateEl.className = 'sv-date';
    dateEl.textContent = valid ? d.toLocaleDateString('ar') : '';
    const timeEl = document.createElement('span');
    timeEl.className = 'sv-time';
    timeEl.textContent = valid ? d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '';
    meta.appendChild(dateEl);
    meta.appendChild(timeEl);

    const top = document.createElement('div');
    top.appendChild(play);

    const body = document.createElement('div');
    body.appendChild(name);
    if (course.textContent) body.appendChild(course);

    card.appendChild(del);
    card.appendChild(top);
    card.appendChild(body);
    card.appendChild(reason);
    card.appendChild(meta);

    card.addEventListener('click', () => {
      location.assign(`${domain}/subcourses/${video.subcourseId}/lessons?resNum=${video.videoNum}&lessonNum=${video.lessonNum}`);
    });

    savedGrid.appendChild(card);
  });
}

async function loadSavedVideos() {
  if (!savedGrid || !savedLoadingEl) return;

  const token = ++savedRequestId;
  setSavedLoading(true);

  try {
    const results = await Promise.all(
      getSubcourseIds().map(id => notesFetch(`${domain}/api/v1/saved-videos/${id}/all-saved`))
    );
    if (token !== savedRequestId) return;

    const videos = results
      .flatMap(res => (Array.isArray(res.data) ? res.data : []))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    setSavedLoading(false);
    renderSavedVideos(videos);
  } catch (err) {
    if (token !== savedRequestId) return;
    setSavedLoading(false);
    showSavedError(err.message);
  }
}

async function removeSavedVideo(video) {
  setSavedLoading(true);

  try {
    await notesFetch(`${domain}/api/v1/saved-videos/${video.subcourseId}/unsave-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedId: video._id }),
    });
  } catch (err) {
    showNotification(err.message, 'fail');
  }
  loadSavedVideos();
}

// تحميل الفيديوهات عند فتح قسم الفيديوهات المحفوظة
menuBtns.forEach(btn => {
  if (btn.classList.contains('item-number-4')) btn.addEventListener('click', () => loadSavedVideos());
});
