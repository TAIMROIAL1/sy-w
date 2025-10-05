const classesContainer = document.querySelector('.classes');
const userImg = document.querySelector('.nav-bar-img');
const uploadBtn = document.querySelector('.upload-btn');
const suggestedContainer = document.querySelector('#suggested-courses');
const listIcon = document.querySelector('.list-icon');
const list = document.querySelector('.nav');
const classesBtns = [...document.querySelectorAll('.classes-btn')];

const layer = document.querySelector('.backdrop');
const cancelBtn = document.querySelector('.cancel-btn')
const agreeBtn = document.querySelector('.confirm-btn')

const classesSection = document.getElementById('classes-section');

// The notifcation message
const notifcation = document.querySelector('.error');

const domain = document.body.dataset.domain;
const role = document.body.dataset.role;

const ajaxCall = async function(url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = {'Content-Type': 'application/json'};
  if(data) fetchOpts.body = JSON.stringify(data);
  const data2 = await fetch(url, fetchOpts);
  return await data2.json();
}

cancelBtn.addEventListener('click', (e) => {
  layer.classList.add('hidden');
  document.body.style.overflow = 'auto';
  agreeBtn.removeAttribute('data-courseid');
})

agreeBtn.addEventListener('click', async (e) => {
  const courseId = agreeBtn.dataset.courseid;
  const classId = location.href.split('/')[4];
  agreeBtn.classList.add('hidden');
  cancelBtn.classList.add('hidden');
  const data = await ajaxCall(`${domain}/api/v1/classes/${classId}/courses/${courseId}/activate-course`, 'POST')

  const boughtCourseContainer = [...suggestedContainer.querySelectorAll('.card')].find(c => c.dataset.courseid === agreeBtn.dataset.courseid);

  const price = boughtCourseContainer.querySelector('.salary');
  const buyBtn = boughtCourseContainer.querySelector('.buy-btn');
  
  if(data.status === 'success') {  
    // atpNum.textContent = Number(atpNum.textContent) - Number(price.querySelector('.price').textContent);

    price.remove();
    buyBtn.remove();
  }
  if(data.message === `لقد اشتريت هذا الكورس او جزء منه`){
    price.remove();
    buyBtn.remove();
  }
  agreeBtn.classList.remove('hidden');
  cancelBtn.classList.remove('hidden');
  
  agreeBtn.removeAttribute('data-courseid');
  document.body.style.overflow = 'auto';
  layer.classList.add('hidden');

  return showNotification(data.message, data.status);
})


suggestedContainer.addEventListener('click', async function(e){
  const id = e.target.closest('.card').dataset.courseid;
  if(!id) return;

  const clicked1 = e.target.closest('.bi-edit')
  if(clicked1){
    e.preventDefault();
    return location.assign(`/classes/${id}/edit-course/${clicked1.closest('.card').dataset.courseid}`)
  }

  const clicked2 = e.target.closest('.bi-trash')
  if(clicked2) {
    e.preventDefault();
    const deleteCount = Number(clicked2.dataset.deletecount);

    if(deleteCount !== 2) {
    if(deleteCount === 0) clicked2.classList.add('trash1');
    if(deleteCount === 1){
      clicked2.classList.remove('trash1') 
      clicked2.classList.add('trash2');
    }
    return clicked2.dataset.deletecount++;
}
  const courseToDelete = e.target.closest('.card');

  const response = await fetch(`${domain}/api/v1/classes/${id}/courses/${courseToDelete.dataset.courseid}`, {
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

  const clicked3 = e.target.closest('.buy-btn');
  if(clicked3) {
    e.preventDefault();
    layer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    return agreeBtn.setAttribute('data-courseid', clicked3.closest('.card').dataset.courseid);
  }

  const clicked4 = e.target.closest('.card');
  if(clicked4)
    location.assign(`/courses/${clicked4.dataset.courseid}/subcourses`)
});


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
  
  type === 'success' ? (type = 'success') : (type = 'error');

  
  const notifcationPopup = notifcation.querySelector(`.toast-${type}`);

  notifcationPopup.classList.remove('hidden');

  const notifcationMsg = notifcationPopup.querySelector('.toast-text');
  notifcationMsg.textContent = msg;
  setTimeout(() => {
      notifcation.classList.toggle('hidden');
      [...notifcation.querySelectorAll('.toast')].forEach(t => t.classList.add('hidden'));
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