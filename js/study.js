const StudyModule = {
    studyStartTime: null,
    _answeredQuestions: new Set(),
    
    init() {
        this.bindEvents();
    },
    
    // 根据题目类别获取阶段编号（1, 2, 3）
    getPhaseNumber(category) {
        const map = {
            [CATEGORIES.LAW]: 1,
            [CATEGORIES.REGULATION]: 2,
            [CATEGORIES.STANDARD]: 3
        };
        return map[category] || 1;
    },
    
    bindEvents() {
        UI.elements.study.categoryFilter.addEventListener('change', () => this.filterQuestions());
        UI.elements.study.typeFilter.addEventListener('change', () => this.filterQuestions());
    },

    // 保存学习会话
    saveStudySession() {
        AppState.studySession.active = true;
        AppState.studySession.currentIndex = AppState.study.currentIndex;
        AppState.studySession.correctCount = AppState.study.correct;
        AppState.studySession.wrongCount = AppState.study.wrong;
        AppState.studySession.questionOrder = AppState.studySession.questionOrder || [];
        AppState.studySession.answeredIds = this._answeredQuestions ? Array.from(this._answeredQuestions) : [];
        AppState.studySession.lastSavedAt = Date.now();
        Storage.saveProgress();
    },

    // 开始新学习会话
    startPhase(phase) {
        const category = CONFIG.PHASES[phase].category;
        
        // 检查是否有相同分类的未完成学习会话
        if (AppState.studySession.active && AppState.studySession.questionIds.length > 0) {
            const remaining = AppState.studySession.questionIds.length - AppState.studySession.currentIndex;
            if (remaining > 0) {
                // 检查当前会话的题目是否属于同一分类
                const sessionQuestions = AppState.studySession.questionIds
                    .map(id => questions.find(q => q.id === id))
                    .filter(Boolean);
                const sessionCategories = new Set(sessionQuestions.map(q => q.category));
                
                // 如果当前会话包含目标分类，恢复会话
                if (sessionCategories.has(category)) {
                    this.resumeStudySession();
                    return;
                }
            }
        }
        
        // 开始新的学习会话 - 随机排序
        const filteredQuestions = questions.filter(q => q.category === category);
        const shuffledQuestions = Utils.shuffleArray(filteredQuestions.length > 0 ? filteredQuestions : questions.slice());
        AppState.study.questions = shuffledQuestions;
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        AppState.resetStudy();

        // 初始化已回答题目集合
        this._answeredQuestions = new Set();

        // 保留之前的答题状态
        const existingStates = AppState.study.questionStates || AppState.studySession.questionStates || {};

        const questionOrder = Utils.shuffleArray([...Array(shuffledQuestions.length).keys()]);

        // 初始化学习会话
        AppState.studySession = {
            active: true,
            type: 'normal',
            questionIds: AppState.study.questions.map(q => q.id),
            questionOrder: questionOrder,
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            questionStates: existingStates
        };

        UI.showSection('study');
        this.loadQuestion();
        // 开始学习计时
        this.studyStartTime = Date.now();
        Storage.saveProgress();
        showToast(`开始 ${CONFIG.PHASES[phase].name}，共 ${AppState.study.questions.length} 题`, TOAST_TYPES.INFO);
    },
    
    // 继续学习或开始新学习
    startStudy() {
        // 检查是否有未完成的学习会话
        if (AppState.studySession.active && AppState.studySession.questionIds.length > 0) {
            const remaining = AppState.studySession.questionIds.length - AppState.studySession.currentIndex;
            if (remaining > 0) {
                // 恢复会话
                this.resumeStudySession();
                return;
            }
        }

        // 开始新的学习会话（全部题目）- 随机排序
        const shuffledQuestions = Utils.shuffleArray(questions.slice());
        AppState.study.questions = shuffledQuestions;
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        AppState.resetStudy();

        // 初始化已回答题目集合
        this._answeredQuestions = new Set();

        // 保留之前的答题状态
        const existingStates = AppState.study.questionStates || AppState.studySession.questionStates || {};

        const questionOrder = Utils.shuffleArray([...Array(shuffledQuestions.length).keys()]);

        // 初始化学习会话
        AppState.studySession = {
            active: true,
            type: 'normal',
            questionIds: shuffledQuestions.map(q => q.id),
            questionOrder: questionOrder,
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            questionStates: existingStates
        };

        UI.showSection('study');
        this.loadQuestion();
        // 开始学习计时
        this.studyStartTime = Date.now();
        Storage.saveProgress();
    },

    // 按分类过滤并开始学习
    filterByCategory(category) {
        // 检查是否有相同分类的未完成学习会话
        if (AppState.studySession.active && AppState.studySession.questionIds.length > 0) {
            const remaining = AppState.studySession.questionIds.length - AppState.studySession.currentIndex;
            if (remaining > 0) {
                // 检查当前会话的题目是否属于同一分类
                const sessionQuestions = AppState.studySession.questionIds
                    .map(id => questions.find(q => q.id === id))
                    .filter(Boolean);
                const sessionCategories = new Set(sessionQuestions.map(q => q.category));
                
                // 如果当前会话包含目标分类，恢复会话
                if (sessionCategories.has(category)) {
                    this.resumeStudySession();
                    return;
                }
            }
        }
        
        // 开始新的学习会话（指定分类的题目）
        const filteredQuestions = questions.filter(q => q.category === category);
        const shuffledQuestions = Utils.shuffleArray(filteredQuestions);
        
        AppState.study.questions = shuffledQuestions;
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        AppState.resetStudy();

        // 初始化已回答题目集合
        this._answeredQuestions = new Set();

        // 保留之前的答题状态
        const existingStates = AppState.study.questionStates || AppState.studySession.questionStates || {};

        const questionOrder = Utils.shuffleArray([...Array(shuffledQuestions.length).keys()]);

        // 初始化学习会话
        AppState.studySession = {
            active: true,
            type: 'normal',
            questionIds: shuffledQuestions.map(q => q.id),
            questionOrder: questionOrder,
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            questionStates: existingStates
        };

        UI.showSection('study');
        this.loadQuestion();
        this.studyStartTime = Date.now();
        Storage.saveProgress();
        
        Utils.showToast(`${category}，共 ${shuffledQuestions.length} 题`, TOAST_TYPES.INFO);
    },

    // 智能学习：根据当前进度选择合适的题目
    smartStartStudy() {
        const { progress } = AppState;
        const phase1Total = CONFIG.PHASES[1].total;
        const phase2Total = CONFIG.PHASES[2].total;
        const phase3Total = CONFIG.PHASES[3].total;
        const phase1Percent = phase1Total > 0 ? progress.phase1 / phase1Total : 0;
        const phase2Percent = phase2Total > 0 ? progress.phase2 / phase2Total : 0;
        const phase3Percent = phase3Total > 0 ? progress.phase3 / phase3Total : 0;

        // 检查是否有未完成的学习会话，如果有则恢复
        if (AppState.studySession.active && AppState.studySession.questionIds.length > 0) {
            const remaining = AppState.studySession.questionIds.length - AppState.studySession.currentIndex;
            if (remaining > 0) {
                this.resumeStudySession();
                return;
            }
        }

        // 确定当前应该学习的阶段
        let targetPhase = 1;
        let targetCategory = CATEGORIES.LAW;

        if (phase3Percent < 1) {
            // Phase3 刚开始或未开始，检查 Phase2 是否解锁
            if (phase2Percent >= 0.5) {
                targetPhase = 3;
                targetCategory = CATEGORIES.STANDARD;
            } else if (phase2Percent >= 0.3) {
                targetPhase = 2;
                targetCategory = CATEGORIES.REGULATION;
            } else {
                targetPhase = 1;
                targetCategory = CATEGORIES.LAW;
            }
        } else {
            // 继续 Phase3
            targetPhase = 3;
            targetCategory = CATEGORIES.STANDARD;
        }

        // 根据阶段选择题目
        let targetQuestions = questions.filter(q => q.category === targetCategory);

        // 如果该阶段已完成，随机选择其他未完成的题目
        if (targetQuestions.length === 0 || (targetPhase === 3 && phase3Percent >= 1)) {
            // 优先选择未完成阶段的题目
            if (phase2Percent < 1) {
                targetQuestions = questions.filter(q => q.category === CATEGORIES.REGULATION);
                targetPhase = 2;
            }
            if (phase1Percent < 1 && targetQuestions.length === 0) {
                targetQuestions = questions.filter(q => q.category === CATEGORIES.LAW);
                targetPhase = 1;
            }
            // 如果还是空的，说明全部完成了
            if (targetQuestions.length === 0) {
                targetQuestions = questions.slice();
            }
        }

        // 过滤掉已完全掌握的题目（答对3次以上的）
        const masteredIds = this.getMasteredQuestionIds();
        let studyQuestions = targetQuestions.filter(q => !masteredIds.has(q.id));

        // 如果过滤后题目太少，补充一些
        if (studyQuestions.length < 10) {
            studyQuestions = targetQuestions;
        }

        // 随机打乱顺序
        studyQuestions = Utils.shuffleArray(studyQuestions);

        // 设置学习状态
        AppState.study.questions = studyQuestions;
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        AppState.resetStudy();

        // 初始化已回答题目集合
        this._answeredQuestions = new Set();

        // 保留之前的答题状态
        const existingStates = AppState.study.questionStates || AppState.studySession.questionStates || {};

        const questionOrder = Utils.shuffleArray([...Array(studyQuestions.length).keys()]);

        // 初始化学习会话
        AppState.studySession = {
            active: true,
            type: 'normal',
            questionIds: studyQuestions.map(q => q.id),
            questionOrder: questionOrder,
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            questionStates: existingStates
        };

        UI.showSection('study');
        this.loadQuestion();
        this.studyStartTime = Date.now();
        Storage.saveProgress();

        const phaseName = CONFIG.PHASES[targetPhase]?.name || '智能学习';
        showToast(`${phaseName}，共 ${studyQuestions.length} 题`, TOAST_TYPES.INFO);
    },

    // 获取已掌握的题目ID（答对3次以上的）
    getMasteredQuestionIds() {
        const masteredIds = new Set();
        const questionStats = AppState.progress.questionStats || {};
        
        Object.keys(questionStats).forEach(key => {
            const id = parseInt(key);
            const stat = questionStats[id];
            if (!isNaN(id) && stat && stat.correctCount >= 3) {
                masteredIds.add(id);
            }
        });
        
        return masteredIds;
    },

    // 恢复学习会话
    resumeStudySession() {
        const { questionIds, currentIndex, answeredIds, correctCount, wrongCount, questionStates, questionOrder } = AppState.studySession;

        AppState.study.questions = questionIds
            .map(id => questions.find(q => q.id === id))
            .filter(q => q !== undefined);

        AppState.study.currentIndex = Math.min(currentIndex, AppState.study.questions.length - 1);
        AppState.study.correct = correctCount || 0;
        AppState.study.wrong = wrongCount || 0;
        AppState.study.selectedAnswer = null;
        AppState.study.isAnswered = false;
        AppState.study.isSubmitting = false;
        
        // 恢复答题状态
        AppState.study.questionStates = questionStates || {};

        // 恢复或生成questionOrder
        if (questionOrder && questionOrder.length === AppState.study.questions.length) {
            AppState.studySession.questionOrder = questionOrder;
        } else {
            AppState.studySession.questionOrder = Utils.shuffleArray(
                [...Array(AppState.study.questions.length).keys()]
            );
        }

        // 初始化已回答题目集合，避免重复计数
        this._answeredQuestions = new Set(answeredIds || []);

        UI.showSection('study');
        this.loadQuestion();
        this.studyStartTime = Date.now();
        Storage.saveProgress();

        const totalAnswered = answeredIds ? answeredIds.length : 0;
        showToast(`继续上次学习进度，已完成 ${totalAnswered}/${AppState.study.questions.length} 题`, TOAST_TYPES.INFO);
    },
    
    filterQuestions() {
        const category = UI.elements.study.categoryFilter.value;
        const type = UI.elements.study.typeFilter.value;
        
        const filteredQuestions = questions.filter(q => {
            const categoryMatch = category === 'all' || q.category === category;
            const typeMatch = type === 'all' || q.type === type;
            return categoryMatch && typeMatch;
        });
        
        if (filteredQuestions.length === 0) {
            showToast('没有符合条件的题目', TOAST_TYPES.WARNING);
            return; // 不切换，保持当前题目
        }
        
        // 检查是否有相同题目的未完成学习会话
        if (AppState.studySession.active && AppState.studySession.questionIds.length > 0) {
            const remaining = AppState.studySession.questionIds.length - AppState.studySession.currentIndex;
            // 如果剩余题目较多（>3题），提示用户会丢失进度
            if (remaining > 3 && filteredQuestions.length !== AppState.study.questions.length) {
                if (!confirm(`切换筛选将丢失当前 ${remaining} 道题的进度，确定要继续吗？`)) {
                    // 恢复筛选器到当前题目列表的筛选条件
                    const currentCategory = AppState.study.questions[0]?.category || 'all';
                    const currentType = AppState.study.questions[0]?.type || 'all';
                    UI.elements.study.categoryFilter.value = currentCategory;
                    UI.elements.study.typeFilter.value = currentType;
                    return;
                }
            }
        }
        
        // 随机排序
        const shuffledQuestions = Utils.shuffleArray(filteredQuestions);
        AppState.study.questions = shuffledQuestions;
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        AppState.resetStudy();

        // 初始化已回答题目集合
        this._answeredQuestions = new Set();

        // 更新学习会话，保留原来的会话类型
        const questionOrder = Utils.shuffleArray([...Array(shuffledQuestions.length).keys()]);
        AppState.studySession = {
            active: true,
            type: AppState.studySession.type || 'normal',
            questionIds: shuffledQuestions.map(q => q.id),
            questionOrder: questionOrder,
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            questionStates: AppState.study.questionStates || {}
        };

        this.loadQuestion();
        Storage.saveProgress();
        showToast(`筛选完成，共 ${shuffledQuestions.length} 道题`, TOAST_TYPES.INFO);
    },
    
    loadQuestion() {
        const { currentIndex, questions: studyQuestions, questionStates } = AppState.study;
        const questionOrder = AppState.studySession.questionOrder;
        
        if (studyQuestions.length === 0) {
            showToast('暂无题目可用', TOAST_TYPES.WARNING);
            return;
        }
        
        if (currentIndex >= studyQuestions.length) {
            this.showResult();
            return;
        }
        
        const realIndex = questionOrder.length > 0 ? questionOrder[currentIndex] : currentIndex;
        const question = studyQuestions[realIndex];
        const { questionType, questionCategory, questionNumber, questionContent, optionsList } = UI.elements.study;
        const questionId = typeof question.id === 'number' ? question.id : parseInt(question.id);
        
        questionNumber.textContent = `第 ${currentIndex + 1}/${studyQuestions.length} 题`;
        
        this.updateStudyProgress(currentIndex, studyQuestions.length);
        
        questionType.textContent = Utils.getTypeName(question.type);
        questionType.className = 'question-tag ' + Utils.getTypeClass(question.type);
        
        questionCategory.textContent = question.category;
        questionCategory.className = 'question-tag ' + Utils.getCategoryClass(question.category);
        
        questionContent.textContent = question.content;
        
        this.renderOptions(optionsList, question);
        
        const savedState = questionStates[questionId] || AppState.studySession.questionStates[questionId];
        
        if (savedState && savedState.isAnswered) {
            AppState.study.isAnswered = true;
            AppState.study.selectedAnswer = savedState.selectedAnswer;
            
            this.showAnswerResult(question, savedState.isCorrect);
            
            UI.elements.study.submitBtn.disabled = true;
            UI.elements.study.nextBtn.disabled = false;
        } else {
            UI.elements.study.answerFeedback.classList.remove('show');
            UI.elements.study.memoryTip.classList.remove('show');
            UI.elements.study.analysis.classList.remove('show');
            
            UI.elements.study.submitBtn.disabled = false;
            UI.elements.study.nextBtn.disabled = true;
            
            if (savedState && savedState.selectedAnswer !== null) {
                AppState.study.selectedAnswer = savedState.selectedAnswer;
                const options = UI.elements.study.optionsList.querySelectorAll('.option-item');
                options.forEach((option, i) => {
                    if (i === savedState.selectedAnswer) {
                        option.classList.add('selected');
                    }
                });
            } else {
                AppState.study.selectedAnswer = null;
                AppState.study.isAnswered = false;
            }
        }
        
        UI.elements.study.prevBtn.disabled = currentIndex === 0;
        
        this.updateFavoriteButton(question);
    },
    
    updateFavoriteButton(question) {
        const favoriteBtn = document.getElementById('favorite-btn');
        if (!favoriteBtn) return;
        
        if (AppState.progress.favorite.includes(question.id)) {
            favoriteBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            favoriteBtn.style.color = 'white';
            favoriteBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> 已收藏';
        } else {
            favoriteBtn.style.background = '#f1f5f9';
            favoriteBtn.style.color = 'var(--text-primary)';
            favoriteBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> 收藏';
        }
    },
    
    updateStudyProgress(currentIndex, totalQuestions) {
        if (!UI.elements.study.studyProgressBar || !UI.elements.study.studyProgressText) {
            return;
        }
        
        const answeredCount = AppState.studySession.answeredIds ? AppState.studySession.answeredIds.length : 0;
        const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
        UI.elements.study.studyProgressBar.style.width = progress + '%';
        UI.elements.study.studyProgressText.textContent = `${answeredCount}/${totalQuestions} (${progress}%)`;
    },
    
    renderOptions(container, question) {
        if (!question || !question.options || question.options.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">暂无选项</div>';
            return;
        }
        const questionId = typeof question.id === 'number' ? question.id : parseInt(question.id);
        let savedState = AppState.study.questionStates[questionId];
        if (!savedState) {
            savedState = {};
            AppState.study.questionStates[questionId] = savedState;
        }

        let displayOptions = question.options;
        let correctAnswer = question.answer;

        if (savedState.shuffledOptions && savedState.shuffledAnswer !== undefined) {
            displayOptions = savedState.shuffledOptions;
            correctAnswer = savedState.shuffledAnswer;
        } else {
            const result = Utils.shuffleOptions(question.options, question.answer);
            displayOptions = result.shuffledOptions;
            correctAnswer = result.newAnswerIndex;
            savedState.shuffledOptions = displayOptions;
            savedState.shuffledAnswer = correctAnswer;
        }

        const displayQuestion = { ...question, options: displayOptions, answer: correctAnswer };
        Utils.renderOptions(container, displayQuestion, (index) => this.selectOption(index));
    },
    
    handleOptionClick(event) {
        if (AppState.study.isAnswered) return;
        
        const index = parseInt(event.currentTarget.dataset.index);
        this.selectOption(index);
    },
    
    selectOption(index) {
        if (AppState.study.isAnswered) return;
        
        AppState.study.selectedAnswer = index;
        
        const options = UI.elements.study.optionsList.querySelectorAll('.option-item');
        options.forEach((option, i) => {
            option.classList.remove('selected');
            if (i === index) {
                option.classList.add('selected');
            }
        });
        
        // 保存选择状态（即使未提交）
        const questionOrder = AppState.studySession.questionOrder;
        const realIndex = questionOrder.length > 0 ? questionOrder[AppState.study.currentIndex] : AppState.study.currentIndex;
        const question = AppState.study.questions[realIndex];
        const questionId = typeof question.id === 'number' ? question.id : parseInt(question.id);
        
        const currentState = AppState.study.questionStates[questionId] || {};
        AppState.study.questionStates[questionId] = {
            ...currentState,
            selectedAnswer: index,
            isAnswered: false
        };
        AppState.studySession.questionStates[questionId] = AppState.study.questionStates[questionId];
    },
    
    submitAnswer() {
        if (AppState.study.isSubmitting || AppState.study.isAnswered) return;
        
        if (AppState.study.selectedAnswer === null) {
            showToast('请先选择一个答案', TOAST_TYPES.WARNING);
            return;
        }
        
        AppState.study.isSubmitting = true;
        const questionOrder = AppState.studySession.questionOrder;
        const realIndex = questionOrder.length > 0 ? questionOrder[AppState.study.currentIndex] : AppState.study.currentIndex;
        const question = AppState.study.questions[realIndex];
        AppState.study.isAnswered = true;
        
        const questionId = typeof question.id === 'number' ? question.id : parseInt(question.id);
        const qState = AppState.study.questionStates[questionId] || {};
        const shuffledAnswer = qState.shuffledAnswer !== undefined ? qState.shuffledAnswer : question.answer;
        const isCorrect = AppState.study.selectedAnswer === shuffledAnswer;
        
        const existingState = AppState.study.questionStates[questionId] || {};
        AppState.study.questionStates[questionId] = {
            ...existingState,
            selectedAnswer: AppState.study.selectedAnswer,
            isAnswered: true,
            isCorrect: isCorrect
        };
        AppState.studySession.questionStates[questionId] = AppState.study.questionStates[questionId];
        
        UI.elements.study.submitBtn.disabled = true;
        UI.elements.study.nextBtn.disabled = false;
        
        if (isCorrect) {
            this._scheduleAutoAdvance();
        }
        
        try {
            this.showAnswerResult(question, isCorrect);
        } catch (e) {
            console.error('显示答案结果失败:', e);
        }
        
        try {
            this.updateProgress(question, isCorrect);
        } catch (e) {
            console.error('更新学习进度失败:', e);
        }
        
        try {
            if (!AppState.studySession.answeredIds.includes(questionId)) {
                AppState.studySession.answeredIds.push(questionId);
            }
            AppState.studySession.correctCount = AppState.study.correct;
            AppState.studySession.wrongCount = AppState.study.wrong;
            this.updateStudyProgress(AppState.study.currentIndex, AppState.study.questions.length);
            this.saveStudySession();
        } catch (e) {
            console.error('保存学习会话失败:', e);
        }
        
        setTimeout(() => {
            AppState.study.isSubmitting = false;
        }, 500);
    },
    
    _scheduleAutoAdvance() {
        setTimeout(() => {
            UI.elements.study.answerFeedback.classList.remove('show');
            UI.elements.study.analysis.classList.remove('show');
            UI.elements.study.memoryTip.classList.remove('show');
            
            const questionCard = document.querySelector('.question-card');
            if (questionCard) {
                questionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            setTimeout(() => {
                this.nextQuestion();
            }, 300);
        }, 1200);
    },
    
    showAnswerResult(question, isCorrect) {
        const options = UI.elements.study.optionsList.querySelectorAll('.option-item');
        const questionId = typeof question.id === 'number' ? question.id : parseInt(question.id);
        const qState = AppState.study.questionStates[questionId] || {};
        const correctAnswer = qState.shuffledAnswer !== undefined ? qState.shuffledAnswer : question.answer;
        
        options.forEach((option, index) => {
            option.classList.remove('selected');
            
            if (index === correctAnswer) {
                option.classList.add('correct');
                option.style.animation = 'pulse 0.5s ease';
            } else if (index === AppState.study.selectedAnswer && !isCorrect) {
                option.classList.add('incorrect');
                option.style.animation = 'shake 0.5s ease';
            }
        });
        
        // 显示答案解析和记忆技巧
        UI.elements.study.answerFeedback.classList.add('show');
        UI.elements.study.analysisContent.textContent = question.analysis || '';
        UI.elements.study.analysis.classList.add('show');
        
        // 提交答案后显示记忆技巧
        if (question.memoryTip) {
            UI.elements.study.memoryTipContent.textContent = question.memoryTip;
            UI.elements.study.memoryTip.classList.add('show');
        }
        
        if (!isCorrect) {
            showToast('😅 回答错误，请查看解析', TOAST_TYPES.WARNING);
            
            const questionId = typeof question.id === 'number' ? question.id : parseInt(question.id);
            if (!AppState.progress.wrong.includes(questionId)) {
                AppState.progress.wrong.push(questionId);
                showToast('⚠️ 已加入错题本', TOAST_TYPES.INFO);
            }
        } else {
            showToast('🎉 回答正确！', TOAST_TYPES.SUCCESS);
            
            const questionId = typeof question.id === 'number' ? question.id : parseInt(question.id);
            const wrongIndex = AppState.progress.wrong.indexOf(questionId);
            if (wrongIndex > -1) {
                AppState.progress.wrong.splice(wrongIndex, 1);
                showToast('🎉 已从错题本移除', TOAST_TYPES.SUCCESS);
            }
        }
        
        // 更新错题本显示
        App.populateWrongList();
    },
    
    updateProgress(question, isCorrect) {
        const questionId = typeof question.id === 'number' ? question.id : parseInt(question.id);
        const isWrongReview = AppState.studySession.type === 'wrong';
        const progress = AppState.progress;
        
        // 1. 先记录会话内已答（避免重复）
        this._answeredQuestions.add(questionId);
        
        // 2. 错题复习不计入今日目标，但更新全局已答
        if (isWrongReview) {
            // 错题复习仅添加到全局已答（如果还没答过）
            if (!progress.answeredIds.includes(questionId)) {
                progress.answeredIds.push(questionId);
                progress.completed = progress.answeredIds.length;
                
                // 更新阶段进度（仅第一次答题时）
                const phaseNumber = this.getPhaseNumber(question.category);
                const phaseKey = 'phase' + phaseNumber;
                const phaseTotal = CONFIG.PHASES[phaseNumber].total;
                if (progress[phaseKey] < phaseTotal) {
                    progress[phaseKey]++;
                }
            }
        } else {
            // 正常学习：检查全局是否已答过
            if (!progress.answeredIds.includes(questionId)) {
                progress.answeredIds.push(questionId);
                progress.completed = progress.answeredIds.length;
                
                // 更新阶段进度（仅第一次答题时）
                const phaseNumber = this.getPhaseNumber(question.category);
                const phaseKey = 'phase' + phaseNumber;
                const phaseTotal = CONFIG.PHASES[phaseNumber].total;
                if (progress[phaseKey] < phaseTotal) {
                    progress[phaseKey]++;
                }
                
                // 更新今日目标（仅新题第一次答）
                if (!progress.todayAnsweredIds.includes(questionId)) {
                    progress.todayAnsweredIds.push(questionId);
                    progress.todayCount = progress.todayAnsweredIds.length;
                }
            } else {
                // 已答过的题，仅检查今日是否需要计数
                if (!progress.todayAnsweredIds.includes(questionId)) {
                    progress.todayAnsweredIds.push(questionId);
                    progress.todayCount = progress.todayAnsweredIds.length;
                }
            }
        }
        
        // 更新题目答题统计
        if (!progress.questionStats) {
            progress.questionStats = {};
        }
        if (!progress.questionStats[questionId]) {
            progress.questionStats[questionId] = {
                correctCount: 0,
                wrongCount: 0,
                lastAnswerTime: null
            };
        }
        const questionStat = progress.questionStats[questionId];
        if (isCorrect) {
            questionStat.correctCount++;
        } else {
            questionStat.wrongCount++;
        }
        questionStat.lastAnswerTime = Date.now();
        
        if (isCorrect) {
            AppState.study.correct++;
        } else {
            AppState.study.wrong++;
        }
        
        Storage.saveProgress();
        App.updateStats();
        
        // 同步学习路径进度
        this.updateLearningPathProgress(question);
    },
    
    updateLearningPathProgress(question) {
        if (typeof LearningPath !== 'undefined') {
            const categoryMap = {
                [CATEGORIES.LAW]: 1,
                [CATEGORIES.REGULATION]: 2,
                [CATEGORIES.STANDARD]: 3
            };
            const phaseId = categoryMap[question.category];
            if (phaseId) {
                const phase = LearningPath.phases.find(p => p.id === phaseId);
                if (phase) {
                    // 每答对5道题完成10%的任务进度
                    const questionsPerTask = Math.ceil(CONFIG.PHASES[phaseId].total / (phase.tasks.length * 10));
                    const answeredInPhase = AppState.progress[`phase${phaseId}`];
                    
                    phase.tasks.forEach((task, index) => {
                        const taskThreshold = (index + 1) * questionsPerTask * 10;
                        if (answeredInPhase >= taskThreshold) {
                            task.progress = Math.min(100, task.progress + 10);
                        }
                    });
                    
                    LearningPath.saveProgress();
                }
            }
        }
    },
    
    prevQuestion() {
        if (AppState.study.currentIndex > 0) {
            AppState.study.currentIndex--;
            AppState.resetStudy();
            this.loadQuestion();
        }
    },
    
    nextQuestion() {
        AppState.study.currentIndex++;
        AppState.studySession.currentIndex = AppState.study.currentIndex;

        const questionOrder = AppState.studySession.questionOrder;
        if (questionOrder.length > 0 && AppState.study.currentIndex < questionOrder.length) {
            const seen = questionOrder.slice(0, AppState.study.currentIndex);
            const remaining = Utils.shuffleArray(
                questionOrder.slice(AppState.study.currentIndex)
            );
            AppState.studySession.questionOrder = [...seen, ...remaining];
        }

        this.saveStudySession();

        if (AppState.study.currentIndex >= AppState.study.questions.length) {
            this.showResult();
        } else {
            AppState.resetStudy();
            this.loadQuestion();
            const questionCard = document.querySelector('.question-card');
            if (questionCard) {
                questionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    },
    
    toggleMemoryTip() {
        const tip = UI.elements.study.memoryTip;
        const feedback = UI.elements.study.answerFeedback;
        const analysis = UI.elements.study.analysis;
        const questionOrder = AppState.studySession.questionOrder;
        const realIndex = questionOrder.length > 0 ? questionOrder[AppState.study.currentIndex] : AppState.study.currentIndex;
        const question = AppState.study.questions[realIndex];
        
        if (!question) {
            showToast('请先开始学习', TOAST_TYPES.WARNING);
            return;
        }
        
        if (tip.classList.contains('show')) {
            // 隐藏技巧
            tip.classList.remove('show');
            // 如果技巧和解析都隐藏了，隐藏整个容器
            if (!analysis.classList.contains('show')) {
                feedback.classList.remove('show');
            }
        } else {
            // 显示技巧
            const memoryTipText = question.memoryTip || '暂无记忆技巧';
            UI.elements.study.memoryTipContent.textContent = memoryTipText;
            feedback.classList.add('show');
            tip.classList.add('show');
        }
    },
    
    showResult() {
        const { correct, wrong } = AppState.study;
        const total = correct + wrong;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        // 停止学习计时并更新总时间
        if (this.studyStartTime) {
            const studyDuration = Math.floor((Date.now() - this.studyStartTime) / 60000); // 转换为分钟
            AppState.progress.totalTime += studyDuration;
            this.studyStartTime = null;
            Storage.saveProgress();
            App.updateStats();
        }

        // 如果是错题复习模式，处理错题更新
        if (AppState.studySession.type === 'wrong') {
            // 将答对的错题从错题本中移除
            const answeredCorrectly = [];
            AppState.study.questions.forEach((q) => {
                if (AppState.study.questionStates[q.id]?.isCorrect) {
                    answeredCorrectly.push(q.id);
                }
            });
            
            // 从错题本中移除答对的题目
            AppState.progress.wrong = AppState.progress.wrong.filter(id => 
                !answeredCorrectly.includes(id)
            );
            
            // 更新错题复习计数
            AppState.progress.wrongReviewed += total;
        }

        // 结束学习会话
        AppState.studySession.active = false;
        AppState.studySession.lastSavedAt = Date.now();
        // 清理临时保存的会话（学习完成后不需要再保留）
        delete AppState.studySession.previousNormalSession;
        Storage.saveProgress();

        // 生成鼓励语
        let title = '答题完成';
        let text = `正确 ${correct} 题，错误 ${wrong} 题，正确率 ${accuracy}%`;
        
        if (accuracy >= 90) {
            title = '太棒了！';
            text = `正确率 ${accuracy}%！继续保持，你已经掌握了这些知识点！`;
        } else if (accuracy >= 70) {
            title = '表现不错！';
            text = `正确率 ${accuracy}%。再接再厉，争取更好的成绩！`;
        } else if (accuracy >= 50) {
            title = '继续努力！';
            text = `正确率 ${accuracy}%。建议复习错题，巩固知识点。`;
        } else if (total > 0) {
            title = '需要加油！';
            text = `正确率 ${accuracy}%。建议先从简单题目开始练习。`;
        }
        
        UI.showModal(accuracy >= 60 ? 'success' : 'warning', {
            correct,
            wrong,
            accuracy,
            title,
            text
        });
    },
    
    reviewWrong() {
        const wrongQuestions = questions.filter(q => AppState.progress.wrong.includes(q.id));
        
        if (wrongQuestions.length === 0) {
            showToast('暂无错题需要重做', TOAST_TYPES.SUCCESS);
            return;
        }
        
        // 检查是否有正常学习的未完成会话
        const hasNormalSession = AppState.studySession.active && 
                                 AppState.studySession.type === 'normal' &&
                                 AppState.studySession.questionIds.length > 0;
        const remaining = hasNormalSession ? 
            AppState.studySession.questionIds.length - AppState.studySession.currentIndex : 0;
        
        if (hasNormalSession && remaining > 0) {
            if (!confirm(`当前有 ${remaining} 道正常学习题目未完成，确定要切换到错题复习吗？`)) {
                return;
            } else {
                // 用户确认切换，先保存当前正常学习会话的进度
                this.saveStudySession();
                
                // 保存当前正常学习会话，以便之后可以恢复
                AppState.studySession.previousNormalSession = {
                    type: AppState.studySession.type,
                    questionIds: AppState.studySession.questionIds,
                    questionOrder: AppState.studySession.questionOrder || [],
                    currentIndex: AppState.studySession.currentIndex,
                    answeredIds: AppState.studySession.answeredIds,
                    correctCount: AppState.studySession.correctCount,
                    wrongCount: AppState.studySession.wrongCount,
                    questionStates: AppState.studySession.questionStates || {}  // 保存答题状态
                };
            }
        }
        
        AppState.study.questions = Utils.shuffleArray(wrongQuestions);
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        
        // 错题复习需要重置所有答题状态，让用户重新答题
        AppState.study.questionStates = {};
        
        AppState.resetStudy();

        // 初始化已回答题目集合（新建，错题复习需要重新答题）
        this._answeredQuestions = new Set();

        // 保存之前的正常学习会话（如果已保存）
        const previousSession = AppState.studySession.previousNormalSession;

        // 初始化错题复习会话（重置答题状态）
        const wrongQuestionOrder = Utils.shuffleArray([...Array(AppState.study.questions.length).keys()]);
        AppState.studySession = {
            active: true,
            type: 'wrong',
            questionIds: AppState.study.questions.map(q => q.id),
            questionOrder: wrongQuestionOrder,
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            previousNormalSession: previousSession,
            questionStates: {}
        };

        UI.showSection('study');
        this.loadQuestion();
        this.studyStartTime = Date.now();
        Storage.saveProgress();
        showToast(`开始复习 ${wrongQuestions.length} 道错题`, TOAST_TYPES.INFO);
    },
    
    // 收藏当前题目
    toggleFavorite() {
        const questionOrder = AppState.studySession.questionOrder;
        const realIndex = questionOrder.length > 0 ? questionOrder[AppState.study.currentIndex] : AppState.study.currentIndex;
        const question = AppState.study.questions[realIndex];
        if (!question) return;
        
        App.addToFavorite(question.id);
        // 更新收藏按钮UI
        this.updateFavoriteButton(question);
    },
    
    // 更新收藏按钮状态（使用新的收藏机制）
    updateFavoriteButton(question) {
        const favoriteBtn = document.getElementById('favorite-btn');
        if (!favoriteBtn) return;
        
        if (AppState.progress.favorite.includes(question.id)) {
            favoriteBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            favoriteBtn.style.color = 'white';
            favoriteBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> 已收藏';
        } else {
            favoriteBtn.style.background = '#f1f5f9';
            favoriteBtn.style.color = 'var(--text-primary)';
            favoriteBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> 收藏';
        }
    },
    
    // 复习收藏题目
    reviewFavorite() {
        const favoriteQuestions = questions.filter(q => AppState.progress.favorite.includes(q.id));
        
        if (favoriteQuestions.length === 0) {
            showToast('暂无收藏题目需要复习', TOAST_TYPES.SUCCESS);
            return;
        }
        
        // 检查是否有正常学习的未完成会话
        const hasNormalSession = AppState.studySession.active && 
                                 AppState.studySession.type === 'normal' &&
                                 AppState.studySession.questionIds.length > 0;
        const remaining = hasNormalSession ? 
            AppState.studySession.questionIds.length - AppState.studySession.currentIndex : 0;
        
        if (hasNormalSession && remaining > 0) {
            if (!confirm(`当前有 ${remaining} 道正常学习题目未完成，确定要切换到收藏复习吗？`)) {
                return;
            } else {
                // 用户确认切换，先保存当前正常学习会话的进度
                this.saveStudySession();
                
                // 保存当前正常学习会话，以便之后可以恢复
                AppState.studySession.previousNormalSession = {
                    type: AppState.studySession.type,
                    questionIds: AppState.studySession.questionIds,
                    questionOrder: AppState.studySession.questionOrder || [],
                    currentIndex: AppState.studySession.currentIndex,
                    answeredIds: AppState.studySession.answeredIds,
                    correctCount: AppState.studySession.correctCount,
                    wrongCount: AppState.studySession.wrongCount,
                    questionStates: AppState.studySession.questionStates || {}
                };
            }
        }
        
        AppState.study.questions = Utils.shuffleArray(favoriteQuestions);
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        
        // 收藏复习需要重置所有答题状态，让用户重新答题
        AppState.study.questionStates = {};
        
        AppState.resetStudy();

        // 初始化已回答题目集合
        this._answeredQuestions = new Set();

        // 保存之前的正常学习会话（如果已保存）
        const previousSession = AppState.studySession.previousNormalSession;

        // 初始化收藏复习会话（重置答题状态）
        const favoriteQuestionOrder = Utils.shuffleArray([...Array(AppState.study.questions.length).keys()]);
        AppState.studySession = {
            active: true,
            type: 'favorite',
            questionIds: AppState.study.questions.map(q => q.id),
            questionOrder: favoriteQuestionOrder,
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            previousNormalSession: previousSession,
            questionStates: {}
        };

        UI.showSection('study');
        this.loadQuestion();
        this.studyStartTime = Date.now();
        Storage.saveProgress();
        showToast(`开始复习 ${favoriteQuestions.length} 道收藏题目`, TOAST_TYPES.INFO);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyModule;
}
