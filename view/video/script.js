/* =========================================
   LESSON ACCORDION
========================================= */

const lessons = document.querySelectorAll(".lesson");

lessons.forEach(lesson => {

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
            question: "كم يساوي 5 + 3 ؟",

            options: [
                "6",
                "7",
                "8",
                "9"
            ],

            correct: 2
        },

        {
            question: "كم يساوي 10 - 4 ؟",

            options: [
                "4",
                "5",
                "6",
                "7"
            ],

            correct: 2
        },

        {
            question: "كم يساوي 6 × 2 ؟",

            options: [
                "10",
                "12",
                "14",
                "16"
            ],

            correct: 1
        },

        {
            question: "كم يساوي 20 ÷ 5 ؟",

            options: [
                "2",
                "3",
                "4",
                "5"
            ],

            correct: 2
        },

        {
            question: "كم يساوي 7 + 6 ؟",

            options: [
                "11",
                "12",
                "13",
                "14"
            ],

            correct: 2
        }

    ],


    lesson2: [

        {
            question: "إذا كان x + 5 = 10 فما قيمة x ؟",

            options: [
                "3",
                "4",
                "5",
                "6"
            ],

            correct: 2
        },

        {
            question: "إذا كان x - 3 = 7 فما قيمة x ؟",

            options: [
                "8",
                "9",
                "10",
                "11"
            ],

            correct: 2
        },

        {
            question: "ما قيمة x في المعادلة 2x = 10 ؟",

            options: [
                "2",
                "3",
                "5",
                "10"
            ],

            correct: 2
        },

        {
            question: "إذا كان x + 2 = 8 فما قيمة x ؟",

            options: [
                "4",
                "5",
                "6",
                "7"
            ],

            correct: 2
        },

        {
            question: "ما قيمة x في المعادلة x / 2 = 4 ؟",

            options: [
                "4",
                "6",
                "8",
                "10"
            ],

            correct: 2
        }

    ],


    lesson3: [

        {
            question: "ما درجة المعادلة 2x + 5 = 10 ؟",

            options: [
                "الأولى",
                "الثانية",
                "الثالثة",
                "الرابعة"
            ],

            correct: 0
        },

        {
            question: "ما قيمة x في 3x = 12 ؟",

            options: [
                "2",
                "3",
                "4",
                "5"
            ],

            correct: 2
        },

        {
            question: "إذا كان x - 8 = 2 فما قيمة x ؟",

            options: [
                "8",
                "9",
                "10",
                "11"
            ],

            correct: 2
        },

        {
            question: "ما قيمة x في 5x = 25 ؟",

            options: [
                "3",
                "4",
                "5",
                "6"
            ],

            correct: 2
        },

        {
            question: "إذا كان x + 10 = 15 فما قيمة x ؟",

            options: [
                "3",
                "4",
                "5",
                "6"
            ],

            correct: 2
        }

    ],


    lesson4: [

        {
            question: "إذا كان x > 5، فأي قيمة تحقق المتباينة؟",

            options: [
                "3",
                "4",
                "5",
                "6"
            ],

            correct: 3
        },

        {
            question: "أي رمز يعني أصغر من؟",

            options: [
                ">",
                "<",
                "=",
                "≥"
            ],

            correct: 1
        },

        {
            question: "أي رمز يعني أكبر من؟",

            options: [
                "<",
                "=",
                ">",
                "≤"
            ],

            correct: 2
        },

        {
            question: "إذا كان x < 10، فأي قيمة صحيحة؟",

            options: [
                "12",
                "11",
                "10",
                "8"
            ],

            correct: 3
        },

        {
            question: "أي متباينة صحيحة؟",

            options: [
                "8 > 10",
                "5 < 9",
                "7 > 12",
                "3 = 8"
            ],

            correct: 1
        }

    ]

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


const questionText =
    document.getElementById("questionText");

const optionsContainer =
    document.getElementById("optionsContainer");


const currentQuestion =
    document.getElementById("currentQuestion");

const totalQuestions =
    document.getElementById("totalQuestions");


const quizProgressBar =
    document.getElementById("quizProgressBar");


const previousButton =
    document.getElementById("prevQuestion");

const nextButton =
    document.getElementById("nextQuestion");


/* =========================================
   OPEN QUIZ
========================================= */

const quizButtons =
    document.querySelectorAll(".quiz-resource");


quizButtons.forEach(button => {

    button.addEventListener("click", () => {

        const quizId =
            button.dataset.quiz;

        startQuiz(quizId);

        closeMobileSidebar();

    });

});


/* =========================================
   START QUIZ
========================================= */

function startQuiz(quizId) {

    selectedQuizId = quizId;

    currentQuiz = quizzes[quizId];

    currentQuestionIndex = 0;

    userAnswers =
        new Array(currentQuiz.length).fill(null);


    showView(quizView);

    renderQuestion();

}


/* =========================================
   RENDER QUESTION
========================================= */

function renderQuestion() {

    const question =
        currentQuiz[currentQuestionIndex];


    questionText.textContent =
        question.question;


    currentQuestion.textContent =
        currentQuestionIndex + 1;


    totalQuestions.textContent =
        currentQuiz.length;


    optionsContainer.innerHTML = "";


    const letters = [
        "أ",
        "ب",
        "ج",
        "د"
    ];


    question.options.forEach((option, index) => {

        const button =
            document.createElement("button");


        button.className =
            "option-btn";


        if (
            userAnswers[currentQuestionIndex] === index
        ) {

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

            selectAnswer(index);

        });


        optionsContainer.appendChild(button);

    });


    updateProgress();

    updateButtons();

}


/* =========================================
   SELECT ANSWER
========================================= */

function selectAnswer(index) {

    userAnswers[currentQuestionIndex] =
        index;


    const buttons =
        document.querySelectorAll(".option-btn");


    buttons.forEach((button, buttonIndex) => {

        button.classList.toggle(
            "selected",
            buttonIndex === index
        );

    });

}


/* =========================================
   PROGRESS
========================================= */

function updateProgress() {

    const progress =
        (
            (currentQuestionIndex + 1) /
            currentQuiz.length
        ) * 100;


    quizProgressBar.style.width =
        progress + "%";

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


    if (
        currentQuestionIndex ===
        currentQuiz.length - 1
    ) {

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


    /*
        لا يسمح بالانتقال
        إذا لم يختر الطالب إجابة
    */

    if (
        userAnswers[currentQuestionIndex] === null
    ) {

        alert("يرجى اختيار إجابة أولاً");

        return;

    }


    /*
        إذا كان آخر سؤال
    */

    if (
        currentQuestionIndex ===
        currentQuiz.length - 1
    ) {

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

    const unanswered =
        userAnswers.includes(null);


    if (unanswered) {

        alert(
            "يجب الإجابة عن جميع الأسئلة قبل إنهاء الاختبار"
        );

        return;

    }


    /*
        إخفاء الاختبار
        وإظهار اللودر
    */

    showView(loadingView);


    /*
        محاكاة عملية التصحيح
        لمدة 2 ثانية
    */

    setTimeout(() => {

        calculateResult();

    }, 2000);

}


/* =========================================
   CALCULATE RESULT
========================================= */

function calculateResult() {

    let correct = 0;


    currentQuiz.forEach((question, index) => {

        if (
            userAnswers[index] ===
            question.correct
        ) {

            correct++;

        }

    });


    const total =
        currentQuiz.length;


    const wrong =
        total - correct;


    const percentage =
        Math.round(
            (correct / total) * 100
        );


    /*
        عرض النتيجة
    */

    document.getElementById(
            "scorePercentage"
        ).textContent =
        percentage + "%";


    document.getElementById(
            "correctAnswers"
        ).textContent =
        correct;


    document.getElementById(
            "wrongAnswers"
        ).textContent =
        wrong;


    document.getElementById(
            "resultTotal"
        ).textContent =
        total;


    /*
        الرسالة حسب النتيجة
    */

    const message =
        document.getElementById(
            "resultMessage"
        );


    if (percentage >= 90) {

        message.textContent =
            "ممتاز جداً! أداء رائع، استمر بهذا المستوى.";

    } else if (percentage >= 70) {

        message.textContent =
            "أحسنت! نتيجة جيدة ويمكنك الوصول إلى الأفضل.";

    } else if (percentage >= 50) {

        message.textContent =
            "نتيجة مقبولة، ننصحك بمراجعة الدرس مرة أخرى.";

    } else {

        message.textContent =
            "لا بأس، حاول مراجعة الدرس وإعادة الاختبار.";

    }


    showView(resultView);

}


/* =========================================
   RETRY QUIZ
========================================= */

document.getElementById(
    "retryQuiz"
).addEventListener("click", () => {

    startQuiz(selectedQuizId);

});


/* =========================================
   BACK TO LESSON
========================================= */

document.getElementById(
    "backToLesson"
).addEventListener("click", () => {

    showView(videoView);

});


/* =========================================
   SHOW VIEW
========================================= */

function showView(view) {

    document
        .querySelectorAll(".page-view")
        .forEach(item => {

            item.classList.remove(
                "active-view"
            );

        });


    view.classList.add(
        "active-view"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}