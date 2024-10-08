const nameInput = document.getElementById('class-name');
const descriptionInput = document.getElementById('class-des');
const photoUrlInput = document.getElementById('image');
const uploadBtn = document.querySelector('.btn-sub');
const domain = document.body.dataset.domain;

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

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
    const description = descriptionInput.value;
    const photoUrl = photoUrlInput.value;

    if(!title || !description || !photoUrl) return;
    const res = await fetch(`${domain}/api/v1/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, description, photoUrl})
    })

    const data = await res.json();
    showNotification(data.message, data.status);
  })