const toggle = document.getElementById("darkModeSwitch");
const courseBtn = document.querySelector(".course-btn");

const { domain, courseId } = document.body.dataset;

const lessonsContainer = document.querySelector(".lessons-scroll");

const layer = document.querySelector(".backdrop");

const atpNum = document.querySelector(".balance");

const notification = document.querySelector(".notifi");
const notificationMsg = document.querySelector(".notifi-message");

const cancelBtn = document.querySelector(".cancel-btn");
const agreeBtn = document.querySelector(".confirm-btn");

const price = document.querySelector('.course-price');

const loginBtn = document.querySelector('.login-btn');

let notifiTimeout;


// Helper Functions
const ajaxCall = async function (url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = { "Content-Type": "application/json" };
  if (data) fetchOpts.body = JSON.stringify(data);
  const data2 = await fetch(url, fetchOpts);
  return await data2.json();
};

const showNotification = function (msg, type) {
  clearTimeout(notifiTimeout);
  notification.classList.remove("show-notifi");
  notification.classList.remove("hide-notifi");
  void notification.offsetWidth; // restart animation
  notification.classList.add("show-notifi");

  notification.classList.remove("green");
  notification.classList.remove("red");

  if (type === "success") notification.classList.add("green");
  else notification.classList.add("red");

  notificationMsg.textContent = msg;
  notifiTimeout = setTimeout(() => {
    notification.classList.add("hide-notifi");
  }, 2500);
};

toggle.addEventListener("change", () => {
  document.body.classList.toggle("page-dark-mode");

  if (document.body.classList.contains("page-dark-mode")) {
    localStorage.setItem("darkMode", "dark");
  } else {
    localStorage.removeItem("darkMode");
  }
});

cancelBtn.addEventListener("click", (e) => {
  layer.classList.add("hidden");
  document.body.style.overflow = "auto";
  agreeBtn.removeAttribute("data-courseid");
});

agreeBtn.addEventListener("click", async (e) => {
  const courseId = agreeBtn.dataset.courseid;

  agreeBtn.classList.add("hidden");
  cancelBtn.classList.add("hidden");
  const data = await ajaxCall(
    `${domain}/api/v1/courses/6a9eac3201a147cc688bb5ee/subcourses/${courseId}/activate-subcourse`,
    "POST",
  );

  if (data.status === "success") {
    atpNum.textContent =
      Number(atpNum.textContent) - Number(price.dataset.price);

      courseBtn.classList.remove('subscribe-btn');
      courseBtn.classList.add('enter-course-btn');
      courseBtn.textContent = "دخول الكورس";
      price.remove();
  }
  if (data.message === `لقد اشتريت هذا الكورس او جزء منه`) {
    courseBtn.classList.remove('subscribe-btn');
      courseBtn.classList.add('enter-course-btn');
      courseBtn.textContent = "دخول الكورس";
      price.remove();
  }
  agreeBtn.classList.remove("hidden");
  cancelBtn.classList.remove("hidden");

  agreeBtn.removeAttribute("data-courseid");
  document.body.style.overflow = "auto";
  layer.classList.add("hidden");

  return showNotification(data.message, data.status);
});

document.querySelectorAll(".course-lesson-header").forEach(function (header) {
  header.addEventListener("click", function () {
    const lesson = this.closest(".course-lesson");

    lesson.classList.toggle("active");
  });
});

courseBtn.addEventListener("click", () => {
  if (courseBtn.classList.contains("subscribe-btn")) {
    layer.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    return agreeBtn.setAttribute(
      "data-courseid",
      document.body.dataset.courseId,
    );
  } else if (courseBtn.classList.contains("enter-course-btn")) {
    location.assign(`${domain}/subcourses/${courseId}/lessons`);
  }
});

loginBtn?.addEventListener('click', () => {
  location.assign(`${domain}/sign-up`)
})

lessonsContainer.addEventListener("click", (e) => {
  const enterBtn = e.target.closest(".enter-lesson");

  if (!enterBtn) return;
  const {courseId} = document.body.dataset;
  location.assign(`${domain}/subcourses/${courseId}/lessons`);
});

document.querySelectorAll('.course-lesson-header').forEach(header => {
  header.addEventListener('click', () => {
    const lesson = header.parentElement;

    

    // If lesson is disabled, do nothing
    if (lesson.classList.contains('disabledLesson')) return;


    // Close all other lessons
    document.querySelectorAll('.course-lesson.active').forEach(openLesson => {
      if (openLesson !== lesson) {
        openLesson.classList.remove('active');
      }
    });

    // Toggle the clicked one
    lesson.classList.add('active');

    console.log(lesson.classList.contains('active'));
  });
});

// Checks dark mode
(() => {
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode) {
    toggle.checked = true;
    document.body.classList.toggle("page-dark-mode");
  }
})();