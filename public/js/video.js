const listOpnBtn = document.querySelector('.list-button');
const list = document.querySelector('.list');

const overlay = document.querySelector('.username');
const videoToLoad = document.querySelector('.video-to-load')
const btnsContainers1 = document.querySelectorAll('.btns-flex-container1');
const videoContainer = document.querySelectorAll('.video-con');

const uploadLessonBtn = document.querySelector('.upload-lesson-btn');

// The notifcation message
const notifcation = document.querySelector('.correct');
const notifcationMsg = document.querySelector('.correct-message')

const domain = document.body.dataset.domain;

const videoToPlayContainer = document.querySelector('.video-container');
const videoTitle = document.querySelector('.title');
const videoPlay = document.querySelector('.video');

const role = document.body.dataset.role;
const username = document.body.dataset.username;

const submitAnswersBtn = document.querySelector('.submite');
const questionsContainer = document.querySelector('.questions-container');
let questions = [];
const questionAdminHTML = `
<i class="bi-trash delete-question-btn" data-deletecount="0">&#128465;</i>
<svg class="bi-edit edit-question-btn" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"></path>
    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"></path>
  </svg>
`
const submitBtnContainer = document.querySelector('.submit-answers-btn-container');

let screenState = false;
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

const handleDocumentClick = function(e) {
  const clickedList = e.target.closest('.list');
  if(clickedList) return;

  if(e.target.closest('.list-button')) return
  if(!list.classList.contains('hidden')) list.classList.add('hidden');
}

const createQuestionHTML = async function(text, answers, id) {
  const questionDiv = document.createElement('div');
  questionDiv.classList.add('question');
  questionDiv.setAttribute('data-questionid', id);
  questionDiv.innerHTML = `
        ${role === 'admin'? questionAdminHTML: ''}
        <p class="title-question">${text}</p>
        <div data-answernum= 0 class="answer-container">
        <button class="a"></button>
        <p class="answer-text" class="answer-text">${answers[0]}</p>
        </div>
        <div data-answernum= 1 class="answer-container">
        <button class="a"></button>
        <p class="answer-text">${answers[1]}</p>
        </div>
        <div data-answernum= 2 class="answer-container">
        <button class="a"></button>
        <p class="answer-text">${answers[2]}</p>
        </div>
        <div data-answernum= 3 class="answer-container">
        <button class="a"></button>
        <p class="answer-text">${answers[3]}</p>
        </div>
  `
  questions.push(questionDiv);
  questionsContainer.append(questionDiv);
}

const addL = function(tit) {
  const fl = document.createElement('div');
  const sl = document.createElement('div');
  const tl = document.createElement('div');
  const ll = document.createElement('div');
  fl.classList.add('fl')
  sl.classList.add('sl')
  tl.classList.add('tl')
  ll.classList.add('ll')

  fl.textContent = username[0];
  sl.textContent = username[1];
  tl.textContent = username[2];
  ll.textContent = username[username.length - 1];

  tit.append(fl);
  tit.append(sl);
  tit.append(tl);
  tit.append(ll);
}
const createQuestions = async function(clicked) {
    questionsContainer.classList.add('hidden');
    list.classList.add('hidden');
    questions = [];
    questionsContainer.innerHTML = ``;
    submitBtnContainer.classList.add('hidden');
    const videoElement = clicked.closest('.video-con');
    videoTitle.textContent = (videoElement.querySelector('.video-title').textContent) + (username.length > 6 ? '-' : '+');

    addL(videoTitle);

    videoToPlayContainer.classList.remove('hidden');
    videoToPlayContainer.innerHTML = `
    <div style="position:relative; height:100%; width:100%;"><iframe class="my-iframe" src="${videoElement.dataset.videourl}" loading="lazy" style="border:0;border-radius:6px;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>
    `;
    const videoId = videoElement.dataset.videoid;
    document.body.setAttribute('data-videoid', videoId);
    const subcourseId = location.href.split('/')[4];
    const questionsToLoad = await ajaxCall(`${domain}/api/v1/videos/${videoId}/questions`, 'POST', {subcourseId});
    questionsContainer.classList.remove('hidden');
    if(questionsToLoad.data.questions.length > 0){
    questionsToLoad.data.questions.forEach(q => createQuestionHTML(q.text, q.answers, q._id));
    submitBtnContainer.classList.remove('hidden');
    }
    const overlaydiv = document.createElement('div');
    overlaydiv.classList.add('username');
    overlaydiv.textContent = document.body.dataset.username
    // videoToPlayContainer.append(overlaydiv);
    document.querySelector('.my-iframe').append(overlaydiv);
}

const ajaxCall = async function(url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = {'Content-Type': 'application/json'};
  if(data) fetchOpts.body = JSON.stringify(data);
  const response = await fetch(url, fetchOpts);
  const data2 = await response.json();
  return data2;
}


document.addEventListener('click', handleDocumentClick);

listOpnBtn.addEventListener('click', (e) => {
  list.classList.toggle('hidden');
});
if(role === 'admin'){
uploadLessonBtn.addEventListener('click', (e) => {
  const subcourseId = location.href.split('/')[4];
  location.assign(`/subcourses/${subcourseId}/upload-lesson`);
});

btnsContainers1.forEach(btnsContainer => {
  btnsContainer.addEventListener('click', async (e) => {
    const lessonId = e.target.closest('.my-details').dataset.lessonid;
    const subcourseId = location.href.split('/')[4];
    const clicked1 = e.target.closest('.bi-edit')
  if(clicked1){
    return location.assign(`/subcourses/${subcourseId}/edit-lesson/${clicked1.closest('.my-details').dataset.lessonid}`);
  }

  const clicked2 = e.target.closest('.bi-trash')
  if(clicked2) {
    const deleteCount = Number(clicked2.dataset.deletecount);

    if(deleteCount !== 2) {
    if(deleteCount === 0) clicked2.classList.add('trash1');
    if(deleteCount === 1){
      clicked2.classList.remove('trash1') 
      clicked2.classList.add('trash2');
    }
    return clicked2.dataset.deletecount++;
}
  const lessonToDelete = e.target.closest('.my-details');

  const response = await fetch(`${domain}/api/v1/subcourses/${subcourseId}/lessons/${lessonToDelete.dataset.lessonid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const data = await response.json();

  showNotification(data.message, data.status);
  if(data.status === 'success') {
    return setTimeout(() => {
      location.reload(true);
    }, 1500);
  }
  }

  const clicked3 = e.target.closest('.upload-video');

  if(clicked3) {
    return location.assign(`/lessons/${lessonId}/upload-video`);
  }


  })
});
}

videoContainer.forEach(btnsContainer => {
  btnsContainer.addEventListener('click', async (e) => {
    const lessonId = e.target.closest('.my-details').dataset.lessonid;
  const clicked1 = e.target.closest('.bi-edit')
  if(clicked1){
    return location.assign(`/lessons/${lessonId}/edit-video/${clicked1.closest('.video-con').dataset.videoid}`)
  }

  const clicked2 = e.target.closest('.bi-trash');

  if(clicked2) {
    const deleteCount = Number(clicked2.dataset.deletecount);

    if(deleteCount !== 2) {
    if(deleteCount === 0) clicked2.classList.add('trash1');
    if(deleteCount === 1){
      clicked2.classList.remove('trash1') 
      clicked2.classList.add('trash2');
    }
    return clicked2.dataset.deletecount++;
}
  const videoToDelete = clicked2.closest('.video-con').dataset.videoid;
  const response = await fetch(`${domain}/api/v1/lessons/${lessonId}/videos/${videoToDelete}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const data = await response.json();

  showNotification(data.message, data.status);
  if(data.status === 'success') {
    return setTimeout(() => {
      location.reload(true);
    }, 1500);
  }
  }

  const clicked3 = e.target.closest('.upload-questions');

  if(clicked3) {
    return location.assign(`/videos/${clicked3.closest('.video-con').dataset.videoid}/upload-question`);
  }

  const clicked4 = e.target.closest('.video-title');

  if(clicked4) {
    createQuestions(clicked4);
  }
}
  )
});


questionsContainer.addEventListener('click', async (e) => {

  if(role === 'admin') {
    const videoId = location.href.split('/')[4];
    const clicked1 = e.target.closest('.bi-edit')
    if(clicked1) {
      const questionId = clicked1?.closest('.question')?.dataset.questionid;
      return location.assign(`/videos/${videoId}/edit-question/${questionId}`);
    }

    const clicked2 = e.target.closest('.bi-trash');
    if(clicked2) {
      const deleteCount = Number(clicked2.dataset.deletecount);

    if(deleteCount !== 2) {
    if(deleteCount === 0) clicked2.classList.add('trash1');
    if(deleteCount === 1){
      clicked2.classList.remove('trash1') 
      clicked2.classList.add('trash2');
    }
    return clicked2.dataset.deletecount++;
}
  const questionToDelete = clicked2.closest('.question').dataset.questionid;

  const response = await fetch(`${domain}/api/v1/videos/${videoId}/questions/${questionToDelete}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  const data = await response.json();

  showNotification(data.message, data.status);
  if(data.status === 'success') {
    return setTimeout(() => {
      location.reload(true);
    }, 1500);
  }
    }
  }

  if(e.target.classList.contains('a')){

  if(e.target.classList.contains('checked')) return e.target.classList.remove('checked');

  const singleQuestionContainer = e.target.closest('.question');
  [...singleQuestionContainer.querySelectorAll('.a')].forEach(cb => cb.classList.remove('checked'));
  e.target.classList.add('checked');
}
})

const highlightAnswers = function(results) {

  const checks = [...document.querySelectorAll('.question')];
  results.forEach(result => {
    const check = checks.find(ch => ch.dataset.questionid == result.questionId);
    const checked = check.querySelector('.checked');
    if(result.solvedRight == true) {

      checked.classList.remove('checked');
      checked.classList.add('correct-answer');
    }
    else {
      if(checked) {
        checked.classList.remove('checked');
      checked.classList.add('wrong-answer');
      }
      const allCheckBtns = [...check.querySelectorAll('.a')];
      const correctCheckBox = allCheckBtns.find(cb => Number(cb.closest('.answer-container').dataset.answernum) + 1 == result.correctAnswer);
      correctCheckBox.classList.add('expected-answer');
    }
  })
}

const handleSubmit = async function() {
    const solvedQuestions = questions.map(q => {
      const questionId = q.closest('.question').dataset.questionid;
      let answer = -1;
      const checked = q.closest('.question').querySelector('.checked');
  
      if(checked) answer = Number(checked.closest('.answer-container').dataset.answernum) + 1;
      return {id: questionId, answer}
    });

    const videoId = document.body.dataset.videoid;

    const subcourseId = location.href.split('/')[4];

    const { results } = await ajaxCall(`${domain}/api/v1/videos/${videoId}/questions/solve-questions`, 'POST', {solvedQuestions, subcourseId});

    highlightAnswers(results)
    submitAnswersBtn.removeEventListener('click', handleSubmit);
    setTimeout(() => {
      const answerBtns = questionsContainer.querySelectorAll('.a');
      answerBtns.forEach(ab => {
      ab.classList.remove('checked');
      ab.classList.remove('correct-answer');
      ab.classList.remove('wrong-answer');
      ab.classList.remove('expected-answer');
      submitAnswersBtn.addEventListener('click', handleSubmit);
    })  
    }, 6000)
    
}

submitAnswersBtn.addEventListener('click', handleSubmit);

const handleFullScreen = function() {
  if(document.fullscreenElement && !screenState){   
    screenState = true;
    setTimeout(() => {
      document.exitFullscreen();
      screenState = false;
    }, 10 * 60 * 1000);
}
}

document.addEventListener('fullscreenchange', handleFullScreen);