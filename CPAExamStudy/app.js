// --- State Management ---
let questions = [];
let currentQuestionIndex = 0;
let score = 0;

let xp = parseInt(localStorage.getItem('isc_xp')) || 0;
let streak = parseInt(localStorage.getItem('isc_streak')) || 0;
let level = parseInt(localStorage.getItem('isc_level')) || 1;

let lastAttemptDate = localStorage.getItem('isc_last_date') || null;
let flaggedQuestions = new Set();
let sessionQuestions = [];

// --- Selectors ---
const screens = {
  dashboard: document.getElementById('dashboard-screen'),
  quiz: document.getElementById('quiz-screen'),
  results: document.getElementById('results-screen')
};

// --- Initialization ---
async function init() {
  try {
    const response = await fetch('questions.json');
    questions = await response.json();
    updateUIStats();
    setupEventListeners();
  } catch (err) {
    console.error("Failed to load questions:", err);
    alert("Questions failed to load. Make sure questions.json is in the same folder as index.html.");
  }
}

function setupEventListeners() {
  document.getElementById('start-quiz-btn').addEventListener('click', startNewSession);

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

  const flagBtn = document.getElementById('flag-btn');
  if (flagBtn) flagBtn.addEventListener('click', toggleFlag);
}

// --- Core Logic ---
function startNewSession() {
  sessionQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, 10);
  currentQuestionIndex = 0;
  score = 0;

  showScreen('quiz');
  loadQuestion();
}

function loadQuestion() {
  const q = sessionQuestions[currentQuestionIndex];
  const optionsList = document.getElementById('options-list');

  document.getElementById('feedback-container').classList.add('hidden');
  document.getElementById('next-btn').classList.add('hidden');

  document.getElementById('question-meta').innerText = `Area ${q.area} | ${q.topic}`;
  document.getElementById('question-text').innerText = q.stem;
  document.getElementById('progress-text').innerText =
    `Question ${currentQuestionIndex + 1} of ${sessionQuestions.length}`;

  optionsList.innerHTML = '';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn jets-choice';
    btn.innerText = `${opt.id}: ${opt.text}`;
    btn.onclick = () => handleAnswer(opt.id, btn);
    optionsList.appendChild(btn);
  });

  const flagBtn = document.getElementById('flag-btn');
  flagBtn.style.borderColor = flaggedQuestions.has(q.id)
    ? '#ffffff'
    : '#125740';
}

function handleAnswer(selectedId, btnElement) {
  const q = sessionQuestions[currentQuestionIndex];
  const allBtns = document.querySelectorAll('.option-btn');

  allBtns.forEach(btn => {
    btn.style.pointerEvents = 'none';
  });

  if (selectedId === q.answer) {
    btnElement.classList.add('correct', 'correct-pop');
    score++;
    updateXP(25);
    showFeedback("TOUCHDOWN! Correct!", q.explanation);
    fireJetsConfetti();
  } else {
    btnElement.classList.add('incorrect', 'incorrect-shake');

    allBtns.forEach(btn => {
      if (btn.innerText.startsWith(q.answer)) {
        btn.classList.add('correct');
      }
    });

    showFeedback("Flag on the play — Incorrect", q.explanation);
  }

  document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex < sessionQuestions.length) {
    loadQuestion();
  } else {
    finishSession();
  }
}

// --- XP / Level System ---
function getXPForNextLevel() {
  return level * 100;
}

function updateXP(amount) {
  xp += amount;

  while (xp >= getXPForNextLevel()) {
    xp -= getXPForNextLevel();
    level++;
    fireJetsConfetti();
  }

  localStorage.setItem('isc_xp', xp);
  localStorage.setItem('isc_level', level);

  updateUIStats();
}

function updateUIStats() {
  document.getElementById('xp-count').innerText = xp;
  document.getElementById('streak-count').innerText = streak;

  const rankBadge = document.getElementById('user-rank');

  if (level >= 10) {
    rankBadge.innerText = "Jets CPA Legend";
  } else if (level >= 7) {
    rankBadge.innerText = "Playoff Auditor";
  } else if (level >= 4) {
    rankBadge.innerText = "Gang Green Analyst";
  } else {
    rankBadge.innerText = "Rookie Associate";
  }

  updateXPBar();
}

function updateXPBar() {
  const xpBar = document.getElementById('xp-bar-fill');
  const levelText = document.getElementById('level-text');

  if (!xpBar || !levelText) return;

  const percent = Math.min((xp / getXPForNextLevel()) * 100, 100);

  xpBar.style.width = `${percent}%`;
  levelText.innerText = `Level ${level}`;
}

function finishSession() {
  showScreen('results');

  const finalPercent = Math.round((score / sessionQuestions.length) * 100);

  document.getElementById('final-score').innerText = `${finalPercent}%`;
  document.getElementById('xp-gained-msg').innerText = `+${score * 25} XP Earned`;

  if (finalPercent >= 80) {
    fireJetsConfetti();
  }

  const today = new Date().toDateString();

  if (lastAttemptDate !== today) {
    streak++;
    localStorage.setItem('isc_streak', streak);
    localStorage.setItem('isc_last_date', today);
    lastAttemptDate = today;
  }

  updateUIStats();
}

// --- Confetti ---
function fireJetsConfetti() {
  for (let i = 0; i < 45; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'jets-confetti';

    const colors = ['#125740', '#ffffff', '#000000'];
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 3000);
  }
}

// --- Helpers ---
function showScreen(screenKey) {
  Object.values(screens).forEach(screen => {
    screen.classList.add('hidden');
  });

  screens[screenKey].classList.remove('hidden');
}

function toggleFlag() {
  const qId = sessionQuestions[currentQuestionIndex].id;

  if (flaggedQuestions.has(qId)) {
    flaggedQuestions.delete(qId);
  } else {
    flaggedQuestions.add(qId);
  }

  loadQuestion();
}

function showFeedback(msg, explanation) {
  const container = document.getElementById('feedback-container');

  container.classList.remove('hidden');

  document.getElementById('feedback-message').innerText = msg;
  document.getElementById('explanation-text').innerText = explanation;
}

// --- Start App ---
init();
