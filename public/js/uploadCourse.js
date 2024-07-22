const nameInput = document.getElementById('class-name');
const descriptionInput = document.getElementById('class-des');
const photoUrlInput = document.getElementById('image');
const priceInput = document.getElementById('num');
const uploadBtn = document.querySelector('.btn-sub');

uploadBtn.addEventListener('click', async (e) => {
    const title = nameInput.value;
    const description = descriptionInput.value;
    const photoUrl = photoUrlInput.value;
    const price = priceInput.value;
    if(!title || !description || !photoUrl || !price) return;
    const id = location.href.split('/')[4]
    const res = await fetch(`http://127.0.0.1:3000/api/v1/classes/${id}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, description, photoUrl, price})
    })
    console.log(res)
    const data = await res.json();
    console.log(data);
})