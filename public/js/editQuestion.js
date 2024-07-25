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

const showNotification = function(msg) {
  notifcation.classList.toggle('hidden');
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
    const res = await fetch(`http://127.0.0.1:3000/api/v1/videos/${videoId}/questions/${questionId}/edit-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({text, answers: [answer1, answer2, answer3, answer4], correctAnswer})
    })

    const data = await res.json();

    if(data.status === 'success') {
      showNotification(data.message);
    }
    if(data.status === 'fail') {
      showNotification(data.message);
    }
  })