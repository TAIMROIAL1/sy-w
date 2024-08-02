const nameInput = document.getElementById('lesson-name');
const photoUrlInput = document.getElementById('image');
const numberInput = document.getElementById('num');
const uploadBtn = document.querySelector('.btn-sub');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const showNotification = function(msg) {
  notifcation.classList.toggle('hidden');
  notifcationMsg.textContent = msg;
  setTimeout(() => {
      notifcation.classList.toggle('hidden');
  }, 5000)
}


uploadBtn.addEventListener('click', async (e) => {
    const title = nameInput.value;
    const photoUrl = photoUrlInput.value;
    const num = numberInput.value;
    if(!title || !photoUrl || !num) return;
    const subcourseId = location.href.split('/')[4]
    const res = await fetch(`http://127.0.0.1:3000/api/v1/subcourses/${subcourseId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, photoUrl, num, subcourse: subcourseId})
    })

    const data = await res.json();

    if(data.status === 'success') {
      showNotification(data.message);
    }
  })