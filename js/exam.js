const ExamModule = {
    start() {
        if (AppState.exam.isStarted) return;
        
        AppState.exam.isStarted = true;
        AppState.exam.questions = Utils.shuffleArray(questions).slice(0, CONFIG.EXAM_QUESTION_COUNT);
        AppState.exam.currentIndex = 0;
        AppState.exam.answers = {};
        AppState.exam.startTime = Date.now();
        
        let timeRemaining = CONFIG.EXAM_DURATION;
        AppState.exam.timer = setInterval(() => {
            timeRemaining--;
            UI.elements.exam.time.textContent = Utils.formatTime(timeRemaining);
            
            // 时间少于10分钟时显示警告样式
            if (timeRemaining <= 600) {
                UI.elements.exam.time.style.color = '#f59e0b';
                UI.elements.exam.time.style.fontWeight = 'bold';
            }
            // 时间少于5分钟时显示紧急警告
            if (timeRemaining <= 300) {
                UI.elements.exam.time.style.color = '#ef4444';
            }
            // 最后1分钟闪烁提示
            if (timeRemaining <= 60) {
                UI.elements.exam.time.style.animation = 'pulse 1s infinite';
            }
            
            if (timeRemaining <= 0) {
                this.end();
            }
        }, 1000);
        
        // 更新考试信息显示
        UI.elements.exam.total.textContent = AppState.exam.questions.length;
        UI.elements.exam.totalScore.textContent = CONFIG.EXAM_TOTAL_SCORE;
        UI.elements.exam.passScore.textContent = CONFIG.EXAM_PASS_SCORE;
        
        this.loadQuestion();
        
        UI.elements.exam.startBtn.style.display = 'none';
        UI.elements.exam.startBtn.textContent = '考试中';
        UI.elements.exam.prevBtn.disabled = false;
        UI.elements.exam.nextBtn.disabled = false;
        UI.elements.exam.endBtn.style.display = 'block';
        
        this.updateAnsweredCount();
        
        showToast(`模拟考试开始，共 ${CONFIG.EXAM_QUESTION_COUNT} 道题，总分 ${CONFIG.EXAM_TOTAL_SCORE} 分，时间 ${Math.floor(CONFIG.EXAM_DURATION / 60)} 分钟，${CONFIG.EXAM_PASS_SCORE} 分合格`, TOAST_TYPES.INFO);
    },
    
    loadQuestion() {
        const { currentIndex, questions: examQuestions, answers } = AppState.exam;
        const question = examQuestions[currentIndex];
        
        UI.elements.exam.questionType.textContent = Utils.getTypeName(question.type);
        UI.elements.exam.questionType.className = 'question-tag ' + Utils.getTypeClass(question.type);
        
        UI.elements.exam.questionCategory.textContent = question.category;
        UI.elements.exam.questionCategory.className = 'question-tag ' + Utils.getCategoryClass(question.category);
        
        UI.elements.exam.questionNumber.textContent = `第 ${currentIndex + 1}/${examQuestions.length} 题`;
        UI.elements.exam.questionContent.textContent = question.content;
        
        UI.elements.exam.current.textContent = currentIndex + 1;
        const progressPercent = ((currentIndex + 1) / examQuestions.length) * 100;
        UI.elements.exam.progressFill.style.width = progressPercent + '%';
        
        UI.elements.exam.prevBtn.disabled = currentIndex === 0;
        
        this.renderOptions(question, answers[currentIndex]);
        this.updateAnsweredCount();
    },
    
    updateAnsweredCount() {
        const answeredEl = document.getElementById('exam-answered-count');
        if (answeredEl) {
            const total = AppState.exam.questions.length;
            const answered = Object.keys(AppState.exam.answers).length;
            const remaining = total - answered;
            answeredEl.innerHTML = `<i class="fa-solid fa-check-circle" style="color: var(--success-color);"></i> 已答 <strong>${answered}</strong> 题，剩余 <strong>${remaining}</strong> 题`;
        }
    },
    
    renderOptions(question, savedAnswer) {
        Utils.renderOptions(
            UI.elements.exam.optionsList, 
            question, 
            (index) => this.selectOption(index),
            savedAnswer
        );
    },
    
    handleOptionClick(event) {
        const index = parseInt(event.currentTarget.dataset.index);
        this.selectOption(index);
    },
    
    selectOption(index) {
        AppState.exam.answers[AppState.exam.currentIndex] = index;
        
        const options = UI.elements.exam.optionsList.querySelectorAll('.option-item');
        options.forEach((option, i) => {
            option.classList.remove('selected');
            if (i === index) {
                option.classList.add('selected');
            }
        });
        
        this.updateAnsweredCount();
    },
    
    prevQuestion() {
        if (AppState.exam.currentIndex > 0) {
            AppState.exam.currentIndex--;
            this.loadQuestion();
        }
    },
    
    nextQuestion() {
        const isLastQuestion = AppState.exam.currentIndex >= AppState.exam.questions.length - 1;
        
        if (isLastQuestion) {
            // 最后一题，提示提交答卷
            showToast('已是最后一题，请点击"提交答卷"完成考试', TOAST_TYPES.INFO);
            return;
        }
        
        AppState.exam.currentIndex++;
        this.loadQuestion();
    },
    
    submitExam() {
        const unanswered = AppState.exam.questions.length - Object.keys(AppState.exam.answers).length;
        if (unanswered > 0) {
            Utils.showConfirmDialog('提交考试', `还有 <strong>${unanswered}</strong> 道题未作答，确定要提交吗？`,
                () => this.end()
            );
            return;
        }
        this.end();
    },
    
    end() {
        if (AppState.exam.timer) {
            clearInterval(AppState.exam.timer);
            AppState.exam.timer = null;
        }
        
        AppState.exam.isStarted = false;
        
        let correct = 0;
        const wrongQuestions = [];
        
        AppState.exam.questions.forEach((question, index) => {
            if (AppState.exam.answers[index] === question.answer) {
                correct++;
            } else {
                // 将答错的题目加入错题本（使用Set防止重复）
                if (!this._wrongSet) {
                    this._wrongSet = new Set(AppState.progress.wrong);
                }
                if (!this._wrongSet.has(question.id)) {
                    this._wrongSet.add(question.id);
                    AppState.progress.wrong.push(question.id);
                }
                wrongQuestions.push(question);
            }
        });
        
        const total = AppState.exam.questions.length;
        // 计算分数（总分100分）
        const score = Math.round((correct / total) * CONFIG.EXAM_TOTAL_SCORE);
        const isPassed = score >= CONFIG.EXAM_PASS_SCORE;
        
        // 更新考试完成次数
        AppState.progress.examCompleted++;
        
        // 保存错题本和进度
        Storage.saveProgress();
        App.updateStats();
        App.populateWrongList();
        
        // 根据分数决定弹窗类型和消息
        let modalType = 'warning';
        let title, text;
        
        if (score >= 90) {
            modalType = 'success';
            title = '🎉 优秀！';
            text = `恭喜你取得 ${score} 分的优异成绩！继续保持！`;
        } else if (isPassed) {
            modalType = 'success';
            title = '✅ 考试通过！';
            text = `恭喜你通过了模拟考试，得分 ${score} 分！`;
        } else {
            title = '📚 需要加强复习';
            text = `考试成绩 ${score} 分，未达到 ${CONFIG.EXAM_PASS_SCORE} 分合格线，建议多做练习巩固知识。`;
        }
        
        const wrongCount = total - correct;
        if (wrongCount > 0) {
            UI.showExamResultModal({
                correct,
                wrong: wrongCount,
                score,
                accuracy: Math.round((correct / total) * 100),
                isPassed,
                title,
                text,
                hasWrong: wrongCount > 0
            });
        } else {
            UI.showModal(modalType, {
                correct,
                wrong: wrongCount,
                score,
                accuracy: 100,
                isPassed: true,
                title,
                text
            });
        }
        
        // 重置考试状态
        AppState.resetExam();
        
        UI.elements.exam.startBtn.style.display = 'block';
        UI.elements.exam.startBtn.textContent = '开始考试';
        UI.elements.exam.prevBtn.disabled = true;
        UI.elements.exam.nextBtn.disabled = true;
        UI.elements.exam.endBtn.style.display = 'none';
        UI.elements.exam.time.textContent = Utils.formatTime(CONFIG.EXAM_DURATION);
        UI.elements.exam.time.style.color = '#ef4444';
        UI.elements.exam.progressFill.style.width = '0%';
        UI.elements.exam.current.textContent = '0';
        UI.elements.exam.total.textContent = CONFIG.EXAM_QUESTION_COUNT;
        UI.elements.exam.questionContent.textContent = '点击"开始考试"按钮开始模拟考试';
        UI.elements.exam.questionType.textContent = '单选题';
        UI.elements.exam.questionType.className = 'question-tag tag-single';
        UI.elements.exam.questionCategory.textContent = '法律类';
        UI.elements.exam.questionCategory.className = 'question-tag tag-law';
        UI.elements.exam.questionNumber.textContent = '第 1/' + CONFIG.EXAM_QUESTION_COUNT + ' 题';
        UI.elements.exam.optionsList.innerHTML = '';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExamModule;
}
