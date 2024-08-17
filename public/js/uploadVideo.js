const nameInput = document.getElementById('video-name');
const videoUrlInput = document.getElementById('video-url');
const numberInput = document.getElementById('num');
const uploadBtn = document.querySelector('.btn-sub');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;

const showNotification = function(msg) {
  notifcation.classList.toggle('hidden');
  notifcationMsg.textContent = msg;
  setTimeout(() => {
      notifcation.classList.toggle('hidden');
  }, 5000)
}


uploadBtn.addEventListener('click', async (e) => {
    const title = nameInput.value;
    const videoUrl = videoUrlInput.value;
    const num = numberInput.value;
    
    if(!title || !num || !videoUrl) return;
    const lessonId = location.href.split('/')[4]
    const res = await fetch(`${domain}/api/v1/lessons/${lessonId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, num, videoUrl})
    })

    const data = await res.json();

    if(data.status === 'success') {
      showNotification(data.message);
    }
  })