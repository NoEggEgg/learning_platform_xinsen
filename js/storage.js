const Storage = {
    saveProgress: Utils.debounce(function() {
        const data = {
            version: 3,
            progress: AppState.progress,
            studySession: AppState.studySession,
            savedAt: Date.now()
        };
        
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('保存进度失败:', error);
            showToast('保存进度失败', TOAST_TYPES.ERROR);
        }
    }, CONFIG.AUTO_SAVE_DELAY),
    
    loadProgress() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!saved) return null;
            
            const data = JSON.parse(saved);
            
            // 数据版本检查和迁移
            const dataVersion = data.version || 1;
            if (dataVersion < 2) {
                // 迁移旧版本数据
                console.log('检测到旧版本数据，正在迁移...');
            }
            
            if (data.progress) {
                // 使用验证函数确保数据完整性
                const validatedProgress = this.validateProgressData(data.progress);
                AppState.progress = { ...AppState.progress, ...validatedProgress };
            }
            
            // 数据迁移：将旧的flashcardMarked迁移到新的favorite系统
            if (data.flashcardMarked && Array.isArray(data.flashcardMarked)) {
                const validMarked = data.flashcardMarked.filter(id => typeof id === 'number');
                if (!AppState.progress.favorite || !Array.isArray(AppState.progress.favorite)) {
                    AppState.progress.favorite = [];
                }
                validMarked.forEach(id => {
                    if (!AppState.progress.favorite.includes(id)) {
                        AppState.progress.favorite.push(id);
                    }
                });
            }

            // 加载学习会话
            if (data.studySession && data.studySession.active) {
                // 验证会话数据
                if (Array.isArray(data.studySession.questionIds) && data.studySession.questionIds.length > 0) {
                    AppState.studySession = {
                        ...AppState.studySession,
                        active: true,
                        questionIds: data.studySession.questionIds.filter(id => typeof id === 'number'),
                        questionOrder: data.studySession.questionOrder || [],
                        visitedIndices: data.studySession.visitedIndices || [],
                        currentIndex: Math.min(data.studySession.currentIndex || 0, data.studySession.questionIds.length - 1),
                        answeredIds: data.studySession.answeredIds || [],
                        correctCount: data.studySession.correctCount || 0,
                        wrongCount: data.studySession.wrongCount || 0,
                        startedAt: data.studySession.startedAt,
                        lastSavedAt: data.studySession.lastSavedAt,
                        questionStates: data.studySession.questionStates || {}
                    };
                    console.log('已恢复学习会话:', AppState.studySession);
                }
            }
            
            // 加载成就数据
            if (typeof Achievement !== 'undefined' && Achievement.loadUnlocked) {
                Achievement.loadUnlocked();
            }
            
            return data;
        } catch (error) {
            console.error('加载进度失败:', error);
            // 如果加载失败，尝试清除损坏的数据
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return null;
        }
    },
    
    clearProgress() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            AppState.resetProgress();
            
            // 重置成就系统
            if (typeof Achievement !== 'undefined' && Achievement.unlocked) {
                Achievement.unlocked.clear();
            }
            
            // 重置学习会话状态
            AppState.studySession = {
                active: false,
                type: 'normal',
                questionIds: [],
                questionOrder: [],
                visitedIndices: [],
                currentIndex: 0,
                answeredIds: [],
                correctCount: 0,
                wrongCount: 0,
                startedAt: null,
                lastSavedAt: null,
                questionStates: {}
            };
            
            // 重置当前学习状态
            AppState.study = {
                currentIndex: 0,
                questions: [],
                selectedAnswer: null,
                isAnswered: false,
                correct: 0,
                wrong: 0,
                isSubmitting: false,
                questionStates: {}
            };
            
            // 重置考试状态
            AppState.exam = {
                questions: [],
                currentIndex: 0,
                answers: {},
                startTime: null,
                timer: null,
                isStarted: false,
                wrongQuestions: []
            };
            
            return true;
        } catch (error) {
            console.error('清除进度失败:', error);
            return false;
        }
    },
    
    exportConfig() {
        const config = {
            version: 3,
            progress: AppState.progress,
            studySession: AppState.studySession,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `学习配置_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('配置文件已导出', TOAST_TYPES.SUCCESS);
    },
    
    importConfig(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    
                    // 验证配置结构
                    if (!config || typeof config !== 'object') {
                        showToast('无效的配置文件：格式错误', TOAST_TYPES.ERROR);
                        reject(new Error('Invalid config format'));
                        return;
                    }
                    
                    // 验证 progress 字段存在
                    if (!config.progress || typeof config.progress !== 'object') {
                        showToast('无效的配置文件：缺少进度数据', TOAST_TYPES.ERROR);
                        reject(new Error('Missing progress data'));
                        return;
                    }
                    
                    // 验证 progress 的必要字段
                    const requiredFields = ['completed', 'wrong', 'streak', 'todayCount', 'totalTime'];
                    const missingFields = requiredFields.filter(field => 
                        typeof config.progress[field] !== 'number' && config.progress[field] !== undefined
                    );
                    if (missingFields.length > 0 && Object.keys(config.progress).length > 0) {
                        console.warn('配置文件缺少部分字段，将使用默认值:', missingFields);
                    }
                    
                    // 安全地合并进度数据
                    const validatedProgress = this.validateProgressData(config.progress);
                    AppState.progress = { ...AppState.progress, ...validatedProgress };
                    
                    // 验证并导入 studySession
                    if (config.studySession && typeof config.studySession === 'object') {
                        AppState.studySession = {
                            active: !!config.studySession.active,
                            type: config.studySession.type === 'wrong' ? 'wrong' : 'normal',
                            questionIds: Array.isArray(config.studySession.questionIds) 
                                ? config.studySession.questionIds.filter(id => typeof id === 'number') 
                                : [],
                            questionOrder: Array.isArray(config.studySession.questionOrder) 
                                ? config.studySession.questionOrder 
                                : [],
                            visitedIndices: Array.isArray(config.studySession.visitedIndices) 
                                ? config.studySession.visitedIndices 
                                : [],
                            currentIndex: typeof config.studySession.currentIndex === 'number' 
                                ? Math.max(0, config.studySession.currentIndex) 
                                : 0,
                            answeredIds: Array.isArray(config.studySession.answeredIds) 
                                ? config.studySession.answeredIds.filter(id => typeof id === 'number') 
                                : [],
                            correctCount: typeof config.studySession.correctCount === 'number' 
                                ? Math.max(0, config.studySession.correctCount) 
                                : 0,
                            wrongCount: typeof config.studySession.wrongCount === 'number' 
                                ? Math.max(0, config.studySession.wrongCount) 
                                : 0,
                            startedAt: config.studySession.startedAt || null,
                            lastSavedAt: config.studySession.lastSavedAt || null,
                            questionStates: config.studySession.questionStates || {}
                        };
                    }
                    
                    // 数据迁移：将旧的flashcardMarked迁移到新的favorite系统
                    if (config.flashcardMarked && Array.isArray(config.flashcardMarked)) {
                        const validMarked = config.flashcardMarked.filter(id => typeof id === 'number');
                        if (!AppState.progress.favorite || !Array.isArray(AppState.progress.favorite)) {
                            AppState.progress.favorite = [];
                        }
                        validMarked.forEach(id => {
                            if (!AppState.progress.favorite.includes(id)) {
                                AppState.progress.favorite.push(id);
                            }
                        });
                    }
                    
                    this.saveProgress();
                    
                    // 重新加载成就数据
                    if (typeof Achievement !== 'undefined' && Achievement.loadUnlocked) {
                        Achievement.loadUnlocked();
                    }
                    
                    showToast('配置文件已导入', TOAST_TYPES.SUCCESS);
                    resolve(config);
                } catch (error) {
                    console.error('导入配置失败:', error);
                    showToast('配置文件解析失败', TOAST_TYPES.ERROR);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                showToast('文件读取失败', TOAST_TYPES.ERROR);
                reject(new Error('File read error'));
            };
            
            reader.readAsText(file);
        });
    },
    
    validateProgressData(progress) {
        const validated = {};
        const MAX_VALUES = {
            completed: 100000,     // 最大完成题数
            streak: 3650,          // 最大连续天数（10年）
            todayCount: 1000,      // 最大每日题数
            totalTime: 525600,     // 最大学习时间（365天 * 24小时 * 60分钟）
            phase: 100000,         // 最大阶段题数
            wrong: 10000,          // 最大错题数
            wrongId: 1000000000    // 题目ID最大值
        };
        
        // 数据迁移：旧格式 -> 新格式
        if (progress.completed && (!progress.answeredIds || !Array.isArray(progress.answeredIds))) {
            console.log('数据迁移：初始化 answeredIds...');
            // 旧数据无法准确恢复已答题目，只能从当前 completed 开始计数
            progress.answeredIds = [];
        }
        if (!progress.todayAnsweredIds || !Array.isArray(progress.todayAnsweredIds)) {
            progress.todayAnsweredIds = [];
        }
        
        // 验证 answeredIds (全局已答题目)
        if (Array.isArray(progress.answeredIds)) {
            validated.answeredIds = progress.answeredIds
                .filter(id => typeof id === 'number' && id >= 0 && id <= MAX_VALUES.wrongId)
                .filter((id, index, arr) => arr.indexOf(id) === index);  // 去重
        }
        
        // 验证 todayAnsweredIds (今日已答题目)
        if (Array.isArray(progress.todayAnsweredIds)) {
            validated.todayAnsweredIds = progress.todayAnsweredIds
                .filter(id => typeof id === 'number' && id >= 0 && id <= MAX_VALUES.wrongId)
                .filter((id, index, arr) => arr.indexOf(id) === index);  // 去重
        }
        
        // completed 和 todayCount 从数组长度计算，不使用旧数据
        validated.completed = validated.answeredIds ? validated.answeredIds.length : 0;
        validated.todayCount = validated.todayAnsweredIds ? validated.todayAnsweredIds.length : 0;
        
        if (typeof progress.streak === 'number' && progress.streak >= 0) {
            validated.streak = Math.min(Math.floor(progress.streak), MAX_VALUES.streak);
        }
        if (typeof progress.totalTime === 'number' && progress.totalTime >= 0) {
            validated.totalTime = Math.min(Math.max(0, progress.totalTime), MAX_VALUES.totalTime);
        }
        
        // 验证阶段进度
        ['phase1', 'phase2', 'phase3'].forEach(phase => {
            if (typeof progress[phase] === 'number' && progress[phase] >= 0) {
                validated[phase] = Math.min(Math.floor(progress[phase]), MAX_VALUES.phase);
            }
        });
        
        // 验证错题数组
        if (Array.isArray(progress.wrong)) {
            validated.wrong = progress.wrong
                .filter(id => typeof id === 'number' && id >= 0 && id <= MAX_VALUES.wrongId)
                .filter((id, index, arr) => arr.indexOf(id) === index)
                .slice(0, MAX_VALUES.wrong);
        }
        
        // 验证收藏数组
        if (Array.isArray(progress.favorite)) {
            validated.favorite = progress.favorite
                .filter(id => typeof id === 'number' && id >= 0 && id <= MAX_VALUES.wrongId)
                .filter((id, index, arr) => arr.indexOf(id) === index)
                .slice(0, MAX_VALUES.wrong);
        }
        
        // 验证日期格式
        if (progress.lastDate && typeof progress.lastDate === 'string') {
            const dateRegex = /^\w{3}\s\w{3}\s\d{1,2}\s\d{4}$|^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(progress.lastDate)) {
                validated.lastDate = progress.lastDate;
            }
        }
        
        // 验证成就系统字段
        if (Array.isArray(progress.achievements)) {
            validated.achievements = progress.achievements
                .filter(id => typeof id === 'string' || typeof id === 'number');
        }
        if (typeof progress.maxAccuracy === 'number' && progress.maxAccuracy >= 0 && progress.maxAccuracy <= 100) {
            validated.maxAccuracy = progress.maxAccuracy;
        }
        if (typeof progress.wrongReviewed === 'number' && progress.wrongReviewed >= 0) {
            validated.wrongReviewed = Math.min(progress.wrongReviewed, 100000);
        }
        if (typeof progress.examCompleted === 'number' && progress.examCompleted >= 0) {
            validated.examCompleted = Math.min(progress.examCompleted, 100000);
        }
        
        // 验证间隔重复学习记录
        if (progress.reviewRecords && typeof progress.reviewRecords === 'object') {
            validated.reviewRecords = {};
            Object.keys(progress.reviewRecords).forEach(key => {
                const id = parseInt(key);
                if (!isNaN(id) && progress.reviewRecords[key]) {
                    validated.reviewRecords[id] = progress.reviewRecords[key];
                }
            });
        }
        
        // 验证学习路径数据
        if (progress.learningPath && typeof progress.learningPath === 'object') {
            validated.learningPath = progress.learningPath;
        }
        
        // 验证题目统计数据
        if (progress.questionStats && typeof progress.questionStats === 'object') {
            validated.questionStats = {};
            Object.keys(progress.questionStats).forEach(key => {
                const id = parseInt(key);
                const stat = progress.questionStats[key];
                if (!isNaN(id) && typeof stat === 'object' && stat) {
                    validated.questionStats[id] = {
                        correctCount: typeof stat.correctCount === 'number' ? Math.max(0, stat.correctCount) : 0,
                        wrongCount: typeof stat.wrongCount === 'number' ? Math.max(0, stat.wrongCount) : 0,
                        lastAnswerTime: typeof stat.lastAnswerTime === 'number' ? stat.lastAnswerTime : null
                    };
                }
            });
        }
        
        // 内部标记（如果存在也保留）
        if (typeof progress._streakUpdated === 'boolean') {
            validated._streakUpdated = progress._streakUpdated;
        }
        
        return validated;
    },
    
    // 获取进度数据（供其他模块使用）
    getProgress() {
        return {
            progress: AppState.progress
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
