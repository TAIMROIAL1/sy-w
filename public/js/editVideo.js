const nameInput = document.getElementById('video-name');
const numberInput = document.getElementById('num');
const uploadBtn = document.querySelector('.btn-sub');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;

const showNotification = function(msg, type) {
  notifcation.classList.toggle('hidden');

  notifcation.classList.remove('green');
  notifcation.classList.remove('red');

  if(type === 'success')
    notifcation.classList.add('green');
  else
    notifcation.classList.add('red');

  notifcationMsg.textContent = msg;
  setTimeout(() => {
      notifcation.classList.toggle('hidden');
  }, 5000)
}


uploadBtn.addEventListener('click', async (e) => {
    const title = nameInput.value;
    const num = numberInput.value;
    if(!title || !num) return;

    const lessonId = location.href.split('/')[4];
    const videoId = location.href.split('/')[6];
    const res = await fetch(`${domain}/api/v1/lessons/${lessonId}/videos/${videoId}/edit-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, num})
    })

    const data = await res.json();

    showNotification(data.message, data.status);
  })