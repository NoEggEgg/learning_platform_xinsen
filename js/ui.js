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
                nextBtn: document.getElementById('exam-next-btn')
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
        
        this.elements.sections[sectionName].style.display = 'block';
        
        this.elements.sidebarLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
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
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    
    const config = {
        info: { color: 'var(--primary-color)', icon: 'fa-solid fa-info-circle' },
        success: { color: 'var(--success-color)', icon: 'fa-solid fa-check-circle' },
        warning: { color: 'var(--warning-color)', icon: 'fa-solid fa-exclamation-triangle' },
        error: { color: 'var(--danger-color)', icon: 'fa-solid fa-exclamation-circle' }
    };
    
    const { color, icon } = config[type] || config.info;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 30px;
        padding: 14px 20px;
        background: ${color};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        animation: slideInLeft 0.3s ease;
        max-width: 90vw;
    `;
    
    const iconElement = document.createElement('i');
    iconElement.className = icon;
    
    const messageElement = document.createElement('span');
    messageElement.innerHTML = message;
    
    toast.appendChild(iconElement);
    toast.appendChild(messageElement);
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.remove();
            }
        }, 300);
    }, CONFIG.TOAST_DURATION);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UI, showToast };
}
