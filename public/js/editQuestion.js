const textInput = document.getElementById('question');
const answer1Input = document.getElementById('answer-1');
const answer2Input = document.getElementById('answer-2');
const answer3Input = document.getElementById('answer-3');
const answer4Input = document.getElementById('answer-4');
const correctAnswerInput = document.getElementById('correct-answer');
const editBtn = document.querySelector('.btn-sub');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;

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


editBtn.addEventListener('click', async (e) => {
    const text = textInput.value;
    const answer1 = answer1Input.value;
    const answer2 = answer2Input.value;
    const answer3 = answer3Input.value;
    const answer4 = answer4Input.value;
    const correctAnswer = correctAnswerInput.value;

    if(!text || !answer1 || !answer2 || !answer3 || !answer4 || !correctAnswer) return;
    const videoId = location.href.split('/')[4];
    const questionId = location.href.split('/')[6];
    const res = await fetch(`${domain}/api/v1/videos/${videoId}/questions/${questionId}/edit-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({text, answers: [answer1, answer2, answer3, answer4], correctAnswer})
    })

    const data = await res.json();

    showNotification(data.message, data.status);
  })