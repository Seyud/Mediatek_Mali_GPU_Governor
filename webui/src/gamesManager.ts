/**
 * 游戏管理器
 * 主要负责协调各个子模块
 */

import { PATHS } from "./constants";
import { AppInfoService } from "./games/AppInfoService";
import { GameModal } from "./games/GameModal";
import { GameParser } from "./games/GameParser";
import { GameRenderer } from "./games/GameRenderer";
import { getTranslation } from "./i18n";
import type { GameConfig, GameItem, Lang } from "./types/games";
import { exec, toast } from "./utils";

export class GamesManager {
	gamesListData: (GameItem | GameConfig)[] = [];
	currentLanguage: Lang = "zh";
	private gamesList: HTMLElement | null;
	private addGameBtn: HTMLElement | null;
	private saveGamesBtn: HTMLElement | null;
	private gamesSearchInput: HTMLInputElement | null;
	private editingIndex = -1;

	private renderer: GameRenderer;
	private modal: GameModal;

	constructor() {
		this.gamesList = document.getElementById("gamesList");
		this.addGameBtn = document.getElementById("addGameBtn");
		this.saveGamesBtn = document.getElementById("saveGamesBtn");
		this.gamesSearchInput = document.getElementById("gamesSearchInput") as HTMLInputElement | null;

		// 初始化渲染器和模态框管理器
		this.renderer = new GameRenderer(
			this.currentLanguage,
			(index) => this.editGameItem(index),
			(index) => this.deleteGameItem(index)
		);
		this.modal = new GameModal(this.currentLanguage);
	}

	/**
	 * 初始化
	 */
	init(): void {
		this.setupEventListeners();
		this.modal.init(
			() => this.saveGameItem(),
			() => this.closeGameModal()
		);

		// 设置搜索框占位符
		if (this.gamesSearchInput) {
			this.gamesSearchInput.placeholder = getTranslation(
				"config_games_search_placeholder",
				{},
				this.currentLanguage
			);
		}
	}

	/**
	 * 设置事件监听
	 */
	private setupEventListeners(): void {
		if (this.addGameBtn) {
			this.addGameBtn.addEventListener("click", () => this.openGameModal());
		}

		if (this.saveGamesBtn) {
			this.saveGamesBtn.addEventListener("click", () => this.saveGamesToFile());
		}

		// 搜索功能
		if (this.gamesSearchInput) {
			this.gamesSearchInput.addEventListener("input", (e) => {
				const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
				this.filterGamesList(searchTerm);
			});
		}
	}

	/**
	 * 过滤游戏列表
	 */
	private filterGamesList(searchTerm: string): void {
		const gameCards = document.querySelectorAll(".game-card");
		gameCards.forEach((card) => {
			const gameName = card.querySelector(".game-name")?.textContent?.toLowerCase() || "";
			const packageName = card.querySelector(".game-package")?.textContent?.toLowerCase() || "";
			if (gameName.includes(searchTerm) || packageName.includes(searchTerm)) {
				(card as HTMLElement).style.display = "flex";
			} else {
				(card as HTMLElement).style.display = "none";
			}
		});
	}

	/**
	 * 加载游戏列表
	 */
	async loadGamesList(): Promise<void> {
		// 显示加载中状态
		if (this.gamesList) {
			this.gamesList.innerHTML = `<div class="loading-text">${getTranslation("status_loading", {}, this.currentLanguage)}</div>`;
		}

		const { errno, stdout } = await exec(`cat ${PATHS.GAMES_FILE}`);
		if (errno === 0 && stdout.trim()) {
			const games = GameParser.parseTomlGames(stdout.trim());

			if (games.length === 0 && stdout.trim().length > 0) {
				// 解析失败
				toast(getTranslation("toast_games_parse_error", {}, this.currentLanguage));
			}

			this.gamesListData = games as GameItem[];

			if (games.length > 0) {
				// 立即显示游戏列表（使用占位符名称）
				this.refreshGamesList();

				// 异步加载应用名称（不阻塞渲染）
				this.loadAppNamesAsync();
			} else if (this.gamesList) {
				this.gamesList.innerHTML = `<div class="loading-text">${getTranslation("config_games_not_found", {}, this.currentLanguage)}</div>`;
			}
		} else if (this.gamesList) {
			this.gamesList.innerHTML = `<div class="loading-text">${getTranslation("config_games_list_not_found", {}, this.currentLanguage)}</div>`;
		}
	} /**
	 * 异步加载应用名称（不阻塞UI）
	 */
	private async loadAppNamesAsync(): Promise<void> {
		// 并行加载所有应用名称
		const promises = this.gamesListData
			.filter((game) => game.package && !game.name)
			.map(async (game) => {
				if (game.package) {
					const appName = await AppInfoService.fetchAppName(game.package);
					game.name = appName;
					// 加载完成后立即更新该游戏的显示
					if ("package" in game && game.package) {
						this.updateGameCardName(game as GameItem);
					}
				}
			});

		await Promise.all(promises);
	}

	/**
	 * 更新单个游戏卡片的名称显示
	 */
	private updateGameCardName(game: GameItem): void {
		if (!this.gamesList) return;

		const gameCards = this.gamesList.querySelectorAll(".game-card");
		gameCards.forEach((card) => {
			const packageElement = card.querySelector(".game-package");
			if (packageElement?.textContent === game.package) {
				const nameElement = card.querySelector(".game-name");
				if (nameElement && game.name) {
					nameElement.textContent = game.name;
					nameElement.setAttribute("title", game.name);
				}
			}
		});
	}

	/**
	 * 批量加载应用名称（并行加载以提升性能）
	 * @deprecated 使用 loadAppNamesAsync 替代
	 */
	private async loadAppNames(): Promise<void> {
		// 并行加载所有应用名称，而不是逐个串行加载
		const promises = this.gamesListData
			.filter((game) => game.package && !game.name)
			.map(async (game) => {
				if (game.package) {
					game.name = await AppInfoService.fetchAppName(game.package);
				}
			});

		await Promise.all(promises);
	}

	/**
	 * 刷新游戏列表显示
	 */
	refreshGamesList(): void {
		if (!this.gamesList) return;
		this.renderer.renderGamesList(this.gamesList, this.gamesListData as GameItem[]);
	}

	/**
	 * 打开游戏模态框（添加模式）
	 */
	openGameModal(): void {
		this.modal.openForAdd();
		this.editingIndex = -1;
	}

	/**
	 * 编辑游戏项
	 */
	editGameItem(index: number): void {
		if (index < 0 || index >= this.gamesListData.length) return;
		const game = this.gamesListData[index];
		this.modal.openForEdit(game.package || "", game.mode || "balance");
		this.editingIndex = index;
	}

	/**
	 * 关闭游戏模态框
	 */
	closeGameModal(): void {
		this.modal.close();
		this.editingIndex = -1;
	}

	/**
	 * 保存游戏项
	 */
	saveGameItem(): void {
		const packageName = this.modal.getPackageName();
		const gameMode = this.modal.getGameMode();

		if (!packageName) {
			toast(getTranslation("toast_game_invalid", {}, this.currentLanguage));
			return;
		}

		if (this.editingIndex === -1) {
			// 添加模式
			if (this.gamesListData.some((g) => g.package === packageName)) {
				toast(getTranslation("toast_game_exists", {}, this.currentLanguage));
				return;
			}
			this.gamesListData.push({ package: packageName, mode: gameMode });
		} else {
			// 编辑模式
			this.gamesListData[this.editingIndex].package = packageName;
			this.gamesListData[this.editingIndex].mode = gameMode;
		}

		this.closeGameModal();
		this.refreshGamesList();

		if (this.editingIndex === -1) {
			toast(getTranslation("toast_game_added", {}, this.currentLanguage));
		}
	}

	/**
	 * 删除游戏项
	 */
	deleteGameItem(index: number): void {
		if (index >= 0 && index < this.gamesListData.length) {
			this.gamesListData.splice(index, 1);
			this.refreshGamesList();
			toast(getTranslation("toast_game_deleted", {}, this.currentLanguage));
		} else {
			toast(getTranslation("toast_index_invalid", {}, this.currentLanguage));
		}
	}

	/**
	 * 保存游戏列表到文件
	 */
	async saveGamesToFile(): Promise<void> {
		if (this.gamesListData.length === 0) {
			toast(getTranslation("toast_games_empty", {}, this.currentLanguage));
			return;
		}

		const gamesContent = GameParser.serializeTomlGames(this.gamesListData as GameConfig[]);
		const b64 = btoa(unescape(encodeURIComponent(gamesContent)));
		const writeResult = await exec(`echo '${b64}' | base64 -d > ${PATHS.GAMES_FILE}`);

		if (writeResult.errno === 0) {
			toast(getTranslation("toast_games_saved", {}, this.currentLanguage));
		} else {
			toast(getTranslation("toast_games_save_fail", {}, this.currentLanguage));
		}
	}

	/**
	 * 设置语言
	 */
	setLanguage(language: Lang): void {
		this.currentLanguage = language;

		// 更新搜索框占位符
		if (this.gamesSearchInput) {
			this.gamesSearchInput.placeholder = getTranslation(
				"config_games_search_placeholder",
				{},
				this.currentLanguage
			);
		}

		// 更新渲染器和模态框的语言
		this.renderer.setLanguage(language);
		this.modal.setLanguage(language);

		// 刷新游戏列表显示
		this.refreshGamesList();
	}
}
