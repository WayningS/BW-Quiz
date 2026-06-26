const TOTAL_QUESTIONS = 10;
const QUESTION_TIME = 60;
const TIMER_WARNING_TIME = 10;
const THEME_STORAGE_KEY = "bwQuizTheme";
const SCOREBOARD_STORAGE_KEY = "bwQuizScoreboard";
const RUN_STATE_STORAGE_KEY = "bwQuizCurrentRun";
const OUTDOOR_MODE_STORAGE_KEY = "bwQuizOutdoorMode";
const QUIZ_SCALE_STORAGE_KEY = "bwQuizScale";
const APP_CACHE_NAME = "bw-quiz-scoreboard-test-v35";
const OFFLINE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./fragen.json",
  "./wildflecken-quiz-emblem.svg",
  "./manifest.webmanifest",
  "./icon.svg"
];
const THEMES = {
  exhibition: {
    bodyClass: "theme-exhibition",
    buttonText: "Design: Feldjägerregiment 2",
    themeColor: "#141e24"
  },
  classic: {
    bodyClass: "theme-classic",
    buttonText: "Design: Klassisch",
    themeColor: "#1f2a1f"
  }
};

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
let offlineReady = false;
let currentGroupName = "";
let resultSavedForCurrentRun = false;
let activeScreen = null;
let operatorReturnScreen = null;

const introScreen = document.getElementById("intro-screen");
const startScreen = document.getElementById("start-screen");
const readyScreen = document.getElementById("ready-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const scoreboardScreen = document.getElementById("scoreboard-screen");
const operatorScreen = document.getElementById("operator-screen");

const introStartBtn = document.getElementById("intro-start-btn");
const introScoreboardBtn = document.getElementById("intro-scoreboard-btn");
const startBtn = document.getElementById("start-btn");
const readyBtn = document.getElementById("ready-btn");
const restartBtn = document.getElementById("restart-btn");
const nextBtn = document.getElementById("next-btn");
const scoreboardBtn = document.getElementById("scoreboard-btn");
const scoreboardBackBtn = document.getElementById("scoreboard-back-btn");
const scoreboardClearBtn = document.getElementById("scoreboard-clear-btn");
const operatorBtn = document.getElementById("operator-btn");
const operatorThemeBtn = document.getElementById("operator-theme-btn");
const operatorScoreboardBtn = document.getElementById("operator-scoreboard-btn");
const operatorClearScoreboardBtn = document.getElementById("operator-clear-scoreboard-btn");
const operatorClearStorageBtn = document.getElementById("operator-clear-storage-btn");
const operatorOutdoorBtn = document.getElementById("operator-outdoor-btn");
const operatorQuizScaleInput = document.getElementById("operator-quiz-scale");
const operatorQuizScaleValue = document.getElementById("operator-quiz-scale-value");
const operatorResetBtn = document.getElementById("operator-reset-btn");
const groupNameInput = document.getElementById("group-name");

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
const resultGroup = document.getElementById("result-group");
const totalPushups = document.getElementById("total-pushups");
const totalSquats = document.getElementById("total-squats");
const scoreboardList = document.getElementById("scoreboard-list");
const scoreboardEmpty = document.getElementById("scoreboard-empty");

const timerWrapper = document.getElementById("timer-wrapper");
const timerSeconds = document.getElementById("timer-seconds");
const timerRing = document.getElementById("timer-ring");
const connectionStatus = document.getElementById("connection-status");
const themeColorMeta = document.querySelector("meta[name='theme-color']");

const CIRCLE_RADIUS = 80;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

async function loadQuestions() {
  const response = await fetch("./fragen.json?update=" + Date.now(), {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("fragen.json konnte nicht geladen werden.");
  }

  const data = await response.json();
  const questionData = Array.isArray(data) ? data : data.fragen;
  if (!Array.isArray(questionData)) {
    throw new Error("fragen.json hat kein gültiges Fragenformat.");
  }

  allQuestions = questionData.filter((question) => question.aktiv !== false);

}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function formatPoints(points) {
  return `${points} ${points === 1 ? "Punkt" : "Punkte"}`;
}

function getEnteredGroupName() {
  return groupNameInput ? groupNameInput.value.trim() : "";
}

function normalizeGroupName(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function hasScoreboardEntryForGroup(groupName) {
  const normalizedName = normalizeGroupName(groupName);
  if (!normalizedName) return false;

  return getScoreboardEntries().some((entry) => normalizeGroupName(entry.groupName) === normalizedName);
}

function getScoreboardEntries() {
  try {
    const stored = localStorage.getItem(SCOREBOARD_STORAGE_KEY);
    const entries = stored ? JSON.parse(stored) : [];
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    return [];
  }
}

function saveScoreboardEntries(entries) {
  try {
    localStorage.setItem(SCOREBOARD_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error("Scoreboard konnte nicht gespeichert werden.", error);
    return false;
  }
}

function getSavedRunState() {
  try {
    const stored = localStorage.getItem(RUN_STATE_STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored);
    if (!state || !Array.isArray(state.quizQuestions)) return null;
    if (state.quizQuestions.length < TOTAL_QUESTIONS) return null;
    if (!Number.isInteger(state.currentIndex)) return null;

    return state;
  } catch (error) {
    return null;
  }
}

function saveRunState(nextIndex = currentIndex) {
  if (!quizQuestions.length || nextIndex > TOTAL_QUESTIONS) return;

  try {
    localStorage.setItem(RUN_STATE_STORAGE_KEY, JSON.stringify({
      currentIndex: nextIndex,
      correctCount,
      penalties,
      jokerPenalties,
      quizQuestions,
      currentGroupName,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Zwischenstand konnte nicht gespeichert werden.", error);
  }
}

function clearRunState() {
  try {
    localStorage.removeItem(RUN_STATE_STORAGE_KEY);
  } catch (error) {
    // Ohne lokalen Speicher gibt es auch keinen Zwischenstand zu entfernen.
  }
}

function restoreRunState(state) {
  quizQuestions = state.quizQuestions;
  currentIndex = Math.min(Math.max(state.currentIndex, 0), TOTAL_QUESTIONS);
  correctCount = Number.isInteger(state.correctCount) ? state.correctCount : 0;
  penalties = Array.isArray(state.penalties) ? state.penalties : [];
  jokerPenalties = Array.isArray(state.jokerPenalties) ? state.jokerPenalties : [];
  currentGroupName = state.currentGroupName || "";
  resultSavedForCurrentRun = false;

  if (groupNameInput) {
    groupNameInput.value = currentGroupName;
  }

  if (currentIndex >= TOTAL_QUESTIONS) {
    showResults();
    return;
  }

  showReadyScreen();
}

function offerRunRestore() {
  const savedRun = getSavedRunState();
  if (!savedRun) return;

  const shouldRestore = confirm("Offenen Durchgang fortsetzen?");
  if (shouldRestore) {
    restoreRunState(savedRun);
  } else {
    clearRunState();
  }
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch (error) {
    return "";
  }
}

function formatExerciseSummary(entry) {
  const exercises = [];
  if (entry.pushups > 0) exercises.push(`${entry.pushups} Liegestütze`);
  if (entry.squats > 0) exercises.push(`${entry.squats} Kniebeugen`);
  return exercises.length ? exercises.join(" / ") : "Keine Übungen";
}

function saveCurrentResult(wrong, pushups, squats) {
  if (!currentGroupName || resultSavedForCurrentRun) return false;
  if (hasScoreboardEntryForGroup(currentGroupName)) return false;

  const entries = getScoreboardEntries();
  entries.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    groupName: currentGroupName,
    points: correctCount,
    wrong,
    pushups,
    squats,
    createdAt: new Date().toISOString()
  });
  if (!saveScoreboardEntries(entries)) return false;

  resultSavedForCurrentRun = true;
  return true;
}

function renderScoreboard() {
  const entries = getScoreboardEntries().sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  scoreboardList.innerHTML = "";
  scoreboardEmpty.classList.toggle("hidden", entries.length > 0);

  let rank = 0;
  let lastPoints = null;
  entries.forEach((entry) => {
    if (entry.points !== lastPoints) {
      rank += 1;
      lastPoints = entry.points;
    }

    const row = document.createElement("div");
    row.className = "scoreboard-row";

    const rankEl = document.createElement("div");
    rankEl.className = "scoreboard-rank";
    rankEl.textContent = `${rank}.`;

    const body = document.createElement("div");
    body.className = "scoreboard-body";

    const name = document.createElement("strong");
    name.textContent = entry.groupName;

    const meta = document.createElement("span");
    meta.textContent = `${entry.wrong} falsch · ${formatExerciseSummary(entry)}`;

    const time = document.createElement("small");
    time.textContent = formatDateTime(entry.createdAt);

    const points = document.createElement("div");
    points.className = "scoreboard-points";

    const pointValue = document.createElement("strong");
    pointValue.textContent = `${entry.points}/${TOTAL_QUESTIONS}`;

    const pointLabel = document.createElement("small");
    pointLabel.textContent = "Punkte";

    points.append(pointValue, pointLabel);

    const deleteButton = document.createElement("button");
    deleteButton.className = "scoreboard-delete";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `${entry.groupName} löschen`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => deleteScoreboardEntry(entry.id));

    body.append(name, meta, time);
    row.append(rankEl, body, points, deleteButton);
    scoreboardList.appendChild(row);
  });
}

function showScoreboard() {
  renderScoreboard();
  showScreen(scoreboardScreen);
}

function clearScoreboard() {
  const shouldDelete = confirm("Willst du es wirklich löschen?");
  if (!shouldDelete) return;

  if (!saveScoreboardEntries([])) {
    alert("Scoreboard konnte nicht gelöscht werden. Prüfe den Browser-Speicher.");
    return;
  }

  renderScoreboard();
}

function deleteScoreboardEntry(entryId) {
  const entries = getScoreboardEntries();
  const entry = entries.find((item) => item.id === entryId);
  if (!entry) return;

  const shouldDelete = confirm(`Eintrag "${entry.groupName}" wirklich löschen?`);
  if (!shouldDelete) return;

  if (!saveScoreboardEntries(entries.filter((item) => item.id !== entryId))) {
    alert("Eintrag konnte nicht gelöscht werden. Prüfe den Browser-Speicher.");
    return;
  }

  renderScoreboard();
}

async function clearAppStorage() {
  const shouldClear = confirm("Bist du dir sicher?");
  if (!shouldClear) return;

  stopQuestionTimer();
  let cacheTouched = false;
  let cacheRebuilt = false;
  const wasOfflineReady = offlineReady;

  try {
    [
      SCOREBOARD_STORAGE_KEY,
      RUN_STATE_STORAGE_KEY,
      THEME_STORAGE_KEY,
      OUTDOOR_MODE_STORAGE_KEY,
      QUIZ_SCALE_STORAGE_KEY
    ].forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("App-Speicher konnte nicht vollständig geleert werden.", error);
  }

  if ("caches" in window && navigator.onLine) {
    try {
      const freshCacheName = `${APP_CACHE_NAME}-fresh`;
      await caches.delete(freshCacheName);

      const freshCache = await caches.open(freshCacheName);
      await freshCache.addAll(OFFLINE_ASSETS);

      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("bw-quiz-") && cacheName !== freshCacheName)
          .map((cacheName) => caches.delete(cacheName))
      );

      cacheTouched = true;

      const cache = await caches.open(APP_CACHE_NAME);
      await Promise.all(
        OFFLINE_ASSETS.map(async (asset) => {
          const cacheKey = new URL(asset, window.location.href).href;
          const response = await freshCache.match(cacheKey);
          if (response) {
            await cache.put(cacheKey, response.clone());
          }
        })
      );
      await caches.delete(freshCacheName);
      cacheRebuilt = await verifyOfflineCache();
    } catch (error) {
      console.error("Cache konnte nicht vollständig gelöscht werden.", error);
    }
  }

  currentIndex = 0;
  correctCount = 0;
  penalties = [];
  jokerPenalties = [];
  quizQuestions = [];
  currentGroupName = "";
  resultSavedForCurrentRun = false;
  offlineReady = cacheTouched ? cacheRebuilt : wasOfflineReady;

  if (groupNameInput) groupNameInput.value = "";
  applyQuizScale(100);
  renderScoreboard();
  updateConnectionStatus();
  showScreen(introScreen);

  if (cacheRebuilt) {
    alert("App-Speicher wurde bereinigt. Der Offline-Cache wurde neu aufgebaut.");
  } else if (cacheTouched) {
    alert("App-Speicher wurde bereinigt. Für Offline-Nutzung bitte einmal mit Internet neu laden, bis „Online / offline bereit“ steht.");
  } else {
    alert(navigator.onLine
      ? "App-Speicher wurde bereinigt. Der Offline-Cache wurde nicht gelöscht, weil er nicht neu aufgebaut werden konnte."
      : "App-Speicher wurde bereinigt. Der Offline-Cache wurde im Flugmodus nicht gelöscht.");
  }
}

function showScreen(screen) {
  introScreen.classList.add("hidden");
  startScreen.classList.add("hidden");
  readyScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  scoreboardScreen.classList.add("hidden");
  operatorScreen.classList.add("hidden");
  screen.classList.remove("hidden");
  activeScreen = screen;
}

function toggleOperatorScreen() {
  if (activeScreen === operatorScreen) {
    closeOperatorScreen();
    return;
  }

  if (activeScreen !== operatorScreen) {
    operatorReturnScreen = activeScreen || introScreen;
  }

  showScreen(operatorScreen);
}

function closeOperatorScreen() {
  showScreen(operatorReturnScreen || introScreen);
  operatorReturnScreen = null;
}

function setAnswerButtonsLocked(locked) {
  [...answersEl.children].forEach((btn) => {
    btn.disabled = locked;
    btn.classList.toggle("locked", locked);
  });
}

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function saveTheme(themeName) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  } catch (error) {
    // Die App funktioniert auch ohne gespeicherte Design-Auswahl.
  }
}

function applyTheme(themeName) {
  const selectedTheme = THEMES[themeName] ? themeName : "exhibition";
  const theme = THEMES[selectedTheme];

  document.body.classList.remove(THEMES.exhibition.bodyClass, THEMES.classic.bodyClass);
  document.body.classList.add(theme.bodyClass);
  document.body.dataset.theme = selectedTheme;

  if (operatorThemeBtn) {
    operatorThemeBtn.textContent = theme.buttonText;
  }

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", theme.themeColor);
  }

  saveTheme(selectedTheme);
}

function toggleTheme() {
  const currentTheme = document.body.dataset.theme === "classic" ? "classic" : "exhibition";
  applyTheme(currentTheme === "classic" ? "exhibition" : "classic");
}

function getSavedOutdoorMode() {
  try {
    return localStorage.getItem(OUTDOOR_MODE_STORAGE_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function saveOutdoorMode(enabled) {
  try {
    localStorage.setItem(OUTDOOR_MODE_STORAGE_KEY, String(enabled));
  } catch (error) {
    // Die Anzeige funktioniert auch ohne gespeicherten Outdoor-Modus.
  }
}

function applyOutdoorMode(enabled) {
  document.body.classList.toggle("outdoor-mode", enabled);

  if (operatorOutdoorBtn) {
    operatorOutdoorBtn.textContent = enabled ? "Outdoor-Modus: An" : "Outdoor-Modus: Aus";
  }

  saveOutdoorMode(enabled);
}

function toggleOutdoorMode() {
  applyOutdoorMode(!document.body.classList.contains("outdoor-mode"));
}

function normalizeQuizScale(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 100;
  return Math.min(100, Math.max(80, Math.round(scale / 5) * 5));
}

function getSavedQuizScale() {
  try {
    return normalizeQuizScale(localStorage.getItem(QUIZ_SCALE_STORAGE_KEY) || 100);
  } catch (error) {
    return 100;
  }
}

function saveQuizScale(value) {
  try {
    localStorage.setItem(QUIZ_SCALE_STORAGE_KEY, String(value));
  } catch (error) {
    // Die App funktioniert auch ohne gespeicherte Quizfeld-Größe.
  }
}

function applyQuizScale(value) {
  const scale = normalizeQuizScale(value);
  document.documentElement.style.setProperty("--quiz-field-scale", String(scale / 100));

  if (operatorQuizScaleInput) {
    operatorQuizScaleInput.value = String(scale);
  }

  if (operatorQuizScaleValue) {
    operatorQuizScaleValue.textContent = `${scale}%`;
  }

  saveQuizScale(scale);
}

function updateQuizScale(event) {
  applyQuizScale(event.target.value);
}

function updateConnectionStatus() {
  if (!connectionStatus) return;

  if (!navigator.onLine) {
    connectionStatus.textContent = offlineReady ? "Offline bereit" : "Offline";
  } else {
    connectionStatus.textContent = offlineReady ? "Online / offline bereit" : "Online";
  }

  connectionStatus.classList.toggle("is-offline", !navigator.onLine);
  connectionStatus.classList.toggle("is-ready", offlineReady);
}

async function requestPersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) return false;

  try {
    if (navigator.storage.persisted && await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch (error) {
    return false;
  }
}

async function verifyOfflineCache() {
  if (!("caches" in window)) return false;

  try {
    const cachedAssets = await Promise.all(
      OFFLINE_ASSETS.map((asset) => caches.match(new URL(asset, window.location.href).href))
    );

    return cachedAssets.every(Boolean);
  } catch (error) {
    return false;
  }
}

async function prepareOfflineMode() {
  await requestPersistentStorage();
  offlineReady = await verifyOfflineCache();
  updateConnectionStatus();
}

function startQuiz() {
  currentGroupName = getEnteredGroupName();
  resultSavedForCurrentRun = false;

  if (currentGroupName && hasScoreboardEntryForGroup(currentGroupName)) {
    alert("Diese Gruppe ist bereits im Scoreboard. Bitte anderen Namen wählen oder den alten Eintrag im Scoreboard löschen.");
    showScreen(introScreen);
    return;
  }

  currentIndex = 0;
  correctCount = 0;
  penalties = [];
  jokerPenalties = [];
  quizQuestions = shuffle(allQuestions).slice(0, TOTAL_QUESTIONS);

  if (quizQuestions.length < TOTAL_QUESTIONS) {
    alert(`Du brauchst mindestens ${TOTAL_QUESTIONS} aktive Fragen in fragen.json.`);
    return;
  }

  saveRunState(0);
  showReadyScreen();
}

function showReadyScreen() {
  stopQuestionTimer();

  readyTitle.textContent = "Soldat bereit?";
  readyProgress.textContent = `Frage ${currentIndex + 1} von ${TOTAL_QUESTIONS}`;
  readyScore.textContent = formatPoints(correctCount);
  readyProgressFill.style.width = `${(currentIndex / TOTAL_QUESTIONS) * 100}%`;

  saveRunState(currentIndex);
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
  scoreEl.textContent = formatPoints(correctCount);
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
    timerWrapper.classList.remove("timer-warning");
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

  if (timerWrapper) {
    timerWrapper.classList.toggle("timer-warning", timeLeft > 0 && timeLeft <= TIMER_WARNING_TIME && !questionResolved);
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
  if (timerWrapper) {
    timerWrapper.classList.remove("timer-warning");
    timerWrapper.classList.add("time-up");
  }

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
    saveRunState(currentIndex + 1);
  } else {
    feedbackEl.innerHTML = `<strong>Falsch.</strong><br>Richtig wäre Antwort ${q.richtig}. ${q.erklaerung || ""}`;
    penaltyBox.classList.remove("hidden");
  }

  scoreEl.textContent = formatPoints(correctCount);
}

document.querySelectorAll("[data-penalty]").forEach((btn) => {
  btn.addEventListener("click", () => {
    penalties.push(btn.dataset.penalty);
    penaltyBox.classList.add("hidden");
    nextBtn.classList.remove("hidden");
    saveRunState(currentIndex + 1);
  });
});

function nextQuestion() {
  stopQuestionTimer();
  currentIndex++;
  if (currentIndex >= TOTAL_QUESTIONS) {
    showResults();
  } else {
    saveRunState(currentIndex);
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
  const savedToScoreboard = saveCurrentResult(wrong, totalPushupCount, totalSquatCount);

  if (resultGroup) {
    if (savedToScoreboard) {
      resultGroup.textContent = `Gespeichert im Scoreboard: ${currentGroupName}`;
    } else if (currentGroupName) {
      resultGroup.textContent = "Scoreboard konnte nicht gespeichert werden. Prüfe den Browser-Speicher.";
    } else {
      resultGroup.textContent = "Ohne Gruppenname - dieser Durchgang wurde nicht gespeichert.";
    }
  }

  showScreen(resultScreen);
  clearRunState();
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
  currentGroupName = "";
  resultSavedForCurrentRun = false;
  if (groupNameInput) groupNameInput.value = "";
  clearRunState();
  showScreen(introScreen);
}

if (jokerBtn) {
  jokerBtn.addEventListener("click", useJoker);
}

introStartBtn.addEventListener("click", () => showScreen(startScreen));
introScoreboardBtn.addEventListener("click", showScoreboard);
startBtn.addEventListener("click", startQuiz);
readyBtn.addEventListener("click", showCurrentQuestion);
restartBtn.addEventListener("click", confirmResetToStartScreen);
nextBtn.addEventListener("click", nextQuestion);
scoreboardBtn.addEventListener("click", showScoreboard);
scoreboardBackBtn.addEventListener("click", resetToStartScreen);
scoreboardClearBtn.addEventListener("click", clearScoreboard);
operatorBtn.addEventListener("click", toggleOperatorScreen);
operatorScoreboardBtn.addEventListener("click", showScoreboard);
operatorClearScoreboardBtn.addEventListener("click", clearScoreboard);
if (operatorClearStorageBtn) {
  operatorClearStorageBtn.addEventListener("click", clearAppStorage);
}
operatorResetBtn.addEventListener("click", confirmResetToStartScreen);
if (operatorThemeBtn) {
  operatorThemeBtn.addEventListener("click", toggleTheme);
}
if (operatorOutdoorBtn) {
  operatorOutdoorBtn.addEventListener("click", toggleOutdoorMode);
}
if (operatorQuizScaleInput) {
  operatorQuizScaleInput.addEventListener("input", updateQuizScale);
  operatorQuizScaleInput.addEventListener("change", updateQuizScale);
}
window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
applyTheme(getSavedTheme() || "exhibition");
applyOutdoorMode(getSavedOutdoorMode());
applyQuizScale(getSavedQuizScale());
updateConnectionStatus();

loadQuestions()
  .then(() => offerRunRestore())
  .catch((error) => {
    console.error(error);
    alert("Fehler beim Laden der Fragen. Prüfe die Datei fragen.json.");
  });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .then((registration) => registration.update())
      .then(() => navigator.serviceWorker.ready)
      .then(() => prepareOfflineMode())
      .catch((error) => console.error("Service Worker konnte nicht registriert werden.", error));
  });
}
