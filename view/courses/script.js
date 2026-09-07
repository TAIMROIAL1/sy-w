const toggle = document.getElementById("darkModeSwitch");

toggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("mode", "dark");
  } else {
    localStorage.setItem("mode", "light");
  }
});

// Load saved mode
if (localStorage.getItem("mode") === "dark") {
  document.body.classList.add("dark");
  toggle.checked = true;
}
