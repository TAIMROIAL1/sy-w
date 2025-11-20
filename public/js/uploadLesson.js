const nameInput = document.getElementById('lesson-name');
const photoUrlInput = document.getElementById('image');
const numberInput = document.getElementById('num');
const uploadBtn = document.querySelector('.btn-sub');
const domain = document.body.dataset.domain;

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

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


uploadBtn.addEventListener('click', async (e) => {
    const title = nameInput.value;
    const photoUrl = photoUrlInput.value;
    const num = numberInput.value;
    if(!title || !photoUrl || !num) return;
     const hrefParts = location.href.split("/");
     let res;
     if(hrefParts[3] === 'subcourses'){
    const subcourseId = location.href.split('/')[4]
     res = await fetch(`${domain}/api/v1/subcourses/${subcourseId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, photoUrl, num, subcourse: subcourseId})
    })
}

    else if(hrefParts[3] === 'workshops') {
   const workshopId = location.href.split('/')[4]
     res = await fetch(`${domain}/api/v1/workshops/${workshopId}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({title, photoUrl, num, workshop: workshopId})
    })
}
    const data = await res.json();

    showNotification(data.message, data.status);
  })