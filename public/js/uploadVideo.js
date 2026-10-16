const videoNameInput = document.getElementById('video-name');
const subNameInput = document.getElementById('video-sub-name');
const videoUrlInput = document.getElementById('video-url');
const infoInput = document.getElementById('info');
const durationInput = document.getElementById('duration');
const uploadBtn = document.querySelector('.btn-sub');

const quizNameInput = document.getElementById('quiz-name');
const fileTypeBtns = [...document.querySelectorAll('.file-type-btn')];

const videoFields = document.querySelector('.video-fields');
const quizFields = document.querySelector('.quiz-fields');
const fileFields = document.querySelector('.file-fields');
const fileNameInput = document.getElementById('file-name');
const fileInfoInput = document.getElementById('file-info');
const lessonFileInput = document.getElementById('lesson-file');
const questionsContainer = document.querySelector('.questions');
const addQuestionBtn = document.querySelector('.add-question-btn');
const questionTemplate = document.getElementById('question-template');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message');

const domain = document.body.dataset.domain;

const showNotification = function (msg, type) {
  notifcation.classList.remove('hidden');

  notifcation.classList.remove('green');
  notifcation.classList.remove('red');

  if (type === 'success') notifcation.classList.add('green');
  else notifcation.classList.add('red');

  notifcationMsg.textContent = msg;
  setTimeout(() => {
    notifcation.classList.add('hidden');
  }, 5000);
};

/* ---------------------------------- quiz --------------------------------- */

const renumberQuestions = function () {
  [...questionsContainer.children].forEach((question, i) => {
    question.querySelector('.question-number').textContent = `السؤال ${i + 1}`;
  });
};

const addQuestion = function () {
  const question = questionTemplate.content.firstElementChild.cloneNode(true);

  question
    .querySelector('.remove-question-btn')
    .addEventListener('click', () => {
      question.remove();
      renumberQuestions();
    });

  questionsContainer.appendChild(question);
  renumberQuestions();
};

addQuestionBtn.addEventListener('click', addQuestion);

// start with one empty question
addQuestion();

// returns { title, questions: [{ text, answers: [4 strings], correctAnswer: 0-3 }] }
// or null when something is missing / invalid
const collectQuizData = function () {
  const title = quizNameInput.value.trim();
  if (!title) return null;

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

    // the user types 1-4, the API expects an index 0-3
    questions.push({ text, answers, correctAnswer: correctAnswer - 1 });
  }

  return { title, questionsData: questions, fileType: "quiz" };
};

/* --------------------------------- upload -------------------------------- */

const isQuizMode = () =>
  document.querySelector('.file-type-btn.quiz-res').classList.contains('active');
const isFileMode = () =>
  document.querySelector('.file-type-btn.file-res').classList.contains('active');

const uploadFile = async function (url) {
  const title = fileNameInput.value.trim();
  const file = lessonFileInput.files[0];

  if (!title || !file) {
    showNotification('اكتب عنوان الملف واختر الملف', 'error');
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    showNotification('حجم الملف يجب ألا يتجاوز 25MB', 'error');
    return;
  }

  const form = new FormData();
  form.append('fileType', 'file');
  form.append('title', title);
  form.append('info', fileInfoInput.value.trim());
  form.append('file', file);

  uploadBtn.disabled = true;
  const label = uploadBtn.textContent;
  uploadBtn.textContent = 'جاري الرفع...';
  try {
    const res = await fetch(url, { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    showNotification(data.message || 'حدث خطأ, الرجاء المحاولة مجددا', data.status);
    if (data.status === 'success') {
      fileNameInput.value = '';
      fileInfoInput.value = '';
      lessonFileInput.value = '';
    }
  } catch (err) {
    showNotification('حدث خطأ, الرجاء المحاولة مجددا', 'error');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = label;
  }
};

uploadBtn.addEventListener('click', async () => {
  const subcourseId = location.href.split('/')[4];
  const lessonId = location.href.split('/')[6];

  const url = `${domain}/api/v1/lessons/${subcourseId}/videos/${lessonId}`;
  let body;

  if (isFileMode()) return uploadFile(url);

  if (isQuizMode()) {
    const quiz = collectQuizData();
    if (!quiz) {
      showNotification('املأ كل حقول الاختبار', 'error');
      return;
    }

    body = quiz;
  } else {
    const title = videoNameInput.value;
    const subTitle = subNameInput.value;
    const videoUrl = videoUrlInput.value;
    const info = infoInput.value;
    const duration = durationInput.value;

    if (!title || !info || !videoUrl || !duration || !subTitle) return;

    body = { title, subTitle, info, videoUrl, duration, fileType: "video" };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  showNotification(data.message, data.status);
});

/* ------------------------------ mode switch ------------------------------ */

fileTypeBtns.forEach(btn =>
  btn.addEventListener('click', function () {
    if (this.classList.contains('active')) return;

    fileTypeBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    videoFields.classList.toggle('hidden', !this.classList.contains('video-res'));
    quizFields.classList.toggle('hidden', !this.classList.contains('quiz-res'));
    fileFields.classList.toggle('hidden', !this.classList.contains('file-res'));
  })
);
