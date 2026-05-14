/**
 * 成就系统 - Achievement.js
 * 游戏化学习体验，提高学习积极性
 */

const Achievement = {
    // 成就定义
    achievements: {
        // 学习成就
        'first_study': {
            id: 'first_study',
            name: '🌟 新手入门',
            description: '完成第一次学习',
            icon: 'fa-star',
            color: '#f1c40f',
            condition: (data) => data.completed >= 1,
            reward: '解锁更多学习功能'
        },
        'study_10': {
            id: 'study_10',
            name: '📚 初露锋芒',
            description: '累计完成10道题目',
            icon: 'fa-book',
            color: '#3498db',
            condition: (data) => data.completed >= 10
        },
        'study_50': {
            id: 'study_50',
            name: '🎓 学有小成',
            description: '累计完成50道题目',
            icon: 'fa-graduation-cap',
            color: '#9b59b6',
            condition: (data) => data.completed >= 50
        },
        'study_100': {
            id: 'study_100',
            name: '🏆 学富五车',
            description: '累计完成100道题目',
            icon: 'fa-trophy',
            color: '#e67e22',
            condition: (data) => data.completed >= 100
        },
        
        // 连续学习成就
        'streak_3': {
            id: 'streak_3',
            name: '🔥 小试牛刀',
            description: '连续学习3天',
            icon: 'fa-fire',
            color: '#e74c3c',
            condition: (data) => data.streak >= 3
        },
        'streak_7': {
            id: 'streak_7',
            name: '📖 好学不倦',
            description: '连续学习7天',
            icon: 'fa-calendar-check',
            color: '#27ae60',
            condition: (data) => data.streak >= 7
        },
        'streak_30': {
            id: 'streak_30',
            name: '👑 持之以恒',
            description: '连续学习30天',
            icon: 'fa-crown',
            color: '#f39c12',
            condition: (data) => data.streak >= 30
        },
        
        // 正确率成就
        'accuracy_100': {
            id: 'accuracy_100',
            name: '🎯 精准打击',
            description: '正确率100%完成一套题',
            icon: 'fa-bullseye',
            color: '#2ecc71',
            condition: (data) => data.maxAccuracy >= 100
        },
        'accuracy_90': {
            id: 'accuracy_90',
            name: '💯 十拿九稳',
            description: '单次正确率达到90%以上',
            icon: 'fa-check-double',
            color: '#3498db',
            condition: (data) => data.maxAccuracy >= 90
        },
        
        // 时间成就
        'time_60': {
            id: 'time_60',
            name: '⏰ 勤学苦练',
            description: '累计学习60分钟',
            icon: 'fa-clock',
            color: '#95a5a6',
            condition: (data) => data.totalTime >= 60
        },
        'time_500': {
            id: 'time_500',
            name: '⏳ 持之以恒',
            description: '累计学习500分钟',
            icon: 'fa-hourglass-half',
            color: '#8e44ad',
            condition: (data) => data.totalTime >= 500
        },
        'time_1000': {
            id: 'time_1000',
            name: '🏅 坚持不懈',
            description: '累计学习1000分钟',
            icon: 'fa-medal',
            color: '#e74c3c',
            condition: (data) => data.totalTime >= 1000
        },
        
        // 错题成就
        'wrong_reviewed': {
            id: 'wrong_reviewed',
            name: '📝 知错能改',
            description: '复习完成一道错题',
            icon: 'fa-edit',
            color: '#e67e22',
            condition: (data) => data.wrongReviewed >= 1
        },
        
        // 收藏成就
        'favorite_10': {
            id: 'favorite_10',
            name: '🔖 收藏达人',
            description: '收藏10道题目',
            icon: 'fa-bookmark',
            color: '#3498db',
            condition: (data) => data.favoriteCount >= 10
        },
        'favorite_master': {
            id: 'favorite_master',
            name: '⭐ 收藏大师',
            description: '收藏50道题目',
            icon: 'fa-star',
            color: '#9b59b6',
            condition: (data) => data.favoriteCount >= 50
        },
        
        // 考试成就
        'exam_pass': {
            id: 'exam_pass',
            name: '📋 初试身手',
            description: '完成第一次模拟考试',
            icon: 'fa-file-alt',
            color: '#1abc9c',
            condition: (data) => data.examCompleted >= 1
        },
        
        // 阶段成就
        'phase_complete_1': {
            id: 'phase_complete_1',
            name: '📖 第一阶段',
            description: '完成基础学习阶段',
            icon: 'fa-book-open',
            color: '#3498db',
            condition: (data) => data.phase1Complete === true
        },
        'phase_complete_2': {
            id: 'phase_complete_2',
            name: '🎯 第二阶段',
            description: '完成强化记忆阶段',
            icon: 'fa-brain',
            color: '#9b59b6',
            condition: (data) => data.phase2Complete === true
        },
        'phase_complete_3': {
            id: 'phase_complete_3',
            name: '🏆 第三阶段',
            description: '完成冲刺复习阶段',
            icon: 'fa-trophy',
            color: '#e74c3c',
            condition: (data) => data.phase3Complete === true
        }
    },
    
    // 已解锁的成就
    unlocked: new Set(),
    
    /**
     * 初始化成就系统
     */
    init() {
        this.loadUnlocked();
        this.renderAchievements();
        this.checkAchievements();
    },
    
    /**
     * 加载已解锁的成就
     */
    loadUnlocked() {
        if (AppState.progress && Array.isArray(AppState.progress.achievements)) {
            const validIds = AppState.progress.achievements
                .filter(id => typeof id === 'string' || typeof id === 'number')
                .filter(id => this.achievements[id]); // 只保留有效的成就ID
            this.unlocked = new Set(validIds);
        } else {
            this.unlocked = new Set();
        }
    },
    
    /**
     * 保存已解锁的成就
     */
    saveUnlocked() {
        AppState.progress.achievements = Array.from(this.unlocked);
        Storage.saveProgress();
    },
    
    /**
     * 解锁成就
     */
    unlock(achievementId) {
        if (this.unlocked.has(achievementId)) return false;
        
        const achievement = this.achievements[achievementId];
        if (!achievement) return false;
        
        this.unlocked.add(achievementId);
        this.saveUnlocked();
        
        // 显示解锁动画
        this.showUnlockAnimation(achievement);
        
        return true;
    },
    
    /**
     * 检查成就是否达成
     */
    checkAchievements() {
        const { progress } = AppState;
        const data = {
            completed: progress.completed || 0,
            streak: progress.streak || 0,
            totalTime: progress.totalTime || 0,
            maxAccuracy: progress.maxAccuracy || 0,
            wrongReviewed: progress.wrongReviewed || 0,
            favoriteCount: AppState.progress.favorite.length || 0,
            examCompleted: progress.examCompleted || 0,
            phase1Complete: progress.phase1 >= CONFIG.PHASES[1].total,
            phase2Complete: progress.phase2 >= CONFIG.PHASES[2].total,
            phase3Complete: progress.phase3 >= CONFIG.PHASES[3].total
        };
        
        // 检查所有成就
        Object.keys(this.achievements).forEach(id => {
            if (!this.unlocked.has(id)) {
                const achievement = this.achievements[id];
                if (achievement.condition(data)) {
                    this.unlock(id);
                }
            }
        });
    },
    
    /**
     * 显示解锁动画
     */
    showUnlockAnimation(achievement) {
        const container = document.createElement('div');
        container.className = 'achievement-unlock';
        container.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon" style="background: ${achievement.color}">
                    <i class="fa-solid ${achievement.icon}"></i>
                </div>
                <div class="achievement-info">
                    <div class="achievement-label">成就解锁!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 添加动画样式
        const style = document.createElement('style');
        style.id = 'achievement-unlock-style';
        style.textContent = `
            .achievement-unlock {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                animation: slideIn 0.5s ease, slideOut 0.5s ease 2.5s forwards;
            }
            
            .achievement-content {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1);
            }
            
            .achievement-icon {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
                animation: pulse 0.5s ease;
            }
            
            .achievement-label {
                font-size: 12px;
                color: #f1c40f;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .achievement-name {
                font-size: 18px;
                font-weight: 600;
                color: white;
                margin: 4px 0;
            }
            
            .achievement-desc {
                font-size: 13px;
                color: #bdc3c7;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            container.remove();
            style.remove();
        }, 3000);
    },
    
    /**
     * 渲染成就列表
     */
    renderAchievements() {
        const container = document.getElementById('achievement-container');
        if (!container) return;
        
        const unlockedCount = this.unlocked.size;
        const totalCount = Object.keys(this.achievements).length;
        
        container.innerHTML = `
            <div class="achievements-panel">
                <div class="achievement-header">
                    <h3><i class="fa-solid fa-trophy"></i> 学习成就</h3>
                    <span class="achievement-count">${unlockedCount}/${totalCount}</span>
                </div>
                
                <div class="achievement-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(unlockedCount/totalCount)*100}%"></div>
                    </div>
                </div>
                
                <div class="achievement-grid">
                    ${Object.values(this.achievements).map(a => `
                        <div class="achievement-item ${this.unlocked.has(a.id) ? 'unlocked' : 'locked'}"
                             data-id="${a.id}">
                            <div class="achievement-badge" style="border-color: ${this.unlocked.has(a.id) ? a.color : '#ccc'}">
                                <i class="fa-solid ${a.icon}" style="color: ${this.unlocked.has(a.id) ? a.color : '#ccc'}"></i>
                            </div>
                            <div class="achievement-name">${a.name}</div>
                            <div class="achievement-desc">${a.description}</div>
                            ${this.unlocked.has(a.id) ? '<div class="achievement-unlocked-badge"><i class="fa-solid fa-check"></i></div>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.addStyles();
    },
    
    /**
     * 添加样式
     */
    addStyles() {
        if (document.getElementById('achievement-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'achievement-styles';
        styles.textContent = `
            .achievements-panel { padding: 20px; }
            .achievement-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            .achievement-header h3 {
                font-size: 20px;
                color: #2c3e50;
                margin: 0;
            }
            .achievement-count {
                padding: 4px 12px;
                background: #3498db;
                color: white;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
            }
            .achievement-progress { margin-bottom: 20px; }
            .achievement-progress .progress-bar {
                height: 8px;
                background: #ecf0f1;
                border-radius: 4px;
                overflow: hidden;
            }
            .achievement-progress .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #f1c40f, #e67e22);
                border-radius: 4px;
                transition: width 0.5s ease;
            }
            .achievement-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 16px;
            }
            .achievement-item {
                position: relative;
                padding: 16px;
                background: white;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
            }
            .achievement-item.locked { opacity: 0.5; }
            .achievement-item.unlocked { border: 2px solid transparent; }
            .achievement-badge {
                width: 64px;
                height: 64px;
                margin: 0 auto 12px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f8f9fa;
                border: 3px solid;
                font-size: 28px;
            }
            .achievement-name {
                font-size: 14px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 4px;
            }
            .achievement-desc {
                font-size: 11px;
                color: #7f8c8d;
            }
            .achievement-unlocked-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 20px;
                height: 20px;
                background: #27ae60;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
            }
        `;
        document.head.appendChild(styles);
    }
};
