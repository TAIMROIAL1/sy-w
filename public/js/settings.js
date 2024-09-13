// The list that conatins buttons for bubbling event with the interfaces
const btnsList = document.querySelector('.btn-list');
const interfaces = [...document.querySelectorAll('.setting-info')]

const layer = document.querySelector('.layer');
const acceptLogoutBtn = document.querySelector('.logout-accept')
const cancelLogoutBtn = document.querySelector('.logout-cancel')
// Input and their buttons
const codeInput = document.getElementById('code');
const activateCodeBtn = document.getElementById('activation-code-btn');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const nameEmailUpdateBtn = document.getElementById('name-email-update-btn')

const currentPasswordInput = document.getElementById('current-password');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password-confirm');
const passwordUpdateBtn = document.getElementById('password-update-btn')

const createCodeInput = document.getElementById('code-upload');
const createCodeValueInput = document.getElementById('code-value');
const createCodeBtn = document.getElementById('creation-code-btn');

const coursesContainer = document.querySelector('.my-courses');

// The correct/wrong message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;
const role = document.body.dataset.role;

// The list button for mobile size
const listBtn = document.querySelector('.setting-btn');
const list = document.querySelector('.list');

const showError = function(field, msg) {
    if(field === 'passwordConfirm') field = 'password-confirm'
    const errs = [...document.querySelectorAll('.error')];
    errs.forEach(err => {
      err.classList.add('hidden');
    })

    if(field === 'message') {
        return showNotification(msg, 'fail');
    }

      const errDiv = document.querySelector(`.error-${field}`);
      errDiv.classList.remove('hidden');
      const msgDiv = errDiv.querySelector('.error-message');
      const errorMsg = msg.startsWith('Validation Error') ? msg.split(':')[1].split(',')[0] : msg;
      msgDiv.textContent = errorMsg;
}

const showNotification = function(msg, type) {
    notifcation.classList.toggle('hidden');

    notifcation.classList.remove('green');
    notifcation.classList.remove('red');
  
    if(type === 'success')
      notifcation.classList.add('green');
    else
      notifcation.classList.add('red');

    notifcationMsg.textContent = msg;
    setTimeout(() => {
        notifcation.classList.toggle('hidden');
    }, 5000)
}

listBtn.addEventListener('click', (e) => {
    list.classList.toggle('hidden');
})

const ajaxCall = async function(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    return await response.json();
}

btnsList.addEventListener('click', (e) => {
    const clicked = e.target.closest('.btn');
    if(!clicked) return;

    const parts = clicked.className.split(' ')[1].split('-')
    const interfaceClass = parts[0] + '-' + parts[1];
    
    if(interfaceClass === 'logout-btn') return layer.classList.remove('hidden');

    interfaces.forEach(int => {
        if(!int.classList.contains(interfaceClass)) int.classList.add('hidden');
        else int.classList.remove('hidden');
    })
    if(window.innerWidth < 500)
    list.classList.add('hidden');
})

cancelLogoutBtn.addEventListener('click', () => {
    layer.classList.add('hidden');
})

acceptLogoutBtn.addEventListener('click', async () => {
    await ajaxCall(`${domain}/api/v1/users/logout`, {});
    location.assign('/')
})

activateCodeBtn.addEventListener('click', async (e) => {
    const code = codeInput.value;
    if(!code) return;
    const data = await ajaxCall(`${domain}/api/v1/codes/activate-code`, {code});

    if(data.status === 'success') {
        showNotification(data.message, data.status);
        codeInput.value = '';
    }

    if(data.status === 'fail') {
        showError(data.path, data.message);
    } 
})

nameEmailUpdateBtn.addEventListener('click', async (e) => {
    const name = nameInput.value;
    const email = emailInput.value;
    if(!name) return showError('name', 'الرجاء ادخال الاسم');
    if(!email) return showError('email', 'الرجاء ادخال البريد الالكتروني');

    const data = await ajaxCall(`${domain}/api/v1/users/update-email-name`, {name, email});

    if(data.status === 'success') {
        showNotification(data.message, data.status)
    }

    if(data.status === 'fail') {
        showError(data.path, data.message);
    }
})

passwordUpdateBtn.addEventListener('click', async (e) => {
    const currentPassword = currentPasswordInput.value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    if(!currentPassword) return showError('current-password', 'الرجاء ادخال كلمة السر الحالية');
    if(!password) return showError('password', 'الرجاء ادخال كلمة السر الجديدة');
    if(!passwordConfirm) return showError('password-confirm', 'الرجاء تاكيد كلمة السر');

    const data = await ajaxCall(`${domain}/api/v1/users/update-password`, {currentPassword, password, passwordConfirm});

    if(data.status === 'success') {
        showNotification(data.message, data.status)
        setTimeout(() => location.reload(true), 2000);
        currentPasswordInput.value = '';
        passwordInput.value = '';
        passwordConfirmInput.value = '';
    }

    if(data.status === 'fail') {
        showError(data.path, data.message);
    }

})

if(role === 'admin')
createCodeBtn.addEventListener('click', async (e) => {
    const codeToUpload = createCodeInput.value;
    const codeToUploadValue = createCodeValueInput.value;
    if(!codeToUpload || !codeToUploadValue) return;

    const data = await ajaxCall(`${domain}/api/v1/codes`, {code: codeToUpload, value: codeToUploadValue});

    showNotification(data.message, data.status);
})

coursesContainer.addEventListener('click', (e) => {
    const clicked = e.target.closest('.course-container');
    if(!clicked) return;

    const subcourseId = clicked.dataset.subcourseid;
    return location.assign(`/subcourses/${subcourseId}/lessons`);
})

window.addEventListener('orientationchange', (e) => {
    if(screen.width > 500 && screen.height > 500) return;
    if(window.matchMedia("(orientation: portrait)").matches) list.classList.remove('hidden');
    else list.classList.add('hidden');
})