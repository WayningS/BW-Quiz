const TOTAL_QUESTIONS = 10;
const QUESTION_TIME = 60;

let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let penalties = [];
let jokerPenalties = [];
let jokerUsedForCurrentQuestion = false;
let jokerPenaltySelectedForCurrentQuestion = false;

let timerInterval = null;
let timeLeft = QUESTION_TIME;
let questionResolved = false;

const startScreen = document.getElementById("start-screen");
const readyScreen = document.getElementById("ready-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const startBtn = document.getElementById("start-btn");
const readyBtn = document.getElementById("ready-btn");
const restartBtn = document.getElementById("restart-btn");
const nextBtn = document.getElementById("next-btn");

const readyTitle = document.getElementById("ready-title");
const readyProgress = document.getElementById("ready-progress");
const readyScore = document.getElementById("ready-score");
const readyProgressFill = document.getElementById("ready-progress-fill");

const progressEl = document.getElementById("progress");
const scoreEl = document.getElementById("score");
const progressFill = document.getElementById("progress-fill");
const questionEl = document.getElementById("question");
const questionImage = document.getElementById("question-image");
const answersEl = document.getElementById("answers");
const feedbackEl = document.getElementById("feedback");
const penaltyBox = document.getElementById("penalty-box");

const jokerBox = document.getElementById("joker-box");
const jokerBtn = document.getElementById("joker-btn");
const jokerChoice = document.getElementById("joker-choice");

const resultScore = document.getElementById("result-score");
const resultWrong = document.getElementById("result-wrong");
const totalPushups = document.getElementById("total-pushups");
const totalSquats = document.getElementById("total-squats");

const timerWrapper = document.getElementById("timer-wrapper");
const timerSeconds = document.getElementById("timer-seconds");
const timerRing = document.getElementById("timer-ring");

const CIRCLE_RADIUS = 80;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

async function loadQuestions() {
  const response = await fetch("./fragen.json?update=" + Date.now(), {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("fragen.json konnte nicht geladen werden.");
  }

  allQuestions = await response.json();
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function showScreen(screen) {
  startScreen.classList.add("hidden");
  readyScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

function setAnswerButtonsLocked(locked) {
  [...answersEl.children].forEach((btn) => {
    btn.disabled = locked;
    btn.classList.toggle("locked", locked);
  });
}

function startQuiz() {
  currentIndex = 0;
  correctCount = 0;
  penalties = [];
  jokerPenalties = [];
  quizQuestions = shuffle(allQuestions).slice(0, TOTAL_QUESTIONS);

  if (quizQuestions.length < TOTAL_QUESTIONS) {
    alert(`Du brauchst mindestens ${TOTAL_QUESTIONS} Fragen in fragen.json.`);
    return;
  }

  showReadyScreen();
}

function showReadyScreen() {
  stopQuestionTimer();

  readyTitle.textContent = `Soldat ${currentIndex + 1} bereit?`;
  readyProgress.textContent = `Frage ${currentIndex + 1} von ${TOTAL_QUESTIONS}`;
  readyScore.textContent = `${correctCount} richtig`;
  readyProgressFill.style.width = `${(currentIndex / TOTAL_QUESTIONS) * 100}%`;

  showScreen(readyScreen);
}

function showCurrentQuestion() {
  showScreen(quizScreen);
  renderQuestion();
}

function renderQuestion() {
  const q = quizQuestions[currentIndex];
  jokerUsedForCurrentQuestion = false;
  jokerPenaltySelectedForCurrentQuestion = false;
  questionResolved = false;

  progressEl.textContent = `Frage ${currentIndex + 1} von ${TOTAL_QUESTIONS}`;
  scoreEl.textContent = `${correctCount} richtig`;
  progressFill.style.width = `${(currentIndex / TOTAL_QUESTIONS) * 100}%`;

  questionEl.textContent = q.frage;
  answersEl.innerHTML = "";
  feedbackEl.className = "feedback hidden";
  feedbackEl.textContent = "";
  penaltyBox.classList.add("hidden");
  nextBtn.classList.add("hidden");
  nextBtn.textContent = currentIndex + 1 >= TOTAL_QUESTIONS ? "Ergebnis anzeigen" : "Nächster Soldat";

  if (jokerBox) jokerBox.classList.remove("hidden");
  if (jokerChoice) jokerChoice.classList.add("hidden");

  if (jokerBtn) {
    jokerBtn.disabled = false;
    jokerBtn.classList.remove("used");
    jokerBtn.textContent = "Joker: Gruppe fragen";
  }

  if (q.bild) {
    questionImage.src = q.bild;
    questionImage.classList.remove("hidden");
  } else {
    questionImage.removeAttribute("src");
    questionImage.classList.add("hidden");
  }

  for (const letter of ["A", "B", "C", "D"]) {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.innerHTML = `<span class="letter">${letter}</span><span>${q.antworten[letter]}</span>`;
    btn.addEventListener("click", () => answerQuestion(letter));
    answersEl.appendChild(btn);
  }

  startQuestionTimer();
}

function startQuestionTimer() {
  stopQuestionTimer();

  timeLeft = QUESTION_TIME;
  updateTimerVisuals();
  if (timerWrapper) {
    timerWrapper.classList.remove("time-up");
  }

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerVisuals();

    if (timeLeft <= 0) {
      stopQuestionTimer();
      handleTimeUp();
    }
  }, 1000);
}

function stopQuestionTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerVisuals() {
  if (timerSeconds) {
    timerSeconds.textContent = String(Math.max(timeLeft, 0));
  }

  const progress = (QUESTION_TIME - Math.max(timeLeft, 0)) / QUESTION_TIME;
  const dashOffset = CIRCLE_CIRCUMFERENCE * progress;

  if (timerRing) {
    timerRing.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE}`;
    // Positive Dashoffset-Richtung = sichtbarer Ablauf gegen den Uhrzeigersinn
    timerRing.style.strokeDashoffset = `${dashOffset}`;
  }

}


function handleTimeUp() {
  if (questionResolved) return;

  questionResolved = true;

  [...answersEl.children].forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove("locked");
    const letter = btn.querySelector(".letter").textContent;
    const q = quizQuestions[currentIndex];
    if (letter === q.richtig) btn.classList.add("correct");
  });

  const jokerPenaltyPending = jokerUsedForCurrentQuestion && !jokerPenaltySelectedForCurrentQuestion;

  if (jokerBox) jokerBox.classList.toggle("hidden", !jokerPenaltyPending);
  if (jokerChoice) jokerChoice.classList.toggle("hidden", !jokerPenaltyPending);
  if (timerWrapper) timerWrapper.classList.add("time-up");

  feedbackEl.classList.remove("hidden");
  feedbackEl.classList.remove("good");
  feedbackEl.classList.add("bad");
  feedbackEl.innerHTML = `<strong>Zeit abgelaufen.</strong><br>Die Frage gilt als falsch beantwortet.`;

  penaltyBox.classList.toggle("hidden", jokerPenaltyPending);
}

function useJoker() {
  if (jokerUsedForCurrentQuestion || questionResolved) return;

  jokerUsedForCurrentQuestion = true;
  jokerPenaltySelectedForCurrentQuestion = false;
  setAnswerButtonsLocked(true);

  if (jokerBtn) {
    jokerBtn.disabled = true;
    jokerBtn.classList.add("used");
    jokerBtn.textContent = "Erst Joker-Übung wählen";
  }

  if (jokerChoice) {
    jokerChoice.classList.remove("hidden");
  }
}

document.querySelectorAll("[data-joker-penalty]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!jokerUsedForCurrentQuestion || jokerPenaltySelectedForCurrentQuestion) return;

    jokerPenaltySelectedForCurrentQuestion = true;
    jokerPenalties.push(btn.dataset.jokerPenalty);

    if (jokerChoice) {
      jokerChoice.classList.add("hidden");
    }

    if (jokerBtn) {
      jokerBtn.textContent = "Joker: Gruppe darf helfen";
    }

    if (questionResolved) {
      if (jokerBox) jokerBox.classList.add("hidden");
      penaltyBox.classList.remove("hidden");
    } else {
      setAnswerButtonsLocked(false);
    }
  });
});

function answerQuestion(selected) {
  if (questionResolved) return;

  questionResolved = true;
  stopQuestionTimer();

  const q = quizQuestions[currentIndex];
  const isCorrect = selected === q.richtig;

  [...answersEl.children].forEach((btn) => {
    btn.disabled = true;
    const letter = btn.querySelector(".letter").textContent;
    if (letter === q.richtig) btn.classList.add("correct");
    if (letter === selected && !isCorrect) btn.classList.add("wrong");
  });

  if (jokerBox) jokerBox.classList.add("hidden");

  feedbackEl.classList.remove("hidden");
  feedbackEl.classList.toggle("good", isCorrect);
  feedbackEl.classList.toggle("bad", !isCorrect);

  if (isCorrect) {
    correctCount++;
    feedbackEl.innerHTML = `<strong>Richtig!</strong><br>${q.erklaerung || ""}`;
    nextBtn.classList.remove("hidden");
  } else {
    feedbackEl.innerHTML = `<strong>Falsch.</strong><br>Richtig wäre Antwort ${q.richtig}. ${q.erklaerung || ""}`;
    penaltyBox.classList.remove("hidden");
  }

  scoreEl.textContent = `${correctCount} richtig`;
}

document.querySelectorAll("[data-penalty]").forEach((btn) => {
  btn.addEventListener("click", () => {
    penalties.push(btn.dataset.penalty);
    penaltyBox.classList.add("hidden");
    nextBtn.classList.remove("hidden");
  });
});

function nextQuestion() {
  stopQuestionTimer();
  currentIndex++;
  if (currentIndex >= TOTAL_QUESTIONS) {
    showResults();
  } else {
    showReadyScreen();
  }
}

function showResults() {
  stopQuestionTimer();
  progressFill.style.width = "100%";
  const wrong = TOTAL_QUESTIONS - correctCount;

  resultScore.textContent = `${correctCount}/${TOTAL_QUESTIONS}`;
  resultWrong.textContent = wrong.toString();

  const pushups = penalties.filter(p => p === "Liegestütze").length;
  const squats = penalties.filter(p => p === "Kniebeugen").length;

  const jokerPushups = jokerPenalties.filter(p => p === "Liegestütze").length;
  const jokerSquats = jokerPenalties.filter(p => p === "Kniebeugen").length;
  const totalPushupCount = jokerPushups * 5 + pushups * 10;
  const totalSquatCount = jokerSquats * 5 + squats * 10;

  totalPushups.textContent = totalPushupCount.toString();
  totalSquats.textContent = totalSquatCount.toString();

  showScreen(resultScreen);
}

function confirmResetToStartScreen() {
  const shouldReset = confirm("Zur Startseite zurückkehren? Das aktuelle Ergebnis wird zurückgesetzt.");
  if (!shouldReset) return;

  resetToStartScreen();
}

function resetToStartScreen() {
  stopQuestionTimer();
  currentIndex = 0;
  correctCount = 0;
  penalties = [];
  jokerPenalties = [];
  quizQuestions = [];
  showScreen(startScreen);
}

if (jokerBtn) {
  jokerBtn.addEventListener("click", useJoker);
}

startBtn.addEventListener("click", startQuiz);
readyBtn.addEventListener("click", showCurrentQuestion);
restartBtn.addEventListener("click", confirmResetToStartScreen);
nextBtn.addEventListener("click", nextQuestion);

loadQuestions().catch((error) => {
  console.error(error);
  alert("Fehler beim Laden der Fragen. Prüfe die Datei fragen.json.");
});

// Alten Offline-Cache deaktivieren, damit neue Fragen sauber geladen werden.
// Offline-Funktion können wir später wieder sauber einbauen.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}
