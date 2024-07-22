const btnsList = document.querySelector('.btn-list');
const interfaces = [...document.querySelectorAll('.setting-info')]

const codeInput = document.getElementById('code');
const activateCodeBtn = document.getElementById('activation-code-btn');

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
    console.log(interfaceClass)

    interfaces.forEach(int => {
        if(!int.classList.contains(interfaceClass)) int.classList.add('hidden');
        else int.classList.remove('hidden');
    })
})

activateCodeBtn.addEventListener('click', async (e) => {
    const code = codeInput.value;
    if(!code) return;
    const data = await ajaxCall('http://127.0.0.1:3000/api/v1/codes/activate-code', {code});
    console.log(data);
})