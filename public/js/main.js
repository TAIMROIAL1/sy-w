const classesContainer = document.querySelector('.classes');
const userImg = document.querySelector('.nav-bar-img');
const uploadBtn = document.querySelector('.upload-btn');

const listIcon = document.querySelector('.list-icon');
const list = document.querySelector('.nav');
const classesBtns = [...document.querySelectorAll('.classes-btn')];

const classesSection = document.getElementById('classes-section');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;
const role = document.body.dataset.role;

const toggleList = function() {
  list.classList.toggle('hidden');
}

const goToClassesSection = function(e) {
  if(e.target.closest('.nav'))
    list.classList.add('hidden');

  classesSection.scrollIntoView({
    behavior: 'smooth'
  })
}

listIcon.addEventListener('click', toggleList)

classesBtns.forEach(cb => cb.addEventListener('click', goToClassesSection));

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
classesContainer.addEventListener('click', async (e) => {
  const clicked1 = e.target.closest('.bi-edit')
  if(clicked1){
    e.preventDefault();
    return location.assign(`/edit-class/${clicked1.closest('.card').dataset.classid}`)
  }

  const clicked2 = e.target.closest('.bi-trash')
  if(clicked2) {
    e.preventDefault();
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
  const classToDelete = e.target.closest('.first-cours');
  const response = await fetch(`${domain}/api/v1/classes/${classToDelete.dataset.classid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const data = await response.json();

  showNotification(data.message, data.status);
  if(data.status === 'success') {
    return setTimeout(() => {
      location.reload(true);
    }, 1500);
  }
  }

  const clicked = e.target.closest('.card');
  location.assign(`/classes/${clicked.dataset.classid}/courses`)
})

if(role === 'admin')
uploadBtn.addEventListener('click', (e) => {
  location.assign('/upload-class')
})