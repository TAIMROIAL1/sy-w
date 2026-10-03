const { domain, subcourseId, lessonId, videoNum } = document.body.dataset;
const apiBase = `${domain}/api/v1/subcourses/${subcourseId}/lessons`;

const uploadBtn = document.querySelector('.btn-sub');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message');

const showNotification = function (msg, type) {
  notifcation.classList.remove('hidden');

  notifcation.classList.remove('green');
  notifcation.classList.remove('red');

  if (type === 'success') notifcation.classList.add('green');
  else notifcation.classList.add('red');

  notifcationMsg.textContent = msg;

  // restart the slide in / out animation
  notifcation.style.animation = 'none';
  void notifcation.offsetWidth;
  notifcation.style.animation = '';

  clearTimeout(showNotification.timer);
  showNotification.timer = setTimeout(() => {
    notifcation.classList.add('hidden');
  }, 5000);
};

// go back to the page the admin came from (?redirect=/...)
const goBack = function () {
  const redirect = new URLSearchParams(location.search).get('redirect');
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) location.assign(`${domain}${redirect}`);
  else history.back();
};

const sendEdit = async function (url, body, successMsg) {
  uploadBtn.disabled = true;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok || data.status !== 'success') {
      showNotification(data.message || 'حدث خطأ, الرجاء المحاولة مجددا', 'error');
      uploadBtn.disabled = false;
      return;
    }

    showNotification(data.message || successMsg, 'success');
    setTimeout(goBack, 1500);
  } catch (err) {
    showNotification('حدث خطأ, الرجاء المحاولة مجددا', 'error');
    uploadBtn.disabled = false;
  }
};

/* ---------------------------------- quiz ----------------------------------- */

const quizNameInput = document.getElementById('quiz-name');
const numInput = document.getElementById('num');
const questionsContainer = document.querySelector('.questions');
const addQuestionBtn = document.querySelector('.add-question-btn');
const questionTemplate = document.getElementById('question-template');

const renumberQuestions = function () {
  [...questionsContainer.children].forEach((question, i) => {
    question.querySelector('.question-number').textContent = `السؤال ${i + 1}`;
  });
};

const attachRemove = function (question) {
  question
    .querySelector('.remove-question-btn')
    .addEventListener('click', () => {
      if (questionsContainer.children.length === 1) {
        showNotification('يجب أن يحتوي الاختبار على سؤال واحد على الأقل', 'error');
        return;
      }
      question.remove();
      renumberQuestions();
    });
};

const addQuestion = function () {
  const question = questionTemplate.content.firstElementChild.cloneNode(true);
  attachRemove(question);
  questionsContainer.appendChild(question);
  renumberQuestions();
  question.querySelector('.question-text').focus();
};

// existing questions are rendered by the server
[...questionsContainer.children].forEach(attachRemove);
renumberQuestions();

addQuestionBtn.addEventListener('click', addQuestion);

// returns { title, num, questionsData: [{ _id?, text, answers: [4 strings], correctAnswer: 0-3 }] }
// or null when something is missing / invalid
const collectQuizData = function () {
  const title = quizNameInput.value.trim();
  const num = numInput.value.trim();
  if (!title || !num) return null;

  const questionEls = [...questionsContainer.children];
  if (questionEls.length === 0) return null;

  const questions = [];

  for (const el of questionEls) {
    const text = el.querySelector('.question-text').value.trim();
    const answers = [...el.querySelectorAll('.answer-input')].map(input =>
      input.value.trim()
    );
    const correctAnswer = Number(el.querySelector('.correct-answer').value);

    if (!text) return null;
    if (answers.length !== 4 || answers.some(answer => !answer)) return null;
    if (!Number.isInteger(correctAnswer) || correctAnswer < 1 || correctAnswer > 4)
      return null;

    const question = { text, answers, correctAnswer: correctAnswer - 1 };
    // existing questions keep their id so they are updated instead of re-created
    if (el.dataset.questionId) question._id = el.dataset.questionId;

    questions.push(question);
  }

  return { title, num, questionsData: questions };
};

uploadBtn.addEventListener('click', () => {
  if (uploadBtn.disabled) return;

  const quiz = collectQuizData();
  if (!quiz) {
    showNotification('املأ كل حقول الاختبار', 'error');
    return;
  }

  sendEdit(`${apiBase}/${lessonId}/quizzes/${videoNum}/edit-quiz`, quiz, 'تم تعديل الاختبار بنجاح');
});
