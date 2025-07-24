// 设置管理模块
import { exec, toast } from './utils.js';
import { PATHS } from './constants.js';
import { getTranslation } from './i18n.js';

export class SettingsManager {
    constructor() {
        this.currentLanguage = 'zh';
        
        // DOM元素
        this.logLevelContainer = document.getElementById('logLevelContainer');
        this.languageContainer = document.getElementById('languageContainer');
    }

    init() {
        this.setupEventListeners();
        this.loadLogLevel();
    }

    setupEventListeners() {
        // 日志等级选择器事件
        if (this.logLevelContainer) {
            const logLevelButtons = this.logLevelContainer.querySelectorAll('.settings-tab-btn');
            logLevelButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();

                    // 移除所有按钮的选中状态
                    logLevelButtons.forEach(btn => btn.classList.remove('active'));

                    // 为当前按钮添加选中状态
                    button.classList.add('active');

                    // 保存设置
                    this.saveLogLevel();
                });
            });
        }

        // 语言设置选择器事件
        if (this.languageContainer) {
            const languageButtons = this.languageContainer.querySelectorAll('.settings-tab-btn');
            languageButtons.forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.preventDefault();

                    // 移除所有按钮的选中状态
                    languageButtons.forEach(btn => btn.classList.remove('active'));

                    // 为当前按钮添加选中状态
                    button.classList.add('active');

                    // 保存设置
                    const selectedValue = button.getAttribute('data-value');
                    localStorage.setItem('languageSetting', selectedValue);

                    let currentLanguage = 'zh';
                    
                    // 如果选择了跟随系统
                    if (selectedValue === 'system') {
                        // 检测系统语言
                        try {
                            const { errno, stdout } = await exec('getprop persist.sys.locale || getprop ro.product.locale || echo "zh-CN"');
                            
                            if (errno === 0 && stdout.trim()) {
                                const locale = stdout.trim().toLowerCase();
                                
                                // 根据语言代码判断
                                if (locale.startsWith('en')) {
                                    currentLanguage = 'en';
                                } else {
                                    currentLanguage = 'zh';
                                }
                            }
                        } catch {
                            // 默认使用中文
                            currentLanguage = 'zh';
                        }
                        
                        localStorage.setItem('language', currentLanguage);
                        toast(getTranslation('toast_language_follow_system', {}, this.currentLanguage));
                    } else {
                        // 直接使用选择的语言
                        currentLanguage = selectedValue;
                        localStorage.setItem('language', selectedValue);

                        // 显示提示
                        const languageName = selectedValue === 'zh' ? '中文' : 'English';
                        toast(getTranslation('toast_language_changed', { language: languageName }, this.currentLanguage));
                    }
                    
                    // 触发自定义事件，通知主应用语言已更改
                    const languageChangeEvent = new CustomEvent('languageChange', {
                        detail: { language: currentLanguage }
                    });
                    document.dispatchEvent(languageChangeEvent);
                });
            });
        }
    }

    // 加载日志等级设置
    async loadLogLevel() {
        try {
            // 检查日志等级文件是否存在
            const { errno, stdout } = await exec(`cat ${PATHS.LOG_LEVEL_PATH} 2>/dev/null || echo "info"`);

            let logLevel = 'info'; // 默认值

            if (errno === 0) {
                const level = stdout.trim().toLowerCase();

                // 验证日志等级是否有效
                if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
                    logLevel = level;
                }
            }

            // 更新按钮选中状态
            if (this.logLevelContainer) {
                const logLevelButtons = this.logLevelContainer.querySelectorAll('.settings-tab-btn');
                logLevelButtons.forEach(button => {
                    if (button.getAttribute('data-value') === logLevel) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                });
            }
        } catch (error) {
            console.error('加载日志等级设置失败:', error);
            // 出错时选中默认的info按钮
            if (this.logLevelContainer) {
                const infoButton = this.logLevelContainer.querySelector('.settings-tab-btn[data-value="info"]');
                if (infoButton) {
                    const logLevelButtons = this.logLevelContainer.querySelectorAll('.settings-tab-btn');
                    logLevelButtons.forEach(btn => btn.classList.remove('active'));
                    infoButton.classList.add('active');
                }
            }
        }
    }

    // 保存日志等级设置
    async saveLogLevel() {
        try {
            // 从选中的按钮获取日志等级
            if (!this.logLevelContainer) return;
            
            const selectedButton = this.logLevelContainer.querySelector('.settings-tab-btn.active');
            if (!selectedButton) {
                console.error('未找到选中的日志等级按钮');
                return;
            }

            const selectedLevel = selectedButton.getAttribute('data-value');

            // 保存到文件
            const { errno } = await exec(`echo "${selectedLevel}" > ${PATHS.LOG_LEVEL_PATH}`);

            if (errno === 0) {
                if (selectedLevel === 'debug') {
                    toast(getTranslation('toast_log_level_debug', {}, this.currentLanguage));
                } else {
                    toast(getTranslation('toast_log_level_set', { level: selectedLevel }, this.currentLanguage));
                }
            } else {
                toast(getTranslation('toast_log_level_fail', {}, this.currentLanguage));
            }
        } catch (error) {
            console.error('保存日志等级失败:', error);
            toast(`保存日志等级失败: ${error.message}`);
        }
    }

    setLanguage(language) {
        this.currentLanguage = language;
    }
}