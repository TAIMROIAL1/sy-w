const classesContainer = document.querySelector('.courses');

classesContainer.addEventListener('click', (e) => {
  const clicked = e.target.closest('.btn-clases');
  location.assign(`/classes/${clicked.dataset.classid}/courses`)
})

const userImg = document.querySelector('.nav-bar-img');
userImg.addEventListener('click', (e) =>{ 
  location.assign('/settings')
})