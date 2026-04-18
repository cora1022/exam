const addForm = document.getElementById('add-form');
const questionsList = document.getElementById('questions-list');
const countSpan = document.getElementById('list-count');
const statTotal = document.getElementById('stat-total');
const categoryBadgeList = document.getElementById('category-badge-list');
const categorySuggestions = document.getElementById('category-suggestions');
const categoryInput = document.getElementById('category');
const formTitle = document.getElementById('form-title');
const cancelBtn = document.getElementById('cancel-btn');

const multipleArea = document.getElementById('multiple-choice-area');
const shortArea = document.getElementById('short-answer-area');
const optionsContainer = document.getElementById('options-container');
const multipleAnswerSelect = document.getElementById('multiple-answer');

let localData = (typeof quizData !== 'undefined') ? JSON.parse(JSON.stringify(quizData)) : [];
let currentType = 'multiple';
let editingId = null;
let hasUnsavedChanges = false;
let categoryOpenState = {}; // 각 과목의 열림/닫힘 상태 저장

// 페이지 이탈 시 경고
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // 브라우저 표준에 따라 빈 문자열 설정
    }
});

// 메인 화면 링크 클릭 시 별도 확인 (선택 사항이나 UX 향상을 위해 추가)
document.addEventListener('DOMContentLoaded', () => {
    const mainNavLink = document.querySelector('a[href="../../index.html"]');
    if (mainNavLink) {
        mainNavLink.addEventListener('click', (e) => {
            if (hasUnsavedChanges) {
                if (!confirm('수정된 내용이 있습니다. 내보내기를 하지 않고 이동하시겠습니까?')) {
                    e.preventDefault();
                }
            }
        });
    }
});

/**
 * 탭 전환 함수
 */
window.switchTab = function(el, tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
};

function renderDashboard() {
    if (statTotal) statTotal.innerText = localData.length;
}

function renderList() {
    if (!questionsList) return;
    questionsList.innerHTML = '';
    countSpan.innerText = localData.length + '개';

    if (localData.length === 0) {
        questionsList.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--text-muted);">등록된 문제가 없습니다.</p>';
        return;
    }

    const groupedData = localData.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {});

    for (const category in groupedData) {
        if (categoryOpenState[category] === undefined) categoryOpenState[category] = true;
        const isOpen = categoryOpenState[category];

        const categorySection = document.createElement('div');
        categorySection.className = 'category-group';
        categorySection.style.marginBottom = '1.5rem';

        const header = document.createElement('div');
        header.className = 'category-header';
        header.onclick = () => toggleCategory(category);
        header.innerHTML = `
            <div class="category-title-area">
                <span class="category-toggle-icon ${isOpen ? '' : 'collapsed'}">▼</span>
                <h4 style="margin: 0; color: var(--primary);">${category}</h4>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">(${groupedData[category].length})</span>
            </div>
            <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; color: var(--accent-error);" onclick="event.stopPropagation(); deleteCategory('${category.replace(/'/g, "\\'")}')">과목 전체 삭제</button>
        `;

        const qContainer = document.createElement('div');
        qContainer.className = `category-questions-container ${isOpen ? '' : 'collapsed'}`;

        groupedData[category].forEach((item) => {
            const originalIndex = localData.findIndex(q => q.id === item.id);
            const div = document.createElement('div');
            div.className = 'q-card';
            div.style.opacity = item.isActive ? '1' : '0.5';

            div.innerHTML = `
                <div class="q-main-row">
                    <div>
                        <label class="switch" title="상태 변경">
                            <input type="checkbox" ${item.isActive ? 'checked' : ''} onchange="toggleQuestion(${originalIndex})">
                            <span class="slider"></span>
                        </label>
                        <div style="min-width: 0;">
                            <span style="font-size: 0.7rem; color: var(--primary); font-weight: 700; display: block;">${item.type === 'multiple' ? '객관식' : '단답형'}</span>
                            <p style="font-weight: 600; margin: 0; line-height: 1.4;">${item.question}</p>
                        </div>
                    </div>
                    <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="toggleManage(this)">⚙️ 관리</button>
                </div>
                <div class="manage-controls">
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-outline" style="padding: 0.3rem 0.5rem; font-size: 0.7rem;" onclick="moveQuestion(${originalIndex}, -1)">▲ 위로</button>
                        <button class="btn btn-outline" style="padding: 0.3rem 0.5rem; font-size: 0.7rem;" onclick="moveQuestion(${originalIndex}, 1)">▼ 아래로</button>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: var(--primary);" onclick="editQuestion('${item.id}')">수정</button>
                        <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: var(--accent-error);" onclick="deleteQuestion(${originalIndex})">삭제</button>
                    </div>
                </div>
            `;
            qContainer.appendChild(div);
        });

        categorySection.appendChild(header);
        categorySection.appendChild(qContainer);
        questionsList.appendChild(categorySection);
    }
}

window.toggleCategory = function(category) {
    categoryOpenState[category] = !categoryOpenState[category];
    const isOpen = categoryOpenState[category];
    
    // 해당 카테고리 그룹 찾기
    const groups = document.querySelectorAll('.category-group');
    for (const group of groups) {
        if (group.querySelector('h4').innerText === category) {
            const icon = group.querySelector('.category-toggle-icon');
            const container = group.querySelector('.category-questions-container');
            
            if (isOpen) {
                icon.classList.remove('collapsed');
                container.classList.remove('collapsed');
            } else {
                icon.classList.add('collapsed');
                container.classList.add('collapsed');
            }
            break;
        }
    }
};

window.toggleManage = function(btn) {
    const controls = btn.closest('.q-card').querySelector('.manage-controls');
    controls.classList.toggle('active');
    btn.innerText = controls.classList.contains('active') ? '✕ 닫기' : '⚙️ 관리';
};

window.moveQuestion = function(index, direction) {
    const targetCategory = localData[index].category;
    let targetIndex = -1;

    if (direction === -1) { // 위로 이동
        for (let i = index - 1; i >= 0; i--) {
            if (localData[i].category === targetCategory) {
                targetIndex = i;
                break;
            }
        }
    } else { // 아래로 이동
        for (let i = index + 1; i < localData.length; i++) {
            if (localData[i].category === targetCategory) {
                targetIndex = i;
                break;
            }
        }
    }

    if (targetIndex !== -1) {
        const temp = localData[index];
        localData[index] = localData[targetIndex];
        localData[targetIndex] = temp;
        hasUnsavedChanges = true;
        renderList();
    }
};

window.toggleQuestion = function(idx) {
    localData[idx].isActive = !localData[idx].isActive;
    hasUnsavedChanges = true;
    
    // DOM 요소 투명도 조절
    const qCards = document.querySelectorAll('.q-card');
    // localData의 인덱스와 매칭되는 q-card를 찾아야 함
    // renderList에서 부여한 originalIndex 정보를 활용하여 매칭
    for (const card of qCards) {
        const checkbox = card.querySelector('input[type="checkbox"]');
        // onchange="toggleQuestion(${originalIndex})" 형태의 문자열에서 인덱스 추출
        if (checkbox && checkbox.getAttribute('onchange').includes(`(${idx})`)) {
            card.style.opacity = localData[idx].isActive ? '1' : '0.5';
            break;
        }
    }
    
    renderDashboard();
};

window.setQuestionType = function(el, type) {
    currentType = type;
    if (el) {
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        el.classList.add('active');
    }
    
    const multipleInputs = multipleArea.querySelectorAll('input, select');
    const shortAnswerInput = document.getElementById('short-answer');

    if (type === 'multiple') {
        multipleArea.style.display = 'block';
        shortArea.style.display = 'none';
        multipleInputs.forEach(i => i.disabled = false);
        shortAnswerInput.disabled = true;
        shortAnswerInput.required = false;
    } else {
        multipleArea.style.display = 'none';
        shortArea.style.display = 'block';
        multipleInputs.forEach(i => i.disabled = true);
        shortAnswerInput.disabled = false;
        shortAnswerInput.required = true;
    }
};

window.addOptionField = function(value = '') {
    const div = document.createElement('div');
    div.className = 'option-input-group';
    div.innerHTML = `
        <input type="text" class="opt-input" required placeholder="보기 내용을 입력하세요" value="${value}" style="margin-top:0;">
        ${optionsContainer.children.length >= 2 ? `<button type="button" class="btn-icon" onclick="this.parentElement.remove(); updateAnswerSelect();">✕</button>` : ''}
    `;
    optionsContainer.appendChild(div);
    updateAnswerSelect();
};

function updateAnswerSelect() {
    multipleAnswerSelect.innerHTML = '';
    Array.from(optionsContainer.children).forEach((_, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = `보기 ${i + 1}`;
        multipleAnswerSelect.appendChild(opt);
    });
}

window.editQuestion = function(id) {
    const item = localData.find(q => q.id.toString() === id.toString());
    if (!item) return;

    editingId = id;
    formTitle.innerText = '문제 수정하기';
    cancelBtn.style.display = 'inline-block';
    
    categoryInput.value = item.category;
    document.getElementById('question').value = item.question;
    setQuestionType(null, item.type);
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', (item.type === 'multiple' && btn.innerText.includes('객관식')) || (item.type === 'short' && btn.innerText.includes('단답형')));
    });

    if (item.type === 'multiple') {
        optionsContainer.innerHTML = '';
        item.options.forEach(opt => addOptionField(opt));
        multipleAnswerSelect.value = item.answer;
    } else {
        document.getElementById('short-answer').value = Array.isArray(item.answer) ? item.answer.join(', ') : item.answer;
    }
    switchTab(document.querySelectorAll('.nav-item')[2], 'add');
};

window.cancelEdit = function() {
    editingId = null;
    formTitle.innerText = '새 문제 등록';
    cancelBtn.style.display = 'none';
    addForm.reset();
    initOptions();
};

if (addForm) {
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const questionData = {
            category: categoryInput.value,
            question: document.getElementById('question').value,
            type: currentType,
            isActive: true
        };

        if (currentType === 'multiple') {
            questionData.options = Array.from(document.querySelectorAll('.opt-input')).map(i => i.value);
            questionData.answer = parseInt(multipleAnswerSelect.value);
        } else {
            const answers = document.getElementById('short-answer').value.split(',').map(a => a.trim()).filter(a => a !== '');
            questionData.answer = answers.length === 1 ? answers[0] : answers;
        }

        if (editingId) {
            const idx = localData.findIndex(q => q.id.toString() === editingId.toString());
            localData[idx] = { ...localData[idx], ...questionData };
            alert('문제가 수정되었습니다.');
            cancelEdit();
        } else {
            localData.push({ id: Date.now(), ...questionData });
            alert('문제가 추가되었습니다.');
        }
        hasUnsavedChanges = true;
        renderDashboard(); renderList(); updateCategoryTools(); addForm.reset(); initOptions();
    });
}

window.deleteQuestion = function(idx) {
    if (confirm('삭제하시겠습니까?')) {
        localData.splice(idx, 1);
        hasUnsavedChanges = true;
        renderDashboard(); renderList(); updateCategoryTools();
    }
};

window.deleteCategory = function(cat) {
    if (confirm(`'${cat}' 과목 전체를 삭제하시겠습니까?`)) {
        localData = localData.filter(q => q.category !== cat);
        hasUnsavedChanges = true;
        renderDashboard(); renderList(); updateCategoryTools();
    }
};

window.downloadDataFile = function() {
    const dataString = `const quizData = ${JSON.stringify(localData, null, 4)};`;
    const blob = new Blob([dataString], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data.js'; a.click();
    hasUnsavedChanges = false;
    alert('새 data.js 파일을 다운로드했습니다. 기존 파일과 교체해주세요.');
};

function updateCategoryTools() {
    if (!categorySuggestions) return;
    const categories = [...new Set(localData.map(q => q.category))].sort();
    categorySuggestions.innerHTML = '';
    categoryBadgeList.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        categorySuggestions.appendChild(option);

        const span = document.createElement('span');
        span.className = 'category-suggestion';
        span.innerText = cat;
        span.onclick = () => { categoryInput.value = cat; };
        categoryBadgeList.appendChild(span);
    });
}

function initOptions() {
    if (!optionsContainer) return;
    optionsContainer.innerHTML = '';
    for(let i=0; i<4; i++) addOptionField();
}

renderDashboard(); renderList(); updateCategoryTools(); initOptions();