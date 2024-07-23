const nameInput = document.getElementById('course-name');
const descriptionInput = document.getElementById('course-des');
const photoUrlInput = document.getElementById('image');
const priceInput = document.getElementById('price');
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
    const price = priceInput.value;

    const classId = location.href.split('/')[4];
    const courseId = location.href.split('/')[6];

    if(!title || !description || !photoUrl || !price) return;

    const res = await fetch(`http://127.0.0.1:3000/api/v1/classes/${classId}/courses/${courseId}/edit-course`, {
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