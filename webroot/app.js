// 使用KernelSU API
// KernelSU WebUI环境中，API通过全局对象ksu提供
function exec(command, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            const callbackName = `exec_callback_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
            window[callbackName] = (errno, stdout, stderr) => {
                resolve({ errno, stdout, stderr });
                delete window[callbackName];
            };
            ksu.exec(command, JSON.stringify(options), callbackName);
        } catch (error) {
            reject(error);
        }
    });
}

function toast(message) {
    try {
        ksu.toast(message);
    } catch (error) {
        console.error('Toast失败:', error);
    }
}

// DOM元素
const app = document.getElementById('app');
const loading = document.getElementById('loading');
const themeToggle = document.getElementById('themeToggle');
const runningStatus = document.getElementById('runningStatus');

const moduleVersion = document.getElementById('moduleVersion');
const followSystemThemeToggle = document.querySelector('#followSystemThemeToggle .miuix-switch-input');
const followSystemThemeSuperSwitch = document.getElementById('followSystemThemeSuperSwitch');
const logLevelContainer = document.getElementById('logLevelContainer');
const logContent = document.getElementById('logContent');
const refreshLogBtn = document.getElementById('refreshLogBtn');
const gpuFreqTable = document.getElementById('gpuFreqTable').querySelector('tbody');
const gamesList = document.getElementById('gamesList');
const marginValue_elem = document.getElementById('marginValue');
const marginDecreaseBtn = document.getElementById('marginDecreaseBtn');
const marginIncreaseBtn = document.getElementById('marginIncreaseBtn');

// 语言设置相关DOM元素
const htmlRoot = document.getElementById('htmlRoot');
const languageContainer = document.getElementById('languageContainer');

// 自定义电压和内存档位选择器DOM元素
const selectedVolt = document.getElementById('selectedVolt');
const voltDecreaseBtn = document.getElementById('voltDecreaseBtn');
const voltIncreaseBtn = document.getElementById('voltIncreaseBtn');
const ddrContainer = document.getElementById('ddrContainer');
const selectedDdr = document.getElementById('selectedDdr');
const ddrOptions = document.getElementById('ddrOptions');

// 配置编辑相关DOM元素
const addConfigBtn = document.getElementById('addConfigBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const editConfigModal = document.getElementById('editConfigModal');
const closeModalBtn = document.querySelector('.close-modal');
const freqInput = document.getElementById('freqInput');
const voltSelect = document.getElementById('voltSelect');
const saveItemBtn = document.getElementById('saveItemBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const deleteItemBtn = document.getElementById('deleteItemBtn');

// 游戏列表编辑相关DOM元素
const addGameBtn = document.getElementById('addGameBtn');
const saveGamesBtn = document.getElementById('saveGamesBtn');
const editGameModal = document.getElementById('editGameModal');
const closeGameModalBtn = document.querySelector('.close-game-modal');
const packageNameInput = document.getElementById('packageNameInput');
const saveGameBtn = document.getElementById('saveGameBtn');
const cancelGameBtn = document.getElementById('cancelGameBtn');

// 页面导航相关DOM元素
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');

// 路径常量
const LOG_PATH = '/data/adb/gpu_governor/log';
const CONFIG_PATH = '/data/gpu_freq_table.conf';

const GAMES_FILE = '/data/adb/gpu_governor/game/games.conf'; // 游戏列表文件路径

const LOG_LEVEL_PATH = '/data/adb/gpu_governor/log/log_level';

// 电压列表
const VOLT_LIST = [
    65000, 64375, 63750, 63125, 62500, 61875, 61250, 60625, 60000,
    59375, 58750, 58125, 57500, 56875, 56250, 55625, 55000, 54375, 53750,
    53125, 52500, 51875, 51250, 50625, 50000, 49375, 48750, 48125, 47500,
    46875, 46250, 45625, 45000, 44375, 43750, 43125, 42500, 41875
];

// 全局变量
let gpuConfigs = []; // 存储当前的GPU配置
let editingIndex = -1; // 当前正在编辑的配置索引，-1表示新增
let gamesList_data = []; // 存储当前的游戏列表
let currentVoltIndex = 0; // 当前电压选择器的索引
let marginValue = 20; // 默认余量值
let currentLanguage = 'zh'; // 当前语言，默认中文


// 电压调整相关全局变量
const VOLT_STEP = 625; // 电压调整步长
const MAX_VOLT = 65000; // 电压最大值
const MIN_VOLT = 41875; // 电压最小值
let currentVoltValue = 65000; // 当前电压值
let isLongPress = false; // 是否是长按
let decreaseTimer = null; // 减小电压的定时器
let increaseTimer = null; // 增加电压的定时器
const pressDelay = 500; // 长按多久后开始连续触发（毫秒）
const pressInterval = 150; // 连续触发的间隔（毫秒）

// 翻译字典
const translations = {
    'zh': {
        // 页面标题
        'title': '天玑GPU调速器',
        // 加载提示
        'loading': '加载中',
        // 顶部标题
        'header_title': '天玑GPU调速器',
        // 底部导航
        'nav_status': '状态',
        'nav_config': '配置',
        'nav_log': '日志',
        'nav_settings': '设置',
        // 状态页面
        'status_title': '模块状态',
        'status_running': '运行状态:',
        'status_running_active': '运行中',
        'status_running_inactive': '未运行',
        'status_checking': '检查中...',

        'status_module_version': '模块版本:',
        'status_unknown': '未知',
        // 配置页面
        'config_gpu_title': 'GPU频率表',
        'config_freq': '频率 (MHz)',
        'config_volt': '电压 (uV)',
        'config_ddr': '内存档位',
        'config_edit': '编辑',
        'config_loading': '加载中...',
        'config_not_found': '未找到配置',
        'config_add': '添加配置',
        'config_save': '保存配置',
        'config_margin_title': 'GPU频率计算余量',
        'config_margin_percent': '余量百分比 (%):',
        'config_margin_desc1': '余量越大，GPU升频越积极，性能越充裕',
        'config_margin_desc2': '游戏模式下会自动增加10%的余量',
        'config_margin_save': '保存余量设置',
        'config_games_title': '游戏列表',
        'config_games_add': '添加游戏',
        'config_games_save': '保存列表',
        // 日志页面
        'log_title': '运行日志',
        'log_refresh': '刷新',
        'log_main': '主日志',
        'log_init': '初始化日志',
        'log_loading': '加载中...',
        'log_empty': '日志为空',
        'log_not_found': '未找到日志',
        'log_size_warning': '警告: 日志文件较大',
        // 设置页面
        'settings_title': '设置',
        'settings_theme_follow': '深色模式跟随系统',
        'settings_theme_follow_summary': '自动根据系统设置切换主题',
        'settings_language': '语言设置:',
        'settings_language_follow': '跟随系统',
        'settings_language_zh': '中文',
        'settings_language_en': 'English',
        'settings_language_desc1': '修改语言设置后实时生效',
        'settings_language_desc2': '跟随系统将自动检测系统语言设置',
        'settings_log_level': '主日志等级:',
        'settings_log_level_debug': 'Debug (详细)',
        'settings_log_level_info': 'Info (信息)',
        'settings_log_level_warn': 'Warn (警告)',
        'settings_log_level_error': 'Error (错误)',
        'settings_log_level_desc1': '修改日志等级后实时生效',
        'settings_log_level_desc2': '设置为Debug级别将启用详细日志记录',
        // 编辑配置对话框
        'edit_config_title': '编辑GPU配置',
        'edit_config_freq': '频率 (MHz):',
        'edit_config_freq_hint': '请输入KHz值，表格中显示为MHz',
        'edit_config_volt': '电压 (uV):',
        'edit_config_ddr': '内存档位:',
        'edit_config_ddr_default': '999 (不调整)',
        'edit_config_ddr_highest': '0 (最高)',
        'edit_config_ddr_high': '1',
        'edit_config_ddr_medium': '2',
        'edit_config_ddr_low': '3 (最低)',
        'edit_config_save': '保存',
        'edit_config_cancel': '取消',
        'edit_config_delete': '删除',
        // 编辑游戏对话框
        'edit_game_title': '编辑游戏列表',
        'edit_game_package': '应用包名:',
        'edit_game_package_example': '例如: com.tencent.tmgp.sgame',
        'edit_game_save': '保存',
        'edit_game_cancel': '取消',
        // 提示消息
        'toast_webui_loaded': 'WebUI加载完成',
        'toast_theme_follow_disabled': '已关闭跟随系统主题，现在可以手动切换主题',
        'toast_theme_follow_enabled': '已开启跟随系统主题',
        'toast_theme_follow_keep': '已关闭跟随系统主题，将保持当前主题',
        'toast_theme_switched_dark': '已切换到深色模式',
        'toast_theme_switched_light': '已切换到浅色模式',

        'toast_config_updated': '配置已更新，请点击"保存配置"按钮保存到文件',
        'toast_config_deleted': '配置已删除，请点击"保存配置"按钮保存到文件',
        'toast_config_saved': '配置已成功保存',
        'toast_config_save_fail': '保存配置失败，请检查权限',
        'toast_config_empty': '没有配置可保存',
        'toast_freq_invalid': '请输入有效的频率值',
        'toast_index_invalid': '无效的配置索引',
        'toast_margin_saved': '余量设置已成功保存',
        'toast_margin_save_fail': '保存余量设置失败，请检查权限',
        'toast_game_added': '游戏已添加，请点击"保存列表"按钮保存到文件',
        'toast_game_deleted': '游戏已删除，请点击"保存列表"按钮保存到文件',
        'toast_game_exists': '该应用包名已存在于列表中',
        'toast_game_invalid': '请输入有效的应用包名',
        'toast_games_saved': '游戏列表已成功保存',
        'toast_games_save_fail': '保存游戏列表失败，请检查权限',
        'toast_games_empty': '没有游戏可保存',
        'toast_log_level_debug': '日志等级已设置为: debug，详细日志记录已启用',
        'toast_log_level_set': '日志等级已设置为: {level}，已实时生效',
        'toast_log_level_fail': '保存日志等级失败，请检查权限',
        'toast_language_changed': '语言已切换为{language}',
        'toast_language_follow_system': '语言已设置为跟随系统',
        // 版权信息
        'copyright_text': '天玑GPU调速器 © 2025 酷安@瓦力喀 / Github@Seyud',
        'config_games_not_found': '未找到游戏',
        'config_games_list_not_found': '未找到游戏列表'
    },
    'en': {
        // Page title
        'title': 'Dimensity GPU Governor',
        // Loading hint
        'loading': 'Loading',
        // Header title
        'header_title': 'Dimensity GPU Governor',
        // Bottom navigation
        'nav_status': 'Status',
        'nav_config': 'Config',
        'nav_log': 'Log',
        'nav_settings': 'Settings',
        // Status page
        'status_title': 'Module Status',
        'status_running': 'Running Status:',
        'status_running_active': 'Running',
        'status_running_inactive': 'Not Running',
        'status_checking': 'Checking...',

        'status_module_version': 'Module Version:',
        'status_unknown': 'Unknown',
        // Config page
        'config_gpu_title': 'GPU Frequency Table',
        'config_freq': 'Frequency (MHz)',
        'config_volt': 'Voltage (uV)',
        'config_ddr': 'Memory Level',
        'config_edit': 'Edit',
        'config_loading': 'Loading...',
        'config_not_found': 'No configuration found',
        'config_add': 'Add Config',
        'config_save': 'Save Config',
        'config_margin_title': 'GPU Frequency Calculation Margin',
        'config_margin_percent': 'Margin Percentage (%):',
        'config_margin_desc1': 'Higher margin means more aggressive frequency scaling and better performance',
        'config_margin_desc2': 'Game mode automatically adds 10% to the margin',
        'config_margin_save': 'Save Margin',
        'config_games_title': 'Games List',
        'config_games_add': 'Add Game',
        'config_games_save': 'Save List',
        // Log page
        'log_title': 'Runtime Log',
        'log_refresh': 'Refresh',
        'log_main': 'Main Log',
        'log_init': 'Init Log',
        'log_loading': 'Loading...',
        'log_empty': 'Log is empty',
        'log_not_found': 'Log not found',
        'log_size_warning': 'Warning: Log file size exceeds limit, it will be rotated automatically.',
        // Settings page
        'settings_title': 'Settings',
        'settings_theme_follow': 'Follow System Dark Mode',
        'settings_theme_follow_summary': 'Automatically switch theme based on system settings',
        'settings_language': 'Language:',
        'settings_language_follow': 'Follow System',
        'settings_language_zh': '中文',
        'settings_language_en': 'English',
        'settings_language_desc1': 'Language changes take effect immediately',
        'settings_language_desc2': 'Follow System will detect system language settings',
        'settings_log_level': 'Main Log Level:',
        'settings_log_level_debug': 'Debug (Detailed)',
        'settings_log_level_info': 'Info',
        'settings_log_level_warn': 'Warn',
        'settings_log_level_error': 'Error',
        'settings_log_level_desc1': 'Log level changes take effect immediately',
        'settings_log_level_desc2': 'Debug level enables detailed logging',
        // Edit config dialog
        'edit_config_title': 'Edit GPU Config',
        'edit_config_freq': 'Frequency (MHz):',
        'edit_config_freq_hint': 'Please enter KHz value, displayed as MHz in table',
        'edit_config_volt': 'Voltage (uV):',
        'edit_config_ddr': 'Memory Level:',
        'edit_config_ddr_default': '999 (No Change)',
        'edit_config_ddr_highest': '0 (Highest)',
        'edit_config_ddr_high': '1',
        'edit_config_ddr_medium': '2',
        'edit_config_ddr_low': '3 (Lowest)',
        'edit_config_save': 'Save',
        'edit_config_cancel': 'Cancel',
        'edit_config_delete': 'Delete',
        // Edit game dialog
        'edit_game_title': 'Edit Game List',
        'edit_game_package': 'Package Name:',
        'edit_game_package_example': 'Example: com.tencent.tmgp.sgame',
        'edit_game_save': 'Save',
        'edit_game_cancel': 'Cancel',
        // Toast messages
        'toast_webui_loaded': 'WebUI loaded successfully',
        'toast_theme_follow_disabled': 'System theme following disabled, you can now switch themes manually',
        'toast_theme_follow_enabled': 'System theme following enabled',
        'toast_theme_follow_keep': 'System theme following disabled, current theme will be kept',
        'toast_theme_switched_dark': 'Switched to dark mode',
        'toast_theme_switched_light': 'Switched to light mode',

        'toast_config_updated': 'Configuration updated, please click "Save Config" to save to file',
        'toast_config_deleted': 'Configuration deleted, please click "Save Config" to save to file',
        'toast_config_saved': 'Configuration saved successfully',
        'toast_config_save_fail': 'Failed to save configuration, please check permissions',
        'toast_config_empty': 'No configuration to save',
        'toast_freq_invalid': 'Please enter a valid frequency value',
        'toast_index_invalid': 'Invalid configuration index',
        'toast_margin_saved': 'Margin settings saved successfully',
        'toast_margin_save_fail': 'Failed to save margin settings, please check permissions',
        'toast_game_added': 'Game added, please click "Save List" to save to file',
        'toast_game_deleted': 'Game deleted, please click "Save List" to save to file',
        'toast_game_exists': 'This package name already exists in the list',
        'toast_game_invalid': 'Please enter a valid package name',
        'toast_games_saved': 'Games list saved successfully',
        'toast_games_save_fail': 'Failed to save games list, please check permissions',
        'toast_games_empty': 'No games to save',
        'toast_log_level_debug': 'Log level set to: debug, detailed logging has been enabled',
        'toast_log_level_set': 'Log level set to: {level}, changes applied immediately',
        'toast_log_level_fail': 'Failed to save log level, please check permissions',
        'toast_language_changed': 'Language changed to {language}',
        'toast_language_follow_system': 'Language set to follow system',
        // Copyright information
        'copyright_text': 'Dimensity GPU Governor © 2025 Coolapk@Walika / Github@Seyud',
        'config_games_not_found': 'No games found',
        'config_games_list_not_found': 'No games list found'
    }
};

// 获取翻译文本
function getTranslation(key, replacements = {}) {
    // 获取当前语言的翻译
    const translation = translations[currentLanguage] || translations['zh'];

    // 获取翻译文本
    let text = translation[key] || key;

    // 替换占位符
    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(`{${placeholder}}`, value);
    }

    return text;
}

// 应用翻译到界面
function applyTranslations() {
    try {
        // 更新页面标题
        document.title = getTranslation('title');

        // 更新HTML语言属性
        if (htmlRoot) {
            htmlRoot.setAttribute('lang', currentLanguage === 'en' ? 'en' : 'zh-CN');
        }

        // 更新加载提示
        if (loading) {
            loading.textContent = getTranslation('loading');
        }

        // 更新顶部标题
        const headerTitle = document.querySelector('.header-content h1');
        if (headerTitle) {
            headerTitle.textContent = getTranslation('header_title');
        }

        // 更新底部导航
        document.querySelectorAll('.nav-item').forEach(item => {
            try {
                const pageId = item.getAttribute('data-page');
                const navText = item.querySelector('.nav-text');
                if (!navText) return;

                if (pageId === 'page-status') {
                    navText.textContent = getTranslation('nav_status');
                } else if (pageId === 'page-config') {
                    navText.textContent = getTranslation('nav_config');
                } else if (pageId === 'page-log') {
                    navText.textContent = getTranslation('nav_log');
                } else if (pageId === 'page-settings') {
                    navText.textContent = getTranslation('nav_settings');
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
            statusTitle.textContent = getTranslation('status_title');
        }

        const runningLabel = document.querySelector('#statusCard .status-item:nth-child(1) .status-text');
        if (runningLabel) {
            runningLabel.textContent = getTranslation('status_running');
        }

        const versionLabel = document.querySelector('#statusCard .status-item:nth-child(2) .status-text');
        if (versionLabel) {
            versionLabel.textContent = getTranslation('status_module_version');
        }

        // 更新模块版本文本，如果是"未知"或"Unknown"，则使用翻译
        const versionValue = document.getElementById('moduleVersion');
        if (versionValue && (versionValue.textContent === '未知' || versionValue.textContent === 'Unknown')) {
            versionValue.textContent = getTranslation('status_unknown');
        }



        // 更新版权信息
        const copyrightText = document.querySelector('#copyrightCard .copyright-content p');
        if (copyrightText) {
            copyrightText.textContent = getTranslation('copyright_text');
        }

        // 根据当前状态更新运行状态文本
        const statusBadge = document.getElementById('runningStatus');
        if (statusBadge) {
            if (statusBadge.classList.contains('status-running')) {
                statusBadge.textContent = getTranslation('status_running_active');
            } else if (statusBadge.classList.contains('status-stopped')) {
                statusBadge.textContent = getTranslation('status_running_inactive');
            } else {
                statusBadge.textContent = getTranslation('status_checking');
            }
        }
    } catch (e) {
        console.error('更新状态页面翻译失败:', e);
    }

    // 更新配置页面
    try {
        // GPU配置表
        const gpuConfigTitle = document.querySelector('#gpuConfigCard .card-title');
        if (gpuConfigTitle) {
            gpuConfigTitle.textContent = getTranslation('config_gpu_title');
        }

        // 表头
        try {
            const freqHeader = document.querySelector('#gpuFreqTable thead tr th:nth-child(1)');
            if (freqHeader) {
                freqHeader.textContent = getTranslation('config_freq');
            }

            const voltHeader = document.querySelector('#gpuFreqTable thead tr th:nth-child(2)');
            if (voltHeader) {
                voltHeader.textContent = getTranslation('config_volt');
            }

            const ddrHeader = document.querySelector('#gpuFreqTable thead tr th:nth-child(3)');
            if (ddrHeader) {
                ddrHeader.textContent = getTranslation('config_ddr');
            }

            const editHeader = document.querySelector('#gpuFreqTable thead tr th:nth-child(4)');
            if (editHeader) {
                editHeader.textContent = getTranslation('config_edit');
            }
        } catch (e) {
            console.error('更新表头翻译失败:', e);
        }

        // 按钮
        const addConfigBtn = document.getElementById('addConfigBtn');
        if (addConfigBtn) {
            const btnText = addConfigBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = getTranslation('config_add');
            }
        }

        const saveConfigBtn = document.getElementById('saveConfigBtn');
        if (saveConfigBtn) {
            const btnText = saveConfigBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = getTranslation('config_save');
            }
        }

        // 更新余量配置
        try {
            const marginTitle = document.querySelector('#marginCard .card-title');
            if (marginTitle) {
                marginTitle.textContent = getTranslation('config_margin_title');
            }

            const marginLabel = document.querySelector('#marginCard .status-item > span:first-child');
            if (marginLabel) {
                marginLabel.textContent = getTranslation('config_margin_percent');
            }

            const marginDesc1 = document.querySelector('#marginCard .setting-description small:nth-child(1)');
            if (marginDesc1) {
                marginDesc1.textContent = getTranslation('config_margin_desc1');
            }

            const marginDesc2 = document.querySelector('#marginCard .setting-description small:nth-child(2)');
            if (marginDesc2) {
                marginDesc2.textContent = getTranslation('config_margin_desc2');
            }

            const saveMarginBtn = document.getElementById('saveMarginBtn');
            if (saveMarginBtn) {
                saveMarginBtn.textContent = getTranslation('config_margin_save');
            }
        } catch (e) {
            console.error('更新余量配置翻译失败:', e);
        }

        // 更新游戏列表
        try {
            const gamesTitle = document.querySelector('#gamesCard .card-title');
            if (gamesTitle) {
                gamesTitle.textContent = getTranslation('config_games_title');
            }

            const addGameBtn = document.getElementById('addGameBtn');
            if (addGameBtn) {
                addGameBtn.textContent = getTranslation('config_games_add');
            }

            const saveGamesBtn = document.getElementById('saveGamesBtn');
            if (saveGamesBtn) {
                saveGamesBtn.textContent = getTranslation('config_games_save');
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
            logTitle.textContent = getTranslation('log_title');
        }

        // 更新标签页按钮文本
        const mainLogTabText = document.querySelector('.log-tab-btn[data-log="gpu_gov.log"] .tab-text');
        if (mainLogTabText) {
            mainLogTabText.textContent = getTranslation('log_main');
        }

        const initLogTabText = document.querySelector('.log-tab-btn[data-log="initsvc.log"] .tab-text');
        if (initLogTabText) {
            initLogTabText.textContent = getTranslation('log_init');
        }

        // 更新刷新按钮文本
        const refreshLogBtnText = document.querySelector('#refreshLogBtn span:not(.refresh-icon)');
        if (refreshLogBtnText) {
            refreshLogBtnText.textContent = getTranslation('log_refresh');
        }
    } catch (e) {
        console.error('更新日志页面翻译失败:', e);
    }

    // 更新设置页面
    try {
        const settingsTitle = document.querySelector('#settingsCard .card-title');
        if (settingsTitle) {
            settingsTitle.textContent = getTranslation('settings_title');
        }

        // 主题设置
        const themeFollowLabel = document.querySelector('#settingsCard .status-item:nth-child(1) > span:first-child');
        if (themeFollowLabel) {
            themeFollowLabel.textContent = getTranslation('settings_theme_follow');
        }

        // 语言设置 - 现在通过data-i18n属性和批量处理来更新
        // 不再需要手动更新每个语言选项，因为它们都有data-i18n属性

        // 日志等级设置
        try {
            const logLevelLabel = document.querySelector('#settingsCard .status-item:nth-child(3) > span:first-child');
            if (logLevelLabel) {
                logLevelLabel.textContent = getTranslation('settings_log_level');
            }

            const debugOption = document.querySelector('#logLevelOptions .option[data-value="debug"]');
            if (debugOption) {
                debugOption.textContent = getTranslation('settings_log_level_debug');
            }

            const infoOption = document.querySelector('#logLevelOptions .option[data-value="info"]');
            if (infoOption) {
                infoOption.textContent = getTranslation('settings_log_level_info');
            }

            const warnOption = document.querySelector('#logLevelOptions .option[data-value="warn"]');
            if (warnOption) {
                warnOption.textContent = getTranslation('settings_log_level_warn');
            }

            const errorOption = document.querySelector('#logLevelOptions .option[data-value="error"]');
            if (errorOption) {
                errorOption.textContent = getTranslation('settings_log_level_error');
            }

            const logLevelDesc1 = document.querySelector('#logLevelContainer + .setting-description small:nth-child(1)');
            if (logLevelDesc1) {
                logLevelDesc1.textContent = getTranslation('settings_log_level_desc1');
            }

            const logLevelDesc2 = document.querySelector('#logLevelContainer + .setting-description small:nth-child(2)');
            if (logLevelDesc2) {
                logLevelDesc2.textContent = getTranslation('settings_log_level_desc2');
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
            configTitle.textContent = getTranslation('edit_config_title');
        }

        // 表单标签
        try {
            // 直接使用ID选择器，避免使用nth-child
            const freqLabel = document.querySelector('label[for="freqInput"]');
            if (freqLabel) {
                freqLabel.textContent = getTranslation('edit_config_freq');
            }

            // 更新频率输入提示
            const freqHint = document.querySelector('#freqInput + small.input-hint');
            if (freqHint) {
                freqHint.textContent = getTranslation('edit_config_freq_hint');
            }

            // 电压标签
            const voltLabel = document.querySelector('label[for="voltSelect"]');
            if (voltLabel) {
                voltLabel.textContent = getTranslation('edit_config_volt');
            }

            // 内存档位标签
            const ddrLabel = document.querySelector('.form-group label');
            if (ddrLabel && ddrLabel.textContent.includes('档位')) {
                ddrLabel.textContent = getTranslation('edit_config_ddr');
            }
        } catch (e) {
            console.error('更新编辑配置表单标签翻译失败:', e);
        }

        // 内存档位选项
        try {
            const ddrDefaultOption = document.querySelector('#ddrOptions .option[data-value="999"]');
            if (ddrDefaultOption) {
                ddrDefaultOption.textContent = getTranslation('edit_config_ddr_default');
            }

            const ddrHighestOption = document.querySelector('#ddrOptions .option[data-value="0"]');
            if (ddrHighestOption) {
                ddrHighestOption.textContent = getTranslation('edit_config_ddr_highest');
            }

            const ddrHighOption = document.querySelector('#ddrOptions .option[data-value="1"]');
            if (ddrHighOption) {
                ddrHighOption.textContent = getTranslation('edit_config_ddr_high');
            }

            const ddrMediumOption = document.querySelector('#ddrOptions .option[data-value="2"]');
            if (ddrMediumOption) {
                ddrMediumOption.textContent = getTranslation('edit_config_ddr_medium');
            }

            const ddrLowOption = document.querySelector('#ddrOptions .option[data-value="3"]');
            if (ddrLowOption) {
                ddrLowOption.textContent = getTranslation('edit_config_ddr_low');
            }
        } catch (e) {
            console.error('更新内存档位选项翻译失败:', e);
        }

        // 按钮
        const saveItemBtn = document.getElementById('saveItemBtn');
        if (saveItemBtn) {
            saveItemBtn.textContent = getTranslation('edit_config_save');
        }

        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.textContent = getTranslation('edit_config_cancel');
        }

        const deleteItemBtn = document.getElementById('deleteItemBtn');
        if (deleteItemBtn) {
            deleteItemBtn.textContent = getTranslation('edit_config_delete');
        }
    } catch (e) {
        console.error('更新编辑配置对话框翻译失败:', e);
    }

    // 更新编辑游戏对话框
    try {
        const gameTitle = document.querySelector('#editGameModal .modal-content h3');
        if (gameTitle) {
            gameTitle.textContent = getTranslation('edit_game_title');
        }

        const packageLabel = document.querySelector('#editGameModal .form-group label');
        if (packageLabel) {
            packageLabel.textContent = getTranslation('edit_game_package');
        }

        const packageInput = document.getElementById('packageNameInput');
        if (packageInput) {
            packageInput.placeholder = getTranslation('edit_game_package_example');
        }

        const saveGameBtn = document.getElementById('saveGameBtn');
        if (saveGameBtn) {
            saveGameBtn.textContent = getTranslation('edit_game_save');
        }

        const cancelGameBtn = document.getElementById('cancelGameBtn');
        if (cancelGameBtn) {
            cancelGameBtn.textContent = getTranslation('edit_game_cancel');
        }
    } catch (e) {
        console.error('更新编辑游戏对话框翻译失败:', e);
    }

    // 更新当前选中的日志等级文本
    try {
        if (selectedLogLevel) {
            const currentText = selectedLogLevel.textContent;
            // 根据当前文本内容来判断日志等级并更新翻译
            if (currentText.includes('Debug') || currentText.includes('详细')) {
                selectedLogLevel.textContent = getTranslation('settings_log_level_debug');
            } else if (currentText.includes('Info') || currentText.includes('信息')) {
                selectedLogLevel.textContent = getTranslation('settings_log_level_info');
            } else if (currentText.includes('Warn') || currentText.includes('警告')) {
                selectedLogLevel.textContent = getTranslation('settings_log_level_warn');
            } else if (currentText.includes('Error') || currentText.includes('错误')) {
                selectedLogLevel.textContent = getTranslation('settings_log_level_error');
            }
        }
    } catch (e) {
        console.error('更新当前日志等级文本失败:', e);
    }

    // 新增：切换语言时刷新动态内容
    try {
        if (typeof refreshGpuTable === 'function') {
            refreshGpuTable();
        }
    } catch (e) {
        console.error('刷新GPU配置表格失败:', e);
    }
    try {
        if (typeof refreshGamesList === 'function') {
            refreshGamesList();
        }
    } catch (e) {
        console.error('刷新游戏列表失败:', e);
    }

    // 新增：批量应用data-i18n国际化（适用于主日志等级等静态文本）
    try {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && translations[currentLanguage] && translations[currentLanguage][key]) {
                el.textContent = getTranslation(key);
            }
        });
    } catch (e) {
        console.error('批量应用data-i18n国际化失败:', e);
    }
}

// 检测系统语言
async function detectSystemLanguage() {
    try {
        // 尝试使用浏览器API获取系统语言
        const browserLanguage = navigator.language || navigator.userLanguage || 'zh-CN';
        console.log(`检测到浏览器语言: ${browserLanguage}`);

        // 尝试使用KernelSU API获取系统语言（如果可用）
        try {
            const { errno, stdout } = await exec('getprop persist.sys.locale || getprop ro.product.locale || echo "zh-CN"');

            if (errno === 0 && stdout.trim()) {
                const locale = stdout.trim().toLowerCase();
                console.log(`检测到系统语言: ${locale}`);

                // 根据语言代码判断
                if (locale.startsWith('en')) {
                    return 'en';
                } else {
                    return 'zh';
                }
            }
        } catch (e) {
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

// 初始化语言设置
async function initLanguage() {
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
        currentLanguage = await detectSystemLanguage();
        localStorage.setItem('language', currentLanguage);
    } else if (savedLanguage) {
        // 如果没有设置跟随系统，但有保存的语言，则使用保存的语言
        currentLanguage = savedLanguage;
    }

    // 先应用翻译，确保所有文本都被正确翻译
    applyTranslations();

    // 然后更新选中的语言显示文本
    updateSelectedLanguageText(savedLanguageSetting || 'system');

    // 设置语言选择器事件
    setupLanguageEvents();
}

// 更新选中的语言按钮状态
function updateSelectedLanguageText(languageSetting) {
    try {
        // 移除所有按钮的选中状态
        const languageButtons = document.querySelectorAll('#languageContainer .settings-tab-btn');
        languageButtons.forEach(btn => btn.classList.remove('active'));

        // 根据语言设置选中对应的按钮
        const selectedButton = document.querySelector(`#languageContainer .settings-tab-btn[data-value="${languageSetting}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        } else {
            // 默认选中跟随系统
            const systemButton = document.querySelector('#languageContainer .settings-tab-btn[data-value="system"]');
            if (systemButton) {
                systemButton.classList.add('active');
            }
        }
    } catch (e) {
        console.error('更新语言按钮状态失败:', e);
        // 默认选中跟随系统按钮
        const systemButton = document.querySelector('#languageContainer .settings-tab-btn[data-value="system"]');
        if (systemButton) {
            systemButton.classList.add('active');
        }
    }
}

// 设置语言选择器事件
function setupLanguageEvents() {
    // 获取所有语言按钮
    const languageButtons = document.querySelectorAll('#languageContainer .settings-tab-btn');

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

            // 如果选择了跟随系统
            if (selectedValue === 'system') {
                // 检测系统语言
                const systemLanguage = await detectSystemLanguage();
                currentLanguage = systemLanguage;
                localStorage.setItem('language', systemLanguage);
                toast(getTranslation('toast_language_follow_system'));
            } else {
                // 直接使用选择的语言
                currentLanguage = selectedValue;
                localStorage.setItem('language', selectedValue);

                // 显示提示
                const languageName = selectedValue === 'zh' ? '中文' : 'English';
                toast(getTranslation('toast_language_changed', { language: languageName }));
            }

            // 应用翻译
            applyTranslations();
        });
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 先显示界面，避免长时间加载
        loading.style.display = 'none';
        app.style.display = 'block';

        // 检查主题
        initTheme();

        // 设置事件监听器
        setupEventListeners();

        // 初始化语言设置
        await initLanguage();

        // 加载数据
        initializeApp();

        // 注意：initMarginSetting()会在loadGpuConfig()完成后自动调用
    } catch (e) {
        console.error('初始化失败:', e);
        // 确保界面显示
        if (loading) loading.style.display = 'none';
        if (app) app.style.display = 'block';
    }
});

// 初始化应用
async function initializeApp() {
    try {
        // 先显示界面，避免长时间加载
        loading.style.display = 'none';
        app.style.display = 'block';

        // 添加错误处理的辅助函数
        const safeExecute = async (fn, fallbackMessage) => {
            try {
                await fn();
            } catch (err) {
                console.error(`${fallbackMessage}:`, err);
            }
        };

        // 逐个加载数据，每个函数都有自己的错误处理
        await safeExecute(checkModuleStatus, '检查模块状态失败');
        await safeExecute(loadModuleVersion, '加载模块版本失败');

        await safeExecute(loadGpuConfig, '加载GPU配置失败');
        await safeExecute(loadGamesList, '加载游戏列表失败');
        await safeExecute(initLogFileSelect, '初始化日志文件选择器失败');
        await safeExecute(loadLog, '加载日志失败');
        await safeExecute(loadLogLevel, '加载日志等级设置失败');

        // 确保电压选择器已初始化
        await safeExecute(initVoltSelect, '初始化电压选择器失败');

        // 初始化页面显示
        switchPage('page-status'); // 默认显示状态页面



        // 加载完成后显示提示
        try {
            toast(getTranslation('toast_webui_loaded'));
        } catch (e) {
            console.log(getTranslation('toast_webui_loaded'));
        }
    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// 初始化主题
function initTheme() {
    // 检查是否有用户保存的主题设置
    const savedTheme = localStorage.getItem('theme');

    // 检查系统是否支持深色模式检测
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 检查用户是否设置了跟随系统主题，默认为true（跟随系统）
    const followSystemThemeSetting = localStorage.getItem('followSystemTheme');
    const followSystemTheme = followSystemThemeSetting === null ? true : followSystemThemeSetting === 'true';

    // 设置跟随系统主题开关的状态
    followSystemThemeToggle.checked = followSystemTheme;

    // 如果是首次使用，将跟随系统设置保存到localStorage
    if (followSystemThemeSetting === null) {
        localStorage.setItem('followSystemTheme', 'true');
    }

    // 根据设置决定使用哪个主题
    let theme;
    if (followSystemTheme) {
        // 如果设置了跟随系统，则使用系统主题
        theme = prefersDarkMode ? 'dark' : 'light';
    } else if (savedTheme) {
        // 如果没有设置跟随系统，但有保存的主题，则使用保存的主题
        theme = savedTheme;
    } else {
        // 如果既没有设置跟随系统，也没有保存的主题，则默认使用系统主题
        theme = prefersDarkMode ? 'dark' : 'light';
    }

    // 应用主题
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // 监听系统主题变化
    if (window.matchMedia) {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (darkModeMediaQuery.addEventListener) {
            darkModeMediaQuery.addEventListener('change', (e) => {
                // 只有当设置了跟随系统主题时，才跟随系统设置
                if (localStorage.getItem('followSystemTheme') === 'true') {
                    const newTheme = e.matches ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem('theme', newTheme);
                }
            });
        }
    }

    // 主题切换按钮点击事件
    themeToggle.addEventListener('click', () => {
        // 添加切换动画类
        themeToggle.classList.add('switching');

        // 如果设置了跟随系统主题，则先关闭跟随系统
        if (localStorage.getItem('followSystemTheme') === 'true') {
            localStorage.setItem('followSystemTheme', 'false');
            followSystemThemeToggle.checked = false;
            toast(getTranslation('toast_theme_follow_disabled'));
        }

        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        // 添加平滑过渡效果
        document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // 移除切换动画类
        setTimeout(() => {
            themeToggle.classList.remove('switching');
            document.documentElement.style.transition = '';
        }, 600);

        // 显示主题切换提示
        const themeKey = newTheme === 'dark' ? 'toast_theme_switched_dark' : 'toast_theme_switched_light';
        toast(getTranslation(themeKey));
    });

    // 跟随系统主题SuperSwitch事件 - 支持点击整个区域
    followSystemThemeSuperSwitch.addEventListener('click', (e) => {
        // 如果点击的是switch输入框本身，让它正常处理
        if (e.target === followSystemThemeToggle) {
            return;
        }

        // 阻止事件冒泡并切换开关状态
        e.preventDefault();

        // 添加触觉反馈（如果支持）
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        followSystemThemeToggle.checked = !followSystemThemeToggle.checked;

        // 手动触发change事件
        const changeEvent = new Event('change', { bubbles: true });
        followSystemThemeToggle.dispatchEvent(changeEvent);
    });

    // 为SuperSwitch添加键盘导航支持
    followSystemThemeSuperSwitch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            followSystemThemeSuperSwitch.click();
        }
    });

    // 使SuperSwitch可以通过Tab键聚焦
    followSystemThemeSuperSwitch.setAttribute('tabindex', '0');
    followSystemThemeSuperSwitch.setAttribute('role', 'switch');
    followSystemThemeSuperSwitch.setAttribute('aria-checked', followSystemThemeToggle.checked);

    // 跟随系统主题开关状态变化事件
    followSystemThemeToggle.addEventListener('change', () => {
        const isFollowSystem = followSystemThemeToggle.checked;
        localStorage.setItem('followSystemTheme', isFollowSystem.toString());

        // 更新aria-checked属性
        followSystemThemeSuperSwitch.setAttribute('aria-checked', isFollowSystem);

        // 添加状态切换动画
        followSystemThemeSuperSwitch.style.transform = 'scale(0.98)';
        setTimeout(() => {
            followSystemThemeSuperSwitch.style.transform = '';
        }, 150);

        if (isFollowSystem) {
            // 如果开启了跟随系统，则立即应用系统主题
            const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', systemTheme);
            localStorage.setItem('theme', systemTheme);
            toast(getTranslation('toast_theme_follow_enabled'));
        } else {
            toast(getTranslation('toast_theme_follow_keep'));
        }
    });

    // 日志等级选择器事件
    const logLevelButtons = document.querySelectorAll('#logLevelContainer .settings-tab-btn');
    logLevelButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            // 移除所有按钮的选中状态
            logLevelButtons.forEach(btn => btn.classList.remove('active'));

            // 为当前按钮添加选中状态
            button.classList.add('active');

            // 保存设置
            saveLogLevel();
        });
    });

    // 自定义内存档位选择事件
    ddrContainer.addEventListener('click', () => {
        ddrContainer.classList.toggle('open');
    });

    // 点击内存档位选项时
    const ddrOptionElements = document.querySelectorAll('#ddrOptions .option');
    ddrOptionElements.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止事件冒泡到container

            // 移除所有选项的选中状态
            ddrOptionElements.forEach(opt => opt.classList.remove('selected'));

            // 为当前选项添加选中状态
            option.classList.add('selected');

            // 更新显示的文本
            selectedDdr.textContent = option.textContent;

            // 关闭下拉菜单
            ddrContainer.classList.remove('open');
        });
    });
}

// 初始化margin设置
function initMarginSetting() {
    // 显示当前margin值
    marginValue_elem.textContent = marginValue;

    // 减小margin按钮事件
    marginDecreaseBtn.addEventListener('click', () => {
        if (marginValue > 0) {
            marginValue--;
            marginValue_elem.textContent = marginValue;
        }
    });

    // 增加margin按钮事件
    marginIncreaseBtn.addEventListener('click', () => {
        if (marginValue < 100) {
            marginValue++;
            marginValue_elem.textContent = marginValue;
        }
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 页面导航相关事件
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPageId = item.getAttribute('data-page');
            switchPage(targetPageId);
        });
    });

    // 保存余量按钮事件
    const saveMarginBtn = document.getElementById('saveMarginBtn');
    if (saveMarginBtn) {
        saveMarginBtn.addEventListener('click', () => {
            saveMarginToFile();
        });
    }

    // 游戏模式状态不再提供切换功能，只显示状态

    // 刷新日志按钮
    refreshLogBtn.addEventListener('click', () => {
        loadLog();
    });

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
            logContent.style.opacity = '0.5';
            logContent.textContent = getTranslation('log_loading');

            // 延迟加载以显示过渡效果
            setTimeout(() => {
                loadLog().then(() => {
                    logContent.style.opacity = '1';
                });
            }, 100);
        });
    });

    // GPU配置相关事件
    // 添加配置按钮
    addConfigBtn.addEventListener('click', () => {
        console.log('添加配置按钮被点击');
        openEditModal();
    });

    // 保存配置按钮
    saveConfigBtn.addEventListener('click', () => {
        saveConfigToFile();
    });

    // 关闭模态框按钮
    closeModalBtn.addEventListener('click', () => {
        closeEditModal();
    });

    // 取消编辑按钮
    cancelEditBtn.addEventListener('click', () => {
        closeEditModal();
    });

    // 保存配置项按钮
    saveItemBtn.addEventListener('click', () => {
        saveConfigItem();
    });

    // 删除配置项按钮
    deleteItemBtn.addEventListener('click', () => {
        deleteConfigItem();
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === editConfigModal) {
            closeEditModal();
        }
        if (event.target === editGameModal) {
            closeGameModal();
        }
    });

    // 按ESC键关闭模态框
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (editConfigModal.style.display === 'block') {
                closeEditModal();
            }
            if (editGameModal.style.display === 'block') {
                closeGameModal();
            }
        }
    });

    // 游戏列表相关事件
    // 添加游戏按钮
    addGameBtn.addEventListener('click', () => {
        openGameModal();
    });

    // 保存游戏列表按钮
    saveGamesBtn.addEventListener('click', () => {
        saveGamesToFile();
    });

    // 关闭游戏编辑模态框按钮
    closeGameModalBtn.addEventListener('click', () => {
        closeGameModal();
    });

    // 取消游戏编辑按钮
    cancelGameBtn.addEventListener('click', () => {
        closeGameModal();
    });

    // 保存游戏按钮
    saveGameBtn.addEventListener('click', () => {
        saveGameItem();
    });
}

// 切换页面
function switchPage(pageId) {
    // 隐藏所有页面
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // 显示目标页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 更新导航按钮状态
    navItems.forEach(item => {
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 检查模块状态
async function checkModuleStatus() {
    try {
        // 使用简单命令检查服务是否运行
        const { errno, stdout } = await exec('pgrep -f gpugovernor || echo ""');

        const newStatus = errno === 0 && stdout.trim();
        const currentStatus = runningStatus.classList.contains('status-running');

        // 如果状态发生变化，添加动画效果
        if (newStatus !== currentStatus) {
            runningStatus.classList.add('status-changing');

            setTimeout(() => {
                if (newStatus) {
                    runningStatus.textContent = getTranslation('status_running_active');
                    runningStatus.className = 'status-badge status-running';
                } else {
                    runningStatus.textContent = getTranslation('status_running_inactive');
                    runningStatus.className = 'status-badge status-stopped';
                }

                // 移除动画类
                setTimeout(() => {
                    runningStatus.classList.remove('status-changing');
                }, 600);
            }, 100);
        }
    } catch (error) {
        console.error('检查模块状态失败:', error);
        runningStatus.textContent = getTranslation('status_checking');
        runningStatus.className = 'status-badge status-stopped';
    }
}

// 加载模块版本
async function loadModuleVersion() {
    try {
        // 从module.prop文件中获取版本信息
        const { errno, stdout } = await exec('grep -i "^version=" /data/adb/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2');

        if (errno === 0 && stdout.trim()) {
            moduleVersion.textContent = stdout.trim();
        } else {
            // 尝试从KSU模块路径获取
            const { errno: errno2, stdout: stdout2 } = await exec('grep -i "^version=" /data/adb/ksu/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2');

            if (errno2 === 0 && stdout2.trim()) {
                moduleVersion.textContent = stdout2.trim();
            } else {
                // 使用当前语言的"未知"文本
                moduleVersion.textContent = currentLanguage === 'en' ? 'Unknown' : '未知';
            }
        }
    } catch (error) {
        console.error('加载模块版本失败:', error);
        // 使用当前语言的"未知"文本
        moduleVersion.textContent = currentLanguage === 'en' ? 'Unknown' : '未知';
    }
}





// 加载GPU配置
async function loadGpuConfig() {
    try {
        const { errno, stdout } = await exec(`cat ${CONFIG_PATH}`);

        if (errno === 0 && stdout.trim()) {
            const lines = stdout.trim().split('\n');

            // 清空当前配置
            gpuConfigs = [];

            // 先检查是否有Margin配置
            for (const line of lines) {
                const trimmedLine = line.trim();
                // 确保不是注释行
                if (trimmedLine.startsWith('Margin=') && !trimmedLine.startsWith('#')) {
                    const marginStr = trimmedLine.substring(7).trim();
                    const parsedMargin = parseInt(marginStr);
                    if (!isNaN(parsedMargin)) {
                        marginValue = parsedMargin;
                        console.log(`从配置文件读取到Margin值: ${marginValue}%`);
                        // 更新UI显示
                        if (marginValue_elem) {
                            marginValue_elem.textContent = marginValue;
                        }
                    }
                }
            }

            // 过滤出频率配置行
            const configLines = lines.filter(line => !line.startsWith('#') && !line.startsWith('Margin=') && line.trim());

            if (configLines.length > 0) {
                gpuFreqTable.innerHTML = '';

                // 解析所有配置
                configLines.forEach(line => {
                    const [freq, volt, ddr] = line.trim().split(/\s+/);

                    if (freq && volt && ddr) {
                        // 保存配置到全局变量
                        gpuConfigs.push({
                            freq: parseInt(freq),
                            volt: parseInt(volt),
                            ddr: parseInt(ddr)
                        });
                    }
                });

                // 然后使用refreshGpuTable来显示配置
                refreshGpuTable();

                // 初始化电压选择下拉框
                initVoltSelect();
            } else {
                gpuFreqTable.innerHTML = `<tr><td colspan="4" class="loading-text">${getTranslation('config_not_found')}</td></tr>`;
            }
        } else {
            gpuFreqTable.innerHTML = `<tr><td colspan="4" class="loading-text">${getTranslation('config_not_found')}</td></tr>`;
        }

        // 初始化margin设置（确保在读取配置后调用）
        initMarginSetting();
    } catch (error) {
        console.error('加载GPU配置失败:', error);
        gpuFreqTable.innerHTML = '<tr><td colspan="4" class="loading-text">加载失败</td></tr>';

        // 即使加载失败，也要初始化margin设置
        initMarginSetting();
    }
}

// 减小电压函数（减小电压值）
function decreaseVolt() {
    // 直接减625单位
    let newVolt = currentVoltValue - VOLT_STEP;

    // 确保不低于最小值
    if (newVolt >= MIN_VOLT) {
        currentVoltValue = newVolt;
        updateVoltDisplay();
        return true; // 返回true表示操作成功
    }
    return false; // 返回false表示已达到极限
}

// 增加电压函数（增加电压值）
function increaseVolt() {
    // 直接加625单位
    let newVolt = currentVoltValue + VOLT_STEP;

    // 确保不超过最大值
    if (newVolt <= MAX_VOLT) {
        currentVoltValue = newVolt;
        updateVoltDisplay();
        return true; // 返回true表示操作成功
    }
    return false; // 返回false表示已达到极限
}

// 更新电压显示
function updateVoltDisplay() {
    // 使用当前电压值
    selectedVolt.textContent = currentVoltValue;

    // 尝试在select中找到匹配的选项
    const voltOption = Array.from(voltSelect.options).find(option => parseInt(option.value) === currentVoltValue);

    if (voltOption) {
        // 如果找到匹配的选项，直接设置
        voltSelect.value = voltOption.value;
    } else {
        // 如果没有找到匹配的选项，添加一个新选项
        const option = document.createElement('option');
        option.value = currentVoltValue;
        option.textContent = currentVoltValue;
        voltSelect.appendChild(option);
        voltSelect.value = currentVoltValue;
    }

    // 禁用或启用按钮
    voltDecreaseBtn.disabled = currentVoltValue <= MIN_VOLT;
    voltIncreaseBtn.disabled = currentVoltValue >= MAX_VOLT;
}

// 初始化电压选择器
function initVoltSelect() {
    console.log('初始化电压选择器');

    // 检查元素是否存在
    if (!voltSelect || !selectedVolt || !voltDecreaseBtn || !voltIncreaseBtn) {
        console.error('电压选择器元素不存在');
        return;
    }

    // 清空现有选项
    voltSelect.innerHTML = '';

    // 添加电压选项到隐藏的select元素
    VOLT_LIST.forEach(volt => {
        const selectOption = document.createElement('option');
        selectOption.value = volt;
        selectOption.textContent = volt;
        voltSelect.appendChild(selectOption);
    });

    console.log(`已添加 ${VOLT_LIST.length} 个电压选项`);

    // 设置默认值
    currentVoltIndex = 0;
    currentVoltValue = VOLT_LIST[currentVoltIndex];
    selectedVolt.textContent = currentVoltValue;
    voltSelect.value = currentVoltValue;

    // 初始化按钮状态
    updateVoltDisplay();

    // 设置事件监听器（只在第一次初始化时添加）
    setupVoltageEvents();
}

// 设置电压选择器的事件监听器（只调用一次）
let voltageEventsInitialized = false;
function setupVoltageEvents() {
    if (voltageEventsInitialized) {
        return; // 如果已经初始化过，则不再重复添加事件监听器
    }

    // 减小电压按钮事件 - 只处理单击
    voltDecreaseBtn.addEventListener('click', () => {
        // 如果是长按结束，不执行单击操作
        if (isLongPress) {
            isLongPress = false;
            return;
        }
        decreaseVolt();
    });

    // 减小电压按钮长按事件
    voltDecreaseBtn.addEventListener('mousedown', () => {
        // 重置长按标记
        isLongPress = false;

        // 设置定时器，延迟后才开始连续操作
        decreaseTimer = setTimeout(() => {
            // 标记为长按
            isLongPress = true;

            // 执行第一次操作
            const canContinue = decreaseVolt();

            // 如果可以继续减小，设置定时器
            if (canContinue) {
                decreaseTimer = setInterval(() => {
                    // 如果不能继续减小，清除定时器
                    if (!decreaseVolt()) {
                        clearInterval(decreaseTimer);
                        decreaseTimer = null;
                    }
                }, pressInterval);
            }
        }, pressDelay);
    });

    // 增加电压按钮事件 - 只处理单击
    voltIncreaseBtn.addEventListener('click', () => {
        // 如果是长按结束，不执行单击操作
        if (isLongPress) {
            isLongPress = false;
            return;
        }
        increaseVolt();
    });

    // 增加电压按钮长按事件
    voltIncreaseBtn.addEventListener('mousedown', () => {
        // 重置长按标记
        isLongPress = false;

        // 设置定时器，延迟后才开始连续操作
        increaseTimer = setTimeout(() => {
            // 标记为长按
            isLongPress = true;

            // 执行第一次操作
            const canContinue = increaseVolt();

            // 如果可以继续增加，设置定时器
            if (canContinue) {
                increaseTimer = setInterval(() => {
                    // 如果不能继续增加，清除定时器
                    if (!increaseVolt()) {
                        clearInterval(increaseTimer);
                        increaseTimer = null;
                    }
                }, pressInterval);
            }
        }, pressDelay);
    });

    // 鼠标松开和离开时清除定时器
    document.addEventListener('mouseup', () => {
        if (decreaseTimer) {
            clearTimeout(decreaseTimer);
            clearInterval(decreaseTimer);
            decreaseTimer = null;
        }
        if (increaseTimer) {
            clearTimeout(increaseTimer);
            clearInterval(increaseTimer);
            increaseTimer = null;
        }
    });

    document.addEventListener('mouseleave', () => {
        if (decreaseTimer) {
            clearTimeout(decreaseTimer);
            clearInterval(decreaseTimer);
            decreaseTimer = null;
        }
        if (increaseTimer) {
            clearTimeout(increaseTimer);
            clearInterval(increaseTimer);
            increaseTimer = null;
        }
    });

    // 触摸事件支持
    voltDecreaseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 防止触发click事件

        // 重置长按标记
        isLongPress = false;

        // 执行一次点击操作
        decreaseVolt();

        // 设置定时器，延迟后才开始连续操作
        decreaseTimer = setTimeout(() => {
            // 标记为长按
            isLongPress = true;

            decreaseTimer = setInterval(() => {
                // 如果不能继续减小，清除定时器
                if (!decreaseVolt()) {
                    clearInterval(decreaseTimer);
                    decreaseTimer = null;
                }
            }, pressInterval);
        }, pressDelay);
    }, { passive: false });

    voltIncreaseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 防止触发click事件

        // 重置长按标记
        isLongPress = false;

        // 执行一次点击操作
        increaseVolt();

        // 设置定时器，延迟后才开始连续操作
        increaseTimer = setTimeout(() => {
            // 标记为长按
            isLongPress = true;

            increaseTimer = setInterval(() => {
                // 如果不能继续增加，清除定时器
                if (!increaseVolt()) {
                    clearInterval(increaseTimer);
                    increaseTimer = null;
                }
            }, pressInterval);
        }, pressDelay);
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (decreaseTimer) {
            clearTimeout(decreaseTimer);
            clearInterval(decreaseTimer);
            decreaseTimer = null;
        }
        if (increaseTimer) {
            clearTimeout(increaseTimer);
            clearInterval(increaseTimer);
            increaseTimer = null;
        }
    });

    // 标记事件已初始化
    voltageEventsInitialized = true;
}

// 打开编辑模态框
function openEditModal(index = -1) {
    console.log('打开编辑模态框，索引:', index);

    // 检查模态框元素是否存在
    if (!editConfigModal) {
        console.error('模态框元素不存在');
        return;
    }

    // 确保电压选择器已初始化
    if (!voltageEventsInitialized) {
        setupVoltageEvents();
    }

    editingIndex = index;

    if (index >= 0 && index < gpuConfigs.length) {
        // 编辑现有配置
        const config = gpuConfigs[index];

        // 设置频率输入框 - 第一个表单组
        freqInput.value = config.freq;

        // 设置电压选择 - 第二个表单组
        const voltValue = config.volt;
        selectedVolt.textContent = voltValue;

        // 设置当前电压值
        currentVoltValue = voltValue;

        // 尝试在select中找到匹配的选项
        const voltOption = Array.from(voltSelect.options).find(option => parseInt(option.value) === voltValue);
        if (voltOption) {
            // 如果找到匹配的选项，直接设置
            voltSelect.value = voltOption.value;
        } else {
            // 如果没有找到匹配的电压选项，添加一个新选项
            const option = document.createElement('option');
            option.value = voltValue;
            option.textContent = voltValue;
            voltSelect.appendChild(option);
            voltSelect.value = voltValue;
        }

        // 更新按钮状态
        voltDecreaseBtn.disabled = voltValue <= MIN_VOLT;
        voltIncreaseBtn.disabled = voltValue >= MAX_VOLT;

        // 设置内存档位选择 - 第三个表单组
        // 更新自定义下拉菜单的显示文本和选中状态
        const ddrOptionElements = document.querySelectorAll('#ddrOptions .option');
        ddrOptionElements.forEach(option => {
            if (parseInt(option.getAttribute('data-value')) === config.ddr) {
                selectedDdr.textContent = option.textContent;
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        // 显示删除按钮
        deleteItemBtn.style.display = 'block';
    } else {
        // 添加新配置
        // 设置频率输入框 - 第一个表单组
        freqInput.value = '';

        // 重置电压选择器 - 第二个表单组
        currentVoltValue = MAX_VOLT; // 设置为最大值
        selectedVolt.textContent = currentVoltValue;
        voltSelect.value = currentVoltValue;

        // 更新按钮状态
        voltDecreaseBtn.disabled = currentVoltValue <= MIN_VOLT;
        voltIncreaseBtn.disabled = currentVoltValue >= MAX_VOLT;

        // 重置内存档位选择器 - 第三个表单组
        selectedDdr.textContent = '999 (不调整)';

        // 更新内存档位选中状态
        document.querySelectorAll('#ddrOptions .option').forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-value') === '999');
        });

        // 隐藏删除按钮
        deleteItemBtn.style.display = 'none';
    }

    // 显示模态框
    console.log('设置模态框显示');
    editConfigModal.style.display = 'block';
    console.log('模态框当前display值:', editConfigModal.style.display);
}

// 关闭编辑模态框
function closeEditModal() {
    editConfigModal.style.display = 'none';
}

// 保存配置项
function saveConfigItem() {
    const freq = parseInt(freqInput.value);
    const volt = parseInt(voltSelect.value);
    const ddr = parseInt(selectedDdr.textContent.split(' ')[0]);

    if (!freq || isNaN(freq)) {
        toast(getTranslation('toast_freq_invalid'));
        return;
    }

    if (editingIndex >= 0 && editingIndex < gpuConfigs.length) {
        // 更新现有配置
        gpuConfigs[editingIndex] = { freq, volt, ddr };
    } else {
        // 添加新配置
        gpuConfigs.push({ freq, volt, ddr });
    }

    // 关闭模态框
    closeEditModal();

    // 刷新表格
    refreshGpuTable();

    toast(getTranslation('toast_config_updated'));
}

// 删除配置项
function deleteConfigItem() {
    if (editingIndex >= 0 && editingIndex < gpuConfigs.length) {
        const config = gpuConfigs[editingIndex];
        console.log(`删除配置: 索引=${editingIndex}, 频率=${config.freq}, 电压=${config.volt}, 内存档位=${config.ddr}`);

        // 从数组中删除
        gpuConfigs.splice(editingIndex, 1);

        // 关闭模态框
        closeEditModal();

        // 刷新表格
        refreshGpuTable();

        toast('配置已删除，请点击"保存配置"按钮保存到文件');
    } else {
        toast('无效的配置索引');
    }
}

// 刷新GPU配置表格
function refreshGpuTable() {
    console.log('刷新表格，当前配置数组:', JSON.stringify(gpuConfigs));

    // 清空表格
    gpuFreqTable.innerHTML = '';

    if (gpuConfigs.length === 0) {
        gpuFreqTable.innerHTML = `<tr><td colspan="4" class="loading-text">${getTranslation('config_not_found')}</td></tr>`;
        return;
    }

    // 按频率排序
    const sortedConfigs = [...gpuConfigs].sort((a, b) => a.freq - b.freq);

    // 更新原始数组
    gpuConfigs = sortedConfigs;

    console.log('排序后配置数组:', JSON.stringify(gpuConfigs));

    // 创建表格行
    gpuConfigs.forEach((config, index) => {
        // 创建一个唯一ID，用于标识这个配置
        const configId = `config-${config.freq}-${config.volt}-${config.ddr}-${index}`;

        const row = document.createElement('tr');
        row.id = configId;
        row.dataset.index = index;
        row.dataset.freq = config.freq;

        const freqCell = document.createElement('td');
        freqCell.textContent = (config.freq / 1000).toFixed(0);

        const voltCell = document.createElement('td');
        voltCell.textContent = config.volt;

        const ddrCell = document.createElement('td');
        ddrCell.textContent = config.ddr;

        const actionsCell = document.createElement('td');

        // 创建编辑按钮
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
        `;
        editBtn.title = '编辑/删除';
        editBtn.onclick = function () {
            openEditModal(index);
            return false; // 阻止事件冒泡
        };

        actionsCell.appendChild(editBtn);

        row.appendChild(freqCell);
        row.appendChild(voltCell);
        row.appendChild(ddrCell);
        row.appendChild(actionsCell);

        gpuFreqTable.appendChild(row);
    });

    console.log('表格刷新完成，行数:', gpuFreqTable.children.length);
}

// 保存配置到文件
async function saveConfigToFile() {
    try {
        if (gpuConfigs.length === 0) {
            toast('没有配置可保存');
            return;
        }

        // 按频率排序
        gpuConfigs.sort((a, b) => a.freq - b.freq);

        // 生成配置文件内容
        let configContent = '# Freq Volt DDR_OPP\n';
        configContent += '# example(Does not include the # symbol)\n';
        configContent += '#852000 61250 3\n';
        configContent += '# Margin: 调整GPU频率计算的余量百分比，默认值为20（非游戏模式）和30（游戏模式）\n';
        configContent += `Margin=${marginValue}\n`;

        gpuConfigs.forEach(config => {
            configContent += `${config.freq} ${config.volt} ${config.ddr}\n`;
        });

        // 保存到文件
        const { errno } = await exec(`echo '${configContent}' > ${CONFIG_PATH}`);

        if (errno === 0) {
            toast('配置已成功保存');
        } else {
            toast('保存配置失败，请检查权限');
        }
    } catch (error) {
        console.error('保存配置失败:', error);
        toast('保存配置失败: ' + error.message);
    }
}

// 加载游戏列表
async function loadGamesList() {
    try {
        const { errno, stdout } = await exec(`cat ${GAMES_FILE}`);

        if (errno === 0 && stdout.trim()) {
            const games = stdout.trim().split('\n').filter(game => game.trim());

            // 保存到全局变量
            gamesList_data = games;

            if (games.length > 0) {
                refreshGamesList();
            } else {
                gamesList.innerHTML = `<li class="loading-text">${getTranslation('config_games_not_found')}</li>`;
            }
        } else {
            gamesList.innerHTML = `<li class="loading-text">${getTranslation('config_games_list_not_found')}</li>`;
        }
    } catch (error) {
        console.error('加载游戏列表失败:', error);
        gamesList.innerHTML = '<li class="loading-text">加载失败</li>';
    }
}

// 刷新游戏列表
function refreshGamesList() {
    gamesList.innerHTML = '';

    if (gamesList_data.length === 0) {
        gamesList.innerHTML = `<li class="loading-text">${getTranslation('config_games_not_found')}</li>`;
        return;
    }

    gamesList_data.forEach((game, index) => {
        const li = document.createElement('li');

        // 创建游戏包名文本
        const gameText = document.createElement('span');
        gameText.textContent = game.trim();
        li.appendChild(gameText);

        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'game-delete-btn';
        deleteBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        `;
        deleteBtn.title = '删除';
        deleteBtn.onclick = function (e) {
            e.stopPropagation(); // 阻止事件冒泡
            deleteGameItem(index);
        };
        li.appendChild(deleteBtn);

        gamesList.appendChild(li);
    });
}

// 打开游戏编辑模态框
function openGameModal() {
    packageNameInput.value = '';
    editGameModal.style.display = 'block';
}

// 关闭游戏编辑模态框
function closeGameModal() {
    editGameModal.style.display = 'none';
}

// 保存游戏项
function saveGameItem() {
    const packageName = packageNameInput.value.trim();

    if (!packageName) {
        toast('请输入有效的应用包名');
        return;
    }

    // 检查是否已存在
    if (gamesList_data.includes(packageName)) {
        toast('该应用包名已存在于列表中');
        return;
    }

    // 添加到列表
    gamesList_data.push(packageName);

    // 关闭模态框
    closeGameModal();

    // 刷新列表
    refreshGamesList();

    toast('游戏已添加，请点击"保存列表"按钮保存到文件');
}

// 删除游戏项
function deleteGameItem(index) {
    if (index >= 0 && index < gamesList_data.length) {
        const game = gamesList_data[index];
        console.log(`删除游戏: 索引=${index}, 包名=${game}`);

        // 从数组中删除
        gamesList_data.splice(index, 1);

        // 刷新列表
        refreshGamesList();

        toast('游戏已删除，请点击"保存列表"按钮保存到文件');
    } else {
        toast('无效的游戏索引');
    }
}

// 保存游戏列表到文件
async function saveGamesToFile() {
    try {
        if (gamesList_data.length === 0) {
            toast('没有游戏可保存');
            return;
        }

        // 生成文件内容
        const gamesContent = gamesList_data.join('\n');

        // 保存到文件
        const { errno } = await exec(`echo '${gamesContent}' > ${GAMES_FILE}`);

        if (errno === 0) {
            toast('游戏列表已成功保存');
        } else {
            toast('保存游戏列表失败，请检查权限');
        }
    } catch (error) {
        console.error('保存游戏列表失败:', error);
        toast('保存游戏列表失败: ' + error.message);
    }
}

// 保存余量设置到文件
async function saveMarginToFile() {
    try {
        // 读取当前配置文件内容
        const { errno: readErrno, stdout } = await exec(`cat ${CONFIG_PATH}`);

        if (readErrno !== 0) {
            toast('读取配置文件失败，请检查权限');
            return;
        }

        // 解析配置文件内容
        const lines = stdout.trim().split('\n');
        let newContent = '';
        let marginUpdated = false;

        // 更新Margin行或保留原始内容
        for (const line of lines) {
            if (line.trim().startsWith('Margin=') && !line.trim().startsWith('#')) {
                // 替换Margin行
                newContent += `Margin=${marginValue}\n`;
                marginUpdated = true;
            } else {
                // 保留原始行
                newContent += line + '\n';
            }
        }

        // 如果没有找到Margin行，添加一个
        if (!marginUpdated) {
            newContent += `# Margin: 调整GPU频率计算的余量百分比，默认值为20（非游戏模式）和30（游戏模式）\n`;
            newContent += `Margin=${marginValue}\n`;
        }

        // 保存到文件
        const { errno: writeErrno } = await exec(`echo '${newContent}' > ${CONFIG_PATH}`);

        if (writeErrno === 0) {
            toast('余量设置已成功保存');
        } else {
            toast('保存余量设置失败，请检查权限');
        }
    } catch (error) {
        console.error('保存余量设置失败:', error);
        toast('保存余量设置失败: ' + error.message);
    }
}

// 加载日志等级设置
async function loadLogLevel() {
    try {
        // 检查日志等级文件是否存在
        const { errno, stdout } = await exec(`cat ${LOG_LEVEL_PATH} 2>/dev/null || echo "info"`);

        let logLevel = 'info'; // 默认值

        if (errno === 0) {
            const level = stdout.trim().toLowerCase();

            // 验证日志等级是否有效
            if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
                logLevel = level;
            }

            console.log(`当前日志等级: ${logLevel}`);
        } else {
            console.log('无法读取日志等级设置，使用默认值: info');
        }

        // 更新按钮选中状态
        const logLevelButtons = document.querySelectorAll('#logLevelContainer .settings-tab-btn');
        logLevelButtons.forEach(button => {
            if (button.getAttribute('data-value') === logLevel) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('加载日志等级设置失败:', error);
        // 出错时选中默认的info按钮
        const infoButton = document.querySelector('#logLevelContainer .settings-tab-btn[data-value="info"]');
        if (infoButton) {
            const logLevelButtons = document.querySelectorAll('#logLevelContainer .settings-tab-btn');
            logLevelButtons.forEach(btn => btn.classList.remove('active'));
            infoButton.classList.add('active');
        }
    }
}

// 保存日志等级设置
async function saveLogLevel() {
    try {
        // 从选中的按钮获取日志等级
        const selectedButton = document.querySelector('#logLevelContainer .settings-tab-btn.active');
        if (!selectedButton) {
            console.error('未找到选中的日志等级按钮');
            return;
        }

        const selectedLevel = selectedButton.getAttribute('data-value');

        // 保存到文件
        const { errno } = await exec(`echo "${selectedLevel}" > ${LOG_LEVEL_PATH}`);

        if (errno === 0) {
            if (selectedLevel === 'debug') {
                toast(getTranslation('toast_log_level_debug'));
            } else {
                toast(getTranslation('toast_log_level_set', { level: selectedLevel }));
            }
            console.log(`日志等级已保存: ${selectedLevel}`);
        } else {
            toast(getTranslation('toast_log_level_fail'));
            console.error('保存日志等级失败');
        }
    } catch (error) {
        console.error('保存日志等级失败:', error);
        toast('保存日志等级失败: ' + error.message);
    }
}

// 初始化日志文件选择器
function initLogFileSelect() {
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
async function loadLog() {
    try {
        // 获取当前激活的日志标签页
        const activeTab = document.querySelector('.log-tab-btn.active');
        const selectedLog = activeTab ? activeTab.getAttribute('data-log') : 'gpu_gov.log';
        logContent.textContent = getTranslation('log_loading');

        // 日志轮转已由Rust程序处理，移除大小检查逻辑

        // 使用cat而不是tail，某些设备可能没有tail命令
        const { errno, stdout } = await exec(`cat ${LOG_PATH}/${selectedLog} 2>/dev/null || echo "日志文件不存在"`);

        // 新增：日志文件不存在时多语言处理
        if (stdout.trim() === "日志文件不存在") {
            logContent.textContent = getTranslation('log_not_found');
            return;
        }

        if (errno === 0) {
            // 如果日志太长，只显示最后100行
            const lines = stdout.trim().split('\n');
            const lastLines = lines.slice(-100).join('\n');

            // 日志轮转已由Rust程序处理，直接显示日志内容
            logContent.textContent = lastLines || getTranslation('log_empty');

            // 滚动到底部
            logContent.scrollTop = logContent.scrollHeight;
        } else {
            logContent.textContent = getTranslation('log_not_found');
        }
    } catch (error) {
        console.error('加载日志失败:', error);
        logContent.textContent = '加载日志失败，请检查权限';
    }
}
