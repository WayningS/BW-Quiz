const TOTAL_QUESTIONS = 10;

let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let penalties = [];
let jokerPenalties = [];
let jokerUsedForCurrentQuestion = false;

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const nextBtn = document.getElementById("next-btn");

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
const penaltyList = document.getElementById("penalty-list");

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
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  screen.classList.remove("hidden");
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

  showScreen(quizScreen);
  renderQuestion();
}

function renderQuestion() {
  const q = quizQuestions[currentIndex];
  jokerUsedForCurrentQuestion = false;

  progressEl.textContent = `Person ${currentIndex + 1} / Frage ${currentIndex + 1} von ${TOTAL_QUESTIONS}`;
  scoreEl.textContent = `${correctCount} richtig`;
  progressFill.style.width = `${(currentIndex / TOTAL_QUESTIONS) * 100}%`;

  questionEl.textContent = q.frage;
  answersEl.innerHTML = "";
  feedbackEl.className = "feedback hidden";
  feedbackEl.textContent = "";
  penaltyBox.classList.add("hidden");
  nextBtn.classList.add("hidden");

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
}

function useJoker() {
  if (jokerUsedForCurrentQuestion) return;

  jokerUsedForCurrentQuestion = true;

  if (jokerBtn) {
    jokerBtn.disabled = true;
    jokerBtn.classList.add("used");
    jokerBtn.textContent = "Joker wurde genutzt";
  }

  if (jokerChoice) {
    jokerChoice.classList.remove("hidden");
  }
}

document.querySelectorAll("[data-joker-penalty]").forEach((btn) => {
  btn.addEventListener("click", () => {
    jokerPenalties.push(btn.dataset.jokerPenalty);

    if (jokerChoice) {
      jokerChoice.classList.add("hidden");
    }

    if (jokerBtn) {
      jokerBtn.textContent = "Joker: Gruppe darf helfen";
    }
  });
});

function answerQuestion(selected) {
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
  currentIndex++;
  if (currentIndex >= TOTAL_QUESTIONS) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults() {
  progressFill.style.width = "100%";
  const wrong = TOTAL_QUESTIONS - correctCount;

  resultScore.textContent = `${correctCount}/${TOTAL_QUESTIONS}`;
  resultWrong.textContent = wrong.toString();

  const pushups = penalties.filter(p => p === "Liegestütze").length;
  const squats = penalties.filter(p => p === "Kniebeugen").length;

  const jokerPushups = jokerPenalties.filter(p => p === "Liegestütze").length;
  const jokerSquats = jokerPenalties.filter(p => p === "Kniebeugen").length;

  penaltyList.innerHTML = "";

  if (penalties.length === 0 && jokerPenalties.length === 0) {
    penaltyList.innerHTML = "<li>Keine Übungen nötig. Starker Durchgang.</li>";
  } else {
    if (jokerPushups > 0) {
      penaltyList.innerHTML += `<li>Joker: ${jokerPushups}x Liegestütze = ${jokerPushups * 5} Liegestütze gesamt</li>`;
    }

    if (jokerSquats > 0) {
      penaltyList.innerHTML += `<li>Joker: ${jokerSquats}x Kniebeugen = ${jokerSquats * 5} Kniebeugen gesamt</li>`;
    }

    if (pushups > 0) {
      penaltyList.innerHTML += `<li>Falsche Antwort: ${pushups}x Liegestütze = ${pushups * 10} Liegestütze gesamt</li>`;
    }

    if (squats > 0) {
      penaltyList.innerHTML += `<li>Falsche Antwort: ${squats}x Kniebeugen = ${squats * 10} Kniebeugen gesamt</li>`;
    }
  }

  showScreen(resultScreen);
}

function resetToStartScreen() {
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
restartBtn.addEventListener("click", resetToStartScreen);
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
