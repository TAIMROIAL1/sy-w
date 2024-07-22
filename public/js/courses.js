const coursesContainer = document.querySelector('.courses');

coursesContainer.addEventListener('click', (e) => {
  const clicked = e.target.closest('.btn-clases');
  location.assign(`/courses/${clicked.dataset.courseid}/subcourses`)
})

const userImg = document.querySelector('.nav-bar-img');
userImg.addEventListener('click', (e) =>{ 
  location.assign('/settings')
})

const uploadBtn = document.querySelector('.upload-btn');
uploadBtn.addEventListener('click', (e) => {
  location.assign('upload-course')
})