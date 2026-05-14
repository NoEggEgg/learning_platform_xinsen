// 常量定义（放在CONFIG之前，因为CONFIG需要使用它们）
const CATEGORIES = {
    LAW: '法律类',
    REGULATION: '法规类',
    STANDARD: '国标类',
    ALL: ['法律类', '法规类', '国标类']
};

const QUESTION_TYPES = {
    SINGLE: 'single',
    JUDGE: 'judge',
    MULTIPLE: 'multiple',
    ALL: ['single', 'judge', 'multiple']
};

const TOAST_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

const STORAGE_KEYS = {
    PROGRESS: 'studyProgress'
};

const CONFIG = {
    PHASES: {
        1: { name: '基础学习', total: 0, category: CATEGORIES.LAW },
        2: { name: '强化记忆', total: 0, category: CATEGORIES.REGULATION },
        3: { name: '冲刺复习', total: 0, category: CATEGORIES.STANDARD }
    },
    DAILY_TARGET: 50,
    EXAM_DURATION: 60 * 60,      // 60分钟
    EXAM_QUESTION_COUNT: 60,      // 60道题
    EXAM_PASS_SCORE: 60,          // 60分合格
    EXAM_TOTAL_SCORE: 100,        // 总分100分
    STORAGE_KEY: 'studyProgress',
    AUTO_SAVE_DELAY: 1000,
    TOAST_DURATION: 3000,
    FLASHCARD_AUTO_PLAY_DELAY: 2000,
    FLASHCARD_FLIP_DELAY: 3000
};

// Initialize phase totals based on actual question data
if (typeof questions !== 'undefined' && Array.isArray(questions)) {
    CONFIG.PHASES[1].total = questions.filter(q => q.category === CATEGORIES.LAW).length || 300;
    CONFIG.PHASES[2].total = questions.filter(q => q.category === CATEGORIES.REGULATION).length || 200;
    CONFIG.PHASES[3].total = questions.filter(q => q.category === CATEGORIES.STANDARD).length || 200;
}

// 浏览器环境暴露到全局
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.CATEGORIES = CATEGORIES;
    window.QUESTION_TYPES = QUESTION_TYPES;
    window.TOAST_TYPES = TOAST_TYPES;
    window.STORAGE_KEYS = STORAGE_KEYS;
}

// CommonJS环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, CATEGORIES, QUESTION_TYPES, TOAST_TYPES, STORAGE_KEYS };
}
