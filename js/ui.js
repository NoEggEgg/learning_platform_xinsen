const UI = {
    elements: null,
    
    init() {
        this.elements = {
            sections: {
                plan: document.getElementById('plan-section'),
                study: document.getElementById('study-section'),
                exercise: document.getElementById('exercise-section'),
                exam: document.getElementById('exam-section'),
                tips: document.getElementById('tips-section')
            },
            
            study: {
                questionType: document.getElementById('question-type'),
                questionCategory: document.getElementById('question-category'),
                questionNumber: document.getElementById('question-number'),
                questionContent: document.getElementById('question-content'),
                optionsList: document.getElementById('options-list'),
                answerFeedback: document.getElementById('answer-feedback'),
                memoryTip: document.getElementById('memory-tip'),
                memoryTipContent: document.getElementById('memory-tip-content'),
                analysis: document.getElementById('analysis'),
                analysisContent: document.getElementById('analysis-content'),
                prevBtn: document.getElementById('prev-btn'),
                submitBtn: document.getElementById('submit-btn'),
                nextBtn: document.getElementById('next-btn'),
                categoryFilter: document.getElementById('category-filter'),
                typeFilter: document.getElementById('type-filter'),
                studyProgressBar: document.getElementById('study-progress-bar'),
                studyProgressText: document.getElementById('study-progress-text')
            },
            
            exercise: {
                wrongList: document.getElementById('wrong-list'),
                favoriteList: document.getElementById('favorite-list')
            },
            
            exam: {
                time: document.getElementById('exam-time'),
                current: document.getElementById('exam-current'),
                total: document.getElementById('exam-total'),
                totalScore: document.getElementById('exam-total-score'),
                passScore: document.getElementById('exam-pass-score'),
                progressFill: document.getElementById('exam-progress-fill'),
                questionType: document.getElementById('exam-question-type'),
                questionCategory: document.getElementById('exam-question-category'),
                questionNumber: document.getElementById('exam-question-number'),
                questionContent: document.getElementById('exam-question-content'),
                optionsList: document.getElementById('exam-options-list'),
                startBtn: document.getElementById('exam-start-btn'),
                prevBtn: document.getElementById('exam-prev-btn'),
                nextBtn: document.getElementById('exam-next-btn'),
                endBtn: document.getElementById('exam-end-btn')
            },
            
            modal: {
                result: document.getElementById('result-modal'),
                icon: document.querySelector('.modal-icon'),
                title: document.getElementById('modal-title'),
                text: document.getElementById('modal-text'),
                correct: document.getElementById('modal-correct'),
                wrong: document.getElementById('modal-wrong'),
                accuracy: document.getElementById('modal-accuracy')
            },
            
            plan: {
                totalWrong: document.getElementById('total-wrong'),
                streak: document.getElementById('streak'),
                todayDone: document.getElementById('today-done'),
                overallProgress: document.getElementById('overall-progress'),
                progressRing: document.querySelector('.progress-ring'),
                todayProgressBar: document.getElementById('today-progress-bar'),
                studyTime: document.getElementById('study-time'),
                todayDate: document.getElementById('today-date'),
                phase1Done: document.getElementById('phase1-done'),
                phase2Done: document.getElementById('phase2-done'),
                phase3Done: document.getElementById('phase3-done'),
                totalCompleted: document.getElementById('total-completed'),
                totalTime: document.getElementById('total-time')
            },
            
            pageTitle: document.getElementById('page-title'),
            sidebarLinks: document.querySelectorAll('.sidebar a')
        };
        
        return this.elements;
    },
    
    showSection(sectionName) {
        Object.values(this.elements.sections).forEach(section => {
            section.style.display = 'none';
        });
        
        const targetSection = this.elements.sections[sectionName];
        targetSection.style.display = 'block';
        targetSection.style.animation = 'none';
        requestAnimationFrame(() => {
            targetSection.style.animation = 'pageEnter 0.4s ease';
        });
        
        this.elements.sidebarLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        if (typeof updateMobileNav === 'function') {
            updateMobileNav(sectionName);
        }
        
        if (sectionName !== 'dashboard') {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('show');
            }
        }
        
        const titles = {
            'plan': '学习计划',
            'study': '题库学习',
            'exercise': '习题本',
            'exam': '模拟考试',
            'tips': '记忆技巧'
        };
        
        this.elements.pageTitle.textContent = titles[sectionName] || '学习平台';
    },
    
    showModal(type, data) {
        const { icon, title, text, correct, wrong, accuracy } = this.elements.modal;
        
        correct.textContent = data.correct || 0;
        wrong.textContent = data.wrong || 0;
        accuracy.textContent = (data.accuracy || 0) + '%';
        
        if (type === 'success') {
            icon.className = 'modal-icon success';
            icon.innerHTML = '<i class="fa-solid fa-trophy"></i>';
            title.textContent = data.title || '考试通过！';
            text.textContent = data.text || `恭喜你通过了模拟考试，得分 ${data.accuracy} 分！`;
        } else if (type === 'warning') {
            icon.className = 'modal-icon warning';
            icon.innerHTML = '<i class="fa-solid fa-award"></i>';
            title.textContent = data.title || '继续努力！';
            text.textContent = data.text || `考试成绩 ${data.accuracy} 分，还需要继续复习哦！`;
        } else {
            icon.className = 'modal-icon warning';
            icon.innerHTML = '<i class="fa-solid fa-book-open"></i>';
            title.textContent = data.title || '需要加强复习';
            text.textContent = data.text || `考试成绩 ${data.accuracy} 分，建议多做练习巩固知识。`;
        }
        
        this.elements.modal.result.classList.add('show');
    },
    
    hideModal() {
        this.elements.modal.result.classList.remove('show');
    },
    
    showExamResultModal(data) {
        const { icon, title, text, correct, wrong, accuracy, score } = this.elements.modal;
        
        correct.textContent = data.correct || 0;
        wrong.textContent = data.wrong || 0;
        accuracy.textContent = (data.accuracy || 0) + '%';
        
        // 显示分数
        const scoreElement = document.getElementById('modal-score');
        if (scoreElement) {
            scoreElement.textContent = (data.score || 0) + ' 分';
        }
        
        // 设置通过状态图标
        if (data.isPassed) {
            icon.className = 'modal-icon success';
            icon.innerHTML = '<i class="fa-solid fa-trophy"></i>';
        } else {
            icon.className = 'modal-icon warning';
            icon.innerHTML = '<i class="fa-solid fa-book-open"></i>';
        }
        
        title.textContent = data.title || '答题完成';
        text.textContent = data.text || '';
        
        // 根据是否有错题来控制按钮显示
        const reviewBtn = document.getElementById('modal-review-btn');
        
        if (reviewBtn) {
            if (data.wrong > 0) {
                reviewBtn.style.display = '';
                reviewBtn.disabled = false;
            } else {
                reviewBtn.style.display = 'none';
            }
        }
        
        this.elements.modal.result.classList.add('show');
    }
};

function showToast(message, type = 'info') {
    const config = {
        info: { color: 'var(--primary-color)', icon: 'fa-solid fa-info-circle', bg: '#eff6ff', text: '#1e40af' },
        success: { color: 'var(--success-color)', icon: 'fa-solid fa-check-circle', bg: '#ecfdf5', text: '#166534' },
        warning: { color: 'var(--warning-color)', icon: 'fa-solid fa-exclamation-triangle', bg: '#fffbeb', text: '#92400e' },
        error: { color: 'var(--danger-color)', icon: 'fa-solid fa-exclamation-circle', bg: '#fef2f2', text: '#991b1b' }
    };

    const { color, icon } = config[type] || config.info;
    
    const existingToasts = document.querySelectorAll('.toast-notification');
    const offset = existingToasts.length * 70;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        bottom: ${30 + offset}px;
        right: 30px;
        padding: 14px 20px;
        background: white;
        color: var(--text-primary);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.9rem;
        font-weight: 500;
        animation: toastSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1);
        border-left: 4px solid ${color};
        max-width: 420px;
        min-width: 280px;
        transform-origin: bottom right;
        transition: all 0.3s ease;
    `;
    
    const iconEl = document.createElement('div');
    iconEl.style.cssText = `
        width: 36px; height: 36px; border-radius: 10px;
        background: ${color}15; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0;
    `;
    iconEl.innerHTML = `<i class="${icon}" style="color: ${color}; font-size: 1rem;"></i>`;
    
    const msgEl = document.createElement('span');
    msgEl.innerHTML = message;
    msgEl.style.flex = '1';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
    closeBtn.style.cssText = `
        background: none; border: none; color: var(--text-secondary);
        cursor: pointer; padding: 4px; font-size: 0.75rem;
        opacity: 0.5; transition: opacity 0.2s;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.5';
    closeBtn.onclick = () => dismissToast(toast);

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute; bottom: 0; left: 4px; right: 4px;
        height: 3px; border-radius: 0 0 3px 3px;
        background: ${color}30; overflow: hidden;
    `;
    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
        height: 100%; background: ${color}; border-radius: 2px;
        width: 100%; transition: width ${CONFIG.TOAST_DURATION}ms linear;
    `;
    progressBar.appendChild(progressFill);
    
    toast.appendChild(iconEl);
    toast.appendChild(msgEl);
    toast.appendChild(closeBtn);
    toast.appendChild(progressBar);
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        progressFill.style.width = '0%';
    });

    const duration = Math.max(CONFIG.TOAST_DURATION, message.length * 50 + 1000);
    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._dismissTimer = timer;

    function dismissToast(t) {
        clearTimeout(t._dismissTimer);
        t.style.animation = 'toastSlideOut 0.25s ease forwards';
        t.addEventListener('animationend', () => {
            if (document.body.contains(t)) t.remove();
            repositionToasts();
        });
    }
}

function repositionToasts() {
    const toasts = document.querySelectorAll('.toast-notification');
    toasts.forEach((t, i) => {
        t.style.bottom = `${30 + i * 70}px`;
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI, showToast };
}
