// Variables Definitions

const darkToggle = document.getElementById('dark-toggle');

const navbar = document.querySelector('.navbar');

const sections = [...document.querySelectorAll('section')].filter(sec => [...sec.classList].find(className => className.startsWith('section-number')));

const domain = document.body.dataset.domain;
// Buttons
const menuButton = document.querySelector('.mobile-menu-btn');
const sectionButtons = document.querySelectorAll('.section-button');



// Helper Functions


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

document.querySelector('.footer-links').addEventListener('click', (e) => {
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

// Init

// Checks dark mode
(() => {
    const darkMode = localStorage.getItem('darkMode');
    if(darkMode) {
        darkToggle.checked = true;
        document.body.classList.toggle("page-dark-mode");
    }

})();