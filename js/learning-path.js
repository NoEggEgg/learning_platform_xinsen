/**
 * 学习路径模块 - LearningPath.js
 * 引导用户按照科学的学习顺序进行学习
 */

const LearningPath = {
    // 当前阶段
    currentPhase: 1,
    
    // 学习阶段定义
    phases: [
        {
            id: 1,
            name: '基础学习',
            description: '掌握安全生产法律法规基础',
            category: '法律类',
            icon: 'fa-book',
            color: '#3498db',
            tasks: [
                { id: 'legal-basics', name: '安全生产法基础', progress: 0 },
                { id: 'rights-obligations', name: '从业人员权利义务', progress: 0 },
                { id: 'responsibility-system', name: '安全生产责任制', progress: 0 },
                { id: 'accident-reporting', name: '事故报告与调查', progress: 0 }
            ],
            estimatedTime: 120, // 分钟
            knowledgePoints: ['安全生产方针', '从业人员权利义务', '安全生产责任制', '法律责任']
        },
        {
            id: 2,
            name: '强化记忆',
            description: '深入学习各类安全法规',
            category: '法规类',
            icon: 'fa-graduation-cap',
            color: '#9b59b6',
            tasks: [
                { id: 'chemical-safety', name: '危化品安全管理', progress: 0 },
                { id: 'fire-safety', name: '消防安全', progress: 0 },
                { id: 'occupational-health', name: '职业健康管理', progress: 0 },
                { id: 'emergency-response', name: '应急管理', progress: 0 }
            ],
            estimatedTime: 240,
            knowledgePoints: ['危化品储存', '防火防爆', '职业病防护', '应急预案']
        },
        {
            id: 3,
            name: '冲刺复习',
            description: '国标规范与综合测试',
            category: '国标类',
            icon: 'fa-trophy',
            color: '#e74c3c',
            tasks: [
                { id: 'safety-signs', name: '安全标志与色标', progress: 0 },
                { id: 'equipment-safety', name: '设备安全标准', progress: 0 },
                { id: 'comprehensive-exam', name: '综合模拟考试', progress: 0 },
                { id: 'weak-points', name: '薄弱知识点强化', progress: 0 }
            ],
            estimatedTime: 180,
            knowledgePoints: ['GB2894', 'GB5083', '安全色', '防护标准']
        }
    ],
    
    /**
     * 初始化学习路径
     */
    init() {
        this.loadProgress();
        this.renderPath();
        this.bindEvents();
        this.updateCurrentPhase();
    },
    
    /**
     * 加载学习进度
     */
    loadProgress() {
        if (AppState.progress.learningPath) {
            this.phases = this.phases.map(phase => {
                if (AppState.progress.learningPath[phase.id]) {
                    phase.tasks = phase.tasks.map(task => ({
                        ...task,
                        progress: AppState.progress.learningPath[phase.id][task.id] || 0
                    }));
                }
                return phase;
            });
        }
    },
    
    /**
     * 保存学习进度
     */
    saveProgress() {
        AppState.progress.learningPath = this.phases.reduce((acc, phase) => {
            acc[phase.id] = phase.tasks.reduce((taskAcc, task) => {
                taskAcc[task.id] = task.progress;
                return taskAcc;
            }, {});
            return acc;
        }, {});
        Storage.saveProgress();
    },
    
    /**
     * 更新当前阶段
     */
    updateCurrentPhase() {
        // 计算各阶段完成度
        this.phases.forEach(phase => {
            const totalProgress = phase.tasks.reduce((sum, task) => sum + task.progress, 0);
            phase.completion = Math.round(totalProgress / phase.tasks.length);
        });
        
        // 确定当前学习阶段
        for (let i = 0; i < this.phases.length; i++) {
            if (this.phases[i].completion < 100) {
                this.currentPhase = this.phases[i].id;
                break;
            }
        }
    },
    
    /**
     * 渲染学习路径
     */
    renderPath() {
        const container = document.getElementById('learning-path-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="learning-path">
                <div class="path-header">
                    <h3><i class="fa-solid fa-route"></i> 学习路径</h3>
                    <p class="path-subtitle">按照科学的学习顺序，循序渐进掌握安全生产知识</p>
                </div>
                
                <div class="phases-container">
                    ${this.phases.map((phase, index) => `
                        <div class="phase-card ${phase.id === this.currentPhase ? 'current' : ''} ${phase.completion >= 100 ? 'completed' : ''}"
                             data-phase-id="${phase.id}">
                            <div class="phase-header" style="border-left: 4px solid ${phase.color}">
                                <div class="phase-icon" style="background: ${phase.color}">
                                    <i class="fa-solid ${phase.icon}"></i>
                                </div>
                                <div class="phase-info">
                                    <h4>${phase.name}</h4>
                                    <p>${phase.description}</p>
                                </div>
                                <div class="phase-progress-ring" data-progress="${phase.completion}">
                                    <svg viewBox="0 0 36 36">
                                        <path class="progress-bg" d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                        <path class="progress-fill" stroke="${phase.color}"
                                            stroke-dasharray="${phase.completion}, 100"
                                            d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                    </svg>
                                    <span class="progress-text">${phase.completion}%</span>
                                </div>
                            </div>
                            
                            <div class="phase-tasks">
                                ${phase.tasks.map(task => `
                                    <div class="task-item ${task.progress >= 100 ? 'completed' : ''}" 
                                         data-task-id="${task.id}">
                                        <div class="task-checkbox">
                                            <i class="fa-solid ${task.progress >= 100 ? 'fa-check-circle' : 'fa-circle'}"></i>
                                        </div>
                                        <div class="task-info">
                                            <span class="task-name">${task.name}</span>
                                            <div class="task-progress-bar">
                                                <div class="task-progress-fill" style="width: ${task.progress}%"></div>
                                            </div>
                                        </div>
                                        <span class="task-percent">${task.progress}%</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="phase-footer">
                                <div class="knowledge-tags">
                                    ${phase.knowledgePoints.slice(0, 3).map(kp => `
                                        <span class="knowledge-tag">${kp}</span>
                                    `).join('')}
                                </div>
                                <div class="phase-time">
                                    <i class="fa-regular fa-clock"></i>
                                    约${phase.estimatedTime}分钟
                                </div>
                            </div>
                            
                            ${phase.id === this.currentPhase ? `
                                <button class="btn btn-primary start-phase-btn" 
                                        data-phase-id="${phase.id}">
                                    <i class="fa-solid fa-play"></i> 开始学习
                                </button>
                            ` : phase.completion >= 100 ? `
                                <button class="btn btn-success" disabled>
                                    <i class="fa-solid fa-check"></i> 已完成
                                </button>
                            ` : `
                                <button class="btn btn-secondary" 
                                        data-phase-id="${phase.id}">
                                    <i class="fa-solid fa-redo"></i> 复习
                                </button>
                            `}
                        </div>
                    `).join('')}
                </div>
                
                <div class="path-progress">
                    <div class="overall-progress">
                        <span>总体进度</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${this.calculateOverallProgress()}%"></div>
                        </div>
                        <span class="progress-value">${this.calculateOverallProgress()}%</span>
                    </div>
                </div>
            </div>
        `;
        
        this.addStyles();
    },
    
    /**
     * 计算总体进度
     */
    calculateOverallProgress() {
        const totalPhases = this.phases.length;
        const completedPhases = this.phases.filter(p => p.completion >= 100).length;
        const inProgressPhase = this.phases.find(p => p.completion > 0 && p.completion < 100);
        
        let progress = 0;
        if (inProgressPhase) {
            progress = ((completedPhases * 100) + inProgressPhase.completion) / totalPhases;
        } else {
            progress = (completedPhases / totalPhases) * 100;
        }
        
        return Math.round(progress);
    },
    
    /**
     * 开始学习指定阶段
     */
    startPhase(phaseId) {
        const phase = this.phases.find(p => p.id === phaseId);
        if (!phase) return;
        
        this.currentPhase = phaseId;
        
        // 根据阶段跳转到对应的学习内容
        if (phaseId === 1) {
            // 基础学习 - 法律类
            App.showSection('study');
            StudyModule.filterByCategory('法律类');
        } else if (phaseId === 2) {
            // 强化记忆 - 法规类
            App.showSection('study');
            StudyModule.filterByCategory('法规类');
        } else if (phaseId === 3) {
            // 冲刺复习 - 国标类，混合学习模式
            App.showSection('study');
            StudyModule.filterByCategory('国标类');
        }
        
        Utils.showToast(`开始学习：${phase.name}`, 'success');
    },
    
    /**
     * 更新任务进度
     */
    updateTaskProgress(phaseId, taskId, progress) {
        const phase = this.phases.find(p => p.id === phaseId);
        if (!phase) return;
        
        const task = phase.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.progress = Math.min(100, Math.max(0, progress));
        
        this.saveProgress();
        this.updateCurrentPhase();
        this.renderPath();
        
        // 检查是否完成阶段
        if (phase.completion >= 100) {
            Utils.showToast(`🎉 恭喜完成${phase.name}阶段！`, 'success');
            Achievement.unlock('phase_complete_' + phase.id);
        }
    },
    
    /**
     * 添加样式
     */
    addStyles() {
        if (document.getElementById('learning-path-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'learning-path-styles';
        styles.textContent = `
            .learning-path {
                padding: 20px;
            }
            
            .path-header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .path-header h3 {
                font-size: 24px;
                color: #2c3e50;
                margin-bottom: 8px;
            }
            
            .path-subtitle {
                color: #7f8c8d;
                font-size: 14px;
            }
            
            .phases-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .phase-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
            }
            
            .phase-card.current {
                box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
                transform: scale(1.02);
            }
            
            .phase-card.completed {
                opacity: 0.8;
            }
            
            .phase-header {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 16px;
            }
            
            .phase-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
            }
            
            .phase-info {
                flex: 1;
            }
            
            .phase-info h4 {
                margin: 0 0 4px;
                font-size: 18px;
                color: #2c3e50;
            }
            
            .phase-info p {
                margin: 0;
                font-size: 13px;
                color: #7f8c8d;
            }
            
            .phase-progress-ring {
                width: 60px;
                height: 60px;
                position: relative;
            }
            
            .phase-progress-ring svg {
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }
            
            .progress-bg, .progress-fill {
                fill: none;
                stroke-width: 3;
            }
            
            .progress-bg {
                stroke: #ecf0f1;
            }
            
            .progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 12px;
                font-weight: 600;
                color: #2c3e50;
            }
            
            .phase-tasks {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 16px;
            }
            
            .task-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                background: #f8f9fa;
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            
            .task-item.completed {
                background: #e8f8f5;
            }
            
            .task-checkbox {
                color: #bdc3c7;
                font-size: 18px;
            }
            
            .task-item.completed .task-checkbox {
                color: #27ae60;
            }
            
            .task-info {
                flex: 1;
            }
            
            .task-name {
                font-size: 14px;
                color: #2c3e50;
            }
            
            .task-item.completed .task-name {
                color: #27ae60;
            }
            
            .task-progress-bar {
                height: 4px;
                background: #ecf0f1;
                border-radius: 2px;
                margin-top: 6px;
            }
            
            .task-progress-fill {
                height: 100%;
                background: #3498db;
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            
            .task-percent {
                font-size: 12px;
                color: #7f8c8d;
                min-width: 36px;
                text-align: right;
            }
            
            .phase-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .knowledge-tags {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }
            
            .knowledge-tag {
                padding: 4px 10px;
                background: #ecf0f1;
                border-radius: 12px;
                font-size: 11px;
                color: #7f8c8d;
            }
            
            .phase-time {
                font-size: 12px;
                color: #95a5a6;
            }
            
            .path-progress {
                margin-top: 24px;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .overall-progress {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .overall-progress span {
                font-size: 14px;
                color: #2c3e50;
                font-weight: 500;
            }
            
            .overall-progress .progress-bar {
                flex: 1;
                height: 8px;
                background: #ecf0f1;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .overall-progress .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3498db, #2ecc71);
                border-radius: 4px;
                transition: width 0.5s ease;
            }
            
            .overall-progress .progress-value {
                font-weight: 600;
                color: #3498db;
            }
            
            .start-phase-btn {
                width: 100%;
            }
        `;
        document.head.appendChild(styles);
    },
    
    /**
     * 绑定事件
     */
    bindEvents() {
        const pathContainer = document.getElementById('learning-path-container');
        if (pathContainer) {
            pathContainer.addEventListener('click', (e) => {
                const target = e.target.closest('button[data-phase-id]');
                if (target) {
                    const phaseId = parseInt(target.dataset.phaseId);
                    if (!isNaN(phaseId)) {
                        this.startPhase(phaseId);
                    }
                }
            });
        }
    }
};
