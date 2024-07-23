const coursesContainer = document.querySelector('.courses');
const userImg = document.querySelector('.nav-bar-img');

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

coursesContainer.addEventListener('click', (e) => {
  const clicked = e.target.closest('.btn-clases');
  location.assign(`/subcourses/${clicked.dataset.subcourseid}/lessons`)
})

userImg.addEventListener('click', (e) =>{ 
  location.assign('/settings')
})