// --- State Management ---
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let xp = parseInt(localStorage.getItem('isc_xp')) || 0;
let streak = parseInt(localStorage.getItem('isc_streak')) || 0;
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
    }
}

function setupEventListeners() {
    document.getElementById('start-quiz-btn').addEventListener('click', startNewSession);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('flag-btn').addEventListener('click', toggleFlag);
}

// --- Core Logic ---
function startNewSession() {
    // Shuffle and pick 10 random questions for a "Quick Testlet"
    sessionQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQuestionIndex = 0;
    score = 0;
    
    showScreen('quiz');
    loadQuestion();
}

function loadQuestion() {
    const q = sessionQuestions[currentQuestionIndex];
    const optionsList = document.getElementById('options-list');
    
    // Reset UI
    document.getElementById('feedback-container').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('question-meta').innerText = `Area ${q.area} | ${q.topic}`;
    document.getElementById('question-text').innerText = q.stem;
    document.getElementById('progress-text').innerText = `Question ${currentQuestionIndex + 1} of ${sessionQuestions.length}`;
    
    optionsList.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${opt.id}: ${opt.text}`;
        btn.onclick = () => handleAnswer(opt.id, btn);
        optionsList.appendChild(btn);
    });

    // Update Flag Button Style
    const flagBtn = document.getElementById('flag-btn');
    flagBtn.style.borderColor = flaggedQuestions.has(q.id) ? 'var(--primary-red)' : 'var(--border-color)';
}

function handleAnswer(selectedId, btnElement) {
    const q = sessionQuestions[currentQuestionIndex];
    const allBtns = document.querySelectorAll('.option-btn');
    
    // Disable all buttons after selection
    allBtns.forEach(btn => btn.style.pointerEvents = 'none');

    if (selectedId === q.answer) {
        btnElement.classList.add('correct');
        score++;
        updateXP(10); // 10 XP for correct answer
        showFeedback("Correct!", q.explanation);
    } else {
        btnElement.classList.add('incorrect');
        // Highlight the right one
        allBtns.forEach(btn => {
            if (btn.innerText.startsWith(q.answer)) btn.classList.add('correct');
        });
        showFeedback("Incorrect", q.explanation);
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

// --- Gamification & Stats ---
function updateXP(amount) {
    xp += amount;
    localStorage.setItem('isc_xp', xp);
    updateUIStats();
}

function updateUIStats() {
    document.getElementById('xp-count').innerText = xp;
    document.getElementById('streak-count').innerText = streak;
    
    // Simple Rank Logic
    const rankBadge = document.getElementById('user-rank');
    if (xp > 1000) rankBadge.innerText = "SOC Master";
    else if (xp > 500) rankBadge.innerText = "Systems Auditor";
    else rankBadge.innerText = "IT Associate";
}

function finishSession() {
    showScreen('results');
    const finalPercent = Math.round((score / sessionQuestions.length) * 100);
    document.getElementById('final-score').innerText = `${finalPercent}%`;
    
    // Handle Streak
    const today = new Date().toDateString();
    if (lastAttemptDate !== today) {
        streak++;
        localStorage.setItem('isc_streak', streak);
        localStorage.setItem('isc_last_date', today);
    }
    
    updateUIStats();
}

// --- Helpers ---
function showScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenKey].classList.remove('hidden');
}

function toggleFlag() {
    const qId = sessionQuestions[currentQuestionIndex].id;
    if (flaggedQuestions.has(qId)) flaggedQuestions.delete(qId);
    else flaggedQuestions.add(qId);
    loadQuestion(); // Refresh UI to show flag state
}

function showFeedback(msg, explanation) {
    const container = document.getElementById('feedback-container');
    container.classList.remove('hidden');
    document.getElementById('feedback-message').innerText = msg;
    document.getElementById('explanation-text').innerText = explanation;
}

// Start the app
init();
