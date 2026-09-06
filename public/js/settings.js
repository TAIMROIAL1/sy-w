// Variables Definitions

const sections = document.querySelectorAll('section');
const menuBtns = document.querySelectorAll('.menu-item');
const menu = document.querySelector('.sidebar');


const layer = document.querySelector(".layer");

const toggle = document.getElementById("dark-toggle");

const notification = document.querySelector('.notifi');
const notificationMsg = document.querySelector('.notifi-message')

const domain = document.body.dataset.domain;

// Inputs
const resetPasswordInput = document.querySelector('.reset-password-input');
const activateCodeInput = document.querySelector('.activate-code-input');
const listToggleInput = document.getElementById('menu-toggle');

// Buttons
const resetPasswordBtn = document.querySelector('.reset-password-btn');
const activateCodeBtn = document.querySelector('.activate-code-btn');
const acceptLogoutBtn = document.querySelector(".logout-accept");
const cancelLogoutBtn = document.querySelector(".logout-cancel");

// Helper Functions

const showNotification = function (msg, type) {
  notification.classList.add("hidden");
  notification.classList.remove('hidden');

  notification.classList.remove("green");
  notification.classList.remove("red");

  if (type === "success") notification.classList.add("green");
  else notification.classList.add("red");

  notificationMsg.textContent = msg;
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 5000);
};

const ajaxCall = async function (url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
};

// Action Handle Functions

function closeList () {
    listToggleInput.checked = false;
}

function handleLogout() {
  closeList();

  document.body.style.overflow = 'hidden';
    layer.style.overflow = 'hidden';
    if (screen.width < 500 ) {
      list.classList.add("hidden");
    }
    return layer.classList.remove("hidden");

}

// Listeners

// Menu Bubble listener
menu.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('.menu-item');

    if(!menuBtn || menuBtn.classList.contains('active')) return;

    if(menuBtn.classList.contains("logout-btn")) {
      return handleLogout();
    }

    const itemNumber = Number([...menuBtn.classList].find(className => className.startsWith('item-number')).split('-')[2]);


    menuBtns.forEach(mb => mb.classList.contains(`item-number-${itemNumber}`) ? mb.classList.add('active') : mb.classList.remove('active'));
    sections.forEach(sec => sec.classList.add('hidden'));

    sections.forEach(sec => sec.classList.contains(`section-${itemNumber}`)? sec.classList.remove('hidden') : sec.classList.add('hidden'));
    
    closeList();
})

// Dark mode Toggle Listener
toggle.addEventListener("change", () => {
    document.body.classList.toggle("page-dark-mode");

    if(toggle.checked) {
        localStorage.setItem("darkMode", "active");
    } else {
        localStorage.removeItem("darkMode");
    }
});

resetPasswordBtn.addEventListener("click", async (e) => {
  const password = resetPasswordInput.value;
  if (!password) return showNotification("الرجاء ادحال كلمة السر الجديدة", "fail");
  

  const data = await ajaxCall(`${domain}/api/v1/users/update-password`, {
    password,
  });

  if (data.status === "success") {
    showNotification(data.message, data.status);
    setTimeout(() => location.reload(true), 2000);

    resetPasswordInput.value = "";
  }

  if (data.status === "fail") {
    const errorMsg = data.message.startsWith("Validation Error")
    ? data.message.split(":")[1].split(",")[0]
    : data.message;
    showNotification(errorMsg, "fail");
  }
});

activateCodeBtn.addEventListener("click", async (e) => {
  activateCodeBtn.classList.add('hidden');
  const code = activateCodeInput.value;
  if (!code) {
    showNotification('الرجاء ادخال الكود', "fail");
    return activateCodeBtn.classList.remove('hidden');
  }
  const data = await ajaxCall(`${domain}/api/v1/codes/activate-code`, { code });

  if (data.status === "success") {
    showNotification(data.message, data.status);
    activateCodeInput.value = "";
  }

  if (data.status === "fail") {
    const errorMsg = data.message.startsWith("Validation Error")
    ? data.message.split(":")[1].split(",")[0]
    : data.message;
    showNotification(errorMsg, "fail");
  }
  activateCodeBtn.classList.remove('hidden');
});

cancelLogoutBtn.addEventListener("click", () => {
  layer.classList.add("hidden");
  document.body.style.overflow = 'auto';
});

acceptLogoutBtn.addEventListener("click", async () => {
  await ajaxCall(`${domain}/api/v1/users/logout`, {});
  location.assign("/");
});
// Init

// Checks dark mode
(() => {
    const darkMode = localStorage.getItem('darkMode');
    if(darkMode) {
        toggle.checked = true;
        document.body.classList.toggle("page-dark-mode");
    }

})();