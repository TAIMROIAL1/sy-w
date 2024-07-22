const coursesContainer = document.querySelector('.courses');

coursesContainer.addEventListener('click', (e) => {
  const clicked = e.target.closest('.btn-clases');
  location.assign(`/subcourses/${clicked.dataset.subcourseid}/lessons`)
})

const userImg = document.querySelector('.nav-bar-img');
userImg.addEventListener('click', (e) =>{ 
  location.assign('/settings')
})