// 主应用模块
import { exec, toast } from './utils.js';
import { PATHS } from './constants.js';
import { translations, getTranslation } from './i18n.js';
import { ThemeManager } from './themeManager.js';
import { ConfigManager } from './configManager.js';
import { GamesManager } from './gamesManager.js';
import { LogManager } from './logManager.js';
import { SettingsManager } from './settingsManager.js';

export class MainApp {
    constructor() {
        // 应用状态
        this.currentLanguage = 'zh';
        this.currentPage = 'page-status';
        
        // DOM元素
        this.app = document.getElementById('app');
        this.loading = document.getElementById('loading');
        this.htmlRoot = document.getElementById('htmlRoot');
        this.moduleVersion = document.getElementById('moduleVersion');
        this.currentMode = document.getElementById('currentMode');
        this.runningStatus = document.getElementById('runningStatus');
        
        // 导航元素
        this.pages = document.querySelectorAll('.page');
        this.navItems = document.querySelectorAll('.nav-item');
        this.languageContainer = document.getElementById('languageContainer');
        
        // 管理器实例
        this.themeManager = new ThemeManager();
        this.configManager = new ConfigManager();
        this.gamesManager = new GamesManager();
        this.logManager = new LogManager();
        this.settingsManager = new SettingsManager();
    }

    async init() {
        try {
            // 先显示界面，避免长时间加载
            if (this.loading) this.loading.style.display = 'none';
            if (this.app) this.app.style.display = 'block';

            // 初始化各个管理器
            this.themeManager.init();
            this.configManager.init();
            this.gamesManager.init();
            this.logManager.init();
            this.settingsManager.init();

            // 初始化语言
            await this.initLanguage();
            // 设置语言选择器事件
            this.setupLanguageEvents();

            // 设置导航事件监听器
            this.setupNavigationEvents();

            // 加载数据
            await this.loadData();

            // 设置定时器更新状态
            setInterval(() => {
                this.loadCurrentMode();
                this.checkModuleStatus();
            }, 2000);

            // 显示加载完成提示
            toast(getTranslation('toast_webui_loaded', {}, this.currentLanguage));
        } catch (error) {
            console.error('初始化失败:', error);
            // 确保界面显示
            if (this.loading) this.loading.style.display = 'none';
            if (this.app) this.app.style.display = 'block';
        }
    }

    setupNavigationEvents() {
        // 页面导航相关事件
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPageId = item.getAttribute('data-page');
                this.switchPage(targetPageId);
            });
        });
    }

    // 设置语言选择器事件
    setupLanguageEvents() {
        // 监听语言更改事件
        document.addEventListener('languageChange', (e) => {
            const { language } = e.detail;
            this.currentLanguage = language;
            
            // 设置各管理器的语言
            this.themeManager.setLanguage(this.currentLanguage);
            this.configManager.setLanguage(this.currentLanguage);
            this.gamesManager.setLanguage(this.currentLanguage);
            this.logManager.setLanguage(this.currentLanguage);
            this.settingsManager.setLanguage(this.currentLanguage);

            // 应用翻译
            this.applyTranslations();
        });
    }

    async initLanguage() {
        // 检查是否有用户保存的语言设置
        const savedLanguageSetting = localStorage.getItem('languageSetting');
        const savedLanguage = localStorage.getItem('language');

        // 如果是首次使用，将语言设置保存到localStorage
        if (savedLanguageSetting === null) {
            localStorage.setItem('languageSetting', 'system');
        }

        // 根据设置决定使用哪个语言
        if (savedLanguageSetting === 'system' || savedLanguageSetting === null) {
            // 如果设置了跟随系统，则检测系统语言
            this.currentLanguage = await this.detectSystemLanguage();
            localStorage.setItem('language', this.currentLanguage);
        } else if (savedLanguage) {
            // 如果没有设置跟随系统，但有保存的语言，则使用保存的语言
            this.currentLanguage = savedLanguage;
        }

        // 设置各管理器的语言
        this.themeManager.setLanguage(this.currentLanguage);
        this.configManager.setLanguage(this.currentLanguage);
        this.gamesManager.setLanguage(this.currentLanguage);
        this.logManager.setLanguage(this.currentLanguage);
        this.settingsManager.setLanguage(this.currentLanguage);

        // 应用翻译
        this.applyTranslations();

        // 更新选中的语言显示文本
        this.updateSelectedLanguageText(savedLanguageSetting || 'system');

        // 设置语言选择器事件
        this.setupLanguageEvents();
    }

    // 检测系统语言
    async detectSystemLanguage() {
        try {
            // 尝试使用浏览器API获取系统语言
            const browserLanguage = navigator.language || navigator.userLanguage || 'zh-CN';

            // 尝试使用KernelSU API获取系统语言（如果可用）
            try {
                const { errno, stdout } = await exec('getprop persist.sys.locale || getprop ro.product.locale || echo "zh-CN"');

                if (errno === 0 && stdout.trim()) {
                    const locale = stdout.trim().toLowerCase();

                    // 根据语言代码判断
                    if (locale.startsWith('en')) {
                        return 'en';
                    } else {
                        return 'zh';
                    }
                }
            } catch {
                console.log('无法通过系统属性检测语言，将使用浏览器语言');
            }

            // 如果无法通过系统属性获取，则使用浏览器语言
            if (browserLanguage.startsWith('en')) {
                return 'en';
            } else {
                return 'zh';
            }
        } catch (error) {
            console.error('检测系统语言失败:', error);
            return 'zh'; // 默认使用中文
        }
    }

    // 应用翻译到界面
    applyTranslations() {
        try {
            // 更新页面标题
            document.title = getTranslation('title', {}, this.currentLanguage);

            // 更新HTML语言属性
            if (this.htmlRoot) {
                this.htmlRoot.setAttribute('lang', this.currentLanguage === 'en' ? 'en' : 'zh-CN');
            }

            // 更新加载提示
            if (this.loading) {
                this.loading.textContent = getTranslation('loading', {}, this.currentLanguage);
            }

            // 更新顶部标题
            const headerTitle = document.querySelector('.header-content h1');
            if (headerTitle) {
                headerTitle.textContent = getTranslation('header_title', {}, this.currentLanguage);
            }

            // 更新底部导航
            document.querySelectorAll('.nav-item').forEach(item => {
                try {
                    const pageId = item.getAttribute('data-page');
                    const navText = item.querySelector('.nav-text');
                    if (!navText) return;

                    if (pageId === 'page-status') {
                        navText.textContent = getTranslation('nav_status', {}, this.currentLanguage);
                    } else if (pageId === 'page-config') {
                        navText.textContent = getTranslation('nav_config', {}, this.currentLanguage);
                    } else if (pageId === 'page-log') {
                        navText.textContent = getTranslation('nav_log', {}, this.currentLanguage);
                    } else if (pageId === 'page-settings') {
                        navText.textContent = getTranslation('nav_settings', {}, this.currentLanguage);
                    }
                } catch (e) {
                    console.error('更新导航项失败:', e);
                }
            });
        } catch (e) {
            console.error('应用基本翻译失败:', e);
        }

        // 更新状态页面
        try {
            const statusTitle = document.querySelector('#statusCard .card-title');
            if (statusTitle) {
                statusTitle.textContent = getTranslation('status_title', {}, this.currentLanguage);
            }

            const runningLabel = document.querySelector('#statusCard .status-item:nth-child(1) .status-text');
            if (runningLabel) {
                runningLabel.textContent = getTranslation('status_running', {}, this.currentLanguage);
            }

            const versionLabel = document.querySelector('#statusCard .status-item:nth-child(2) .status-text');
            if (versionLabel) {
                versionLabel.textContent = getTranslation('status_module_version', {}, this.currentLanguage);
            }

            // 更新当前模式标签
            const currentModeLabel = document.querySelector('#statusCard .status-item:nth-child(3) .status-text');
            if (currentModeLabel) {
                currentModeLabel.textContent = getTranslation('status_current_mode', {}, this.currentLanguage);
            }

            // 更新版权信息
            const copyrightText = document.querySelector('#copyrightCard .copyright-content p');
            if (copyrightText) {
                copyrightText.textContent = getTranslation('copyright_text', {}, this.currentLanguage);
            }
        } catch (e) {
            console.error('更新状态页面翻译失败:', e);
        }

        // 更新配置页面
        try {
            // GPU配置表
            const gpuConfigTitle = document.querySelector('#gpuConfigCard .card-title');
            if (gpuConfigTitle) {
                gpuConfigTitle.textContent = getTranslation('config_gpu_title', {}, this.currentLanguage);
            }

            // 表头
            try {
                const freqHeader = document.querySelector('#gpuFreqTable thead tr th:nth-child(1)');
                if (freqHeader) {
                    freqHeader.textContent = getTranslation('config_freq', {}, this.currentLanguage);
                }

                const voltHeader = document.querySelector('#gpuFreqTable thead tr th:nth-child(2)');
                if (voltHeader) {
                    voltHeader.textContent = getTranslation('config_volt', {}, this.currentLanguage);
                }

                const ddrHeader = document.querySelector('#gpuFreqTable thead tr th:nth-child(3)');
                if (ddrHeader) {
                    ddrHeader.textContent = getTranslation('config_ddr', {}, this.currentLanguage);
                }

                const editHeader = document.querySelector('#gpuFreqTable thead tr th:nth-child(4)');
                if (editHeader) {
                    editHeader.textContent = getTranslation('config_edit', {}, this.currentLanguage);
                }
            } catch (e) {
                console.error('更新表头翻译失败:', e);
            }

            // 按钮
            const addConfigBtn = document.getElementById('addConfigBtn');
            if (addConfigBtn) {
                const btnText = addConfigBtn.querySelector('.btn-text');
                if (btnText) {
                    btnText.textContent = getTranslation('config_add', {}, this.currentLanguage);
                }
            }

            const saveConfigBtn = document.getElementById('saveConfigBtn');
            if (saveConfigBtn) {
                const btnText = saveConfigBtn.querySelector('.btn-text');
                if (btnText) {
                    btnText.textContent = getTranslation('config_save', {}, this.currentLanguage);
                }
            }

            // 更新游戏列表
            try {
                const gamesTitle = document.querySelector('#gamesCard .card-title');
                if (gamesTitle) {
                    gamesTitle.textContent = getTranslation('config_games_title', {}, this.currentLanguage);
                }

                const addGameBtn = document.getElementById('addGameBtn');
                if (addGameBtn) {
                    addGameBtn.textContent = getTranslation('config_games_add', {}, this.currentLanguage);
                }

                const saveGamesBtn = document.getElementById('saveGamesBtn');
                if (saveGamesBtn) {
                    saveGamesBtn.textContent = getTranslation('config_games_save', {}, this.currentLanguage);
                }
            } catch (e) {
                console.error('更新游戏列表翻译失败:', e);
            }
        } catch (e) {
            console.error('更新配置页面翻译失败:', e);
        }

        // 更新日志页面
        try {
            const logTitle = document.querySelector('#logCard .card-title');
            if (logTitle) {
                logTitle.textContent = getTranslation('log_title', {}, this.currentLanguage);
            }

            // 更新标签页按钮文本
            const mainLogTabText = document.querySelector('.log-tab-btn[data-log="gpu_gov.log"] .tab-text');
            if (mainLogTabText) {
                mainLogTabText.textContent = getTranslation('log_main', {}, this.currentLanguage);
            }

            const initLogTabText = document.querySelector('.log-tab-btn[data-log="initsvc.log"] .tab-text');
            if (initLogTabText) {
                initLogTabText.textContent = getTranslation('log_init', {}, this.currentLanguage);
            }

            // 更新刷新按钮文本
            const refreshLogBtnText = document.querySelector('#refreshLogBtn span:not(.refresh-icon)');
            if (refreshLogBtnText) {
                refreshLogBtnText.textContent = getTranslation('log_refresh', {}, this.currentLanguage);
            }
        } catch (e) {
            console.error('更新日志页面翻译失败:', e);
        }

        // 更新设置页面
        try {
            const settingsTitle = document.querySelector('#settingsCard .card-title');
            if (settingsTitle) {
                settingsTitle.textContent = getTranslation('settings_title', {}, this.currentLanguage);
            }

            // 主题设置
            const themeFollowLabel = document.querySelector('#settingsCard .status-item:nth-child(1) > span:first-child');
            if (themeFollowLabel) {
                themeFollowLabel.textContent = getTranslation('settings_theme_follow', {}, this.currentLanguage);
            }

            // 日志等级设置
            try {
                const logLevelLabel = document.querySelector('#settingsCard .status-item:nth-child(3) > span:first-child');
                if (logLevelLabel) {
                    logLevelLabel.textContent = getTranslation('settings_log_level', {}, this.currentLanguage);
                }
            } catch (e) {
                console.error('更新日志等级设置翻译失败:', e);
            }
        } catch (e) {
            console.error('更新设置页面翻译失败:', e);
        }

        // 更新编辑配置对话框
        try {
            // 标题
            const configTitle = document.querySelector('#editConfigModal .modal-content h3');
            if (configTitle) {
                configTitle.textContent = getTranslation('edit_config_title', {}, this.currentLanguage);
            }

            // 表单标签
            try {
                // 直接使用ID选择器，避免使用nth-child
                const freqLabel = document.querySelector('label[for="freqInput"]');
                if (freqLabel) {
                    freqLabel.textContent = getTranslation('edit_config_freq', {}, this.currentLanguage);
                }

                // 更新频率输入提示
                const freqHint = document.querySelector('#freqInput + small.input-hint');
                if (freqHint) {
                    freqHint.textContent = getTranslation('edit_config_freq_hint', {}, this.currentLanguage);
                }

                // 电压标签
                const voltLabel = document.querySelector('label[for="voltSelect"]');
                if (voltLabel) {
                    voltLabel.textContent = getTranslation('edit_config_volt', {}, this.currentLanguage);
                }

                // 内存档位标签
                const ddrLabel = document.querySelector('.form-group label');
                if (ddrLabel && ddrLabel.textContent.includes('档位')) {
                    ddrLabel.textContent = getTranslation('edit_config_ddr', {}, this.currentLanguage);
                }
            } catch (e) {
                console.error('更新编辑配置表单标签翻译失败:', e);
            }

            // 内存档位选项
            try {
                const ddrDefaultOption = document.querySelector('#ddrOptions .option[data-value="999"]');
                if (ddrDefaultOption) {
                    ddrDefaultOption.textContent = getTranslation('edit_config_ddr_default', {}, this.currentLanguage);
                }

                const ddrHighestOption = document.querySelector('#ddrOptions .option[data-value="0"]');
                if (ddrHighestOption) {
                    ddrHighestOption.textContent = getTranslation('edit_config_ddr_highest', {}, this.currentLanguage);
                }

                const ddrHighOption = document.querySelector('#ddrOptions .option[data-value="1"]');
                if (ddrHighOption) {
                    ddrHighOption.textContent = getTranslation('edit_config_ddr_high', {}, this.currentLanguage);
                }

                const ddrMediumOption = document.querySelector('#ddrOptions .option[data-value="2"]');
                if (ddrMediumOption) {
                    ddrMediumOption.textContent = getTranslation('edit_config_ddr_medium', {}, this.currentLanguage);
                }

                const ddrLowOption = document.querySelector('#ddrOptions .option[data-value="3"]');
                if (ddrLowOption) {
                    ddrLowOption.textContent = getTranslation('edit_config_ddr_low', {}, this.currentLanguage);
                }
            } catch (e) {
                console.error('更新内存档位选项翻译失败:', e);
            }

            // 按钮
            const saveItemBtn = document.getElementById('saveItemBtn');
            if (saveItemBtn) {
                saveItemBtn.textContent = getTranslation('edit_config_save', {}, this.currentLanguage);
            }

            const cancelEditBtn = document.getElementById('cancelEditBtn');
            if (cancelEditBtn) {
                cancelEditBtn.textContent = getTranslation('edit_config_cancel', {}, this.currentLanguage);
            }

            const deleteItemBtn = document.getElementById('deleteItemBtn');
            if (deleteItemBtn) {
                deleteItemBtn.textContent = getTranslation('edit_config_delete', {}, this.currentLanguage);
            }
        } catch (e) {
            console.error('更新编辑配置对话框翻译失败:', e);
        }

        // 更新编辑游戏对话框
        try {
            const gameTitle = document.querySelector('#editGameModal .modal-content h3');
            if (gameTitle) {
                gameTitle.textContent = getTranslation('edit_game_title', {}, this.currentLanguage);
            }

            const packageLabel = document.querySelector('#editGameModal .form-group label');
            if (packageLabel) {
                packageLabel.textContent = getTranslation('edit_game_package', {}, this.currentLanguage);
            }

            const packageInput = document.getElementById('packageNameInput');
            if (packageInput) {
                packageInput.placeholder = getTranslation('edit_game_package_example', {}, this.currentLanguage);
            }

            const saveGameBtn = document.getElementById('saveGameBtn');
            if (saveGameBtn) {
                saveGameBtn.textContent = getTranslation('edit_game_save', {}, this.currentLanguage);
            }

            const cancelGameBtn = document.getElementById('cancelGameBtn');
            if (cancelGameBtn) {
                cancelGameBtn.textContent = getTranslation('edit_game_cancel', {}, this.currentLanguage);
            }
        } catch (e) {
            console.error('更新编辑游戏对话框翻译失败:', e);
        }

        // 批量应用data-i18n国际化
        try {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key && translations[this.currentLanguage] && translations[this.currentLanguage][key]) {
                    el.textContent = getTranslation(key, {}, this.currentLanguage);
                }
            });
        } catch {
            console.error('批量应用data-i18n国际化失败');
        }
    }

    // 更新选中的语言按钮状态
    updateSelectedLanguageText(languageSetting) {
        try {
            if (!this.languageContainer) return;
            
            // 移除所有按钮的选中状态
            const languageButtons = this.languageContainer.querySelectorAll('.settings-tab-btn');
            languageButtons.forEach(btn => btn.classList.remove('active'));

            // 根据语言设置选中对应的按钮
            const selectedButton = this.languageContainer.querySelector(`.settings-tab-btn[data-value="${languageSetting}"]`);
            if (selectedButton) {
                selectedButton.classList.add('active');
            } else {
                // 默认选中跟随系统
                const systemButton = this.languageContainer.querySelector('.settings-tab-btn[data-value="system"]');
                if (systemButton) {
                    systemButton.classList.add('active');
                }
            }
        } catch (e) {
            console.error('更新语言按钮状态失败:', e);
            // 默认选中跟随系统按钮
            if (this.languageContainer) {
                const systemButton = this.languageContainer.querySelector('.settings-tab-btn[data-value="system"]');
                if (systemButton) {
                    systemButton.classList.add('active');
                }
            }
        }
    }

    async loadData() {
        // 添加错误处理的辅助函数
        const safeExecute = async (fn, fallbackMessage) => {
            try {
                await fn();
            } catch (err) {
                console.error(`${fallbackMessage}:`, err);
            }
        };

        // 逐个加载数据，每个函数都有自己的错误处理
        await safeExecute(() => this.checkModuleStatus(), '检查模块状态失败');
        await safeExecute(() => this.loadModuleVersion(), '加载模块版本失败');
        await safeExecute(() => this.loadCurrentMode(), '加载当前模式失败');

        await safeExecute(() => this.configManager.loadGpuConfig(), '加载GPU配置失败');
        await safeExecute(() => this.gamesManager.loadGamesList(), '加载游戏列表失败');
        await safeExecute(() => this.logManager.loadLog(), '加载日志失败');
        await safeExecute(() => this.settingsManager.loadLogLevel(), '加载日志等级设置失败');

        // 初始化页面显示
        this.switchPage('page-status'); // 默认显示状态页面
    }

    // 切换页面
    switchPage(pageId) {
        // 隐藏所有页面
        this.pages.forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 更新导航按钮状态
        this.navItems.forEach(item => {
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        this.currentPage = pageId;
    }

    // 检查模块状态
    async checkModuleStatus() {
        try {
            // 使用简单命令检查服务是否运行
            const { errno, stdout } = await exec('pgrep -f gpugovernor || echo ""');

            const newStatus = errno === 0 && stdout.trim();
            const currentStatus = this.runningStatus && this.runningStatus.classList.contains('status-running');

            // 如果状态发生变化，添加动画效果
            if (newStatus !== currentStatus && this.runningStatus) {
                this.runningStatus.classList.add('status-changing');

                setTimeout(() => {
                    if (newStatus) {
                        this.runningStatus.textContent = getTranslation('status_running_active', {}, this.currentLanguage);
                        this.runningStatus.className = 'status-badge status-running';
                    } else {
                        this.runningStatus.textContent = getTranslation('status_running_inactive', {}, this.currentLanguage);
                        this.runningStatus.className = 'status-badge status-stopped';
                    }

                    // 移除动画类
                    setTimeout(() => {
                        if (this.runningStatus) {
                            this.runningStatus.classList.remove('status-changing');
                        }
                    }, 600);
                }, 100);
            }
        } catch (error) {
            console.error('检查模块状态失败:', error);
            if (this.runningStatus) {
                this.runningStatus.textContent = getTranslation('status_checking', {}, this.currentLanguage);
                this.runningStatus.className = 'status-badge status-stopped';
            }
        }
    }

    // 加载模块版本
    async loadModuleVersion() {
        try {
            // 从module.prop文件中获取版本信息
            const { errno, stdout } = await exec('grep -i "^version=" /data/adb/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2');

            if (errno === 0 && stdout.trim()) {
                if (this.moduleVersion) {
                    this.moduleVersion.textContent = stdout.trim();
                }
            } else {
                // 尝试从KSU模块路径获取
                const { errno: errno2, stdout: stdout2 } = await exec('grep -i "^version=" /data/adb/ksu/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2');

                if (errno2 === 0 && stdout2.trim()) {
                    if (this.moduleVersion) {
                        this.moduleVersion.textContent = stdout2.trim();
                    }
                } else {
                    // 使用当前语言的"未知"文本
                    if (this.moduleVersion) {
                        this.moduleVersion.textContent = this.currentLanguage === 'en' ? 'Unknown' : '未知';
                    }
                }
            }
        } catch (error) {
            console.error('加载模块版本失败:', error);
            // 使用当前语言的"未知"文本
            if (this.moduleVersion) {
                this.moduleVersion.textContent = this.currentLanguage === 'en' ? 'Unknown' : '未知';
            }
        }
    }

    // 加载当前模式
    async loadCurrentMode() {
        try {
            const { errno, stdout } = await exec(`cat ${PATHS.CURRENT_MODE_PATH} 2>/dev/null || echo "unknown"`);
            
            let mode = 'unknown';
            if (errno === 0) {
                mode = stdout.trim().toLowerCase();
            }
            
            // 验证模式是否有效
            const validModes = ['powersave', 'balance', 'performance', 'fast'];
            if (!validModes.includes(mode)) {
                mode = 'unknown';
            }
            
            // 更新显示
            if (this.currentMode) {
                const modeText = {
                    'powersave': getTranslation('status_mode_powersave', {}, this.currentLanguage),
                    'balance': getTranslation('status_mode_balance', {}, this.currentLanguage), 
                    'performance': getTranslation('status_mode_performance', {}, this.currentLanguage),
                    'fast': getTranslation('status_mode_fast', {}, this.currentLanguage),
                    'unknown': getTranslation('status_mode_unknown', {}, this.currentLanguage)
                };
                
                this.currentMode.textContent = modeText[mode] || getTranslation('status_mode_unknown', {}, this.currentLanguage);
                this.currentMode.className = `mode-badge ${mode}`;
            }
        } catch (error) {
            console.error('加载当前模式失败:', error);
            if (this.currentMode) {
                this.currentMode.textContent = getTranslation('status_mode_unknown', {}, this.currentLanguage);
                this.currentMode.className = 'mode-badge default';
            }
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    const app = new MainApp();
    await app.init();
});