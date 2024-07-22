const nameInput = document.getElementById('class-name');
const descriptionInput = document.getElementById('class-des');
const photoUrlInput = document.getElementById('image');
const uploadBtn = document.querySelector('.btn-sub');

console.log(nameInput, descriptionInput, photoUrlInput, uploadBtn)

uploadBtn.addEventListener('click', async (e) => {
    const title = nameInput.value;
    const description = descriptionInput.value;
    const photoUrl = photoUrlInput.value;

    if(!title || !description || !photoUrl) return;
    const res = await fetch('http://127.0.0.1:3000/api/v1/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, description, photoUrl})
    })
    console.log(res)
    const data = await res.json();
    console.log(data);
})