const coursesContainer = document.querySelector('.courses');
const userImg = document.querySelector('.nav-bar-img');

const buyCourseBtn = document.querySelector('.buy');
const layer = document.querySelector('.layer');
const cancelBtn = document.querySelector('.buy-cancel')
const agreeBtn = document.querySelector('.buy-accept')

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;

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
  agreeBtn.removeAttribute('data-courseid');
})

agreeBtn.addEventListener('click', async (e) => {
  const subcourseId = agreeBtn.dataset.subcourseid;
  const courseId = location.href.split('/')[4];
  const data = await ajaxCall(`${domain}/api/v1/courses/${courseId}/subcourses/${subcourseId}/activate-subcourse`, 'POST')
  if(data.status === 'success') {
    agreeBtn.removeAttribute('data-courseid');
    layer.classList.add('hidden');
  }
  return showNotification(data.message, data.status);
})

const showNotification = function(msg) {
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

coursesContainer.addEventListener('click', async (e) => {
  const id = location.href.split('/')[4];
  const clicked1 = e.target.closest('.bi-edit')
  if(clicked1){
    return location.assign(`/courses/${id}/edit-subcourse/${clicked1.closest('.first-cours').dataset.subcourseid}`)
  }

  const clicked2 = e.target.closest('.bi-trash')
  if(clicked2) {
    const deleteCount = Number(clicked2.dataset.deletecount);

    if(deleteCount !== 2) {
    if(deleteCount === 0) clicked2.classList.add('trash1');
    if(deleteCount === 1){
      clicked2.classList.remove('trash1') 
      clicked2.classList.add('trash2');
    }
    return clicked2.dataset.deletecount++;
}
  const subcourseToDelete = e.target.closest('.first-cours');

  const response = await fetch(`${domain}/api/v1/courses/${id}/subcourses/${subcourseToDelete.dataset.subcourseid}`, {
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
    layer.classList.remove('hidden');
    return agreeBtn.setAttribute('data-subcourseid', clicked3.closest('.first-cours').dataset.subcourseid);
  }


  const clicked = e.target.closest('.first-cours');
  const buyBtn = clicked.querySelector('.buy');
  if(buyBtn) return;
  location.assign(`/subcourses/${clicked.dataset.subcourseid}/lessons`)
})

userImg.addEventListener('click', (e) =>{ 
  location.assign('/settings')
})