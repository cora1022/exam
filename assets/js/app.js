const quiz = document.getElementById('quiz');
const startScreen = document.getElementById('start-screen');
const categoryList = document.getElementById('category-list');
const result = document.getElementById('result');
const optionsList = document.getElementById('options-list');
const questionEl = document.getElementById('question');
const submitBtn = document.getElementById('submit');
const scoreText = document.getElementById('score-text');
const reviewContainer = document.getElementById('review-container');
const progressEl = document.getElementById('quiz-progress');
const categoryBadge = document.getElementById('quiz-category-badge');
const randomOverlay = document.getElementById('random-overlay');

let currentPlayMode = 'sequential';

window.setPlayMode = function(mode) {
    currentPlayMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');
};

// localStorage를 사용하지 않고 오직 data.js(quizData)만 사용합니다.
// 단, 문제별 통계(맞춘/틀린 횟수)는 localStorage에 저장하여 유지합니다.
let localQuizData = (typeof quizData !== 'undefined') ? JSON.parse(JSON.stringify(quizData)) : [];

const loadStats = () => JSON.parse(localStorage.getItem('quizStats') || '{}');
const saveStats = (stats) => localStorage.setItem('quizStats', JSON.stringify(stats));

// 데이터 정규화
const stats = loadStats();
localQuizData = localQuizData.map(item => ({
    ...item,
    type: item.type || 'multiple',
    category: item.category || '기본',
    isActive: item.isActive !== undefined ? item.isActive : true,
    solvedCount: stats[item.id]?.solved || 0,
    wrongCount: stats[item.id]?.wrong || 0
}));

let activeQuizData = [];
let currentQuiz = 0;
let score = 0;
let selectedAnswer = null;
let userAnswers = [];

initApp();

function initApp() {
    const activeData = localQuizData.filter(q => q.isActive);
    const categories = [...new Set(activeData.map(q => q.category))];
    categoryList.innerHTML = '';
    
    if (activeData.length === 0) {
        categoryList.innerHTML = '<p>활성화된 문제가 없습니다.</p>';
        return;
    }

    renderCategoryCard('전체 보기', activeData.length, '전체');
    categories.forEach(cat => {
        const count = activeData.filter(q => q.category === cat).length;
        renderCategoryCard(cat, count, cat);
    });
}

function renderCategoryCard(title, count, value) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `<h3>${title}</h3><p class="stats">문제 수: ${count}개</p>`;
    card.onclick = () => startQuiz(value);
    categoryList.appendChild(card);
}

function startQuiz(category) {
    const mode = currentPlayMode;
    activeQuizData = (category === '전체') 
        ? localQuizData.filter(q => q.isActive)
        : localQuizData.filter(q => q.isActive && q.category === category);

    if (mode === 'random') {
        activeQuizData = shuffleArray([...activeQuizData]);
        // 랜덤 선택 시 로딩 애니메이션 추가
        randomOverlay.style.display = 'flex';
        setTimeout(() => {
            randomOverlay.style.display = 'none';
            startScreen.style.display = 'none';
            quiz.style.display = 'block';
            quiz.classList.add('fade-in');
            loadQuiz();
        }, 1200);
    } else {
        startScreen.style.display = 'none';
        quiz.style.display = 'block';
        quiz.classList.add('fade-in');
        loadQuiz();
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadQuiz() {
    selectedAnswer = null;
    const item = activeQuizData[currentQuiz];
    categoryBadge.innerText = item.category;
    progressEl.innerText = `${currentQuiz + 1} / ${activeQuizData.length}`;
    questionEl.innerText = item.question;
    questionEl.classList.remove('fade-in');
    void questionEl.offsetWidth; // 트리거 리플로우
    questionEl.classList.add('fade-in');
    
    optionsList.innerHTML = '';

    if (item.type === 'multiple') {
        item.options.forEach((option, index) => {
            const li = document.createElement('li');
            li.innerText = option;
            li.style.animationDelay = `${index * 0.1}s`;
            li.onclick = () => {
                document.querySelectorAll('#options-list li').forEach(el => {
                    el.classList.remove('selected');
                    el.classList.remove('pop-animation');
                });
                li.classList.add('selected');
                li.classList.add('pop-animation');
                selectedAnswer = index;
            };
            optionsList.appendChild(li);
        });
    } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'short-answer-input fade-in';
        input.placeholder = '정답을 입력하세요';
        input.oninput = (e) => { selectedAnswer = e.target.value; };
        input.onkeydown = (e) => { 
            if (e.key === 'Enter') {
                submitBtn.classList.add('pop-animation');
                setTimeout(() => submitBtn.classList.remove('pop-animation'), 300);
                submitBtn.click();
            } 
        };
        optionsList.appendChild(input);
        input.focus();
    }
    submitBtn.innerText = currentQuiz === activeQuizData.length - 1 ? '최종 제출하기' : '다음 문제로';
}

submitBtn.addEventListener('click', () => {
    if (selectedAnswer === null || (typeof selectedAnswer === 'string' && selectedAnswer.trim() === '')) {
        return alert('답안을 입력하거나 선택해주세요!');
    }
    const item = activeQuizData[currentQuiz];
    let isCorrect = (item.type === 'multiple') ? (selectedAnswer === item.answer) : 
        (Array.isArray(item.answer) ? item.answer.some(a => a.replace(/\s+/g, '').toLowerCase() === selectedAnswer.replace(/\s+/g, '').toLowerCase()) : 
        item.answer.replace(/\s+/g, '').toLowerCase() === selectedAnswer.replace(/\s+/g, '').toLowerCase());

    // 통계 업데이트
    const stats = loadStats();
    if (!stats[item.id]) stats[item.id] = { solved: 0, wrong: 0 };
    if (isCorrect) {
        stats[item.id].solved++;
        score++;
    } else {
        stats[item.id].wrong++;
    }
    saveStats(stats);

    userAnswers.push(selectedAnswer);
    currentQuiz++;
    if (currentQuiz < activeQuizData.length) loadQuiz();
    else showResult();
});

function showResult() {
    quiz.style.display = 'none';
    result.style.display = 'block';
    const accuracy = Math.round((score / activeQuizData.length) * 100);
    scoreText.innerHTML = `정답률 <span style="color: var(--primary); font-weight: 700;">${accuracy}%</span> (${activeQuizData.length}문제 중 ${score}문제 정답)`;

    let reviewHtml = '';
    activeQuizData.forEach((data, index) => {
        const userAns = userAnswers[index];
        let isCorrect = (data.type === 'multiple') ? (userAns === data.answer) : 
            (Array.isArray(data.answer) ? data.answer.some(a => String(a).replace(/\s+/g, '').toLowerCase() === String(userAns).replace(/\s+/g, '').toLowerCase()) : 
            String(data.answer).replace(/\s+/g, '').toLowerCase() === String(userAns).replace(/\s+/g, '').toLowerCase());

        if (!isCorrect) {
            const correctAnsDisplay = data.type === 'multiple' ? data.options[data.answer] : (Array.isArray(data.answer) ? data.answer.join(', ') : data.answer);
            const userAnsDisplay = data.type === 'multiple' ? data.options[userAns] : userAns;
            reviewHtml += `<div class="review-item"><p>Q. ${data.question}</p><p>내 선택: <span class="wrong-answer">${userAnsDisplay}</span></p><p>정답: <span class="correct-answer">${correctAnsDisplay}</span></p></div>`;
        }
    });
    reviewContainer.innerHTML = reviewHtml || '<p style="text-align:center;">🎉 모든 문제를 맞히셨습니다!</p>';
}