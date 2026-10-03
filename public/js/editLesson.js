const { domain, subcourseId, lessonId } = document.body.dataset;
const apiBase = `${domain}/api/v1/subcourses/${subcourseId}/lessons`;

const uploadBtn = document.querySelector('.btn-sub');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message');

const showNotification = function (msg, type) {
  notifcation.classList.remove('hidden');

  notifcation.classList.remove('green');
  notifcation.classList.remove('red');

  if (type === 'success') notifcation.classList.add('green');
  else notifcation.classList.add('red');

  notifcationMsg.textContent = msg;

  // restart the slide in / out animation
  notifcation.style.animation = 'none';
  void notifcation.offsetWidth;
  notifcation.style.animation = '';

  clearTimeout(showNotification.timer);
  showNotification.timer = setTimeout(() => {
    notifcation.classList.add('hidden');
  }, 5000);
};

// go back to the page the admin came from (?redirect=/...)
const goBack = function () {
  const redirect = new URLSearchParams(location.search).get('redirect');
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) location.assign(`${domain}${redirect}`);
  else history.back();
};

const sendEdit = async function (url, body, successMsg) {
  uploadBtn.disabled = true;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok || data.status !== 'success') {
      showNotification(data.message || 'حدث خطأ, الرجاء المحاولة مجددا', 'error');
      uploadBtn.disabled = false;
      return;
    }

    showNotification(data.message || successMsg, 'success');
    setTimeout(goBack, 1500);
  } catch (err) {
    showNotification('حدث خطأ, الرجاء المحاولة مجددا', 'error');
    uploadBtn.disabled = false;
  }
};

/* ---------------------------------- lesson --------------------------------- */

const lessonNameInput = document.getElementById('lesson-name');
const subNameInput = document.getElementById('lesson-sub-name');
const numInput = document.getElementById('num');

uploadBtn.addEventListener('click', () => {
  if (uploadBtn.disabled) return;

  const title = lessonNameInput.value.trim();
  const subtitle = subNameInput.value.trim();
  const num = numInput.value.trim();

  if (!title || !num) {
    showNotification('املأ عنوان الدرس ورقمه', 'error');
    return;
  }

  sendEdit(`${apiBase}/${lessonId}/edit-lesson`, { title, subtitle, num }, 'تم تعديل الدرس بنجاح');
});
