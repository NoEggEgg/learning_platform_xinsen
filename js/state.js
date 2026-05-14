const AppState = {
    study: {
        currentIndex: 0,
        questions: [],
        selectedAnswer: null,
        isAnswered: false,
        correct: 0,
        wrong: 0,
        isSubmitting: false,
        questionStates: {}    // 保存每道题的答题状态：{ questionId: { selectedAnswer, isAnswered, isCorrect } }
    },

    // 学习会话持久化（保存到localStorage）
    studySession: {
        active: false,
        type: 'normal',       // 会话类型：'normal'=正常学习, 'wrong'=错题复习
        questionIds: [],      // 保存题目ID列表
        currentIndex: 0,
        answeredIds: [],      // 已回答的题目ID
        correctCount: 0,
        wrongCount: 0,
        startedAt: null,
        lastSavedAt: null,
        questionStates: {}    // 保存每道题的答题状态（持久化）
    },

    exam: {
        questions: [],
        currentIndex: 0,
        answers: {},
        startTime: null,
        timer: null,
        isStarted: false,
        wrongQuestions: []
    },
    
    progress: {
        phase1: 0,
        phase2: 0,
        phase3: 0,
        completed: 0,
        totalTime: 0,
        wrong: [],
        favorite: [],         // 收藏的题目ID列表
        streak: 0,
        todayCount: 0,
        lastDate: '',
        answeredIds: [],      // 新增：全局已答题目ID列表（永久记录）
        todayAnsweredIds: [], // 新增：今日已答题目ID列表（每日重置）
        achievements: [],     // 成就系统：已解锁的成就ID列表
        reviewRecords: {},    // 间隔重复学习：复习记录
        learningPath: {},     // 学习路径：各阶段任务进度
        maxAccuracy: 0,       // 成就系统：最高正确率
        wrongReviewed: 0,     // 成就系统：已复习的错题数
        examCompleted: 0,     // 成就系统：已完成的考试次数
        questionStats: {}     // 题目统计：记录每道题的答对次数
    },
    
    resetStudy() {
        this.study.selectedAnswer = null;
        this.study.isAnswered = false;
        this.study.isSubmitting = false;
        // 保留 questionStates，不清除
    },

    resetExam() {
        this.exam.questions = [];
        this.exam.currentIndex = 0;
        this.exam.answers = {};
        this.exam.startTime = null;
        this.exam.isStarted = false;
        this.exam.wrongQuestions = [];
        if (this.exam.timer) {
            clearInterval(this.exam.timer);
            this.exam.timer = null;
        }
    },
    
    resetProgress() {
        this.progress.phase1 = 0;
        this.progress.phase2 = 0;
        this.progress.phase3 = 0;
        this.progress.completed = 0;
        this.progress.totalTime = 0;
        this.progress.wrong = [];
        this.progress.favorite = [];
        this.progress.streak = 0;
        this.progress.todayCount = 0;
        this.progress.lastDate = '';
        this.progress.answeredIds = [];
        this.progress.todayAnsweredIds = [];
        this.progress.achievements = [];
        this.progress.reviewRecords = {};
        this.progress.learningPath = {};
        this.progress.maxAccuracy = 0;
        this.progress.wrongReviewed = 0;
        this.progress.examCompleted = 0;
        this.progress.questionStats = {};
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
}
