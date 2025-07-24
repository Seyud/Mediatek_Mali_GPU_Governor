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
        this.saveGameBtn = document.getElementById('saveGameBtn');
        this.cancelGameBtn = document.getElementById('cancelGameBtn');
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
    }

    async loadGamesList() {
        try {
            const { errno, stdout } = await exec(`cat ${PATHS.GAMES_FILE}`);

            if (errno === 0 && stdout.trim()) {
                const games = stdout.trim().split('\n').filter(game => game.trim());

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
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                this.deleteGameItem(index);
            };
            li.appendChild(deleteBtn);

            this.gamesList.appendChild(li);
        });
    }

    // 打开游戏编辑模态框
    openGameModal() {
        if (this.packageNameInput) {
            this.packageNameInput.value = '';
        }
        if (this.editGameModal) {
            this.editGameModal.style.display = 'block';
        }
    }

    // 关闭游戏编辑模态框
    closeGameModal() {
        if (this.editGameModal) {
            this.editGameModal.style.display = 'none';
        }
    }

    // 保存游戏项
    saveGameItem() {
        if (!this.packageNameInput) return;
        
        const packageName = this.packageNameInput.value.trim();

        if (!packageName) {
            toast(getTranslation('toast_game_invalid', {}, this.currentLanguage));
            return;
        }

        // 检查是否已存在
        if (this.gamesListData.includes(packageName)) {
            toast(getTranslation('toast_game_exists', {}, this.currentLanguage));
            return;
        }

        // 添加到列表
        this.gamesListData.push(packageName);

        // 关闭模态框
        this.closeGameModal();

        // 刷新列表
        this.refreshGamesList();

        toast(getTranslation('toast_game_added', {}, this.currentLanguage));
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

            // 生成文件内容
            const gamesContent = this.gamesListData.join('\n');

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