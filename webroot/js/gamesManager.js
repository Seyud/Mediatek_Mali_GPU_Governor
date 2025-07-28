// 游戏列表管理模块
import { exec, toast } from './utils.js';
import { PATHS } from './constants.js';
import { getTranslation } from './i18n.js';

export class GamesManager {
    constructor() {
        this.gamesListData = [];
        this.currentLanguage = 'zh';
        
        // DOM元素
        this.gamesList = document.getElementById('gamesList');
        this.addGameBtn = document.getElementById('addGameBtn');
        this.saveGamesBtn = document.getElementById('saveGamesBtn');
        this.editGameModal = document.getElementById('editGameModal');
        this.closeGameModalBtn = document.querySelector('.close-game-modal');
        this.packageNameInput = document.getElementById('packageNameInput');
        this.gameModeSelect = document.getElementById('gameModeSelect');
        this.saveGameBtn = document.getElementById('saveGameBtn');
        this.cancelGameBtn = document.getElementById('cancelGameBtn');
        
        // 游戏模式选择器元素
        this.gameModeContainer = document.getElementById('gameModeContainer');
        this.selectedGameMode = document.getElementById('selectedGameMode');
        this.gameModeOptions = document.getElementById('gameModeOptions');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.addGameBtn) {
            this.addGameBtn.addEventListener('click', () => {
                this.openGameModal();
            });
        }

        if (this.saveGamesBtn) {
            this.saveGamesBtn.addEventListener('click', () => {
                this.saveGamesToFile();
            });
        }

        if (this.closeGameModalBtn) {
            this.closeGameModalBtn.addEventListener('click', () => {
                this.closeGameModal();
            });
        }

        if (this.cancelGameBtn) {
            this.cancelGameBtn.addEventListener('click', () => {
                this.closeGameModal();
            });
        }

        if (this.saveGameBtn) {
            this.saveGameBtn.addEventListener('click', () => {
                this.saveGameItem();
            });
        }

        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            if (event.target === this.editGameModal) {
                this.closeGameModal();
            }
        });

        // 按ESC键关闭模态框
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.editGameModal && this.editGameModal.style.display === 'block') {
                    this.closeGameModal();
                }
            }
        });
        
        // 初始化游戏模式选择器
        this.initGameModeSelect();
    }

    async loadGamesList() {
        try {
            const { errno, stdout } = await exec(`cat ${PATHS.GAMES_FILE}`);

            if (errno === 0 && stdout.trim()) {
                // 解析TOML格式的游戏列表
                const games = this.parseTomlGames(stdout.trim());
                
                // 保存到实例变量
                this.gamesListData = games;

                if (games.length > 0) {
                    this.refreshGamesList();
                } else {
                    if (this.gamesList) {
                        this.gamesList.innerHTML = `<li class="loading-text">${getTranslation('config_games_not_found', {}, this.currentLanguage)}</li>`;
                    }
                }
            } else {
                if (this.gamesList) {
                    this.gamesList.innerHTML = `<li class="loading-text">${getTranslation('config_games_list_not_found', {}, this.currentLanguage)}</li>`;
                }
            }
        } catch (error) {
            console.error('加载游戏列表失败:', error);
            if (this.gamesList) {
                this.gamesList.innerHTML = '<li class="loading-text">加载失败</li>';
            }
        }
    }

    // 解析TOML格式的游戏列表
    parseTomlGames(tomlString) {
        const games = [];
        const lines = tomlString.split('\n');
        
        let currentGame = null;
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 忽略空行和注释行
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }
            
            // 检测游戏条目开始
            if (trimmedLine.startsWith('[[games]]')) {
                if (currentGame) {
                    games.push(currentGame);
                }
                currentGame = {};
                continue;
            }
            
            // 解析键值对
            if (currentGame && trimmedLine.includes('=')) {
                const [key, value] = trimmedLine.split('=');
                const cleanKey = key.trim();
                const cleanValue = value.trim().replace(/"/g, ''); // 移除引号
                
                if (cleanKey === 'package') {
                    currentGame.package = cleanValue;
                } else if (cleanKey === 'mode') {
                    currentGame.mode = cleanValue;
                }
            }
        }
        
        // 添加最后一个游戏条目
        if (currentGame) {
            games.push(currentGame);
        }
        
        return games;
    }

    // 刷新游戏列表
    refreshGamesList() {
        if (!this.gamesList) return;

        this.gamesList.innerHTML = '';

        if (this.gamesListData.length === 0) {
            this.gamesList.innerHTML = `<li class="loading-text">${getTranslation('config_games_not_found', {}, this.currentLanguage)}</li>`;
            return;
        }

        this.gamesListData.forEach((game, index) => {
            const li = document.createElement('li');

            // 创建游戏包名文本
            const gameText = document.createElement('span');
            const modeText = this.getModeText(game.mode || 'balance');
            gameText.textContent = game.package ? `${game.package} (${modeText})` : game.trim();
            li.appendChild(gameText);

            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'game-button-container';

            // 创建编辑按钮
            const editBtn = document.createElement('button');
            editBtn.className = 'game-edit-btn';
            editBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,17.25V21h3.75L17.81,9.94L14.06,6.19L3,17.25M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04Z"/>
                </svg>
            `;
            editBtn.title = '编辑';
            editBtn.onclick = (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                this.editGameItem(index);
            };
            buttonContainer.appendChild(editBtn);

            // 创建删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'game-delete-btn';
            deleteBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            `;
            deleteBtn.title = '删除';
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                this.deleteGameItem(index);
            };
            buttonContainer.appendChild(deleteBtn);

            li.appendChild(buttonContainer);
            this.gamesList.appendChild(li);
        });
    }

    // 获取模式显示文本
    getModeText(mode) {
        const modeTexts = {
            'zh': {
                'powersave': '省电',
                'balance': '均衡',
                'performance': '性能',
                'fast': '极速'
            },
            'en': {
                'powersave': 'Power Saving',
                'balance': 'Balance',
                'performance': 'Performance',
                'fast': 'Fast'
            }
        };
        
        return modeTexts[this.currentLanguage][mode] || modeTexts[this.currentLanguage]['balance'];
    }

    // 打开游戏编辑模态框（新增）
    openGameModal() {
        if (this.packageNameInput) {
            this.packageNameInput.value = '';
        }
        if (this.gameModeSelect) {
            this.gameModeSelect.value = 'balance';
        }
        // 更新自定义选择器显示
        this.updateGameModeSelectDisplay('balance');
        if (this.editGameModal) {
            this.editGameModal.style.display = 'block';
        }
        this.editingIndex = -1; // 新增模式
    }

    // 打开游戏编辑模态框（编辑）
    editGameItem(index) {
        if (index < 0 || index >= this.gamesListData.length) return;
        
        const game = this.gamesListData[index];
        if (this.packageNameInput) {
            this.packageNameInput.value = game.package || '';
        }
        if (this.gameModeSelect) {
            this.gameModeSelect.value = game.mode || 'balance';
        }
        // 更新自定义选择器显示
        this.updateGameModeSelectDisplay(game.mode || 'balance');
        if (this.editGameModal) {
            this.editGameModal.style.display = 'block';
        }
        this.editingIndex = index; // 编辑模式
    }

    // 关闭游戏编辑模态框
    closeGameModal() {
        if (this.editGameModal) {
            this.editGameModal.style.display = 'none';
        }
        this.editingIndex = -1;
    }

    // 保存游戏项
    saveGameItem() {
        if (!this.packageNameInput) return;
        
        const packageName = this.packageNameInput.value.trim();
        const gameMode = this.gameModeSelect ? this.gameModeSelect.value : 'balance';

        if (!packageName) {
            toast(getTranslation('toast_game_invalid', {}, this.currentLanguage));
            return;
        }

        // 检查是否已存在（新增时检查）
        if (this.editingIndex === -1) {
            const exists = this.gamesListData.some(game => game.package === packageName);
            if (exists) {
                toast(getTranslation('toast_game_exists', {}, this.currentLanguage));
                return;
            }

            // 添加到列表
            this.gamesListData.push({
                package: packageName,
                mode: gameMode
            });
        } else {
            // 更新现有项
            this.gamesListData[this.editingIndex].package = packageName;
            this.gamesListData[this.editingIndex].mode = gameMode;
        }

        // 关闭模态框
        this.closeGameModal();

        // 刷新列表
        this.refreshGamesList();

        if (this.editingIndex === -1) {
            toast(getTranslation('toast_game_added', {}, this.currentLanguage));
        }
    }
    
    // 初始化游戏模式选择器
    initGameModeSelect() {
        if (!this.gameModeContainer || !this.selectedGameMode || !this.gameModeOptions) return;
        
        // 点击选中项切换选项容器显示状态
        this.selectedGameMode.addEventListener('click', (e) => {
            e.stopPropagation();
            this.gameModeContainer.classList.toggle('open');
        });
        
        // 点击选项更新选中值并触发change事件
        const options = this.gameModeOptions.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                const text = option.textContent;
                
                // 更新显示文本
                this.selectedGameMode.textContent = text;
                
                // 更新隐藏select的值
                if (this.gameModeSelect) {
                    this.gameModeSelect.value = value;
                    // 触发change事件
                    this.gameModeSelect.dispatchEvent(new Event('change'));
                }
                
                // 移除其他选项的选中状态
                options.forEach(opt => opt.classList.remove('selected'));
                // 为当前选项添加选中状态
                option.classList.add('selected');
                
                // 隐藏选项容器
                this.gameModeContainer.classList.remove('open');
            });
        });
        
        // 点击外部隐藏选项容器
        document.addEventListener('click', (e) => {
            if (!this.gameModeContainer.contains(e.target)) {
                this.gameModeContainer.classList.remove('open');
            }
        });
    }
    
    // 更新游戏模式选择器显示
    updateGameModeSelectDisplay(mode) {
        if (!this.selectedGameMode || !this.gameModeOptions) return;
        
        // 查找对应的选项
        const option = this.gameModeOptions.querySelector(`.option[data-value="${mode}"]`);
        if (option) {
            // 更新显示文本
            this.selectedGameMode.textContent = option.textContent;
            
            // 更新选中状态
            const options = this.gameModeOptions.querySelectorAll('.option');
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        }
    }

    // 删除游戏项
    deleteGameItem(index) {
        if (index >= 0 && index < this.gamesListData.length) {
            // 从数组中删除
            this.gamesListData.splice(index, 1);

            // 刷新列表
            this.refreshGamesList();

            toast(getTranslation('toast_game_deleted', {}, this.currentLanguage));
        } else {
            toast(getTranslation('toast_index_invalid', {}, this.currentLanguage));
        }
    }

    // 保存游戏列表到文件
    async saveGamesToFile() {
        try {
            if (this.gamesListData.length === 0) {
                toast(getTranslation('toast_games_empty', {}, this.currentLanguage));
                return;
            }

            // 生成TOML格式的文件内容
            let gamesContent = '# GPU调速器游戏列表配置文件\n\n';
            this.gamesListData.forEach(game => {
                gamesContent += '[[games]]\n';
                gamesContent += `package = "${game.package}"\n`;
                gamesContent += `mode = "${game.mode || 'balance'}"\n\n`;
            });

            // 保存到文件
            const { errno } = await exec(`echo '${gamesContent}' > ${PATHS.GAMES_FILE}`);

            if (errno === 0) {
                toast(getTranslation('toast_games_saved', {}, this.currentLanguage));
            } else {
                toast(getTranslation('toast_games_save_fail', {}, this.currentLanguage));
            }
        } catch (error) {
            console.error('保存游戏列表失败:', error);
            toast(`保存游戏列表失败: ${error.message}`);
        }
    }

    setLanguage(language) {
        this.currentLanguage = language;
    }
}