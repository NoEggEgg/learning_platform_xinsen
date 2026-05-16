const App = {
    init() {
        UI.init();
        
        Utils.validateQuestions(questions);
        
        Storage.loadProgress();
        
        SpacedRepetition.init();
        
        this.checkDailyReset();
        
        this.updateStats();
        
        this.updateTodayDate();
        
        this.populateWrongList();
        this.populateFavoriteList();
        
        this.bindGlobalEvents();
        
        StudyModule.init();
        
        // 初始化智能推荐
        this.updateRecommendation();
        
        // 显示每日欢迎信息
        this.showDailyWelcome();
        
        console.log('学习平台初始化完成');
    },
    
    showDailyWelcome() {
        const { progress } = AppState;
        const hour = new Date().getHours();
        let greeting = '上午好';
        let icon = 'fa-sun';
        
        if (hour >= 5 && hour < 12) {
            greeting = '上午好';
            icon = 'fa-sun';
        } else if (hour >= 12 && hour < 14) {
            greeting = '中午好';
            icon = 'fa-cloud-sun';
        } else if (hour >= 14 && hour < 18) {
            greeting = '下午好';
            icon = 'fa-cloud-sun';
        } else if (hour >= 18 && hour < 22) {
            greeting = '晚上好';
            icon = 'fa-moon';
        } else {
            greeting = '夜深了';
            icon = 'fa-moon';
        }
        
        // 根据学习进度生成欢迎信息
        let welcomeMsg = '';
        if (progress.streak > 0) {
            welcomeMsg = `已连续学习 <strong>${progress.streak}</strong> 天！`;
        } else {
            welcomeMsg = '开始今天的学习吧！';
        }
        
        // 延迟显示欢迎提示，增强体验
        setTimeout(() => {
            showToast(`${greeting}！${welcomeMsg}`, TOAST_TYPES.INFO);
        }, 800);
    },
    
    checkDailyReset() {
        const today = new Date().toDateString();
        if (AppState.progress.lastDate !== today) {
            const lastDate = AppState.progress.lastDate;
            AppState.progress.todayCount = 0;
            AppState.progress.todayAnsweredIds = [];  // 清空今日已答题目
            AppState.progress.lastDate = today;
            
            if (!lastDate) {
                // 首次学习
                AppState.progress.streak = 1;
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastDate === yesterday.toDateString()) {
                    // 连续学习
                    AppState.progress.streak++;
                } else {
                    // 学习中断，重新开始计数
                    AppState.progress.streak = 1;
                }
            }
            
            // 日期变化时立即设置标记，防止后续刷新重复计算
            AppState.progress._streakUpdated = true;
            Storage.saveProgress();
        }
    },
    
    updateStats() {
        const { progress } = AppState;
        
        // 更新计划页面统计数据
        UI.elements.plan.totalWrong.textContent = progress.wrong.length;
        UI.elements.plan.streak.textContent = progress.streak;
        UI.elements.plan.todayDone.textContent = progress.todayCount;
        
        // 更新阶段总数显示
        const phase1Total = document.getElementById('phase1-total');
        const phase2Total = document.getElementById('phase2-total');
        const phase3Total = document.getElementById('phase3-total');
        if (phase1Total) phase1Total.textContent = CONFIG.PHASES[1].total;
        if (phase2Total) phase2Total.textContent = CONFIG.PHASES[2].total;
        if (phase3Total) phase3Total.textContent = CONFIG.PHASES[3].total;
        
        // 计算阶段进度百分比
        const totalQuestions = CONFIG.PHASES[1].total + CONFIG.PHASES[2].total + CONFIG.PHASES[3].total;
        
        // 更新阶段进度
        const phase1Percent = CONFIG.PHASES[1].total > 0 ? Math.min(Math.round((progress.phase1 / CONFIG.PHASES[1].total) * 100), 100) : 0;
        const phase2Percent = CONFIG.PHASES[2].total > 0 ? Math.min(Math.round((progress.phase2 / CONFIG.PHASES[2].total) * 100), 100) : 0;
        const phase3Percent = CONFIG.PHASES[3].total > 0 ? Math.min(Math.round((progress.phase3 / CONFIG.PHASES[3].total) * 100), 100) : 0;
        
        document.querySelector('.phase-1 .phase-progress-bar').style.width = phase1Percent + '%';
        document.querySelector('.phase-2 .phase-progress-bar').style.width = phase2Percent + '%';
        document.querySelector('.phase-3 .phase-progress-bar').style.width = phase3Percent + '%';
        
        // 更新阶段完成数量显示
        if (UI.elements.plan.phase1Done) UI.elements.plan.phase1Done.textContent = progress.phase1;
        if (UI.elements.plan.phase2Done) UI.elements.plan.phase2Done.textContent = progress.phase2;
        if (UI.elements.plan.phase3Done) UI.elements.plan.phase3Done.textContent = progress.phase3;
        
        // 更新总完成数和总时间
        if (UI.elements.plan.totalCompleted) UI.elements.plan.totalCompleted.textContent = progress.completed;
        if (UI.elements.plan.totalTime) UI.elements.plan.totalTime.textContent = Math.floor(progress.totalTime);
        
        // 更新总体进度环
        const overallProgress = totalQuestions > 0 ? Math.min(Math.round(((progress.phase1 + progress.phase2 + progress.phase3) / totalQuestions) * 100), 100) : 0;
        UI.elements.plan.overallProgress.textContent = overallProgress + '%';
        if (UI.elements.plan.progressRing) {
            UI.elements.plan.progressRing.style.background = `conic-gradient(#10b981 ${overallProgress * 3.6}deg, #e2e8f0 ${overallProgress * 3.6}deg)`;
        }

        const todayPercent = Math.min(Math.round((progress.todayCount / CONFIG.DAILY_TARGET) * 100), 100);
        UI.elements.plan.todayProgressBar.style.width = todayPercent + '%';

        // 更新今日目标区域
        this.updateTodayTargetUI();

        const hours = Math.floor(progress.totalTime / 60);
        const minutes = Math.floor(progress.totalTime % 60);
        UI.elements.plan.studyTime.textContent = hours > 0 ? `学习 ${hours}小时${minutes}分钟` : `学习 ${minutes} 分钟`;
        
        // 更新阶段锁定状态
        this.updatePhaseLockStatus();

        // 更新智能推荐
        this.updateRecommendation();
    },

    // 更新今日目标UI
    updateTodayTargetUI() {
        const { progress } = AppState;
        const phase1Total = CONFIG.PHASES[1].total;
        const phase2Total = CONFIG.PHASES[2].total;
        const phase3Total = CONFIG.PHASES[3].total;

        // 计算当前应该学习的阶段
        const phase1Percent = phase1Total > 0 ? progress.phase1 / phase1Total : 0;
        const phase2Percent = phase2Total > 0 ? progress.phase2 / phase2Total : 0;
        const phase3Percent = phase3Total > 0 ? progress.phase3 / phase3Total : 0;

        let currentPhase = 1;
        let phaseName = '基础学习';

        if (phase1Percent < 1) {
            currentPhase = 1;
            phaseName = '基础学习';
        } else if (phase2Percent < 1) {
            currentPhase = 2;
            phaseName = '强化记忆';
        } else {
            currentPhase = 3;
            phaseName = '冲刺复习';
        }

        // 更新阶段徽章
        const phaseBadge = document.getElementById('current-phase-badge');
        if (phaseBadge) {
            phaseBadge.textContent = phaseName;
            // 根据阶段设置不同颜色
            const colors = { '基础学习': 'var(--primary-color)', '强化记忆': '#f59e0b', '冲刺复习': '#8b5cf6' };
            phaseBadge.style.background = colors[phaseName] || 'var(--primary-color)';
        }

        // 更新剩余题数提示
        const todayRemaining = document.getElementById('today-remaining');
        const todayStatus = document.getElementById('today-status');
        const remaining = CONFIG.DAILY_TARGET - progress.todayCount;

        if (todayRemaining) {
            if (remaining <= 0) {
                todayRemaining.textContent = '今日目标已完成！';
            } else {
                todayRemaining.textContent = `还需完成 ${remaining} 题`;
            }
        }

        if (todayStatus) {
            const percent = progress.todayCount / CONFIG.DAILY_TARGET;
            if (percent >= 1) {
                todayStatus.textContent = '太棒了！';
                todayStatus.style.color = 'var(--success-color)';
            } else if (percent >= 0.5) {
                todayStatus.textContent = '过半了！';
                todayStatus.style.color = 'var(--warning-color)';
            } else if (percent > 0) {
                todayStatus.textContent = '加油！';
                todayStatus.style.color = 'var(--primary-color)';
            } else {
                todayStatus.textContent = '开始学习';
                todayStatus.style.color = 'var(--text-secondary)';
            }
        }
    },
    
    updatePhaseLockStatus() {
        const { progress } = AppState;
        const phase2Lock = document.getElementById('phase2-lock');
        const phase2Btn = document.getElementById('phase2-btn');
        const phase3Lock = document.getElementById('phase3-lock');
        const phase3Btn = document.getElementById('phase3-btn');
        
        // Phase 2: 建议完成 Phase1 30% 以上后解锁
        if (phase2Lock && phase2Btn) {
            const phase1Percent = CONFIG.PHASES[1].total > 0 ? (progress.phase1 / CONFIG.PHASES[1].total) * 100 : 0;
            if (phase1Percent >= 30) {
                phase2Lock.innerHTML = '<i class="fa-solid fa-unlock"></i> 已解锁';
                phase2Lock.style.color = 'var(--success-color)';
                phase2Btn.disabled = false;
                phase2Btn.className = 'btn btn-primary';
            } else {
                phase2Lock.innerHTML = '<i class="fa-solid fa-lock"></i> 建议完成基础学习30%后解锁';
                phase2Lock.style.color = 'var(--text-secondary)';
                phase2Btn.disabled = true;
                phase2Btn.className = 'btn btn-secondary';
            }
        }
        
        // Phase 3: 建议完成 Phase2 50% 以上后解锁
        if (phase3Lock && phase3Btn) {
            const phase2Percent = CONFIG.PHASES[2].total > 0 ? (progress.phase2 / CONFIG.PHASES[2].total) * 100 : 0;
            if (phase2Percent >= 50) {
                phase3Lock.innerHTML = '<i class="fa-solid fa-unlock"></i> 已解锁';
                phase3Lock.style.color = 'var(--success-color)';
                phase3Btn.disabled = false;
                phase3Btn.className = 'btn btn-primary';
            } else {
                phase3Lock.innerHTML = '<i class="fa-solid fa-lock"></i> 建议完成强化记忆50%后解锁';
                phase3Lock.style.color = 'var(--text-secondary)';
                phase3Btn.disabled = true;
                phase3Btn.className = 'btn btn-secondary';
            }
        }
    },
    
    updateTodayDate() {
        UI.elements.plan.todayDate.textContent = Utils.formatDate(new Date());
    },
    
    populateWrongList() {
        const { wrong } = AppState.progress;
        
        if (wrong.length === 0) {
            UI.elements.exercise.wrongList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fa-solid fa-check-circle" style="font-size: 3rem; color: var(--success-color); margin-bottom: 15px; display: block;"></i>
                    太棒了！暂无错题记录
                </div>
            `;
        } else {
            UI.elements.exercise.wrongList.innerHTML = '';
            
            wrong.forEach(qId => {
                const question = questions.find(q => q.id === qId);
                if (question) {
                    const item = document.createElement('div');
                    item.className = 'wrong-item';
                    item.dataset.questionId = qId;
                    item.dataset.searchText = (question.content + ' ' + question.category + ' ' + Utils.getTypeName(question.type)).toLowerCase();
                    const isMarked = AppState.progress.favorite.includes(qId);
                    item.onclick = () => this.showWrongQuestionDetail(question);
                    
                    // 转义HTML，防止XSS
                    const safeContent = Utils.escapeHtml(question.content);
                    const safeTypeName = Utils.escapeHtml(Utils.getTypeName(question.type));
                    const safeCategory = Utils.escapeHtml(question.category);
                    
                    item.innerHTML = `
                        <div class="wrong-item-header">
                            <span class="question-tag ${Utils.getTypeClass(question.type)}">${safeTypeName}</span>
                            <span class="question-tag ${Utils.getCategoryClass(question.category)}">${safeCategory}</span>
                            ${isMarked ? '<span class="question-tag" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;"><i class="fa-solid fa-star"></i> 已收藏</span>' : ''}
                            <span style="margin-left: auto; color: var(--text-secondary); font-size: 0.8rem;">
                                <i class="fa-solid fa-hand-pointer"></i> 点击查看
                            </span>
                        </div>
                        <div class="wrong-item-content">${safeContent}</div>
                    `;
                    UI.elements.exercise.wrongList.appendChild(item);
                }
            });
        }
        
        this.updateExerciseSectionStats();
    },
    
    // 过滤错题列表
    filterWrongQuestions(searchText) {
        const searchLower = searchText.toLowerCase().trim();
        const items = UI.elements.exercise.wrongList.querySelectorAll('.wrong-item');
        let visibleCount = 0;
        
        items.forEach(item => {
            const searchTextAttr = item.dataset.searchText || '';
            if (!searchLower || searchTextAttr.includes(searchLower)) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // 如果没有搜索结果，显示提示
        const noResultMsg = UI.elements.exercise.wrongList.querySelector('.no-search-result');
        if (visibleCount === 0 && searchLower) {
            if (!noResultMsg) {
                const msg = document.createElement('div');
                msg.className = 'no-search-result';
                msg.style.cssText = 'text-align: center; padding: 30px; color: var(--text-secondary);';
                msg.innerHTML = `<i class="fa-solid fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>未找到匹配的错题`;
                UI.elements.exercise.wrongList.appendChild(msg);
            }
        } else if (noResultMsg) {
            noResultMsg.remove();
        }
    },
    
    showWrongQuestionDetail(question) {
        // 创建题目详情弹窗
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'wrong-detail-modal';
        
        // 转义HTML，防止XSS
        const safeContent = Utils.escapeHtml(question.content);
        const safeTypeName = Utils.escapeHtml(Utils.getTypeName(question.type));
        const safeCategory = Utils.escapeHtml(question.category);
        const safeAnalysis = Utils.escapeHtml(question.analysis);
        const safeMemoryTip = question.memoryTip ? Utils.escapeHtml(question.memoryTip) : '';
        
        let optionsHtml = '';
        question.options.forEach((option, index) => {
            const isCorrect = index === question.answer;
            const letter = Utils.getAnswerLetter(index);
            const safeOption = Utils.escapeHtml(option);
            optionsHtml += `
                <div style="padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; 
                     background: ${isCorrect ? '#dcfce7' : '#f8fafc'}; 
                     border: 2px solid ${isCorrect ? '#22c55e' : '#e2e8f0'};">
                    <span style="font-weight: 600; color: ${isCorrect ? '#166534' : '#64748b'};">
                        ${letter}. ${safeOption}
                    </span>
                    ${isCorrect ? '<i class="fa-solid fa-check" style="color: #22c55e; margin-left: 8px;"></i>' : ''}
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="display: flex; gap: 8px;">
                        <span class="question-tag ${Utils.getTypeClass(question.type)}">${safeTypeName}</span>
                        <span class="question-tag ${Utils.getCategoryClass(question.category)}">${safeCategory}</span>
                    </div>
                    <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <div style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 10px;">
                    ${safeContent}
                </div>
                <div style="margin-bottom: 20px;">
                    ${optionsHtml}
                </div>
                <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 15px; border-radius: 10px; border-left: 4px solid var(--primary-color);">
                    <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">
                        <i class="fa-solid fa-book-open"></i> 答案解析
                    </div>
                    <div style="color: #1e3a8a; line-height: 1.7;">${safeAnalysis}</div>
                </div>
                ${question.memoryTip ? `
                <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 15px; border-radius: 10px; border-left: 4px solid var(--warning-color); margin-top: 15px;">
                    <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">
                        <i class="fa-solid fa-lightbulb"></i> 记忆技巧
                    </div>
                    <div style="color: #78350f; line-height: 1.7;">${safeMemoryTip}</div>
                </div>
                ` : ''}
                <div style="display: flex; gap: 12px; margin-top: 20px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
                    <button class="btn btn-warning" id="wrong-detail-fav-btn" onclick="App.addToFavorite(${question.id}); App.updateExerciseSectionStats(); App.updateWrongFavButton(this, ${question.id});" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                        <i class="fa-solid fa-bookmark"></i> ${AppState.progress.favorite.includes(question.id) ? '已收藏' : '收藏'}
                    </button>
                    <button class="btn btn-primary" onclick="App.showWrongQuestionInStudy(${question.id}); this.closest('.modal').remove();">
                        <i class="fa-solid fa-book-open"></i> 去练习
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },
    
    showWrongQuestionInStudy(questionId) {
        const question = questions.find(q => q.id === questionId);
        if (!question) return;
        
        // 检查是否有正常学习的未完成会话
        const hasNormalSession = AppState.studySession.active && 
                                 AppState.studySession.type === 'normal' &&
                                 AppState.studySession.questionIds.length > 0;
        const remaining = hasNormalSession ? 
            AppState.studySession.questionIds.length - AppState.studySession.currentIndex : 0;
        
        if (hasNormalSession && remaining > 0) {
            if (!confirm(`当前有 ${remaining} 道正常学习题目未完成，确定要切换到单题练习吗？`)) {
                return;
            }
        }
        
        AppState.study.questions = [question];
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        AppState.resetStudy();
        
        // 初始化单题练习会话
        AppState.studySession = {
            active: true,
            type: 'wrong',
            questionIds: [question.id],
            questionOrder: [0],
            visitedIndices: [],
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            questionStates: {}
        };
        
        this.showSection('study');
        StudyModule.loadQuestion();
        // 开始学习计时
        StudyModule.studyStartTime = Date.now();
        showToast('单题练习模式', TOAST_TYPES.INFO);
    },
    
    bindGlobalEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 页面离开前保存学习计时
        window.addEventListener('beforeunload', (e) => {
            this.saveStudyTime();
            
            // 如果正在学习或考试中，提示用户
            if (AppState.exam.isStarted) {
                const unanswered = AppState.exam.questions.length - Object.keys(AppState.exam.answers).length;
                if (unanswered > 0) {
                    e.preventDefault();
                    e.returnValue = `还有 ${unanswered} 道题未作答，确定要离开吗？`;
                }
            }
            
            if (StudyModule.studyStartTime) {
                const currentQuestion = AppState.study.questions[AppState.study.currentIndex];
                if (currentQuestion && !AppState.study.isAnswered) {
                    e.preventDefault();
                    e.returnValue = '当前题目尚未提交答案，确定要离开吗？';
                }
            }
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveStudyTime();
            }
        });
    },
    
    saveStudyTime() {
        if (StudyModule.studyStartTime) {
            const studyDuration = Math.floor((Date.now() - StudyModule.studyStartTime) / 60000);
            if (studyDuration > 0) {
                AppState.progress.totalTime += studyDuration;
                Storage.saveProgress();
            }
            // 重置计时器以便下次切换页面时重新计时
            StudyModule.studyStartTime = null;
        }
    },
    
    handleKeyPress(e) {
        const activeSection = this.getActiveSection();
        
        if (activeSection === 'study') {
            this.handleStudyKeyPress(e);
        } else if (activeSection === 'exam') {
            this.handleExamKeyPress(e);
        }
    },
    
    getActiveSection() {
        for (const [key, section] of Object.entries(UI.elements.sections)) {
            if (section.style.display !== 'none') {
                return key;
            }
        }
        return 'plan';
    },
    
    handleStudyKeyPress(e) {
        const { prevBtn, nextBtn, submitBtn } = UI.elements.study;
        
        if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
            StudyModule.prevQuestion();
        } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
            StudyModule.nextQuestion();
        } else if (e.key === 'Enter' && !submitBtn.disabled) {
            StudyModule.submitAnswer();
        } else if (['A', 'B', 'C', 'D'].includes(e.key.toUpperCase())) {
            const index = ['A', 'B', 'C', 'D'].indexOf(e.key.toUpperCase());
            StudyModule.selectOption(index);
        }
    },
    
    handleExamKeyPress(e) {
        const { prevBtn, nextBtn } = UI.elements.exam;
        
        if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
            ExamModule.prevQuestion();
        } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
            ExamModule.nextQuestion();
        } else if (['A', 'B', 'C', 'D'].includes(e.key.toUpperCase())) {
            const index = ['A', 'B', 'C', 'D'].indexOf(e.key.toUpperCase());
            ExamModule.selectOption(index);
        }
    },
    
    showSection(sectionName) {
        const activeSection = this.getActiveSection();
        
        // 从学习页面切换时保存计时并重置
        if (activeSection === 'study' && sectionName !== 'study') {
            this.saveStudyTime();
            // 重置学习开始时间，以便下次进入学习页面时重新计时
            StudyModule.studyStartTime = null;
        }
        
        // 重新进入学习页面时检查并恢复学习会话
        if (sectionName === 'study') {
            StudyModule.studyStartTime = Date.now();
            
            // 检查是否有未完成的学习会话
            if (AppState.studySession.active && AppState.studySession.questionIds.length > 0) {
                const remaining = AppState.studySession.questionIds.length - AppState.studySession.currentIndex;
                
                if (remaining > 0) {
                    if (AppState.studySession.type === 'wrong' || AppState.studySession.type === 'favorite') {
                    // 错题/收藏复习会话：询问用户是继续复习还是回到正常学习
                    const typeText = AppState.studySession.type === 'wrong' ? '错题' : '收藏';
                    const choice = confirm(`当前有${typeText}复习未完成。\n\n确定：继续${typeText}复习\n取消：返回正常学习`);
                    
                    if (!choice) {
                        // 用户选择回到正常学习，尝试恢复之前的正常学习会话
                        if (AppState.studySession.previousNormalSession) {
                            // 恢复之前保存的正常学习会话
                            const savedSession = AppState.studySession.previousNormalSession;
                            AppState.studySession = {
                                ...AppState.studySession,
                                ...savedSession,
                                active: true
                            };
                            delete AppState.studySession.previousNormalSession;
                            
                            // 恢复会话后立即加载学习页面
                            StudyModule.resumeStudySession();
                            return;
                        } else {
                            // 没有保存的会话，重置为正常学习模式
                            AppState.studySession.active = false;
                            AppState.studySession.type = 'normal';
                            AppState.studySession.questionIds = [];
                        }
                        UI.showSection(sectionName);
                        return;
                    }
                    // 继续复习
                }
                    // 有未完成的会话，恢复它
                    StudyModule.resumeStudySession();
                    return; // resumeStudySession 已经调用了 UI.showSection
                }
            }
        }
        
        UI.showSection(sectionName);
        
        // 初始化学习路径模块
        if (sectionName === 'path') {
            LearningPath.init();
        }
        
        // 初始化成就系统
        if (sectionName === 'achievement') {
            Achievement.init();
        }
        
        // 刷新习题本列表
        if (sectionName === 'exercise') {
            this.populateWrongList();
            this.populateFavoriteList();
            this.updateExerciseSectionStats();
        }
    },
    
    resetProgress() {
        if (!confirm('确定要重置所有学习进度吗？此操作不可撤销！')) {
            return;
        }
        
        Storage.clearProgress();
        this.updateStats();
        this.populateWrongList();
        this.populateFavoriteList();
        this.updateExerciseSectionStats();
        this.updateRecommendation();
        this.updateTodayDate();
        showToast('学习进度已重置', TOAST_TYPES.SUCCESS);
    },
    
    exportConfig() {
        Storage.exportConfig();
    },
    
    importConfig(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!confirm('确定要导入配置吗？当前进度将被覆盖！')) {
            event.target.value = '';
            return;
        }
        
        Storage.importConfig(file).then(() => {
            this.updateStats();
            this.populateWrongList();
            this.populateFavoriteList();
        }).catch(() => {
            // Error already handled in Storage.importConfig
        }).finally(() => {
            event.target.value = '';
        });
    },
    
    clearWrongQuestions() {
        Utils.showConfirmDialog('清空错题', '确定要清空所有错题吗？此操作不可恢复。', 
            () => {
                AppState.progress.wrong = [];
                Storage.saveProgress();
                this.updateStats();
                this.populateWrongList();
                showToast('错题已清空', TOAST_TYPES.SUCCESS);
            }
        );
    },
    
    clearFavoriteQuestions() {
        Utils.showConfirmDialog('清空收藏', '确定要清空所有收藏吗？此操作不可恢复。',
            () => {
                AppState.progress.favorite = [];
                Storage.saveProgress();
                this.updateStats();
                this.populateFavoriteList();
                showToast('收藏已清空', TOAST_TYPES.SUCCESS);
            }
        );
    },
    
    // 添加题目到收藏
    addToFavorite(questionId) {
        if (!AppState.progress.favorite.includes(questionId)) {
            AppState.progress.favorite.push(questionId);
            Storage.saveProgress();
            showToast('已添加到收藏', TOAST_TYPES.SUCCESS);
        } else {
            const index = AppState.progress.favorite.indexOf(questionId);
            if (index > -1) {
                AppState.progress.favorite.splice(index, 1);
                Storage.saveProgress();
                showToast('已从收藏移除', TOAST_TYPES.SUCCESS);
            }
        }
    },
    
    updateWrongFavButton(btn, questionId) {
        if (!btn) return;
        const isFav = AppState.progress.favorite.includes(questionId);
        btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> ' + (isFav ? '已收藏' : '收藏');
        if (isFav) {
            btn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            btn.style.color = 'white';
        } else {
            btn.style.background = '#f1f5f9';
            btn.style.color = 'var(--text-primary)';
        }
    },

    // 检查题目是否已收藏
    isFavorite(questionId) {
        return AppState.progress.favorite.includes(questionId);
    },
    
    // 切换习题本标签
    switchExerciseTab(tabName) {
        const wrongPanel = document.getElementById('wrong-panel');
        const favoritePanel = document.getElementById('favorite-panel');
        const wrongTab = document.getElementById('tab-wrong');
        const favoriteTab = document.getElementById('tab-favorite');
        
        if (tabName === 'wrong') {
            wrongPanel.style.display = 'block';
            favoritePanel.style.display = 'none';
            wrongTab.className = 'btn btn-primary';
            favoriteTab.className = 'btn btn-secondary';
        } else {
            wrongPanel.style.display = 'none';
            favoritePanel.style.display = 'block';
            wrongTab.className = 'btn btn-secondary';
            favoriteTab.className = 'btn btn-primary';
        }
    },
    
    // 填充收藏列表
    populateFavoriteList() {
        const { favorite } = AppState.progress;
        
        if (favorite.length === 0) {
            UI.elements.exercise.favoriteList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fa-solid fa-star" style="font-size: 3rem; color: var(--warning-color); margin-bottom: 15px; display: block;"></i>
                    暂无收藏记录
                </div>
            `;
        } else {
            UI.elements.exercise.favoriteList.innerHTML = '';
            
            favorite.forEach(qId => {
                const question = questions.find(q => q.id === qId);
                if (question) {
                    const item = document.createElement('div');
                    item.className = 'wrong-item';
                    item.dataset.questionId = qId;
                    item.dataset.searchText = (question.content + ' ' + question.category + ' ' + Utils.getTypeName(question.type)).toLowerCase();
                    item.onclick = () => this.showFavoriteQuestionDetail(question);
                    
                    // 转义HTML，防止XSS
                    const safeContent = Utils.escapeHtml(question.content);
                    const safeTypeName = Utils.escapeHtml(Utils.getTypeName(question.type));
                    const safeCategory = Utils.escapeHtml(question.category);
                    
                    item.innerHTML = `
                        <div class="wrong-item-header">
                            <span class="question-tag ${Utils.getTypeClass(question.type)}">${safeTypeName}</span>
                            <span class="question-tag ${Utils.getCategoryClass(question.category)}">${safeCategory}</span>
                            <span class="question-tag" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;"><i class="fa-solid fa-star"></i> 已收藏</span>
                            <span style="margin-left: auto; color: var(--text-secondary); font-size: 0.8rem;">
                                <i class="fa-solid fa-hand-pointer"></i> 点击查看
                            </span>
                        </div>
                        <div class="wrong-item-content">${safeContent}</div>
                    `;
                    UI.elements.exercise.favoriteList.appendChild(item);
                }
            });
        }
    },
    
    // 显示收藏题目详情
    showFavoriteQuestionDetail(question) {
        // 创建题目详情弹窗
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'favorite-detail-modal';
        
        // 转义HTML，防止XSS
        const safeContent = Utils.escapeHtml(question.content);
        const safeTypeName = Utils.escapeHtml(Utils.getTypeName(question.type));
        const safeCategory = Utils.escapeHtml(question.category);
        const safeAnalysis = Utils.escapeHtml(question.analysis);
        const safeMemoryTip = question.memoryTip ? Utils.escapeHtml(question.memoryTip) : '';
        
        let optionsHtml = '';
        question.options.forEach((option, index) => {
            const isCorrect = index === question.answer;
            const letter = Utils.getAnswerLetter(index);
            const safeOption = Utils.escapeHtml(option);
            optionsHtml += `
                <div style="padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; 
                     background: ${isCorrect ? '#dcfce7' : '#f8fafc'}; 
                     border: 2px solid ${isCorrect ? '#22c55e' : '#e2e8f0'};">
                    <span style="font-weight: 600; color: ${isCorrect ? '#166534' : '#64748b'};">
                        ${letter}. ${safeOption}
                    </span>
                    ${isCorrect ? '<i class="fa-solid fa-check" style="color: #22c55e; margin-left: 8px;"></i>' : ''}
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="display: flex; gap: 8px;">
                        <span class="question-tag ${Utils.getTypeClass(question.type)}">${safeTypeName}</span>
                        <span class="question-tag ${Utils.getCategoryClass(question.category)}">${safeCategory}</span>
                    </div>
                    <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <div style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 10px;">
                    ${safeContent}
                </div>
                <div style="margin-bottom: 20px;">
                    ${optionsHtml}
                </div>
                <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 15px; border-radius: 10px; border-left: 4px solid var(--primary-color);">
                    <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">
                        <i class="fa-solid fa-book-open"></i> 答案解析
                    </div>
                    <div style="color: #1e3a8a; line-height: 1.7;">${safeAnalysis}</div>
                </div>
                ${question.memoryTip ? `
                <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 15px; border-radius: 10px; border-left: 4px solid var(--warning-color); margin-top: 15px;">
                    <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">
                        <i class="fa-solid fa-lightbulb"></i> 记忆技巧
                    </div>
                    <div style="color: #78350f; line-height: 1.7;">${safeMemoryTip}</div>
                </div>
                ` : ''}
                <div style="display: flex; gap: 12px; margin-top: 20px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">关闭</button>
                    <button class="btn btn-warning" id="favorite-detail-fav-btn" onclick="App.removeFromFavorite(${question.id}); App.populateFavoriteList(); this.closest('.modal').remove();" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                        <i class="fa-solid fa-trash"></i> 取消收藏
                    </button>
                    <button class="btn btn-primary" onclick="App.showFavoriteQuestionInStudy(${question.id}); this.closest('.modal').remove();">
                        <i class="fa-solid fa-book-open"></i> 去练习
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },
    
    // 从收藏中移除
    removeFromFavorite(questionId) {
        const index = AppState.progress.favorite.indexOf(questionId);
        if (index > -1) {
            AppState.progress.favorite.splice(index, 1);
            Storage.saveProgress();
            this.populateFavoriteList();
            showToast('已从收藏移除', TOAST_TYPES.SUCCESS);
        }
    },
    
    // 显示收藏题目学习
    showFavoriteQuestionInStudy(questionId) {
        const question = questions.find(q => q.id === questionId);
        if (!question) return;
        
        // 检查是否有正常学习的未完成会话
        const hasNormalSession = AppState.studySession.active && 
                                 AppState.studySession.type === 'normal' &&
                                 AppState.studySession.questionIds.length > 0;
        const remaining = hasNormalSession ? 
            AppState.studySession.questionIds.length - AppState.studySession.currentIndex : 0;
        
        if (hasNormalSession && remaining > 0) {
            if (!confirm(`当前有 ${remaining} 道正常学习题目未完成，确定要切换到单题练习吗？`)) {
                return;
            }
        }
        
        AppState.study.questions = [question];
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        AppState.resetStudy();
        
        // 初始化单题练习会话
        AppState.studySession = {
            active: true,
            type: 'favorite',
            questionIds: [question.id],
            questionOrder: [0],
            visitedIndices: [],
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            questionStates: {}
        };
        
        this.showSection('study');
        StudyModule.loadQuestion();
        // 开始学习计时
        StudyModule.studyStartTime = Date.now();
        showToast('收藏单题练习模式', TOAST_TYPES.INFO);
    },
    
    // 过滤收藏列表
    filterFavoriteQuestions(searchText) {
        const searchLower = searchText.toLowerCase().trim();
        const items = UI.elements.exercise.favoriteList.querySelectorAll('.wrong-item');
        let visibleCount = 0;
        
        items.forEach(item => {
            const searchTextAttr = item.dataset.searchText || '';
            if (!searchLower || searchTextAttr.includes(searchLower)) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // 如果没有搜索结果，显示提示
        const noResultMsg = UI.elements.exercise.favoriteList.querySelector('.no-search-result');
        if (visibleCount === 0 && searchLower) {
            if (!noResultMsg) {
                const msg = document.createElement('div');
                msg.className = 'no-search-result';
                msg.style.cssText = 'text-align: center; padding: 30px; color: var(--text-secondary);';
                msg.innerHTML = `<i class="fa-solid fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>未找到匹配的收藏`;
                UI.elements.exercise.favoriteList.appendChild(msg);
            }
        } else if (noResultMsg) {
            noResultMsg.remove();
        }
    },
    
    // 更新习题本页面统计
    updateExerciseSectionStats() {
        const wrongCount = AppState.progress.wrong.length;
        const favoriteCount = AppState.progress.favorite.length;
        const overlap = questions.filter(q => 
            AppState.progress.wrong.includes(q.id) && AppState.progress.favorite.includes(q.id)
        ).length;
        
        // 更新卡片标题显示
        const exerciseTitle = document.querySelector('#exercise-section .card-title');
        if (exerciseTitle) {
            exerciseTitle.innerHTML = `习题本 <span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: normal;">(${wrongCount}道错题 · ${favoriteCount}道收藏 · ${overlap}道重点)</span>`;
        }
    },
    
    // 智能学习推荐 - 统一学习入口
    updateRecommendation() {
        const { progress } = AppState;
        const wrongCount = progress.wrong.length;
        const favoriteCount = progress.favorite.length;
        const todayDone = progress.todayCount;
        const dailyTarget = CONFIG.DAILY_TARGET;
        
        // 计算各阶段进度
        const phase1Total = CONFIG.PHASES[1].total;
        const phase2Total = CONFIG.PHASES[2].total;
        const phase3Total = CONFIG.PHASES[3].total;
        const phase1Percent = phase1Total > 0 ? (progress.phase1 / phase1Total) * 100 : 0;
        const phase2Percent = phase2Total > 0 ? (progress.phase2 / phase2Total) * 100 : 0;
        const phase3Percent = phase3Total > 0 ? (progress.phase3 / phase3Total) * 100 : 0;
        const totalQuestions = phase1Total + phase2Total + phase3Total;
        const completedQuestions = progress.phase1 + progress.phase2 + progress.phase3;
        const overallPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
        
        const recommendations = [];
        
        // 确定当前应该学习的阶段（基于解锁状态和进度）
        const getCurrentPhase = () => {
            if (phase1Percent < 100) return 1;
            if (phase2Percent < 100) return 2;
            if (phase3Percent < 100) return 3;
            return 0;
        };
        
        const currentPhase = getCurrentPhase();
        
        // 优先级1：错题较多，优先复习错题
        if (wrongCount > 10) {
            recommendations.push({
                priority: 0,
                icon: 'fa-exclamation-circle',
                color: '#ef4444',
                title: '错题较多',
                desc: `当前有 ${wrongCount} 道错题，建议先复习错题巩固知识`,
                action: 'reviewWrong',
                actionText: '复习错题',
                badge: `${wrongCount}道`
            });
        }
        
        // 优先级2：未完成今日目标，给出智能学习建议
        if (todayDone < dailyTarget) {
            const remaining = dailyTarget - todayDone;
            let studyTarget = '继续学习';
            
            if (currentPhase === 1) {
                studyTarget = `基础学习（${Math.round(phase1Percent)}%）`;
            } else if (currentPhase === 2) {
                studyTarget = `强化记忆（${Math.round(phase2Percent)}%）`;
            } else if (currentPhase === 3) {
                studyTarget = `冲刺复习（${Math.round(phase3Percent)}%）`;
            } else {
                studyTarget = `总体进度 ${overallPercent}%`;
            }
            
            recommendations.push({
                priority: 1,
                icon: 'fa-bullseye',
                color: '#10b981',
                title: '今日目标',
                desc: `已完成 ${todayDone}/${dailyTarget} 题，${remaining} 题完成目标 · ${studyTarget}`,
                action: 'smartStudy',
                actionText: '开始学习',
                badge: `${remaining}题`
            });
        }
        
        // 优先级3：收藏题目，复习收藏
        if (favoriteCount > 0 && favoriteCount < 100) {
            recommendations.push({
                priority: 2,
                icon: 'fa-bookmark',
                color: '#f59e0b',
                title: '有收藏题目',
                desc: `您收藏了 ${favoriteCount} 道重点题目，建议复习收藏`,
                action: 'reviewFavorite',
                actionText: '复习收藏',
                badge: `${favoriteCount}道`
            });
        }
        
        // 优先级4：准备充分，可尝试考试
        if (overallPercent >= 80 && wrongCount <= 5) {
            recommendations.push({
                priority: 3,
                icon: 'fa-trophy',
                color: '#8b5cf6',
                title: '准备充分',
                desc: `学习进度 ${overallPercent}%，错题控制在5道以内，可以尝试模拟考试`,
                action: 'startExam',
                actionText: '开始考试',
                badge: '推荐'
            });
        }
        
        // 全部完成时（仅当所有阶段都100%且今日目标也完成）
        const isAllPhaseComplete = currentPhase === 0;
        const isDailyTargetMet = todayDone >= dailyTarget;
        if (isAllPhaseComplete && isDailyTargetMet && recommendations.length === 0) {
            recommendations.push({
                priority: 4,
                icon: 'fa-crown',
                color: '#fbbf24',
                title: '恭喜完成',
                desc: `全部 ${totalQuestions} 题已学习完毕！建议定期复习保持记忆`,
                action: 'reviewWrong',
                actionText: '复习错题',
                badge: '100%'
            });
        } else if (recommendations.length === 0) {
            recommendations.push({
                priority: 4,
                icon: 'fa-rocket',
                color: '#3b82f6',
                title: '继续加油',
                desc: `今日目标已完成！总体进度 ${overallPercent}%，建议继续学习冲刺复习阶段`,
                action: 'smartStudy',
                actionText: '继续学习',
                badge: `${overallPercent}%`
            });
        }
        
        // 按优先级排序（已在上面设置，无需重复排序）
        
        // 渲染推荐内容
        const container = document.getElementById('recommendation-content');
        if (!container) return;
        
        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        recommendations.forEach(rec => {
            const badgeStyle = rec.badge ? 
                `<span style="background: ${rec.color}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600;">${rec.badge}</span>` : '';
            
            html += `
                <div style="display: flex; align-items: center; gap: 12px; padding: 14px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border-left: 4px solid ${rec.color}; transition: transform 0.2s, box-shadow 0.2s;" 
                     onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
                     onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none';">
                    <div style="width: 42px; height: 42px; border-radius: 50%; background: ${rec.color}20; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fa-solid ${rec.icon}" style="color: ${rec.color}; font-size: 1.1rem;"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="font-weight: 600; color: var(--text-primary);">${rec.title}</span>
                            ${badgeStyle}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">${rec.desc}</div>
                    </div>
                    <button class="btn btn-primary" onclick="App.handleRecommendation('${rec.action}')" style="padding: 8px 16px; font-size: 0.85rem; flex-shrink: 0;">
                        ${rec.actionText}
                    </button>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    },
    
    // 处理推荐操作
    handleRecommendation(action) {
        switch (action) {
            case 'reviewWrong':
                this.showSection('study');
                StudyModule.reviewWrong();
                break;
            case 'reviewFavorite':
                this.showSection('study');
                StudyModule.reviewFavorite();
                break;
            case 'smartStudy':
            case 'startStudy':
                AppState.studySession.active = false;
                this.showSection('study');
                StudyModule.smartStartStudy();
                break;
            case 'startExam':
                AppState.resetExam();
                AppState.exam.isStarted = false;
                this.showSection('exam');
                ExamModule.start();
                break;
        }
    },
    
    // 获取学习统计摘要
    getStudySummary() {
        const { progress } = AppState;
        return {
            totalQuestions: questions.length,
            completed: progress.completed,
            accuracy: progress.completed > 0 ? Math.round(((progress.completed - progress.wrong.length) / progress.completed) * 100) : 0,
            wrongCount: progress.wrong.length,
            markedCount: AppState.progress.favorite.length,
            streak: progress.streak,
            todayCount: progress.todayCount,
            totalTime: Math.floor(progress.totalTime)
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 暴露到全局作用域，供HTML onclick调用
    window.App = App;
    App.init();
});
