const Utils = {
    // 日志级别
    LOG_LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },
    
    currentLogLevel: 1, // 默认INFO级别
    
    // 设置日志级别
    setLogLevel(level) {
        this.currentLogLevel = level;
    },
    
    // 日志记录方法
    log(message, level = 'INFO', module = 'App') {
        const levels = this.LOG_LEVELS;
        const levelNum = levels[level.toUpperCase()] || levels.INFO;
        
        if (levelNum < this.currentLogLevel) return;
        
        const timestamp = new Date().toLocaleString('zh-CN');
        const colorMap = {
            DEBUG: 'color: #9ca3af',
            INFO: 'color: #3b82f6',
            WARN: 'color: #f59e0b',
            ERROR: 'color: #ef4444'
        };
        
        console.log(`%c[${timestamp}] [${level}] [${module}]`, colorMap[level], message);
    },
    
    debug(message, module = 'App') {
        this.log(message, 'DEBUG', module);
    },
    
    info(message, module = 'App') {
        this.log(message, 'INFO', module);
    },
    
    warn(message, module = 'App') {
        this.log(message, 'WARN', module);
    },
    
    error(message, error = null, module = 'App') {
        this.log(message, 'ERROR', module);
        if (error) {
            console.error('详细错误:', error);
        }
    },
    
    // 错误处理包装器
    catchAsync(fn, errorMessage = '操作失败', module = 'App') {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.error(`${errorMessage}: ${error.message}`, error, module);
                showToast(errorMessage, TOAST_TYPES.ERROR);
                throw error;
            }
        };
    },
    
    // 同步错误处理包装器
    catchSync(fn, errorMessage = '操作失败', module = 'App') {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.error(`${errorMessage}: ${error.message}`, error, module);
                showToast(errorMessage, TOAST_TYPES.ERROR);
                throw error;
            }
        };
    },
    
    // 验证数据完整性
    validateData(data, requiredFields, module = 'App') {
        const missingFields = requiredFields.filter(field => 
            data[field] === undefined || data[field] === null || data[field] === ''
        );
        
        if (missingFields.length > 0) {
            this.warn(`缺少必填字段: ${missingFields.join(', ')}`, module);
            return false;
        }
        return true;
    },
    
    // 格式化时间
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return date.toLocaleDateString('zh-CN', options);
    },
    
    getCategoryClass(category) {
        const classMap = {
            '法律类': 'tag-law',
            '法规类': 'tag-reg',
            '国标类': 'tag-standard'
        };
        return classMap[category] || 'tag-law';
    },
    
    getTypeClass(type) {
        const classMap = {
            'single': 'tag-single',
            'judge': 'tag-judge'
        };
        return classMap[type] || 'tag-single';
    },
    
    getTypeName(type) {
        const nameMap = {
            'single': '单选题',
            'judge': '判断题'
        };
        return nameMap[type] || '单选题';
    },
    
    getAnswerLetter(index) {
        const letters = ['A', 'B', 'C', 'D'];
        return letters[index] || '';
    },
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    validateQuestion(question, index) {
        const requiredFields = ['id', 'type', 'category', 'content', 'options', 'answer', 'memoryTip', 'analysis'];
        const errors = [];
        
        requiredFields.forEach(field => {
            // 使用 !== undefined 而不是 ! 判断，因为 answer=0 是有效值
            if (question[field] === undefined || question[field] === null || question[field] === '') {
                errors.push(`缺少字段: ${field}`);
            }
        });
        
        if (!Array.isArray(question.options) || question.options.length < 2) {
            errors.push('选项数量不足');
        }
        
        if (question.answer < 0 || question.answer >= question.options.length) {
            errors.push('答案索引无效');
        }
        
        if (errors.length > 0) {
            console.warn(`题目 ${index + 1} 验证失败:`, errors.join(', '));
        }
        
        return errors.length === 0;
    },
    
    validateQuestions(questions) {
        if (!Array.isArray(questions) || questions.length === 0) {
            console.error('题库数据无效');
            return false;
        }
        
        let validCount = 0;
        questions.forEach((q, index) => {
            if (this.validateQuestion(q, index)) {
                validCount++;
            }
        });
        
        console.log(`题库验证完成: ${validCount}/${questions.length} 题有效`);
        return validCount > 0;
    },
    
    // 显示提示信息（供其他模块调用）
    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    },
    
    // HTML转义，防止XSS攻击
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },
    
    // 渲染题目选项（公共函数，减少代码重复）
    renderOptions(container, question, onSelect, selectedIndex = null, isAnswered = false) {
        container.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionItem = document.createElement('div');
            optionItem.className = 'option-item';
            optionItem.dataset.index = index;
            
            // 转义HTML，防止XSS
            const letter = this.getAnswerLetter(index);
            const safeOption = this.escapeHtml(option);
            
            optionItem.innerHTML = `
                <span class="option-letter">${letter}</span>
                <span class="option-text">${safeOption}</span>
            `;
            
            // 高亮选中项
            if (selectedIndex === index) {
                optionItem.classList.add('selected');
            }
            
            // 答题后显示正确答案/错误答案
            if (isAnswered) {
                if (index === question.answer) {
                    optionItem.classList.add('correct');
                } else if (index === selectedIndex && selectedIndex !== question.answer) {
                    optionItem.classList.add('incorrect');
                }
            }
            
            if (onSelect) {
                optionItem.addEventListener('click', () => onSelect(index));
            }
            
            container.appendChild(optionItem);
        });
    },
    
    // 渲染类型标签（公共函数）
    renderTypeTag(type) {
        return `<span class="question-tag ${this.getTypeClass(type)}">${this.escapeHtml(this.getTypeName(type))}</span>`;
    },
    
    // 渲染分类标签（公共函数）
    renderCategoryTag(category) {
        return `<span class="question-tag ${this.getCategoryClass(category)}">${this.escapeHtml(category)}</span>`;
    },
    
    // 显示加载状态
    showLoading(container, message = '加载中...') {
        if (!container) return;
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px;">
                <div style="width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="margin-top: 16px; color: var(--text-secondary); font-size: 0.95rem;">${message}</span>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;
    },
    
    // 隐藏加载状态
    hideLoading(container) {
        if (!container) return;
        container.innerHTML = '';
    },
    
    // 显示空状态
    showEmptyState(container, options = {}) {
        if (!container) return;
        
        const defaults = {
            icon: 'fa-folder-open',
            title: '暂无数据',
            description: '暂无相关内容',
            buttonText: null,
            buttonAction: null,
            iconColor: '#94a3b8'
        };
        
        const config = { ...defaults, ...options };
        
        const buttonHtml = config.buttonText ? `
            <button class="btn btn-primary" onclick="${config.buttonAction}" style="margin-top: 16px;">
                ${config.buttonText}
            </button>
        ` : '';
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center;">
                <div style="width: 72px; height: 72px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <i class="fa-solid ${config.icon}" style="font-size: 2.5rem; color: ${config.iconColor};"></i>
                </div>
                <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">${config.title}</h3>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">${config.description}</p>
                ${buttonHtml}
            </div>
        `;
    },
    
    // 显示确认对话框
    showConfirmDialog(title, message, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.className = 'modal show';
        const safeTitle = this.escapeHtml(title);
        const safeMessage = this.escapeHtml(message);
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '480px';
        
        const titleElement = document.createElement('h3');
        titleElement.style.fontSize = '1.3rem';
        titleElement.style.fontWeight = '600';
        titleElement.style.marginBottom = '12px';
        titleElement.textContent = safeTitle;
        
        const messageElement = document.createElement('p');
        messageElement.style.color = 'var(--text-secondary)';
        messageElement.style.marginBottom = '24px';
        messageElement.textContent = safeMessage;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '12px';
        buttonContainer.style.justifyContent = 'flex-end';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            dialog.remove();
            if (typeof onCancel === 'function') {
                onCancel();
            }
        });
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.textContent = '确认';
        confirmBtn.addEventListener('click', () => {
            dialog.remove();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });
        
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(confirmBtn);
        
        modalContent.appendChild(titleElement);
        modalContent.appendChild(messageElement);
        modalContent.appendChild(buttonContainer);
        dialog.appendChild(modalContent);
        
        document.body.appendChild(dialog);
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });
    },
    
    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },
    
    // 防抖函数
    debounce(fn, delay) {
        let timer = null;
        return function(...args) {
            const context = this;
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(context, args), delay);
        };
    },
    
    // 节流函数
    throttle(fn, limit) {
        let inThrottle = false;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    },
    
    // 获取URL参数
    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },
    
    // 设置URL参数
    setUrlParam(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    },
    
    // 滚动到指定元素
    scrollToElement(selector, behavior = 'smooth', block = 'start') {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior, block });
        }
    },
    
    // 数字千分位格式化
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // 深拷贝
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // 数组去重
    uniqueArray(arr, key = null) {
        if (key) {
            const seen = new Set();
            return arr.filter(item => {
                const value = item[key];
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        }
        return [...new Set(arr)];
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
