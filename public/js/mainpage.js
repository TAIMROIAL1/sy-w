// Variables Definitions

// Elements
const darkToggle = document.getElementById('dark-toggle');
const sections = [...document.querySelectorAll('section')].filter(sec => [...sec.classList].find(className => className.startsWith('section-number')));
const layer = document.querySelector('.backdrop');

const atpNum = document.querySelector('.balance');

const notification = document.querySelector('.notifi');
const notificationMsg = document.querySelector('.notifi-message');

// Attributes
const domain = document.body.dataset.domain;

// Containers
const navbar = document.querySelector('.navbar');
const coursesContainer = document.querySelector('.courses-grid');
const footerLinksContainer = document.querySelector('.footer-links');

// Buttons
const menuButton = document.querySelector('.mobile-menu-btn');
const sectionButtons = document.querySelectorAll('.section-button');
const loginBtn = document.querySelector('.nav-cta');
const cancelBtn = document.querySelector('.cancel-btn')
const agreeBtn = document.querySelector('.confirm-btn')

let notifiTimeout;

// Helper Functions
const ajaxCall = async function(url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = {'Content-Type': 'application/json'};
  if(data) fetchOpts.body = JSON.stringify(data);
  const data2 = await fetch(url, fetchOpts);
  return await data2.json();
}

const showNotification = function (msg, type) {
  clearTimeout(notifiTimeout);
  notification.classList.remove("show-notifi");
  notification.classList.remove('hide-notifi')
  void notification.offsetWidth; // restart animation
  notification.classList.add("show-notifi");


  notification.classList.remove("green");
  notification.classList.remove("red");

  if (type === "success") notification.classList.add("green");
  else notification.classList.add("red");

  notificationMsg.textContent = msg;
  notifiTimeout = setTimeout(() => {
    notification.classList.add('hide-notifi');
  }, 2500);
};
// Handle Functions

// Listeners

menuButton.addEventListener('click', () => {
  document.getElementById('mobileMenu').style.display = document.getElementById('mobileMenu').style.display === 'block'
      ? 'none'
      : 'block';
})

darkToggle.addEventListener('change', () => {
    document.body.classList.toggle('page-dark-mode', darkToggle.checked);

    if(darkToggle.checked) {
        localStorage.setItem("darkMode", "active");
    } else {
        localStorage.removeItem("darkMode");
    }
});

navbar.addEventListener('click', (e) => {
  const clicked = e.target;

  if(clicked.closest('.section-button')) {

    document.getElementById('mobileMenu').style.display = 'none';
    const secNumber = Number([...clicked.closest('.section-button').classList].find(className => className.startsWith('section-button-')).split('-')[2]);
    
    // Scroll to Section

    const targetSection = sections.find(sec => sec.classList.contains(`section-number-${secNumber}`));
    
    const rect = targetSection.getBoundingClientRect();
    const offset = 80;

    window.scrollTo({
      top: window.scrollY + rect.top - offset,
      behavior: "smooth"
    })
  }

  else if(clicked.closest('.settings-btn')) {
    location.assign(`${domain}/settings`);
  }
})

loginBtn?.addEventListener('click', () => {
  location.assign(`${domain}/sign-up`)
})


window.addEventListener("orientationchange", () => {
  document.getElementById('mobileMenu').style.display = 'none';
});

[...sections].forEach(sec => {
  const options = {
    root: null,
    threshold: 0.5
  }

  const secNumber = [...sec.classList].find(className => className.startsWith('section-number')).split('-')[2];

  const observer = new IntersectionObserver(([entry], obs) => {

    if(entry.isIntersecting){
      sectionButtons.forEach(btn => btn.classList.contains(`section-button-${secNumber}`) ? btn.classList.add('active') : btn.classList.remove('active'));}
    else 
      [...sectionButtons].find(btn => btn.classList.contains(`section-button-${secNumber}`)).classList.remove('active');
  }, options).observe(sec);

});

document.querySelector('.cta-btn').addEventListener('click', () => {

  const targetSection = sections.find(sec => sec.classList.contains('section-number-2'));

  const rect = targetSection.getBoundingClientRect();
    const offset = 80;

    window.scrollTo({
      top: window.scrollY + rect.top - offset,
      behavior: "smooth"
    })
});

footerLinksContainer.addEventListener('click', (e) => {
  const clicked = e.target;

  if(clicked.closest('.section-button')) {

    document.getElementById('mobileMenu').style.display = 'none';
    const secNumber = Number([...clicked.closest('.section-button').classList].find(className => className.startsWith('section-button-')).split('-')[2]);
    
    // Scroll to Section

    const targetSection = sections.find(sec => sec.classList.contains(`section-number-${secNumber}`));
    
    const rect = targetSection.getBoundingClientRect();
    const offset = 80;

    window.scrollTo({
      top: window.scrollY + rect.top - offset,
      behavior: "smooth"
    })
  }
});

coursesContainer.addEventListener('click', (e) => {
  const clicked = e.target;

  if(clicked.closest('.course-btn')) {
    e.preventDefault();
    layer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    return agreeBtn.setAttribute('data-courseid', clicked.closest('.course-card').dataset.courseId);
  }

  else if(clicked.closest('.course-card')) {
    const card = clicked.closest('.course-card');
    const state = card.dataset.activeState;
    const courseId = card.dataset.courseId;

    if(state && state === 'active' && courseId) {
      location.assign(`${domain}/courses/${courseId}/view`);
    }
  }
});

cancelBtn.addEventListener('click', (e) => {
  layer.classList.add('hidden');
  document.body.style.overflow = 'auto';
  agreeBtn.removeAttribute('data-courseid');
});

agreeBtn.addEventListener('click', async (e) => {
  const courseId = agreeBtn.dataset.courseid;

  agreeBtn.classList.add('hidden');
  cancelBtn.classList.add('hidden');
  const data = await ajaxCall(`${domain}/api/v1/courses/6a9eac3201a147cc688bb5ee/subcourses/${courseId}/activate-subcourse`, 'POST')

  const boughtCourseContainer = [...coursesContainer.querySelectorAll('.course-card')].find(c => c.dataset.courseId === agreeBtn.dataset.courseid);

  const price = boughtCourseContainer.querySelector('.course-price');
  const buyBtn = boughtCourseContainer.querySelector('.course-btn');
  
  if(data.status === 'success') {  
    atpNum.textContent = Number(atpNum.textContent) - Number(price.dataset.price);

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
});

// Init

// Checks dark mode
(() => {
    const darkMode = localStorage.getItem('darkMode');
    if(darkMode) {
        darkToggle.checked = true;
        document.body.classList.toggle("page-dark-mode");
    }

})();