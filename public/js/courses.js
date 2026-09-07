const toggle = document.getElementById("darkModeSwitch");

toggle.addEventListener("change", () => {
  document.body.classList.toggle("page-dark-mode");

  if (document.body.classList.contains("page-dark-mode")) {
    localStorage.setItem("mode", "dark");
  } else {
    localStorage.setItem("mode", "light");
  }
});

// Load saved mode
if (localStorage.getItem("mode") === "dark") {
  document.body.classList.add("page-dark-mode");
  toggle.checked = true;
}
