/* =========================================
   LESSON ACCORDION
========================================= */

const darkToggle = document.getElementById('dark-toggle');

const lessons = document.querySelectorAll(".lesson");
const { domain }= document.body.dataset;

const { achievedLesson, achievedResource }= document.body.dataset;

console.log(achievedLesson, achievedResource);

lessons.forEach((lesson) => {
  const header = lesson.querySelector(".lesson-header");

  if (!header) return;

  header.addEventListener("click", () => {
    if (lesson.classList.contains("locked")) {
      return;
    }

    lesson.classList.toggle("open");
  });
});
/* ========================================= 
    Helper Functions
==========================================*/

const ajaxCall = async function (url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
};

/* =========================================
   MOBILE SIDEBAR
========================================= */

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");

const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");

openSidebar.addEventListener("click", () => {
  sidebar.classList.add("mobile-open");

  overlay.classList.add("active");
});

closeSidebar.addEventListener("click", closeMobileSidebar);

overlay.addEventListener("click", closeMobileSidebar);

function closeMobileSidebar() {
  sidebar.classList.remove("mobile-open");

  overlay.classList.remove("active");
}

/* =========================================
   QUIZ DATA
========================================= */

const quizzes = {
  lesson1: [
    {
      question: "أي مما يلي ليس من أقسام الجهاز العصبي المركزي:",

      options: [
        "الدماغ البيني",
        "السويقتان المخيتان",
        "العقد العصبية",
        "الوطاء",
      ],

      correct: 2,
    },

    {
      question: "يدعى تراكم السائل الدماغي الشوكي في بطينات وزيادة حجمها:",

      options: ["سكتة دماغية", "استسقاء دماغي", "شقيقة", "صرع"],

      correct: 1,
    },

    {
      question: "يزداد احتمالية حدوث سكتة بانخفاض:",

      options: ["ضغط الدم", "وزن الجسم", "النشاط البدني", "التدخين"],

      correct: 2,
    },

    {
      question: "يشتق الجهاز العصبي من الوريقة الجنينية:",

      options: ["الخارجية", "الوسطى", "الداخلية", "كل ما سبق صحيح"],

      correct: 0,
    },

    {
      question:
        "بنية تقق بين الدماغ المتوسط من الأعلى والبصلة السيسائية من الأسفل:",

      options: ["الدماغ البيني", "المخ", "الحدبة الحلقية", "الوطاء"],

      correct: 2,
    },
  ],

  lesson2: [
    {
      question: "إذا كان x + 5 = 10 فما قيمة x ؟",

      options: ["3", "4", "5", "6"],

      correct: 2,
    },

    {
      question: "إذا كان x - 3 = 7 فما قيمة x ؟",

      options: ["8", "9", "10", "11"],

      correct: 2,
    },

    {
      question: "ما قيمة x في المعادلة 2x = 10 ؟",

      options: ["2", "3", "5", "10"],

      correct: 2,
    },

    {
      question: "إذا كان x + 2 = 8 فما قيمة x ؟",

      options: ["4", "5", "6", "7"],

      correct: 2,
    },

    {
      question: "ما قيمة x في المعادلة x / 2 = 4 ؟",

      options: ["4", "6", "8", "10"],

      correct: 2,
    },
  ],

  lesson3: [
    {
      question: "ما درجة المعادلة 2x + 5 = 10 ؟",

      options: ["الأولى", "الثانية", "الثالثة", "الرابعة"],

      correct: 0,
    },

    {
      question: "ما قيمة x في 3x = 12 ؟",

      options: ["2", "3", "4", "5"],

      correct: 2,
    },

    {
      question: "إذا كان x - 8 = 2 فما قيمة x ؟",

      options: ["8", "9", "10", "11"],

      correct: 2,
    },

    {
      question: "ما قيمة x في 5x = 25 ؟",

      options: ["3", "4", "5", "6"],

      correct: 2,
    },

    {
      question: "إذا كان x + 10 = 15 فما قيمة x ؟",

      options: ["3", "4", "5", "6"],

      correct: 2,
    },
  ],

  lesson4: [
    {
      question: "إذا كان x > 5، فأي قيمة تحقق المتباينة؟",

      options: ["3", "4", "5", "6"],

      correct: 3,
    },

    {
      question: "أي رمز يعني أصغر من؟",

      options: [">", "<", "=", "≥"],

      correct: 1,
    },

    {
      question: "أي رمز يعني أكبر من؟",

      options: ["<", "=", ">", "≤"],

      correct: 2,
    },

    {
      question: "إذا كان x < 10، فأي قيمة صحيحة؟",

      options: ["12", "11", "10", "8"],

      correct: 3,
    },

    {
      question: "أي متباينة صحيحة؟",

      options: ["8 > 10", "5 < 9", "7 > 12", "3 = 8"],

      correct: 1,
    },
  ],
};

/* =========================================
   QUIZ VARIABLES
========================================= */

let currentQuiz = [];

let currentQuestionIndex = 0;

let userAnswers = [];

let selectedQuizId = null;

/* =========================================
   ELEMENTS
========================================= */

const videoView = document.getElementById("videoView");

const quizView = document.getElementById("quizView");

const loadingView = document.getElementById("loadingView");

const resultView = document.getElementById("resultView");

const questionText = document.getElementById("questionText");

const optionsContainer = document.getElementById("optionsContainer");

const currentQuestion = document.getElementById("currentQuestion");

const totalQuestions = document.getElementById("totalQuestions");

const quizProgressBar = document.getElementById("quizProgressBar");

const previousButton = document.getElementById("prevQuestion");

const nextButton = document.getElementById("nextQuestion");

const btnPrimary = document.getElementById("nextLesson");

const lessonsList = document.querySelector(".lessons-list");

const videoContainer = document.querySelector('.video-container');

// Video View Elements
const videoBadge = document.querySelector('.video-badge');
const videoTitle = document.querySelector('.video-title');
const videoDuration = document.querySelector('.fa-regular');
const videoDescription = document.querySelector('.video-description');
const prevLessonBtn = document.getElementById('prevLesson');

// Loader View Elements
const loaderTitle = document.querySelector('.lodaer-title');
const lodaerDescription = document.querySelector('.loader-description');

// Quiz View Elements
const quizTitle = document.querySelector('.quiz-title');

// Result View Elements
const resultBtn = document.getElementById('backToLesson');

// Progress Elements
const progressPercentage= document.querySelector('.progress-percentage');
const progressBar = document.querySelector('.progress');
const progressSentence = document.querySelector('.progress-sentence');

/* =========================================
   List Listeners
========================================= */

lessonsList.addEventListener("click", async function (e) {
  const clicked = e.target;

  // Check if User clicked A resource
  const lessonRes = clicked.closest(".lesson-resource");

  if (lessonRes) {
    if(lessonRes.classList.contains('active')) {
      return closeMobileSidebar();
    }

    if(lessonRes.classList.contains('locked')) return;

    [...document.querySelectorAll('.lesson-resource')].forEach(res => res.classList.remove('active'));

    lessonRes.classList.add('active');

    [...document.querySelectorAll('.lesson')].forEach(lesson => lesson.classList.remove('active'));
      lessonRes.closest('.lesson').classList.add('active');

    // Video Rescource
    if (lessonRes.classList.contains("video-resource")) {
      const url = lessonRes.dataset.videoUrl;
      updateVideoView(lessonRes);
      showView(videoView, url);
      closeMobileSidebar();
    }
    // Quiz Resource
    else if (lessonRes.classList.contains("quiz-resource")) {
        closeMobileSidebar();
        updateLodaerView('جاري تحميل الأسألة', 'لحظات و يتم بدء الاختبار');
        showView(loadingView);
        const {questions} = (await ajaxCall(
    `${domain}/api/v1/questions`,
    {subcourseId: location.href.split('/')[4] ,resourceNum: lessonRes.dataset.num, lessonId: lessonRes.closest('.lesson').dataset.lessonId}
    )).data;
    quizTitle.textContent = lessonRes.querySelector('strong').textContent;
        startQuiz(questions);
    }
    // PDF Resource
    else {
    }
  }
});

btnPrimary.addEventListener("click", () => { 
  const currentRes = [...document.querySelectorAll(".lesson-resource")].find(res => res.classList.contains('active'));
  const currentLesson = [...document.querySelectorAll('.lesson')].find(lesson => lesson.classList.contains('active'));
  let inNextLesson = false;
  let nextRes = currentRes.nextElementSibling;
  [...document.querySelectorAll('.lesson-resource')].forEach(res => res.classList.remove('active'));
    if(!nextRes) {nextRes = currentLesson.nextElementSibling.querySelector('.lesson-resource');
        inNextLesson = true;
}
    nextRes.classList.add('active');
    [...document.querySelectorAll('.lesson')].forEach(lesson => lesson.classList.remove('active'));
    nextRes.closest('.lesson').classList.add('active');

    updateUserProgress(nextRes.dataset.num, inNextLesson? currentLesson.nextElementSibling.dataset.num: currentLesson.dataset.num);
    currentRes.querySelector('.state-mark').classList.remove('fa-chevron-left');
    currentRes.querySelector('.state-mark').classList.remove('resource-action');
    currentRes.querySelector('.state-mark').classList.add('fa-circle-check');
    currentRes.querySelector('.state-mark').classList.add('completed');
  moveToRes(nextRes);

  closeMobileSidebar();
});

prevLessonBtn.addEventListener('click', function() {
  const currentRes = [...document.querySelectorAll('.lesson-resource')].find(res => res.classList.contains('active'));

  let prevRes;

  if(currentRes.dataset.num == 0)
    prevRes = currentRes.closest('.lesson').previousElementSibling.lastElementChild.lastElementChild;
  else
    prevRes = currentRes.previousElementSibling;


  [...document.querySelectorAll('.lesson')].forEach(lesson => lesson.classList.remove('active'));
  prevRes.closest('.lesson').classList.add('active');

  currentRes.classList.remove('active');
  prevRes.classList.add('active');
  moveToRes(prevRes);
})

async function updateUserProgress(newRes, newLesson) {
const response = await ajaxCall(`${domain}/api/v1/users/update-progress`, {subcourseId: location.href.split('/')[4], newRes, newLesson});

console.log(response);
if(response.status === 'success' && response.data) {
  console.log('hi');
    const courseProgress = response.data;
    const {totalVideos} = document.querySelector('.course-progress').dataset;
    document.body.dataset.achievedLesson = newLesson;
    document.body.dataset.achievedResource = newRes;

    progressPercentage.textContent = `${Math.ceil((courseProgress.achievedVideos.achievedVideosCount/totalVideos) * 100)}%`;
    progressBar.querySelector('span').style.width = `${Math.ceil((courseProgress.achievedVideos.achievedVideosCount/totalVideos) * 100)}%`;
    progressSentence.textContent = `${courseProgress.achievedVideos.achievedVideosCount} من ${totalVideos} درس مكتمل`
};
}
/* =========================================
   START QUIZ
========================================= */

function startQuiz(questions) {
  currentQuestionIndex = 0;

  userAnswers = new Array(questions.length).fill(null);
  
  currentQuiz = questions;
  renderQuestion();
  
  showView(quizView);
}

/* =========================================
   RENDER QUESTION
========================================= */

function renderQuestion() {
  const question = currentQuiz[currentQuestionIndex];
  questionText.textContent = question.text;
  questionText.setAttribute('questionId', currentQuiz[currentQuestionIndex]._id.toString());

  currentQuestion.textContent = currentQuestionIndex + 1;

  totalQuestions.textContent = currentQuiz.length;

  optionsContainer.innerHTML = "";

  const letters = ["أ", "ب", "ج", "د"];

  question.answers.forEach((option, index) => {
    const button = document.createElement("button");

    button.className = "option-btn";

    if (userAnswers[currentQuestionIndex]?.index === index) {
      button.classList.add("selected");
    }

    button.innerHTML = `

            <span class="option-letter">
                ${letters[index]}
            </span>

            <span>
                ${option}
            </span>

        `;

    button.addEventListener("click", () => {
      selectAnswer(index, questionText.getAttribute("questionId"));
    });

    optionsContainer.appendChild(button);
  });

  updateProgress();

  updateButtons();
}

/* =========================================
   SELECT ANSWER
========================================= */

function selectAnswer(index, questionId) {
  userAnswers[currentQuestionIndex] = {index, questionId};

  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach((button, buttonIndex) => {
    button.classList.toggle("selected", buttonIndex === index);
  });
}

/* =========================================
   PROGRESS
========================================= */

function updateProgress() {
  const progressP = ((currentQuestionIndex + 1) / currentQuiz.length) * 100;

  quizProgressBar.style.width = progressP + "%";
}

/* =========================================
   BUTTONS
========================================= */

function updateButtons() {
  if (currentQuestionIndex === 0) {
    previousButton.disabled = true;

    previousButton.style.opacity = ".5";
  } else {
    previousButton.disabled = false;

    previousButton.style.opacity = "1";
  }

  if (currentQuestionIndex === currentQuiz.length - 1) {
    nextButton.innerHTML = `

            إنهاء الاختبار

            <i class="fa-solid fa-check"></i>

        `;
  } else {
    nextButton.innerHTML = `

            التالي

            <i class="fa-solid fa-arrow-left"></i>

        `;
  }
}

/* =========================================
   NEXT QUESTION
========================================= */

nextButton.addEventListener("click", () => {

  if (userAnswers[currentQuestionIndex] === null) {
    alert("يرجى اختيار إجابة أولاً");

    return;
  }

  /*
        إذا كان آخر سؤال
    */

  if (currentQuestionIndex === currentQuiz.length - 1) {
    finishQuiz();

    return;
  }

  currentQuestionIndex++;

  renderQuestion();
});

/* =========================================
   PREVIOUS QUESTION
========================================= */

previousButton.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;

    renderQuestion();
  }
});

/* =========================================
   FINISH QUIZ
========================================= */

function finishQuiz() {
  /*
        التأكد أن جميع الأسئلة محلولة
    */

  const unanswered = userAnswers.includes(null);

  if (unanswered) {
    alert("يجب الإجابة عن جميع الأسئلة قبل إنهاء الاختبار");

    return;
  }

  /*
        إخفاء الاختبار
        وإظهار اللودر
    */
    updateLodaerView("جاري تقييم الاجابات", "لحظات و يتم عرض النتيجة");
    showView(loadingView);

    calculateResult();
}

/* =========================================
   CALCULATE RESULT
========================================= */

async function calculateResult() {
    const currentLesson = [...document.querySelectorAll('.lesson')].find(lesson => lesson.classList.contains('active'));
    const currentRes =  [...currentLesson.querySelectorAll('.lesson-resource')].find(res => res.classList.contains('active'));
    const { lessonId }= currentLesson.dataset;
    const resourceNum = currentRes.dataset.num;
  const { correct } = await ajaxCall(`${domain}/api/v1/questions/solve-questions`, {solvedQuestions: userAnswers, subcourseId: location.href.split('/')[4], lessonId, resourceNum});

  const total = currentQuiz.length;

  const wrong = total - correct;

  const percentage = Math.round((correct / total) * 100);

  /*
        عرض النتيجة
    */

  document.getElementById("scorePercentage").textContent = percentage + "%";

  document.getElementById("correctAnswers").textContent = correct;

  document.getElementById("wrongAnswers").textContent = wrong;

  document.getElementById("resultTotal").textContent = total;

  /*
        الرسالة حسب النتيجة
    */

  const message = document.getElementById("resultMessage");

  if (percentage >= 90) {
    message.textContent = "ممتاز جداً! أداء رائع، استمر بهذا المستوى.";
  } else if (percentage >= 70) {
    message.textContent = "أحسنت! نتيجة جيدة ويمكنك الوصول إلى الأفضل.";
  } else if (percentage >= 50) {
    message.textContent = "نتيجة مقبولة، ننصحك بمراجعة الدرس مرة أخرى.";
  } else {
    message.textContent = "لا بأس، حاول مراجعة الدرس وإعادة الاختبار.";
  }

  const lastLesson = document.querySelector('.lessons-list').lastElementChild;
  const lastRes = lastLesson.lastElementChild.lastElementChild;
  const isLastRes = currentLesson.dataset.num == lastLesson.dataset.num && resourceNum == lastRes.dataset.num;
  resultBtn.textContent = percentage > 80 && !isLastRes? "الدرس التالي" : "العودة الى الدرس";
  
  resultBtn.setAttribute("action", percentage > 80 && !isLastRes? "next" : "back");

  let newRes;
  let inNextLesson = false;
    
    if(resultBtn.getAttribute('action') === "next") {
        newRes = currentRes.nextElementSibling;
        if(!newRes){
            let nextLesson = currentLesson.nextElementSibling;
            inNextLesson = true;
        if(!nextLesson){
            newRes = currentRes.previousElementSibling;
        }
        newRes = nextLesson.querySelector('.lesson-resource');
        }
    }
    else
        newRes = currentRes.previousElementSibling;
  if(percentage > 80){
  newRes.classList.remove('locked');
  if(newRes.classList.contains('video-resource')) {
    newRes.querySelector('.resource-icon').innerHTML = "<i class='fa-solid fa-play'></i>";
  } 
  
  else if(newRes.classList.contains('quiz-resource')) {
     newRes.querySelector('.resource-icon').innerHTML = "<i class='fa-solid fa-clipboard-question'></i>"
  }
  updateUserProgress(isLastRes? Number(currentRes.dataset.num) : newRes.dataset.num, inNextLesson? currentLesson.nextElementSibling.dataset.num: currentLesson.dataset.num)
  currentRes.querySelector('.state-mark').classList.remove('fa-chevron-left');
    currentRes.querySelector('.state-mark').classList.remove('resource-action');
    currentRes.querySelector('.state-mark').classList.add('fa-circle-check');
    currentRes.querySelector('.state-mark').classList.add('completed');
}
  showView(resultView);
}

resultBtn.addEventListener('click', () => {
    const currentRes = [...document.querySelectorAll('.lesson-resource')].find(res => res.classList.contains('active'));
    const currentLesson = [...document.querySelectorAll('.lesson')].find(lesson => lesson.classList.contains('active'));

    let newRes;
    let inNextLesson = false;
    
    if(resultBtn.getAttribute('action') === "next") {
        newRes = currentRes.nextElementSibling;
        if(!newRes){
            let nextLesson = currentLesson.nextElementSibling;
            inNextLesson = true;
        if(!nextLesson){
            newRes = currentRes.previousElementSibling;
        }
        newRes = nextLesson.querySelector('.lesson-resource');
        }
    }
    else
        newRes = currentRes.previousElementSibling;

    [...document.querySelectorAll('.lesson-resource')].forEach(res => res.classList.remove('active'));

    newRes.classList.add('active');
    [...document.querySelectorAll('.lesson')].forEach(lesson => lesson.classList.remove('active'));
    newRes.closest('.lesson').classList.add('active');

    
    moveToRes(newRes);
})

/* =========================================
   RETRY QUIZ
========================================= */

document.getElementById("retryQuiz").addEventListener("click", () => {
  startQuiz(currentQuiz);
});

/* =========================================
   SHOW VIEW
========================================= */

function showView(view, url=null) {
  document.querySelectorAll(".page-view").forEach((item) => {
    if(item.id === "videoView") {
        videoContainer.innerHTML = '';
    }
    item.classList.remove("active-view");
  });

  if(view.id === "videoView") buildVideoView(url);

  view.classList.add("active-view");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function buildVideoView(url) {
  videoContainer.innerHTML = `<div style="position:relative; height:100%; width:100%;">
  <iframe
    class="my-iframe"
    src="${url}"
    loading="lazy"
    style="border:0; border-radius:6px; position:absolute; top:0; height:100%; width:100%;"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowfullscreen="true">
  </iframe>
</div>
`;
}

function updateVideoView(video) {
    const {badge, title, duration, description} = video.dataset;

    videoBadge.textContent = badge;
    videoTitle.textContent = title;
    document.querySelector('.duration-container').textContent = duration;
    videoDescription.textContent = description;
    
    const resNum = video.dataset.num;
    const lessonNum = video.closest('.lesson').dataset.num;

    if(lessonNum == 1 && resNum == 0) prevLessonBtn.classList.add('hidden')
      else
    prevLessonBtn.classList.remove('hidden');

    const lastLesson = document.querySelector('.lessons-list').lastElementChild; 
    if(lessonNum == lastLesson.dataset.num && resNum == lastLesson.lastElementChild.lastElementChild.dataset.num) btnPrimary.classList.add('hidden');
    else btnPrimary.classList.remove('hidden');
    
}

function updateLodaerView(title, description) {
    loaderTitle.textContent = title;
    lodaerDescription.textContent = description;
}

async function init() {

const darkMode = localStorage.getItem('darkMode');
    if(darkMode) {
        darkToggle.checked = true;
        document.body.classList.toggle("page-dark-mode");
    }

    let res;
if(!document.body.dataset.toRes) {
const lesson = [...document.querySelectorAll('.lesson')].find(lesson => lesson.dataset.num == achievedLesson);
lesson.classList.add('active');
res = [...lesson.querySelectorAll('.lesson-resource')].find(res => res.dataset.num == achievedResource);
res.classList.add('active');
}
else {
res = [...document.querySelectorAll('.lesson-resource')].find(res => res.classList.contains('active'));
}

moveToRes(res);
}

async function moveToRes(res) {
res.classList.remove('locked');
if(res.classList.contains('video-resource')) {
    res.querySelector('.resource-icon').innerHTML = "<i class='fa-solid fa-play'></i>";
    const url = res.dataset.videoUrl;
    showView(videoView, url);
    updateVideoView(res);
    closeMobileSidebar();
}

else if(res.classList.contains('quiz-resource')) {
    res.querySelector('.resource-icon').innerHTML = "<i class='fa-solid fa-clipboard-question'></i>"
    updateLodaerView('جاري تحميل الأسألة', 'لحظات و يتم بدء الاختبار');
    showView(loadingView);
    const {questions} = (await ajaxCall(
    `${domain}/api/v1/questions`,
    {subcourseId: location.href.split('/')[4] ,resourceNum: res.dataset.num, lessonId: res.closest('.lesson').dataset.lessonId}
    )).data;
    quizTitle.textContent = res.querySelector('strong').textContent;
    startQuiz(questions);
}
}

darkToggle.addEventListener('change', () => {
    document.body.classList.toggle('page-dark-mode', darkToggle.checked);

    if(darkToggle.checked) {
        localStorage.setItem("darkMode", "active");
    } else {
        localStorage.removeItem("darkMode");
    }
});

init();