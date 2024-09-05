const nameInput = document.getElementById('video-name');
const numberInput = document.getElementById('num');
const btnToLoadBefore = document.querySelector('.first-btn');

const uploadBtn = document.querySelector('.upload-questions-btn');
const addBtn = document.querySelector('.add-question-btn');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;

const forms = [];
let questions = [];
const videoId = location.href.split('/')[4];

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

const createQuestionHTML = function() {
  const formDiv = document.createElement('div');
  formDiv.classList.add('form');
  formDiv.innerHTML = `
        <div class="label-input big">
          <label for="input-question" dir="rtl" lang="ar">السؤال:</label>

        </div>
        <input type="text" id="input-question" class='input-question'>

        <div class="label-input">
          <label for="answer-1" dir="rtl" lang="ar">الخيار الاول</label>

        </div>
        <input type="text" class="input" id="answer-1">

        <div class="label-input">
          <label for="answer-2" dir="rtl" lang="ar">الخيار الثاني </label>

        </div>
        <input type="text" class="input" id="answer-2" dir="rtl" lang="en">

        <div class="label-input">
          <label for="answer-3" dir="rtl" lang="ar">الخيار الثالث </label>

        </div>
        <input type="text" class="input" id="answer-3" dir="rtl" lang="en">

        <div class="label-input">
          <label for="answer-4" dir="rtl" lang="ar">الخيار الرابع </label>
        </div>
        <input type="text" class="input" id="answer-4" dir="rtl" lang="en">

        <div class="label-input">
          <label for="correct-answer" dir="rtl" lang="ar">الاجابة الصحيحة</label>
        </div>
        <input type="number" class="input" id="correct-answer" dir="rtl" lang="en">        
  `;
  btnToLoadBefore.before(formDiv);
  return formDiv;
}

const addHandler = function() {
  forms.push(createQuestionHTML());
}


const init = function() {
  forms.push(createQuestionHTML());

  addBtn.addEventListener('click', addHandler);
  
  uploadBtn.addEventListener('click', async (e) => {
      const check = forms.every(el => {
        const question = el.querySelector('#input-question').value;
        const firstAnswer = el.querySelector('#answer-1').value;
        const secondAnswer = el.querySelector('#answer-2').value;
        const thirdAnswer = el.querySelector('#answer-3').value;
        const fourthAnswer = el.querySelector('#answer-4').value;
        const correctAnswer = el.querySelector('#correct-answer').value;

        const checked = question && firstAnswer && secondAnswer && thirdAnswer && fourthAnswer && correctAnswer; 
        if(checked) {
          questions.push({
            text: question,
            answers: [firstAnswer, secondAnswer, thirdAnswer, fourthAnswer],
            correctAnswer,
            video: videoId
          })
        }
        return checked;
      })

      if(!check) {
        questions = [];
        return showNotification('الرجاء تعبئة كامل الاستمارات', 'fail');
}
      const response = await fetch(`${domain}/api/v1/videos/${videoId}/questions/add-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questions })
      })

      const data = await response.json();
      questions = [];
      showNotification(data.message, data.status);
    })
}
  
init();