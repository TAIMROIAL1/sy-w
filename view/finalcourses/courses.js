const toggle = document.getElementById("darkModeSwitch");

toggle.addEventListener("change", () => {
  document.body.classList.toggle("page-dark-mode");

  if (document.body.classList.contains("page-dark-mode")) {
    localStorage.setItem("darkMode", "dark");
  } else {
    localStorage.removeItem("darkMode");
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
