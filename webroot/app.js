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
const followSystemThemeToggle = document.getElementById('followSystemThemeToggle');
const gpuFreqTable = document.getElementById('gpuFreqTable').querySelector('tbody');
const gamesList = document.getElementById('gamesList');
const logContent = document.getElementById('logContent');
const refreshLogBtn = document.getElementById('refreshLogBtn');
const logFileSelect = document.getElementById('logFileSelect');

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
const GAMES_PATH = '/data/adb/gpu_governor/games.conf';
const GAME_MODE_PATH = '/data/adb/gpu_governor/game_mode';

// 电压列表
const VOLT_LIST = [
    65000, 64375, 63750, 63125, 62500, 61875, 61875, 61250, 60625, 60000,
    59375, 58750, 58125, 57500, 56875, 56250, 55625, 55000, 54375, 53750,
    53125, 52500, 51875, 51250, 50625, 50000, 49375, 48750, 48125, 47500,
    46875, 46250, 45625, 45000, 44375, 43750, 43125, 42500, 41875
];

// 全局变量
let gpuConfigs = []; // 存储当前的GPU配置
let editingIndex = -1; // 当前正在编辑的配置索引，-1表示新增
let gamesList_data = []; // 存储当前的游戏列表

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查主题
    initTheme();

    // 设置事件监听器
    setupEventListeners();

    // 加载数据
    initializeApp();
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
        await safeExecute(loadGameModeStatus, '加载游戏模式状态失败');
        await safeExecute(loadGpuConfig, '加载GPU配置失败');
        await safeExecute(loadGamesList, '加载游戏列表失败');
        await safeExecute(loadLog, '加载日志失败');

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

    // 日志文件选择
    logFileSelect.addEventListener('change', () => {
        loadLog();
    });

    // GPU配置相关事件
    // 添加配置按钮
    addConfigBtn.addEventListener('click', () => {
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
            const lines = stdout.trim().split('\n').filter(line => !line.startsWith('#') && line.trim());

            // 清空当前配置
            gpuConfigs = [];

            if (lines.length > 0) {
                gpuFreqTable.innerHTML = '';

                // 先解析所有配置
                lines.forEach(line => {
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
    } catch (error) {
        console.error('加载GPU配置失败:', error);
        gpuFreqTable.innerHTML = '<tr><td colspan="4" class="loading-text">加载失败</td></tr>';
    }
}

// 初始化电压选择下拉框
function initVoltSelect() {
    voltSelect.innerHTML = '';

    VOLT_LIST.forEach(volt => {
        const option = document.createElement('option');
        option.value = volt;
        option.textContent = volt;
        voltSelect.appendChild(option);
    });
}

// 打开编辑模态框
function openEditModal(index = -1) {
    editingIndex = index;

    if (index >= 0 && index < gpuConfigs.length) {
        // 编辑现有配置
        const config = gpuConfigs[index];
        freqInput.value = config.freq;

        // 设置电压选择
        const voltOption = Array.from(voltSelect.options).find(option => parseInt(option.value) === config.volt);
        if (voltOption) {
            voltSelect.value = voltOption.value;
        } else {
            // 如果没有找到匹配的电压选项，添加一个新选项
            const option = document.createElement('option');
            option.value = config.volt;
            option.textContent = config.volt;
            voltSelect.appendChild(option);
            voltSelect.value = config.volt;
        }

        // 设置内存档位选择
        const ddrOption = Array.from(ddrSelect.options).find(option => parseInt(option.value) === config.ddr);
        if (ddrOption) {
            ddrSelect.value = ddrOption.value;
        }

        // 显示删除按钮
        deleteItemBtn.style.display = 'block';
    } else {
        // 添加新配置
        freqInput.value = '';
        voltSelect.selectedIndex = 0;
        ddrSelect.selectedIndex = 0;

        // 隐藏删除按钮
        deleteItemBtn.style.display = 'none';
    }

    // 显示模态框
    editConfigModal.style.display = 'block';
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

// 加载日志
async function loadLog() {
    try {
        const selectedLog = logFileSelect.value;
        logContent.textContent = '加载中...';

        // 使用cat而不是tail，某些设备可能没有tail命令
        const { errno, stdout } = await exec(`cat ${LOG_PATH}/${selectedLog} 2>/dev/null || echo "日志文件不存在"`);

        if (errno === 0) {
            // 如果日志太长，只显示最后100行
            const lines = stdout.trim().split('\n');
            const lastLines = lines.slice(-100).join('\n');

            logContent.textContent = lastLines || '日志为空';
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
