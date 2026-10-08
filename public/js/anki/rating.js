/* Star rating for community groups. Works on any element with data-rate-group="<groupId>"
   that contains .stars.rateable, and optionally .rating-value / .rating-quantity / .my-rating */
(() => {
  const paintStars = (stars, value) => stars.querySelectorAll('.star i').forEach((icon, i) => {
    icon.className = i < value ? 'fa-solid fa-star' : 'fa-regular fa-star';
  });

  document.querySelectorAll('[data-rate-group] .stars.rateable').forEach(stars => {
    let original = stars.innerHTML;
    const box = stars.closest('[data-rate-group]');

    stars.addEventListener('mouseover', e => {
      const star = e.target.closest('.star');
      if (star) paintStars(stars, Number(star.dataset.value));
    });
    stars.addEventListener('mouseleave', () => { stars.innerHTML = original; });
    stars.addEventListener('click', async e => {
      const star = e.target.closest('.star');
      if (!star) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        const res = await Anki.api(`/groups/${box.dataset.rateGroup}/rate`, 'POST', { rating: Number(star.dataset.value) });
        paintStars(stars, res.data.rating);
        original = stars.innerHTML;
        box.querySelectorAll('.rating-value').forEach(el => el.textContent = res.data.ratingsAverage.toFixed(1));
        box.querySelectorAll('.rating-quantity').forEach(el => el.textContent = res.data.ratingsQuantity);
        box.querySelectorAll('.my-rating').forEach(el => el.textContent = res.data.rating);
        box.dataset.rating = res.data.ratingsAverage;
        box.dataset.ratings = res.data.ratingsQuantity;
        document.dispatchEvent(new CustomEvent('anki:rated', { detail: { groupId: box.dataset.rateGroup, ...res.data } }));
        Anki.toast(res.message);
      } catch (err) {
        Anki.toast(err.message, 'error');
      }
    });
  });
})();
