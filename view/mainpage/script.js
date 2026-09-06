const darkToggle = document.getElementById('dark-toggle');

if (darkToggle) {
  darkToggle.addEventListener('change', () => {
    document.body.classList.toggle('page-dark-mode', darkToggle.checked);
  });
}

const track = document.querySelector('.courses-track');
const cards = Array.from(document.querySelectorAll('.courses-track .course-card'));
const prevBtn = document.querySelector('.courses-arrow-prev');
const nextBtn = document.querySelector('.courses-arrow-next');
const dots = Array.from(document.querySelectorAll('.courses-dot'));

let currentIndex = 0;

// ⭐ Smooth looping version
function updateSlider(index) {
  // Wrap index (infinite loop)
  currentIndex = (index + cards.length) % cards.length;

  track.style.transition = "transform 0.4s ease";
  track.style.transform = `translateX(${-currentIndex * 100}%)`;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

// ⭐ RTL: left arrow → next
prevBtn.addEventListener('click', () => {
  updateSlider(currentIndex + 1);
});

// ⭐ RTL: right arrow → previous
nextBtn.addEventListener('click', () => {
  updateSlider(currentIndex - 1);
});

// ⭐ Dot click
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => updateSlider(i));
});

// ⭐ Swipe support (RTL)
let startX = null;

track.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

track.addEventListener('touchend', (e) => {
  if (startX === null) return;

  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;

  if (Math.abs(diff) > 50) {
    if (diff < 0) {
      // swipe left → previous (RTL)
      updateSlider(currentIndex - 1);
    } else {
      // swipe right → next (RTL)
      updateSlider(currentIndex + 1);
    }
  }

  startX = null;
});

// ⭐ Initialize
updateSlider(0);
