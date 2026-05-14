/**
 * 智能复习系统 - SpacedRepetition.js
 * 基于艾宾浩斯遗忘曲线，智能安排复习时间
 */

const SpacedRepetition = {
    // 艾宾浩斯遗忘曲线复习间隔（天数）
    intervals: [1, 2, 4, 7, 15, 30, 60, 120], // 记忆周期
    
    // 复习记录
    reviewRecords: {},
    
    // 记忆难度等级
    difficultyLevels: {
        easy: { multiplier: 1.5, nextInterval: 2 },   // 简单：延长间隔
        medium: { multiplier: 1.0, nextInterval: 1 }, // 中等：正常间隔
        hard: { multiplier: 0.5, nextInterval: 0 }    // 困难：缩短间隔
    },
    
    /**
     * 初始化智能复习系统
     */
    init() {
        this.loadReviewRecords();
        this.scheduleReviews();
    },
    
    /**
     * 加载复习记录
     */
    loadReviewRecords() {
        if (AppState.progress.reviewRecords) {
            this.reviewRecords = AppState.progress.reviewRecords;
        }
    },
    
    /**
     * 保存复习记录
     */
    saveReviewRecords() {
        AppState.progress.reviewRecords = this.reviewRecords;
        Storage.saveProgress();
    },
    
    /**
     * 记录答题结果
     */
    recordAnswer(questionId, isCorrect, responseTime = 0) {
        if (!this.reviewRecords[questionId]) {
            this.reviewRecords[questionId] = {
                id: questionId,
                repetitions: 0,
                easeFactor: 2.5, // 初始难度因子
                interval: 0,
                nextReviewDate: null,
                history: []
            };
        }
        
        const record = this.reviewRecords[questionId];
        
        // 记录历史
        record.history.push({
            date: new Date().toISOString(),
            isCorrect,
            responseTime
        });
        
        // 保持历史记录不超过20条
        if (record.history.length > 20) {
            record.history = record.history.slice(-20);
        }
        
        // 更新复习间隔
        this.updateInterval(questionId, isCorrect);
        
        this.saveReviewRecords();
    },
    
    /**
     * 根据答题结果更新复习间隔
     */
    updateInterval(questionId, isCorrect) {
        const record = this.reviewRecords[questionId];
        
        if (isCorrect) {
            // 答对了，增加重复次数，延长间隔
            record.repetitions++;
            
            if (record.repetitions === 1) {
                record.interval = 1;
            } else if (record.repetitions === 2) {
                record.interval = 2;
            } else {
                record.interval = Math.round(record.interval * record.easeFactor);
            }
            
            // 增加难度因子（最多3.0）
            record.easeFactor = Math.min(3.0, record.easeFactor + 0.1);
        } else {
            // 答错了，重置重复次数，缩短间隔
            record.repetitions = 1;
            record.interval = 1;
            
            // 降低难度因子（最少1.3）
            record.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
        }
        
        // 计算下次复习日期
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + record.interval);
        record.nextReviewDate = nextDate.toISOString().split('T')[0];
    },
    
    /**
     * 安排复习计划
     */
    scheduleReviews() {
        const today = new Date().toISOString().split('T')[0];
        
        // 获取今天需要复习的题目
        const dueReviews = this.getDueReviews();
        
        // 获取需要强化的薄弱题目
        const weakQuestions = this.getWeakQuestions();
        
        // 更新复习提醒
        this.updateReviewReminder(dueReviews, weakQuestions);
    },
    
    /**
     * 获取今天需要复习的题目
     */
    getDueReviews() {
        const today = new Date().toISOString().split('T')[0];
        const questionMap = new Map(questions.map(q => [q.id, q]));
        
        return Object.keys(this.reviewRecords)
            .filter(id => {
                const record = this.reviewRecords[id];
                return record.nextReviewDate && record.nextReviewDate <= today;
            })
            .map(id => {
                const question = questionMap.get(parseInt(id));
                return {
                    id: parseInt(id),
                    question,
                    record: this.reviewRecords[id],
                    overdue: this.calculateOverdueDays(this.reviewRecords[id].nextReviewDate)
                };
            })
            .filter(item => item.question)
            .sort((a, b) => {
                // 优先显示过期的题目
                return b.overdue - a.overdue;
            });
    },
    
    /**
     * 获取薄弱题目（错误次数多的）
     */
    getWeakQuestions(limit = 10) {
        const questionMap = new Map(questions.map(q => [q.id, q]));
        
        return Object.keys(this.reviewRecords)
            .map(id => {
                const record = this.reviewRecords[id];
                const question = questionMap.get(parseInt(id));
                
                // 计算错误率
                const errors = record.history.filter(h => !h.isCorrect).length;
                const total = record.history.length;
                const errorRate = total > 0 ? errors / total : 0;
                
                return {
                    id: parseInt(id),
                    question,
                    record,
                    errorRate,
                    errors,
                    total
                };
            })
            .filter(item => item.question && item.total > 0)
            .sort((a, b) => b.errorRate - a.errorRate)
            .slice(0, limit);
    },
    
    /**
     * 计算过期天数
     */
    calculateOverdueDays(nextReviewDate) {
        const today = new Date();
        const reviewDate = new Date(nextReviewDate);
        const diffTime = today - reviewDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    },
    
    /**
     * 获取推荐复习的题目
     */
    getRecommendedQuestions(count = 10) {
        const dueReviews = this.getDueReviews();
        const weakQuestions = this.getWeakQuestions();
        
        // 合并并去重
        const allQuestions = [...dueReviews];
        
        weakQuestions.forEach(wq => {
            if (!allQuestions.find(q => q.id === wq.id)) {
                allQuestions.push(wq);
            }
        });
        
        // 按优先级排序
        allQuestions.sort((a, b) => {
            // 过期越久越优先
            const aOverdue = a.overdue || 0;
            const bOverdue = b.overdue || 0;
            
            if (aOverdue !== bOverdue) return bOverdue - aOverdue;
            
            // 错误率高的优先
            const aErrorRate = a.errorRate || (a.record ? 
                a.record.history.filter(h => !h.isCorrect).length / a.record.history.length : 0);
            const bErrorRate = b.errorRate || (b.record ?
                b.record.history.filter(h => !h.isCorrect).length / b.record.history.length : 0);
            
            return bErrorRate - aErrorRate;
        });
        
        return allQuestions.slice(0, count);
    },
    
    /**
     * 更新复习提醒
     */
    updateReviewReminder(dueReviews, weakQuestions) {
        // 可以更新界面上的复习提醒
        const reminderElement = document.getElementById('review-reminder');
        if (reminderElement) {
            const total = dueReviews.length + weakQuestions.length;
            const uniqueCount = new Set([...dueReviews.map(d => d.id), ...weakQuestions.map(w => w.id)]).size;
            
            if (uniqueCount > 0) {
                reminderElement.innerHTML = `
                    <div class="review-reminder-content" onclick="SpacedRepetition.startReview()">
                        <i class="fa-solid fa-clock"></i>
                        <span>今日复习: <span id="review-count"></span>道题目</span>
                        <button class="btn btn-sm btn-warning">开始复习</button>
                    </div>
                `;
                document.getElementById('review-count').textContent = uniqueCount;
                reminderElement.classList.add('show');
            } else {
                reminderElement.innerHTML = '';
                reminderElement.classList.remove('show');
            }
        }
    },
    
    /**
     * 开始复习
     */
    startReview() {
        const recommended = this.getRecommendedQuestions(10);
        
        if (recommended.length === 0) {
            Utils.showToast('今天没有需要复习的题目', 'info');
            return;
        }
        
        // 跳转到学习页面进行复习
        App.showSection('study');
        
        // 初始化学习状态
        AppState.study.questions = recommended.map(r => r.question).filter(Boolean);
        AppState.study.currentIndex = 0;
        AppState.study.correct = 0;
        AppState.study.wrong = 0;
        AppState.study.isReviewMode = true;
        AppState.resetStudy();
        
        // 初始化已回答题目集合
        StudyModule._answeredQuestions = new Set();
        
        // 初始化学习会话
        const questionIds = AppState.study.questions.map(q => q.id);
        AppState.studySession = {
            active: true,
            type: 'review',  // 标记为复习模式
            questionIds: questionIds,
            currentIndex: 0,
            answeredIds: [],
            correctCount: 0,
            wrongCount: 0,
            startedAt: Date.now(),
            lastSavedAt: Date.now(),
            questionStates: {}
        };
        
        StudyModule.loadQuestion();
        
        // 开始学习计时
        StudyModule.studyStartTime = Date.now();
        Storage.saveProgress();
        
        Utils.showToast(`开始复习 ${AppState.study.questions.length} 道题目`, 'success');
    },
    
    /**
     * 获取学习统计
     */
    getStats() {
        const total = Object.keys(this.reviewRecords).length;
        const mastered = Object.keys(this.reviewRecords).filter(id => {
            return this.reviewRecords[id].repetitions >= 5;
        }).length;
        
        const learning = total - mastered;
        
        const dueToday = this.getDueReviews().length;
        
        return {
            total,
            mastered,
            learning,
            dueToday,
            retention: total > 0 ? Math.round((mastered / total) * 100) : 0
        };
    },
    
    /**
     * 渲染复习统计
     */
    renderStats() {
        const stats = this.getStats();
        
        const container = document.getElementById('spaced-repetition-stats');
        if (!container) return;
        
        container.innerHTML = `
            <div class="sr-stats">
                <div class="sr-stat-item">
                    <div class="sr-stat-value">${stats.total}</div>
                    <div class="sr-stat-label">已学习</div>
                </div>
                <div class="sr-stat-item">
                    <div class="sr-stat-value">${stats.mastered}</div>
                    <div class="sr-stat-label">已掌握</div>
                </div>
                <div class="sr-stat-item">
                    <div class="sr-stat-value">${stats.learning}</div>
                    <div class="sr-stat-label">学习中</div>
                </div>
                <div class="sr-stat-item highlight">
                    <div class="sr-stat-value">${stats.dueToday}</div>
                    <div class="sr-stat-label">待复习</div>
                </div>
            </div>
        `;
    }
};


