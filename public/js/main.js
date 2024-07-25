const classesContainer = document.querySelector('.courses');
const userImg = document.querySelector('.nav-bar-img');
const uploadBtn = document.querySelector('.upload-btn');

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

classesContainer.addEventListener('click', async (e) => {
  const clicked1 = e.target.closest('.bi-edit')
  if(clicked1){
    return location.assign(`/edit-class/${clicked1.closest('.btn-clases').dataset.classid}`)
  }

  const clicked2 = e.target.closest('.bi-trash')
  if(clicked2) {
    const deleteCount = Number(clicked2.dataset.deletecount);
    console.log(deleteCount)
    if(deleteCount !== 2) {
    if(deleteCount === 0) clicked2.classList.add('trash1');
    if(deleteCount === 1){
      clicked2.classList.remove('trash1') 
      clicked2.classList.add('trash2');
    }
    return clicked2.dataset.deletecount++;
}
  const classToDelete = e.target.closest('.btn-clases');
  const response = await fetch(`http://127.0.0.1:3000/api/v1/classes/${classToDelete.dataset.classid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  console.log(response);
  const data = await response.json();
  console.log(data);
  if(data.status === 'success') {
    showNotification(data.message);
  }
  return setTimeout(() => {
    location.reload(true);
  }, 1500);
  }

  const clicked = e.target.closest('.btn-clases');
  location.assign(`/classes/${clicked.dataset.classid}/courses`)
})

userImg.addEventListener('click', (e) =>{ 
  location.assign('/settings')
})

uploadBtn.addEventListener('click', (e) => {
  location.assign('/upload-class')
})