// The list that conatins buttons for bubbling event with the interfaces
const btnsList = document.querySelector('.btn-list');
const interfaces = [...document.querySelectorAll('.setting-info')]

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

const showNotification = function(msg, type = 'success') {
    notifcation.classList.toggle('hidden');
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

    interfaces.forEach(int => {
        if(!int.classList.contains(interfaceClass)) int.classList.add('hidden');
        else int.classList.remove('hidden');
    })
})

activateCodeBtn.addEventListener('click', async (e) => {
    const code = codeInput.value;
    if(!code) return;
    const data = await ajaxCall(`${domain}/api/v1/codes/activate-code`, {code});

    if(data.status === 'success') {
        showNotification(data.message);
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
        showNotification(data.message)
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
        showNotification(data.message)
        setTimeout(() => location.reload(true), 2000);
        currentPasswordInput.value = '';
        passwordInput.value = '';
        passwordConfirmInput.value = '';
    }

    if(data.status === 'fail') {
        showError(data.path, data.message);
    }

})

createCodeBtn.addEventListener('click', async (e) => {
    const codeToUpload = createCodeInput.value;
    const codeToUploadValue = createCodeValueInput.value;
    if(!codeToUpload || !codeToUploadValue) return;

    const data = await ajaxCall(`${domain}/api/v1/codes`, {code: codeToUpload, value: codeToUploadValue});

    if(data.status === 'success') {
        showNotification(data.message);
    }
    if(data.status === 'fail' || data.status === 'error') {
        showNotification(data.message);
    }
})

coursesContainer.addEventListener('click', (e) => {
    const clicked = e.target.closest('.course-container');
    if(!clicked) return;

    const subcourseId = clicked.dataset.subcourseid;
    return location.assign(`/subcourses/${subcourseId}/lessons`);
})
