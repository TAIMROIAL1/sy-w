const toggle = document.getElementById("darkModeSwitch");
const courseBtn = document.querySelector('.course-btn');

const {domain, courseId} = document.body.dataset;


toggle.addEventListener("change", () => {
  document.body.classList.toggle("page-dark-mode");

  if (document.body.classList.contains("page-dark-mode")) {
    localStorage.setItem("darkMode", "dark");
  } else {
    localStorage.removeItem("darkMode");
  }
});

document.querySelectorAll(".course-lesson-header").forEach(function(header) {

            header.addEventListener("click", function() {

                const lesson = this.closest(".course-lesson");

                lesson.classList.toggle("active");

            });

        });


courseBtn.addEventListener('click', () => {
  if(courseBtn.classList.contains('subscribe-btn')) {

  }
  else if(courseBtn.classList.contains('enter-course-btn')) {
    location.assign(`${domain}/subcourses/${courseId}/lessons`);
  }
});

// Checks dark mode
(() => {
    const darkMode = localStorage.getItem('darkMode');
    if(darkMode) {
        toggle.checked = true;
        document.body.classList.toggle("page-dark-mode");
    }

})();