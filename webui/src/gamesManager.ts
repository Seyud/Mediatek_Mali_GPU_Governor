import { PATHS } from "./constants";
import { getTranslation, translations } from "./i18n";
import { exec, logError, toast, withResult } from "./utils";

interface TranslationsType {
	[language: string]: {
		[key: string]: string;
	};
}

type Lang = "zh" | "en";

interface GameItem {
	package: string;
	mode: string;
}

interface GameConfig {
	package?: string;
	mode?: string;
	trim?: () => string;
}

export class GamesManager {
	gamesListData: (GameItem | GameConfig)[] = [];
	currentLanguage: Lang = "zh";
	gamesList: HTMLElement | null;
	addGameBtn: HTMLElement | null;
	saveGamesBtn: HTMLElement | null;
	editGameModal: HTMLElement | null;
	closeGameModalBtn: Element | null;
	packageNameInput: HTMLInputElement | null;
	gameModeSelect: HTMLSelectElement | null;
	saveGameBtn: HTMLElement | null;
	cancelGameBtn: HTMLElement | null;
	gameModeContainer: HTMLElement | null;
	selectedGameMode: HTMLElement | null;
	gameModeOptions: HTMLElement | null;
	editingIndex = -1;

	constructor() {
		this.gamesList = document.getElementById("gamesList");
		this.addGameBtn = document.getElementById("addGameBtn");
		this.saveGamesBtn = document.getElementById("saveGamesBtn");
		this.editGameModal = document.getElementById("editGameModal");
		this.closeGameModalBtn = document.querySelector(".close-game-modal");
		this.packageNameInput = document.getElementById("packageNameInput") as HTMLInputElement | null;
		this.gameModeSelect = document.getElementById("gameModeSelect") as HTMLSelectElement | null;
		this.saveGameBtn = document.getElementById("saveGameBtn");
		this.cancelGameBtn = document.getElementById("cancelGameBtn");
		this.gameModeContainer = document.getElementById("gameModeContainer");
		this.selectedGameMode = document.getElementById("selectedGameMode");
		this.gameModeOptions = document.getElementById("gameModeOptions");
	}

	init() {
		this.setupEventListeners();
	}

	setupEventListeners() {
		if (this.addGameBtn) this.addGameBtn.addEventListener("click", () => this.openGameModal());
		if (this.saveGamesBtn)
			this.saveGamesBtn.addEventListener("click", () => this.saveGamesToFile());
		if (this.closeGameModalBtn)
			this.closeGameModalBtn.addEventListener("click", () => this.closeGameModal());
		if (this.cancelGameBtn)
			this.cancelGameBtn.addEventListener("click", () => this.closeGameModal());
		if (this.saveGameBtn) this.saveGameBtn.addEventListener("click", () => this.saveGameItem());
		window.addEventListener("click", (event) => {
			if (event.target === this.editGameModal) this.closeGameModal();
		});
		window.addEventListener("keydown", (event) => {
			if (
				event.key === "Escape" &&
				this.editGameModal &&
				this.editGameModal.style.display === "block"
			)
				this.closeGameModal();
		});
		this.initGameModeSelect();
	}

	async loadGamesList() {
		const result = await withResult(async () => {
			const { errno, stdout } = await exec(`cat ${PATHS.GAMES_FILE}`);
			return { errno, stdout };
		}, "games-load");
		if (!result.ok) {
			logError("games-load", result.error);
			if (this.gamesList) this.gamesList.innerHTML = '<li class="loading-text">加载失败</li>';
			return;
		}
		const { errno, stdout } = result.data;
		if (errno === 0 && stdout.trim()) {
			const games = this.parseTomlGames(stdout.trim());
			this.gamesListData = games as GameItem[];
			if (games.length > 0) this.refreshGamesList();
			else if (this.gamesList)
				this.gamesList.innerHTML = `<li class="loading-text">${getTranslation("config_games_not_found", {}, this.currentLanguage)}</li>`;
		} else if (this.gamesList)
			this.gamesList.innerHTML = `<li class="loading-text">${getTranslation("config_games_list_not_found", {}, this.currentLanguage)}</li>`;
	}

	parseTomlGames(tomlString: string) {
		const games: GameConfig[] = [];
		const lines = tomlString.split("\n");
		let currentGame: GameConfig | null = null;
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			if (trimmed.startsWith("[[games]]")) {
				if (currentGame) games.push(currentGame);
				currentGame = {};
				continue;
			}
			if (currentGame && trimmed.includes("=")) {
				const [k, v] = trimmed.split("=");
				const ck = k.trim();
				const cv = v.trim().replace(/"/g, "");
				if (ck === "package") currentGame.package = cv;
				else if (ck === "mode") currentGame.mode = cv;
			}
		}
		if (currentGame) games.push(currentGame);
		return games;
	}

	refreshGamesList() {
		if (!this.gamesList) return;
		this.gamesList.innerHTML = "";
		if (this.gamesListData.length === 0) {
			this.gamesList.innerHTML = `<li class="loading-text">${getTranslation("config_games_not_found", {}, this.currentLanguage)}</li>`;
			return;
		}
		this.gamesListData.forEach((game, index) => {
			const li = document.createElement("li");
			const gameText = document.createElement("span");
			const modeText = this.getModeText(game.mode || "balance");
			gameText.textContent = game.package ? `${game.package} (${modeText})` : "";
			li.appendChild(gameText);
			const buttonContainer = document.createElement("div");
			buttonContainer.className = "game-button-container";
			const editBtn = document.createElement("button");
			editBtn.className = "game-edit-btn";
			editBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3,17.25V21h3.75L17.81,9.94L14.06,6.19L3,17.25M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04Z"/></svg>`;
			editBtn.title = "编辑";
			editBtn.onclick = (e) => {
				e.stopPropagation();
				this.editGameItem(index);
			};
			buttonContainer.appendChild(editBtn);
			const deleteBtn = document.createElement("button");
			deleteBtn.className = "game-delete-btn";
			deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
			deleteBtn.title = "删除";
			deleteBtn.onclick = (e) => {
				e.stopPropagation();
				this.deleteGameItem(index);
			};
			buttonContainer.appendChild(deleteBtn);
			li.appendChild(buttonContainer);
			this.gamesList?.appendChild(li);
		});
	}

	getModeText(mode: string) {
		const modeTexts: Record<Lang, Record<string, string>> = {
			zh: { powersave: "省电", balance: "均衡", performance: "性能", fast: "极速" },
			en: {
				powersave: "Powersave",
				balance: "Balance",
				performance: "Performance",
				fast: "Fast",
			},
		};
		return modeTexts[this.currentLanguage][mode] || modeTexts[this.currentLanguage].balance;
	}

	openGameModal() {
		if (this.packageNameInput) this.packageNameInput.value = "";
		if (this.gameModeSelect) this.gameModeSelect.value = "balance";
		this.updateGameModeSelectDisplay("balance");
		if (this.editGameModal) this.editGameModal.style.display = "block";
		this.editingIndex = -1;
	}
	editGameItem(index: number) {
		if (index < 0 || index >= this.gamesListData.length) return;
		const game = this.gamesListData[index];
		if (this.packageNameInput) this.packageNameInput.value = game.package || "";
		if (this.gameModeSelect) this.gameModeSelect.value = game.mode || "balance";
		this.updateGameModeSelectDisplay(game.mode || "balance");
		if (this.editGameModal) this.editGameModal.style.display = "block";
		this.editingIndex = index;
	}
	closeGameModal() {
		if (this.editGameModal) this.editGameModal.style.display = "none";
		this.editingIndex = -1;
	}
	saveGameItem() {
		if (!this.packageNameInput) return;
		const packageName = this.packageNameInput.value.trim();
		const gameMode = this.gameModeSelect ? this.gameModeSelect.value : "balance";
		if (!packageName) {
			toast(getTranslation("toast_game_invalid", {}, this.currentLanguage));
			return;
		}
		if (this.editingIndex === -1) {
			if (this.gamesListData.some((g) => g.package === packageName)) {
				toast(getTranslation("toast_game_exists", {}, this.currentLanguage));
				return;
			}
			this.gamesListData.push({ package: packageName, mode: gameMode });
		} else {
			this.gamesListData[this.editingIndex].package = packageName;
			this.gamesListData[this.editingIndex].mode = gameMode;
		}
		this.closeGameModal();
		this.refreshGamesList();
		if (this.editingIndex === -1)
			toast(getTranslation("toast_game_added", {}, this.currentLanguage));
	}
	initGameModeSelect() {
		if (!this.gameModeContainer || !this.selectedGameMode || !this.gameModeOptions) return;
		this.selectedGameMode.addEventListener("click", (e) => {
			e.stopPropagation();
			this.gameModeContainer?.classList.toggle("open");
		});
		const options = this.gameModeOptions.querySelectorAll(".option");
		options.forEach((option) => {
			option.addEventListener("click", (e) => {
				e.stopPropagation();
				const value = option.getAttribute("data-value");
				const text = option.textContent;
				if (this.selectedGameMode) {
					this.selectedGameMode.textContent = text;
				}
				if (this.gameModeSelect && value) {
					this.gameModeSelect.value = value;
					this.gameModeSelect.dispatchEvent(new Event("change"));
				}
				options.forEach((opt) => {
					opt.classList.remove("selected");
				});
				option.classList.add("selected");
				this.gameModeContainer?.classList.remove("open");
			});
		});
		document.addEventListener("click", (e) => {
			if (!this.gameModeContainer?.contains(e.target as Node))
				this.gameModeContainer?.classList.remove("open");
		});
	}
	updateGameModeSelectDisplay(mode: string) {
		if (!this.selectedGameMode || !this.gameModeOptions) return;
		const option = this.gameModeOptions.querySelector(`.option[data-value="${mode}"]`);
		if (option) {
			this.selectedGameMode.textContent = option.textContent;
			const options = this.gameModeOptions.querySelectorAll(".option");
			options.forEach((opt) => {
				opt.classList.remove("selected");
			});
			option.classList.add("selected");
		}
	}
	deleteGameItem(index: number) {
		if (index >= 0 && index < this.gamesListData.length) {
			this.gamesListData.splice(index, 1);
			this.refreshGamesList();
			toast(getTranslation("toast_game_deleted", {}, this.currentLanguage));
		} else toast(getTranslation("toast_index_invalid", {}, this.currentLanguage));
	}
	async saveGamesToFile() {
		if (this.gamesListData.length === 0) {
			toast(getTranslation("toast_games_empty", {}, this.currentLanguage));
			return;
		}
		// 生成 TOML 内容
		let gamesContent = "# GPU调速器游戏列表配置文件\n\n";
		this.gamesListData.forEach((game) => {
			gamesContent += "[[games]]\n";
			gamesContent += `package = "${game.package}"\n`;
			gamesContent += `mode = "${game.mode || "balance"}"\n\n`;
		});
		// 使用 base64 写入以避免引号转义问题
		const b64 = btoa(unescape(encodeURIComponent(gamesContent)));
		const writeResult = await withResult(async () => {
			return await exec(`echo '${b64}' | base64 -d > ${PATHS.GAMES_FILE}`);
		}, "games-save");
		if (!writeResult.ok) {
			toast(getTranslation("toast_games_save_fail", {}, this.currentLanguage));
			return;
		}
		if (writeResult.data.errno === 0)
			toast(getTranslation("toast_games_saved", {}, this.currentLanguage));
		else toast(getTranslation("toast_games_save_fail", {}, this.currentLanguage));
	}
	setLanguage(language: Lang) {
		this.currentLanguage = language;
		if (this.gameModeSelect) {
			const options = this.gameModeSelect.options;
			for (let i = 0; i < options.length; i++) {
				const option = options[i];
				const value = option.value;
				const key = `status_mode_${value}`;
				if ((translations as TranslationsType)[language]?.[key]) {
					option.textContent = (translations as TranslationsType)[language][key];
				}
			}
		}
		if (this.gameModeOptions) {
			const customOptions = this.gameModeOptions.querySelectorAll(".option");
			customOptions.forEach((option) => {
				const value = option.getAttribute("data-value");
				const key = `status_mode_${value}`;
				if ((translations as TranslationsType)[language]?.[key]) {
					option.textContent = (translations as TranslationsType)[language][key];
				}
			});
		}
		if (this.selectedGameMode && this.gameModeSelect) {
			const selectedValue = this.gameModeSelect.value;
			const key = `status_mode_${selectedValue}`;
			if ((translations as TranslationsType)[language]?.[key]) {
				this.selectedGameMode.textContent = (translations as TranslationsType)[language][key];
			}
		}
		this.refreshGamesList();
	}
}
