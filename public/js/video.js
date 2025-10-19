const listOpnBtn = document.querySelector(".hamburger-menu");
const list = document.querySelector(".lessons-sidebar");

const btnsContainers = document.querySelectorAll(".btns-flex-container");
const videoContainer = document.querySelectorAll(".video-item");

const uploadLessonBtn = document.querySelector("#lesson");
const uploadQuestionBtn = document.querySelector("#question");

// The notifcation message
const notifcation = document.querySelector(".error");

const domain = document.body.dataset.domain;

const videoToPlayContainer = document.querySelector(".video-player-container");
const videoTitle = document.querySelector(".lesson-title-main");
const descriptionBox = document.querySelector(".lesson-description-box");
const aboutVideo = document.querySelector(".description-video-about");
const videoDuration = document.querySelector(".video-duration");
const videoDate = document.querySelector(".video-date");
const questionsSection = document.querySelector(".questions-section");

const role = document.body.dataset.role;
const username = document.body.dataset.username;

const submitAnswersBtn = document.querySelector(".submit-answers-btn");
let questions = [];
const questionAdminHTML = `
<i class="bi-trash delete-question-btn" data-deletecount="0">&#128465;</i>
<svg class="bi-edit edit-question-btn" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"></path>
    <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"></path>
  </svg>
`;
const submitBtnContainer = document.querySelector(
  ".submit-answers-btn-container"
);

let screenState = false;

const showNotification = function (msg, type) {
  notifcation.classList.toggle("hidden");

  type === "success" ? (type = "success") : (type = "error");

  const notifcationPopup = notifcation.querySelector(`.toast-${type}`);

  notifcationPopup.classList.remove("hidden");

  const notifcationMsg = notifcationPopup.querySelector(".toast-text");
  notifcationMsg.textContent = msg;
  setTimeout(() => {
    notifcation.classList.toggle("hidden");
    [...notifcation.querySelectorAll(".toast")].forEach((t) =>
      t.classList.add("hidden")
    );
  }, 5000);
};

const handleDocumentClick = function (e) {
  const clickedList = e.target.closest(".lessons-sidebar");
  if (clickedList) return;

  if (e.target.closest(".hamburger-menu")) return;
  if (!list.classList.contains("hidden")) list.classList.add("hidden");
};

const createQuestionHTML = async function (text, answers, id) {
  const questionDiv = document.createElement("div");
  questionDiv.classList.add("question-card");
  questionDiv.setAttribute("data-questionid", id);
  questionDiv.innerHTML = `
        ${role === "admin" ? questionAdminHTML : ""}
        <p class="question-text">${text}</p>
        <div  class="answer-options">
        <div data-answernum= 0 class="answer-option">${answers[0]}</div>
        <div data-answernum= 1 class="answer-option">${answers[1]}</div>
        <div data-answernum= 2 class="answer-option">${answers[2]}</div>
        <div data-answernum= 3 class="answer-option">${answers[3]}</div>
        </div>
  `;
  questions.push(questionDiv);
  submitBtnContainer.insertAdjacentElement(`beforebegin`, questionDiv);
};

const addL = function (tit) {
  const fl = document.createElement("div");
  const sl = document.createElement("div");
  const tl = document.createElement("div");
  const ll = document.createElement("div");
  fl.classList.add("fl");
  sl.classList.add("sl");
  tl.classList.add("tl");
  ll.classList.add("ll");

  fl.textContent = username[0];
  sl.textContent = username[1];
  tl.textContent = username[2];
  ll.textContent = username[username.length - 1];

  tit.append(fl);
  tit.append(sl);
  tit.append(tl);
  tit.append(ll);
};

const styleDate = function (date) {
  const newDate = new Date(date);
  const day = newDate.getDate();
  const year = newDate.getFullYear();
  const arabicMonths = [
    "كانون الثاني",
    "شباط",
    "أذار",
    "نيسان",
    "أيار",
    "حزيران",
    "تموز",
    "أب",
    "أيلول",
    "تشرين الأول",
    "تشرين الثاني",
    "كانون الأول",
  ];
  const month = arabicMonths[newDate.getMonth()];
  return `${day}/${newDate.getMonth() + 1}/${year}`;
};

const initDescriptionBox = function (clicked) {
  const videoInfo = clicked.dataset.videoinfo;
  const duration = clicked.dataset.videoduration;
  const initialDate = clicked.dataset.videodate;
  aboutVideo.textContent = videoInfo;
  videoDuration.textContent = duration;
  videoDate.textContent = styleDate(initialDate);

  descriptionBox.classList.remove("hidden");
};
const createQuestions = async function (clicked) {
  list.classList.add("hidden");
  const subcourseId = location.href.split("/")[4];

  // Highlight video
  [...document.querySelectorAll(".video-item")].forEach((vi) =>
    vi.classList.remove("active")
  );
  clicked.classList.add("active");

  // Setting the video Section
  const title = clicked.querySelector(".video-title").textContent;
  videoTitle.textContent = title;

  // Setting the Description Section
  initDescriptionBox(clicked);

  // Setting the Questions Section
  submitBtnContainer.classList.add("hidden");
  questions = [];
  const oldQuestions = [...document.querySelectorAll(".question-card")];
  if (oldQuestions && oldQuestions.length > 0) {
    oldQuestions.forEach((oq) => oq.remove());
  }

  const questionsToLoad = await ajaxCall(
    `${domain}/api/v1/videos/${clicked.dataset.videoid}/questions`,
    "POST",
    { subcourseId }
  );

  if (questionsToLoad.data.questions.length > 0) {
    questionsToLoad.data.questions.forEach((q) =>
      createQuestionHTML(q.text, q.answers, q._id)
    );
    questionsSection.classList.remove("hidden");
    submitBtnContainer.classList.remove("hidden");
  }
  // Setting the video
  const videoElement = clicked.closest(".video-item");
  const videoId = videoElement.dataset.videoid;
  document.body.setAttribute("data-videoid", videoId);

  videoToPlayContainer.innerHTML = `
     <div style="position:relative; height:100%; width:100%;"><iframe class="my-iframe" src="${videoElement.dataset.videourl}" loading="lazy" style="border:0;border-radius:6px;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>
     `;
};

const ajaxCall = async function (url, method, data = undefined) {
  const fetchOpts = {};
  fetchOpts.method = method;
  fetchOpts.headers = { "Content-Type": "application/json" };
  if (data) fetchOpts.body = JSON.stringify(data);
  const response = await fetch(url, fetchOpts);
  const data2 = await response.json();
  return data2;
};

const handleQuestionSectionClick = async function (e) {
  if (role === "admin") {
    const videoId = location.href.split("/")[4];
    const clicked1 = e.target.closest(".bi-edit");
    if (clicked1) {
      const questionId =
        clicked1?.closest(".question-card")?.dataset.questionid;
      return location.assign(`/videos/${videoId}/edit-question/${questionId}`);
    }

    const clicked2 = e.target.closest(".bi-trash");
    if (clicked2) {
      const deleteCount = Number(clicked2.dataset.deletecount);

      if (deleteCount !== 2) return clicked2.dataset.deletecount++;

      const questionToDelete =
        clicked2.closest(".question-card").dataset.questionid;

      const response = await fetch(
        `${domain}/api/v1/videos/${videoId}/questions/${questionToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      showNotification(data.message, data.status);
      if (data.status === "success") {
        return setTimeout(() => {
          location.reload(true);
        }, 1500);
      }
    }
  }
  const clicked3 = e.target.closest(".answer-option");
  if (clicked3) {
    const answerContainer = clicked3.closest(".answer-options");
    [...answerContainer.querySelectorAll(".answer-option")].forEach((cb) =>
      cb.classList.remove("selected")
    );
    clicked3.classList.add("selected");
  }
};

if(role === 'admin'){
uploadQuestionBtn.addEventListener("click", function (e) {
  const videoId = [...document.querySelectorAll(".video-item")]?.find((vi) =>
    vi.classList.contains("active")
  )?.dataset?.videoid;
  if (!videoId) return;
  location.assign(`/videos/${videoId}/upload-question`);
});
}
document.addEventListener("click", handleDocumentClick);

listOpnBtn.addEventListener("click", (e) => {
  list.classList.toggle("hidden");
});
if (role === "admin") {
  uploadLessonBtn.addEventListener("click", (e) => {
    const subcourseId = location.href.split("/")[4];
    location.assign(`/subcourses/${subcourseId}/upload-lesson`);
  });

  btnsContainers.forEach((btnsContainer) => {
    btnsContainer.addEventListener("click", async (e) => {
      if (e.target.closest(".video-item")) return;

      const lessonId = e.target.closest(".my-details").dataset.lessonid;
      const subcourseId = location.href.split("/")[4];
      const clicked1 = e.target.closest(".bi-edit");
      if (clicked1) {
        return location.assign(
          `/subcourses/${subcourseId}/edit-lesson/${
            clicked1.closest(".my-details").dataset.lessonid
          }`
        );
      }

      const clicked2 = e.target.closest(".bi-trash");
      if (clicked2) {
        const deleteCount = Number(clicked2.dataset.deletecount);

        if (deleteCount !== 2) {
          if (deleteCount === 0) clicked2.classList.add("trash1");
          if (deleteCount === 1) {
            clicked2.classList.remove("trash1");
            clicked2.classList.add("trash2");
          }
          return clicked2.dataset.deletecount++;
        }
        const lessonToDelete = e.target.closest(".my-details");

        const response = await fetch(
          `${domain}/api/v1/subcourses/${subcourseId}/lessons/${lessonToDelete.dataset.lessonid}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );

        const data = await response.json();

        showNotification(data.message, data.status);
        if (data.status === "success") {
          return setTimeout(() => {
            location.reload(true);
          }, 1500);
        }
      }

      const clicked3 = e.target.closest(".upload-video");

      if (clicked3) {
        return location.assign(`/lessons/${lessonId}/upload-video`);
      }
    });
  });
}

[...document.querySelectorAll("details")].forEach((d) => {
  d.addEventListener("click", function (e) {
    e.preventDefault();
    let active = false;
    if (!d.hasAttribute("open") && !d.hasAttribute("open2")) active = true;
    if (
      !(e.target.classList.contains("lesson-title")) &&
      !(e.target.tagName === "SPAN")
    ){
      return;
}
    [...document.querySelectorAll("details")].forEach((det) =>
      det.removeAttribute("open")
    );

    if (active) d.setAttribute("open", "true");
  });
});

videoContainer.forEach((btnsContainer) => {
  btnsContainer.addEventListener("click", async (e) => {
    const lessonId = e.target.closest(".my-details").dataset.lessonid;
    const clicked1 = e.target.closest(".bi-edit");
    if (clicked1) {
      return location.assign(
        `/lessons/${lessonId}/edit-video/${
          clicked1.closest(".video-item").dataset.videoid
        }`
      );
    }

    const clicked2 = e.target.closest(".bi-trash");

    if (clicked2) {
      const deleteCount = Number(clicked2.dataset.deletecount);

      if (deleteCount !== 2) {
        return clicked2.dataset.deletecount++;
      }
      const videoToDelete = clicked2.closest(".video-item").dataset.videoid;
      const response = await fetch(
        `${domain}/api/v1/lessons/${lessonId}/videos/${videoToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      showNotification(data.message, data.status);
      if (data.status === "success") {
        return setTimeout(() => {
          location.reload(true);
        }, 1500);
      }
    }

    const clicked3 = e.target.closest(".video-item");

    if (clicked3) {
      createQuestions(clicked3);
    }
  });
});

questionsSection.addEventListener("click", handleQuestionSectionClick);

const highlightAnswers = function (results) {
  const checks = [...document.querySelectorAll(".question-card")];
  results.forEach((result) => {
    const check = checks.find(
      (ch) => ch.dataset.questionid == result.questionId
    );
    const checked = check.querySelector(".selected");
    if (result.solvedRight == true) {
      checked.classList.remove("selected");
      checked.classList.add("right");
    } else {
      if (checked) {
        checked.classList.remove("selected");
        checked.classList.add("false");
      }
      const answers = [...check.querySelectorAll(".answer-option")];
      const correctCheckBox = answers.find(
        (answer) => Number(answer.dataset.answernum) + 1 == result.correctAnswer
      );
      correctCheckBox.classList.add("expected");
    }
  });
};

const handleSubmit = async function () {
  const solvedQuestions = questions.map((q) => {
    const questionId = q.closest(".question-card").dataset.questionid;
    let answer = -1;
    const checked = q.closest(".question-card").querySelector(".selected");

    if (checked)
      answer = Number(checked.closest(".answer-option").dataset.answernum) + 1;
    return { id: questionId, answer };
  });

  const videoId = document.body.dataset.videoid;

  const subcourseId = location.href.split("/")[4];

  const { results } = await ajaxCall(
    `${domain}/api/v1/videos/${videoId}/questions/solve-questions`,
    "POST",
    { solvedQuestions, subcourseId }
  );

  highlightAnswers(results);
  submitAnswersBtn.removeEventListener("click", handleSubmit);
  questionsSection.removeEventListener("click", handleQuestionSectionClick);
  setTimeout(() => {
    const answerBtns = questionsSection.querySelectorAll(".answer-option");
    answerBtns.forEach((ab) => {
      ab.classList.remove("selected");
      ab.classList.remove("right");
      ab.classList.remove("false");
      ab.classList.remove("expected");
      submitAnswersBtn.addEventListener("click", handleSubmit);
      questionsSection.addEventListener("click", handleQuestionSectionClick);
    });
  }, 15000);
};

submitAnswersBtn.addEventListener("click", handleSubmit);

// TODO
// const handleFullScreen = function() {
//   if(document.fullscreenElement && !screenState){
//     screenState = true;
//     setTimeout(() => {
//       document.exitFullscreen();
//       screenState = false;
//     }, 10 * 60 * 1000);
// }
// }

// document.addEventListener('fullscreenchange', handleFullScreen);
