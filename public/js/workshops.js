const workshopContainer = document.getElementById('workshops-section');

const classesBtns = [...document.querySelectorAll('.classes-btn')];
classesBtns.forEach(cb => cb.remove());

// const buyCourseBtn = document.querySelector('.buy');
const layer = document.querySelector('.backdrop');
const cancelBtn = document.querySelector('.cancel-btn')
const agreeBtn = document.querySelector('.confirm-btn')

const listIcon = document.querySelector('.list-icon');
const list = document.querySelector('.nav');
const atpNum = document.querySelector('.text2');

// The notifcation message
const notifcation = document.querySelector('.error');

const domain = document.body.dataset.domain;
const role = document.body.dataset.role;

const toggleList = function() {
  list.classList.toggle('hidden');
}

listIcon.addEventListener('click', toggleList)

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
  agreeBtn.removeAttribute('data-workshopid');
})

agreeBtn.addEventListener('click', async (e) => {
  const workshopId = agreeBtn.dataset.workshopid;
  agreeBtn.classList.add('hidden');
  cancelBtn.classList.add('hidden');
  const data = await ajaxCall(`${domain}/api/v1/workshops/${workshopId}/activate-workshop`, 'POST')

  const boughtWorkshopContainer = [...workshopContainer.querySelectorAll('.card')].find(c => c.dataset.workshopid === agreeBtn.dataset.workshopid);

  const price = boughtWorkshopContainer.querySelector('.salary');
  const buyBtn = boughtWorkshopContainer.querySelector('.buy-btn');
  
  if(data.status === 'success') {  
    atpNum.textContent = Number(atpNum.textContent) - Number(price.dataset.price);

    price.remove();
    buyBtn.remove();
  }
  if(data.message === `لقد اشتريت هذه الورشة`){
    price.remove();
    buyBtn.remove();
  }
  agreeBtn.classList.remove('hidden');
  cancelBtn.classList.remove('hidden');
  
  agreeBtn.removeAttribute('data-workshopid');
  document.body.style.overflow = 'auto';
  layer.classList.add('hidden');

  return showNotification(data.message, data.status);
})

workshopContainer.addEventListener('click', async (e) => {
    
    const clicked1 = e.target.closest('.buy-btn');
    if(clicked1) {

    const id = clicked1.closest('.card').dataset.workshopid;

    e.preventDefault();
    layer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    return agreeBtn.setAttribute('data-workshopid', id);
  }

  const clicked = e.target.closest('.card');
  const clickedPrice = clicked.querySelector('.salary');
  if(clickedPrice) return;
    location.assign(`/workshops/${clicked.dataset.workshopid}/lessons`)

})