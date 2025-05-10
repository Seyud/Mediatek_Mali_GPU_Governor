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
const gameModeToggle = document.getElementById('gameModeToggle');
const moduleVersion = document.getElementById('moduleVersion');
const followSystemThemeToggle = document.getElementById('followSystemThemeToggle');
const logLevelSelect = document.getElementById('logLevelSelect');
const logLevelContainer = document.getElementById('logLevelContainer');
const selectedLogLevel = document.getElementById('selectedLogLevel');
const logLevelOptions = document.getElementById('logLevelOptions');
const logFileSelect = document.getElementById('logFileSelect');
const logFileContainer = document.getElementById('logFileContainer');
const selectedLogFile = document.getElementById('selectedLogFile');
const logFileOptions = document.getElementById('logFileOptions');
const gpuFreqTable = document.getElementById('gpuFreqTable').querySelector('tbody');
const gamesList = document.getElementById('gamesList');
const logContent = document.getElementById('logContent');
const refreshLogBtn = document.getElementById('refreshLogBtn');
const marginValue_elem = document.getElementById('marginValue');
const marginDecreaseBtn = document.getElementById('marginDecreaseBtn');
const marginIncreaseBtn = document.getElementById('marginIncreaseBtn');

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
const ddrSelect = document.getElementById('ddrSelect');
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
const GAMES_PATH = '/data/adb/gpu_governor/game/games.conf';
const GAME_MODE_PATH = '/data/adb/gpu_governor/game/game_mode';
const LOG_LEVEL_PATH = '/data/adb/gpu_governor/log/log_level';
const MAX_LOG_SIZE_MB = 5; // 日志文件最大大小，单位MB

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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查主题
    initTheme();

    // 设置事件监听器
    setupEventListeners();

    // 加载数据
    initializeApp();

    // 注意：initMarginSetting()会在loadGpuConfig()完成后自动调用
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
        await safeExecute(loadGameModeStatus, '加载游戏模式状态失败');
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
            toast('WebUI加载完成');
        } catch (e) {
            console.log('WebUI加载完成');
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
        // 如果设置了跟随系统主题，则先关闭跟随系统
        if (localStorage.getItem('followSystemTheme') === 'true') {
            localStorage.setItem('followSystemTheme', 'false');
            followSystemThemeToggle.checked = false;
            toast('已关闭跟随系统主题，现在可以手动切换主题');
        }

        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // 跟随系统主题开关事件
    followSystemThemeToggle.addEventListener('change', () => {
        const isFollowSystem = followSystemThemeToggle.checked;
        localStorage.setItem('followSystemTheme', isFollowSystem.toString());

        if (isFollowSystem) {
            // 如果开启了跟随系统，则立即应用系统主题
            const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', systemTheme);
            localStorage.setItem('theme', systemTheme);
            toast('已开启跟随系统主题');
        } else {
            toast('已关闭跟随系统主题，将保持当前主题');
        }
    });

    // 自定义日志等级选择事件
    logLevelContainer.addEventListener('click', () => {
        logLevelContainer.classList.toggle('open');
    });

    // 点击日志等级选项时
    const logLevelOptionElements = document.querySelectorAll('#logLevelOptions .option');
    logLevelOptionElements.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止事件冒泡到container

            // 移除所有选项的选中状态
            logLevelOptionElements.forEach(opt => opt.classList.remove('selected'));

            // 为当前选项添加选中状态
            option.classList.add('selected');

            // 更新显示的文本
            selectedLogLevel.textContent = option.textContent;

            // 更新隐藏的select元素的值
            logLevelSelect.value = option.getAttribute('data-value');

            // 关闭下拉菜单
            logLevelContainer.classList.remove('open');

            // 保存设置
            saveLogLevel();
        });
    });

    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!logLevelContainer.contains(e.target)) {
            logLevelContainer.classList.remove('open');
        }
        if (!logFileContainer.contains(e.target)) {
            logFileContainer.classList.remove('open');
        }
        if (!ddrContainer.contains(e.target)) {
            ddrContainer.classList.remove('open');
        }
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

            // 更新隐藏的select元素的值
            ddrSelect.value = option.getAttribute('data-value');

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

    // 游戏模式开关
    gameModeToggle.addEventListener('change', async () => {
        try {
            // 直接修改游戏模式文件，而不是调用action.sh脚本
            // 这样可以避免路径和权限问题
            const value = gameModeToggle.checked ? '1' : '0';

            // 确保目录存在
            await exec(`mkdir -p ${GAMES_PATH}`);

            // 写入游戏模式状态
            const { errno, stderr } = await exec(`echo "${value}" > ${GAME_MODE_PATH}`);

            if (errno === 0) {
                toast(`游戏模式已${gameModeToggle.checked ? '开启' : '关闭'}`);
                console.log(`游戏模式已切换为: ${value}`);
            } else {
                console.error('切换游戏模式失败:', stderr);
                toast('切换游戏模式失败，请检查权限');
                // 恢复开关状态
                gameModeToggle.checked = !gameModeToggle.checked;
            }
        } catch (error) {
            console.error('切换游戏模式失败:', error);
            toast('切换游戏模式失败: ' + error.message);
            // 恢复开关状态
            gameModeToggle.checked = !gameModeToggle.checked;
        }
    });

    // 刷新日志按钮
    refreshLogBtn.addEventListener('click', () => {
        loadLog();
    });

    // 自定义日志文件选择事件
    logFileContainer.addEventListener('click', () => {
        logFileContainer.classList.toggle('open');
    });

    // 点击日志文件选项时
    const logFileOptionElements = document.querySelectorAll('#logFileOptions .option');
    logFileOptionElements.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止事件冒泡到container

            // 移除所有选项的选中状态
            logFileOptionElements.forEach(opt => opt.classList.remove('selected'));

            // 为当前选项添加选中状态
            option.classList.add('selected');

            // 更新显示的文本
            selectedLogFile.textContent = option.textContent;

            // 更新隐藏的select元素的值
            logFileSelect.value = option.getAttribute('data-value');

            // 关闭下拉菜单
            logFileContainer.classList.remove('open');

            // 加载选中的日志
            loadLog();
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

        if (errno === 0 && stdout.trim()) {
            runningStatus.textContent = '运行中';
            runningStatus.className = 'status-badge status-running';
        } else {
            runningStatus.textContent = '未运行';
            runningStatus.className = 'status-badge status-stopped';
        }
    } catch (error) {
        console.error('检查模块状态失败:', error);
        runningStatus.textContent = '检查失败';
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
                moduleVersion.textContent = '未知';
            }
        }
    } catch (error) {
        console.error('加载模块版本失败:', error);
        moduleVersion.textContent = '未知';
    }
}

// 加载游戏模式状态
async function loadGameModeStatus() {
    try {
        // 确保目录和文件存在
        await exec(`mkdir -p ${GAMES_PATH}`);

        // 检查文件是否存在，如果不存在则创建
        const { errno: checkErrno, stdout: checkResult } = await exec(`[ -f "${GAME_MODE_PATH}" ] && echo "exists" || echo "not_exists"`);

        if (checkErrno === 0 && checkResult.trim() === "not_exists") {
            console.log("游戏模式文件不存在，创建默认文件");
            await exec(`echo "0" > ${GAME_MODE_PATH}`);
        }

        // 读取游戏模式状态
        const { errno, stdout, stderr } = await exec(`cat ${GAME_MODE_PATH} 2>/dev/null || echo 0`);

        if (errno === 0) {
            const status = stdout.trim() === '1';
            gameModeToggle.checked = status;
            console.log(`当前游戏模式状态: ${status ? '开启' : '关闭'}`);
        } else {
            console.error('读取游戏模式状态失败:', stderr);
            gameModeToggle.checked = false; // 默认为关闭
        }
    } catch (error) {
        console.error('加载游戏模式状态失败:', error);
        gameModeToggle.checked = false; // 默认为关闭
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
                gpuFreqTable.innerHTML = '<tr><td colspan="4" class="loading-text">未找到配置</td></tr>';
            }
        } else {
            gpuFreqTable.innerHTML = '<tr><td colspan="4" class="loading-text">未找到配置</td></tr>';
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
        freqInput.value = config.freq;

        // 设置电压选择
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

        // 设置内存档位选择
        const ddrOption = Array.from(ddrSelect.options).find(option => parseInt(option.value) === config.ddr);
        if (ddrOption) {
            ddrSelect.value = ddrOption.value;

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
        }

        // 显示删除按钮
        deleteItemBtn.style.display = 'block';
    } else {
        // 添加新配置
        freqInput.value = '';
        voltSelect.selectedIndex = 0;
        ddrSelect.selectedIndex = 0;

        // 重置电压选择器
        currentVoltValue = MAX_VOLT; // 设置为最大值
        selectedVolt.textContent = currentVoltValue;
        voltSelect.value = currentVoltValue;

        // 更新按钮状态
        voltDecreaseBtn.disabled = currentVoltValue <= MIN_VOLT;
        voltIncreaseBtn.disabled = currentVoltValue >= MAX_VOLT;

        // 重置内存档位选择器
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
    const ddr = parseInt(ddrSelect.value);

    if (!freq || isNaN(freq)) {
        toast('请输入有效的频率值');
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

    toast('配置已更新，请点击"保存配置"按钮保存到文件');
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
        gpuFreqTable.innerHTML = '<tr><td colspan="4" class="loading-text">未找到配置</td></tr>';
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
        editBtn.innerHTML = '✏️';
        editBtn.title = '编辑/删除';
        editBtn.onclick = function() {
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
        const { errno, stdout } = await exec(`cat ${GAMES_PATH}`);

        if (errno === 0 && stdout.trim()) {
            const games = stdout.trim().split('\n').filter(game => game.trim());

            // 保存到全局变量
            gamesList_data = games;

            if (games.length > 0) {
                refreshGamesList();
            } else {
                gamesList.innerHTML = '<li class="loading-text">未找到游戏</li>';
            }
        } else {
            gamesList.innerHTML = '<li class="loading-text">未找到游戏列表</li>';
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
        gamesList.innerHTML = '<li class="loading-text">未找到游戏</li>';
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
        deleteBtn.innerHTML = '✖';
        deleteBtn.title = '删除';
        deleteBtn.onclick = function(e) {
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
        const { errno } = await exec(`echo '${gamesContent}' > ${GAMES_PATH}`);

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

        // 设置隐藏的select元素值
        logLevelSelect.value = logLevel;

        // 更新自定义下拉菜单显示的文本
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            if (option.getAttribute('data-value') === logLevel) {
                selectedLogLevel.textContent = option.textContent;
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    } catch (error) {
        console.error('加载日志等级设置失败:', error);
        // 出错时使用默认值
        logLevelSelect.value = 'info';
        selectedLogLevel.textContent = 'Info (信息)';
    }
}

// 保存日志等级设置
async function saveLogLevel() {
    try {
        const selectedLevel = logLevelSelect.value;

        // 保存到文件
        const { errno } = await exec(`echo "${selectedLevel}" > ${LOG_LEVEL_PATH}`);

        if (errno === 0) {
            if (selectedLevel === 'debug') {
                toast(`日志等级已设置为: ${selectedLevel}，重启模块后将启用详细日志记录`);
            } else {
                toast(`日志等级已设置为: ${selectedLevel}，重启模块后生效`);
            }
            console.log(`日志等级已保存: ${selectedLevel}`);
        } else {
            toast('保存日志等级失败，请检查权限');
            console.error('保存日志等级失败');
        }
    } catch (error) {
        console.error('保存日志等级失败:', error);
        toast('保存日志等级失败: ' + error.message);
    }
}

// 初始化日志文件选择器
function initLogFileSelect() {
    // 获取当前选中的日志文件
    const currentLogFile = logFileSelect.value;

    // 更新自定义下拉菜单显示的文本和选中状态
    const options = document.querySelectorAll('#logFileOptions .option');
    options.forEach(option => {
        if (option.getAttribute('data-value') === currentLogFile) {
            selectedLogFile.textContent = option.textContent;
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// 加载日志
async function loadLog() {
    try {
        const selectedLog = logFileSelect.value;
        logContent.textContent = '加载中...';

        // 检查日志文件大小
        const { errno: statErrno, stdout: statOutput } = await exec(`stat -c %s ${LOG_PATH}/${selectedLog} 2>/dev/null || echo "0"`);

        if (statErrno === 0 && statOutput.trim() !== "0" && statOutput.trim() !== "日志文件不存在") {
            const fileSize = parseInt(statOutput.trim());
            const maxSizeBytes = MAX_LOG_SIZE_MB * 1024 * 1024;

            // 如果文件大小接近限制，显示提示
            if (fileSize > maxSizeBytes * 0.8) {
                const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
                console.log(`日志文件大小: ${fileSizeMB}MB，接近${MAX_LOG_SIZE_MB}MB的限制`);

                // 如果超过限制，显示警告
                if (fileSize > maxSizeBytes) {
                    logContent.textContent = `警告: 日志文件大小(${fileSizeMB}MB)已超过${MAX_LOG_SIZE_MB}MB的限制，将自动轮转。\n\n加载中...`;
                }
            }
        }

        // 使用cat而不是tail，某些设备可能没有tail命令
        const { errno, stdout } = await exec(`cat ${LOG_PATH}/${selectedLog} 2>/dev/null || echo "日志文件不存在"`);

        if (errno === 0) {
            // 如果日志太长，只显示最后100行
            const lines = stdout.trim().split('\n');
            const lastLines = lines.slice(-100).join('\n');

            // 如果日志文件大小接近限制，添加提示信息
            if (statErrno === 0 && statOutput.trim() !== "0" && statOutput.trim() !== "日志文件不存在") {
                const fileSize = parseInt(statOutput.trim());
                const maxSizeBytes = MAX_LOG_SIZE_MB * 1024 * 1024;

                if (fileSize > maxSizeBytes * 0.8) {
                    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
                    const sizeInfo = `[日志文件大小: ${fileSizeMB}MB / ${MAX_LOG_SIZE_MB}MB]\n`;

                    if (fileSize > maxSizeBytes) {
                        logContent.textContent = `警告: 日志文件大小已超过限制，将自动轮转。\n${sizeInfo}\n${lastLines || '日志为空'}`;
                    } else {
                        logContent.textContent = `${sizeInfo}\n${lastLines || '日志为空'}`;
                    }
                } else {
                    logContent.textContent = lastLines || '日志为空';
                }
            } else {
                logContent.textContent = lastLines || '日志为空';
            }

            // 滚动到底部
            logContent.scrollTop = logContent.scrollHeight;
        } else {
            logContent.textContent = '未找到日志';
        }
    } catch (error) {
        console.error('加载日志失败:', error);
        logContent.textContent = '加载日志失败，请检查权限';
    }
}
