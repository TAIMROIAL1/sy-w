const coursesContainer = document.querySelector('.courses');
const userImg = document.querySelector('.nav-bar-img');
const uploadBtn = document.querySelector('.upload-btn');

const buyCourseBtn = document.querySelector('.buy');
const layer = document.querySelector('.layer');
const canelBtn = document.querySelector('.buy-cancel')
const agreeBtn = document.querySelector('.buy-accept')
const atpNum = document.querySelector('.atp');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;
const role = document.body.dataset.role;

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

const ajaxCall = async function(url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = {'Content-Type': 'application/json'};
  if(data) fetchOpts.body = JSON.stringify(data);
  const data2 = await fetch(url, fetchOpts);
  return await data2.json();
}

canelBtn.addEventListener('click', (e) => {
  layer.classList.add('hidden');
  document.body.style.overflow = 'auto';
  agreeBtn.removeAttribute('data-courseid');
})

agreeBtn.addEventListener('click', async (e) => {
  const courseId = agreeBtn.dataset.courseid;
  const classId = location.href.split('/')[4];
  const data = await ajaxCall(`${domain}/api/v1/classes/${classId}/courses/${courseId}/activate-course`, 'POST')
  if(data.status === 'success') {
   
    const boughtCourseContainer = [...coursesContainer.querySelectorAll('.first-cours')].find(c => c.dataset.courseid === agreeBtn.dataset.courseid);
    
    const price = boughtCourseContainer.querySelector('.price-container');
    const buyBtn = boughtCourseContainer.querySelector('.buy');
    atpNum.textContent = Number(atpNum.textContent) - Number(price.querySelector('.price').textContent);

    price.remove();
    buyBtn.remove();
  }
  
  agreeBtn.removeAttribute('data-courseid');
  document.body.style.overflow = 'auto';
  layer.classList.add('hidden');
  return showNotification(data.message, data.status);
})

coursesContainer.addEventListener('click', async (e) => {
  const id = location.href.split('/')[4];
  const clicked1 = e.target.closest('.bi-edit')
  if(clicked1){
    e.preventDefault();
    return location.assign(`/classes/${id}/edit-course/${clicked1.closest('.first-cours').dataset.courseid}`)
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
  const courseToDelete = e.target.closest('.first-cours');

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

  const clicked3 = e.target.closest('.buy');
  if(clicked3) {
    e.preventDefault();
    layer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    return agreeBtn.setAttribute('data-courseid', clicked3.closest('.first-cours').dataset.courseid);
  }

})

if(role === 'admin')
uploadBtn.addEventListener('click', (e) => {
    location.assign('upload-course')
})