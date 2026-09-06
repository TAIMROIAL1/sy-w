const darkToggle = document.getElementById('dark-toggle');

const menuButton = document.querySelector('.mobile-menu-btn');

menuButton.addEventListener('click', () => {
  document.getElementById('mobileMenu').style.display = document.getElementById('mobileMenu').style.display === 'block'
      ? 'none'
      : 'block';
})

if (darkToggle) {
  darkToggle.addEventListener('change', () => {
    document.body.classList.toggle('page-dark-mode', darkToggle.checked);
  });
}