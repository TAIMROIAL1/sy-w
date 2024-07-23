const nameInput = document.getElementById('class-name');
const descriptionInput = document.getElementById('class-des');
const photoUrlInput = document.getElementById('image');
const editBtn = document.querySelector('.btn-sub');

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

editBtn.addEventListener('click', async (e) => {
    const title = nameInput.value;
    const description = descriptionInput.value;
    const photoUrl = photoUrlInput.value;
    const id = location.href.split('/')[4];

    if(!title || !description || !photoUrl) return;
    console.log(`http://127.0.0.1:3000/api/v1/classes/${id}/edit-class`)
    const res = await fetch(`http://127.0.0.1:3000/api/v1/classes/${id}/edit-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, description, photoUrl})
    })

    const data = await res.json();
    if(data.status === 'success') {
      showNotification(data.message);
    }
    else if(data.status === 'fail') {
      showNotification(data.message);
    }
  })