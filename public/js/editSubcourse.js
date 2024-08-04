const nameInput = document.getElementById('subcourse-name');
const descriptionInput = document.getElementById('subcourse-des');
const photoUrlInput = document.getElementById('image');
const priceInput = document.getElementById('price');
const editBtn = document.querySelector('.btn-sub');

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

editBtn.addEventListener('click', async (e) => {
    const title = nameInput.value;
    const description = descriptionInput.value;
    const photoUrl = photoUrlInput.value;
    const price = priceInput.value;

    const courseId = location.href.split('/')[4];
    const subcourseId = location.href.split('/')[6];

    if(!title || !description || !photoUrl || !price) return;

    const res = await fetch(`${domain}/api/v1/courses/${courseId}/subcourses/${subcourseId}/edit-subcourse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, description, photoUrl, price})
    })

    const data = await res.json();
    if(data.status === 'success') {
      showNotification(data.message);
    }
    else if(data.status === 'fail') {
      showNotification(data.message);
    }
  })