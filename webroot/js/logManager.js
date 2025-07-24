// 日志管理模块
import { exec } from './utils.js';
import { PATHS } from './constants.js';
import { getTranslation } from './i18n.js';

export class LogManager {
    constructor() {
        this.currentLanguage = 'zh';
        
        // DOM元素
        this.logContent = document.getElementById('logContent');
        this.refreshLogBtn = document.getElementById('refreshLogBtn');
    }

    init() {
        this.setupEventListeners();
        this.initLogFileSelect();
    }

    setupEventListeners() {
        if (this.refreshLogBtn) {
            this.refreshLogBtn.addEventListener('click', () => {
                this.loadLog();
            });
        }

        // 日志标签页按钮事件
        const logTabBtns = document.querySelectorAll('.log-tab-btn');
        logTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 如果点击的是已经激活的标签，则不执行任何操作
                if (btn.classList.contains('active')) {
                    return;
                }

                // 移除所有标签的active状态
                logTabBtns.forEach(tab => tab.classList.remove('active'));

                // 为当前标签添加active状态
                btn.classList.add('active');

                // 添加淡入动画效果
                if (this.logContent) {
                    this.logContent.style.opacity = '0.5';
                    this.logContent.textContent = getTranslation('log_loading', {}, this.currentLanguage);
                }

                // 延迟加载以显示过渡效果
                setTimeout(() => {
                    this.loadLog().then(() => {
                        if (this.logContent) {
                            this.logContent.style.opacity = '1';
                        }
                    });
                }, 100);
            });
        });
    }

    // 初始化日志文件选择器
    initLogFileSelect() {
        // 获取当前激活的日志标签页
        const activeTab = document.querySelector('.log-tab-btn.active');
        const currentLogFile = activeTab ? activeTab.getAttribute('data-log') : 'gpu_gov.log';

        // 更新标签页按钮的活动状态（确保只有一个激活）
        const logTabBtns = document.querySelectorAll('.log-tab-btn');
        logTabBtns.forEach(btn => {
            if (btn.getAttribute('data-log') === currentLogFile) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 加载日志
    async loadLog() {
        try {
            // 获取当前激活的日志标签页
            const activeTab = document.querySelector('.log-tab-btn.active');
            const selectedLog = activeTab ? activeTab.getAttribute('data-log') : 'gpu_gov.log';
            
            if (this.logContent) {
                this.logContent.textContent = getTranslation('log_loading', {}, this.currentLanguage);
            }

            // 使用cat而不是tail，某些设备可能没有tail命令
            const { errno, stdout } = await exec(`cat ${PATHS.LOG_PATH}/${selectedLog} 2>/dev/null || echo "日志文件不存在"`);

            // 日志文件不存在时多语言处理
            if (stdout.trim() === "日志文件不存在") {
                if (this.logContent) {
                    this.logContent.textContent = getTranslation('log_not_found', {}, this.currentLanguage);
                }
                return;
            }

            if (errno === 0) {
                // 如果日志太长，只显示最后100行
                const lines = stdout.trim().split('\n');
                const lastLines = lines.slice(-100).join('\n');

                // 日志轮转已由Rust程序处理，直接显示日志内容
                if (this.logContent) {
                    this.logContent.textContent = lastLines || getTranslation('log_empty', {}, this.currentLanguage);
                }

                // 滚动到底部
                if (this.logContent) {
                    this.logContent.scrollTop = this.logContent.scrollHeight;
                }
            } else {
                if (this.logContent) {
                    this.logContent.textContent = getTranslation('log_not_found', {}, this.currentLanguage);
                }
            }
        } catch (error) {
            console.error('加载日志失败:', error);
            if (this.logContent) {
                this.logContent.textContent = '加载日志失败，请检查权限';
            }
        }
    }

    setLanguage(language) {
        this.currentLanguage = language;
    }
}