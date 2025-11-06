import { PATHS } from "./constants";
import { getTranslation, translations } from "./i18n";
import { exec, toast } from "./utils";

interface TranslationsType {
	[language: string]: {
		[key: string]: string;
	};
}

type Lang = "zh" | "en";

interface GameItem {
	package: string;
	mode: string;
	name?: string; // 应用名称
}

interface GameConfig {
	package?: string;
	mode?: string;
	name?: string;
	trim?: () => string;
}

// WebUI-X 类型定义
interface WindowWithWebUIX extends Window {
	$packageManager?: {
		getApplicationInfo(
			packageName: string,
			flags: number,
			userId: number
		): {
			getLabel(): string;
		} | null;
		getApplicationIcon(packageName: string, flags: number, userId: number): unknown;
	};
	wrapInputStream?: (stream: unknown) => Promise<Response>;
}

declare const window: WindowWithWebUIX;

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
	gamesSearchInput: HTMLInputElement | null;
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
		this.gamesSearchInput = document.getElementById("gamesSearchInput") as HTMLInputElement | null;
	}

	init() {
		this.setupEventListeners();
		// 设置搜索框占位符
		if (this.gamesSearchInput) {
			this.gamesSearchInput.placeholder = getTranslation(
				"config_games_search_placeholder",
				{},
				this.currentLanguage
			);
		}
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

		// 搜索功能
		if (this.gamesSearchInput) {
			this.gamesSearchInput.addEventListener("input", (e) => {
				const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
				this.filterGamesList(searchTerm);
			});
		}
	}

	filterGamesList(searchTerm: string) {
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

	async loadGamesList() {
		const { errno, stdout } = await exec(`cat ${PATHS.GAMES_FILE}`);
		if (errno === 0 && stdout.trim()) {
			const games = this.parseTomlGames(stdout.trim());
			this.gamesListData = games as GameItem[];

			if (games.length > 0) {
				// 批量获取应用名称
				await this.loadAppNames();
				// 显示游戏列表
				this.refreshGamesList();
			} else if (this.gamesList) {
				this.gamesList.innerHTML = `<div class="loading-text">${getTranslation("config_games_not_found", {}, this.currentLanguage)}</div>`;
			}
		} else if (this.gamesList)
			this.gamesList.innerHTML = `<div class="loading-text">${getTranslation("config_games_list_not_found", {}, this.currentLanguage)}</div>`;
	}

	async loadAppNames() {
		// 使用 WebUI-X API 获取应用名称
		for (const game of this.gamesListData) {
			if (game.package && !game.name) {
				const appName = await this.fetchAppName(game.package);
				game.name = appName;
			}
		}
	}

	async fetchAppName(packageName: string): Promise<string> {
		try {
			// 优先使用 WebUI-X API
			if (typeof window.$packageManager !== "undefined") {
				const info = window.$packageManager.getApplicationInfo(packageName, 0, 0);
				if (info?.getLabel?.()) {
					return info.getLabel();
				}
			}

			// 回退到 shell 命令方法
			const { errno, stdout } = await exec(
				`pm dump ${packageName} 2>/dev/null | grep "label=" | head -1 | sed 's/.*label=//' | cut -d' ' -f1`
			);

			if (errno === 0 && stdout.trim() && stdout.trim() !== "null") {
				return stdout.trim();
			}

			// 再尝试从 APK 获取
			const { errno: pathErrno, stdout: pathStdout } = await exec(
				`pm path ${packageName} 2>/dev/null | head -1 | cut -d':' -f2`
			);

			if (pathErrno === 0 && pathStdout.trim()) {
				const apkPath = pathStdout.trim();
				const { errno: aaptErrno, stdout: aaptStdout } = await exec(
					`aapt dump badging "${apkPath}" 2>/dev/null | grep "application-label:" | head -1 | sed "s/.*application-label:'\\([^']*\\)'.*/\\1/"`
				);

				if (aaptErrno === 0 && aaptStdout.trim()) {
					return aaptStdout.trim();
				}
			}

			// 最后回退到包名处理
			return this.getAppNameFromPackage(packageName);
		} catch (error) {
			console.error(`Failed to fetch app name for ${packageName}:`, error);
			return this.getAppNameFromPackage(packageName);
		}
	}

	getAppNameFromPackage(packageName: string): string {
		// 从包名提取友好名称
		const parts = packageName.split(".");
		const lastPart = parts[parts.length - 1];
		// 移除常见的后缀
		const cleanName = lastPart
			.replace(/app$/i, "")
			.replace(/client$/i, "")
			.replace(/mobile$/i, "");
		// 首字母大写，处理驼峰命名
		return (
			cleanName
				.replace(/([A-Z])/g, " $1")
				.trim()
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(" ") || lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
		);
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
			this.gamesList.innerHTML = `<div class="loading-text">${getTranslation("config_games_not_found", {}, this.currentLanguage)}</div>`;
			return;
		}
		this.gamesListData.forEach((game, index) => {
			// 创建游戏卡片
			const gameCard = document.createElement("div");
			gameCard.className = "game-card";
			gameCard.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;

			// 创建游戏卡片头部
			const gameHeader = document.createElement("div");
			gameHeader.className = "game-header";

			// 应用图标容器
			const iconContainer = document.createElement("div");
			iconContainer.className = "game-icon-container";

			const appName = game.name || this.getAppNameFromPackage(game.package || "");
			const firstLetter = appName.charAt(0).toUpperCase();

			// 生成颜色（基于包名哈希）
			const hash = (game.package || "").split("").reduce((acc, char) => {
				return char.charCodeAt(0) + ((acc << 5) - acc);
			}, 0);
			const hue = Math.abs(hash) % 360;

			const iconPlaceholder = document.createElement("div");
			iconPlaceholder.className = "game-icon-placeholder";
			iconPlaceholder.textContent = firstLetter;
			iconPlaceholder.style.background = `linear-gradient(135deg, hsl(${hue}, 65%, 55%), hsl(${hue + 20}, 65%, 45%))`;

			iconContainer.appendChild(iconPlaceholder);

			// 异步加载真实图标（不阻塞渲染）
			if (game.package) {
				this.loadAppIconAsync(game.package, iconContainer, iconPlaceholder);
			}

			// 游戏名称容器
			const gameNameContainer = document.createElement("div");
			gameNameContainer.className = "game-name-container";

			const gameName = document.createElement("h4");
			gameName.className = "game-name";
			gameName.textContent = appName;
			gameName.title = appName;

			const gamePackage = document.createElement("span");
			gamePackage.className = "game-package";
			gamePackage.textContent = game.package || "";
			gamePackage.title = game.package || "";

			gameNameContainer.appendChild(gameName);
			gameNameContainer.appendChild(gamePackage);

			// 操作按钮容器
			const buttonContainer = document.createElement("div");
			buttonContainer.className = "game-actions";

			const editBtn = document.createElement("button");
			editBtn.className = "game-edit-btn";
			editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
			editBtn.title = "编辑";
			editBtn.onclick = (e) => {
				e.stopPropagation();
				this.editGameItem(index);
			};

			const deleteBtn = document.createElement("button");
			deleteBtn.className = "game-delete-btn";
			deleteBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
			deleteBtn.title = "删除";
			deleteBtn.onclick = (e) => {
				e.stopPropagation();
				this.deleteGameItem(index);
			};

			buttonContainer.appendChild(editBtn);
			buttonContainer.appendChild(deleteBtn);

			gameHeader.appendChild(iconContainer);
			gameHeader.appendChild(gameNameContainer);
			gameHeader.appendChild(buttonContainer);

			// 创建游戏详情
			const gameDetails = document.createElement("div");
			gameDetails.className = "game-details";

			const modeText = this.getModeText(game.mode || "balance");
			const modeBadge = document.createElement("span");
			modeBadge.className = `game-mode-badge mode-${game.mode || "balance"}`;
			modeBadge.textContent = modeText;

			gameDetails.appendChild(modeBadge);

			// 组装卡片
			gameCard.appendChild(gameHeader);
			gameCard.appendChild(gameDetails);

			this.gamesList?.appendChild(gameCard);
		});
	}

	async loadAppIconAsync(
		packageName: string,
		iconContainer: HTMLElement,
		placeholder: HTMLElement
	) {
		try {
			// 优先使用 WebUI-X API
			if (typeof window.$packageManager !== "undefined") {
				try {
					const stream = window.$packageManager.getApplicationIcon(packageName, 0, 0);
					if (stream) {
						// 动态加载 wrapInputStream 工具
						await this.loadWrapInputStream();
						const wrapInputStream = window.wrapInputStream;

						if (wrapInputStream) {
							const response = await wrapInputStream(stream);
							const buffer = await response.arrayBuffer();
							const base64 = this.arrayBufferToBase64(buffer);

							const img = document.createElement("img");
							img.className = "game-icon-loaded";
							img.src = `data:image/png;base64,${base64}`;
							img.alt = packageName;

							img.onload = () => {
								placeholder.style.opacity = "0";
								placeholder.style.transition = "opacity 0.3s ease";

								setTimeout(() => {
									iconContainer.innerHTML = "";
									img.style.opacity = "0";
									iconContainer.appendChild(img);

									requestAnimationFrame(() => {
										img.style.transition = "opacity 0.3s ease";
										img.style.opacity = "1";
									});
								}, 300);
							};

							img.onerror = () => {
								console.warn(`Failed to load icon image for ${packageName}`);
							};

							return; // 成功使用 API，直接返回
						}
					}
				} catch (apiError) {
					console.log(`WebUI-X API failed for ${packageName}:`, apiError);
				}
			}

			// 回退到 shell 命令方法
			const { errno: pathErrno, stdout: pathStdout } = await exec(
				`pm path ${packageName} 2>/dev/null | head -1 | cut -d':' -f2`
			);

			if (pathErrno !== 0 || !pathStdout.trim()) {
				console.log(`Failed to get APK path for ${packageName}`);
				return;
			}

			const apkPath = pathStdout.trim();

			const { errno: iconErrno, stdout: iconStdout } = await exec(
				`aapt dump badging "${apkPath}" 2>/dev/null | grep "application-icon-" | tail -1 | sed "s/.*'\\([^']*\\)'.*/\\1/"`
			);

			if (iconErrno !== 0 || !iconStdout.trim()) {
				console.log(`Failed to get icon path for ${packageName}`);
				return;
			}

			const iconPath = iconStdout.trim();
			const tempFile = `/data/local/tmp/icon_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

			const { errno: unzipErrno } = await exec(
				`unzip -p "${apkPath}" "${iconPath}" > "${tempFile}" 2>/dev/null`
			);

			if (unzipErrno !== 0) {
				console.log(`Failed to extract icon for ${packageName}`);
				await exec(`rm -f "${tempFile}" 2>/dev/null`);
				return;
			}

			const { errno: base64Errno, stdout: base64Data } = await exec(
				`base64 "${tempFile}" 2>/dev/null`
			);

			await exec(`rm -f "${tempFile}" 2>/dev/null`);

			if (base64Errno === 0 && base64Data.trim()) {
				const img = document.createElement("img");
				img.className = "game-icon-loaded";
				img.src = `data:image/png;base64,${base64Data.trim()}`;
				img.alt = packageName;

				img.onload = () => {
					placeholder.style.opacity = "0";
					placeholder.style.transition = "opacity 0.3s ease";

					setTimeout(() => {
						iconContainer.innerHTML = "";
						img.style.opacity = "0";
						iconContainer.appendChild(img);

						requestAnimationFrame(() => {
							img.style.transition = "opacity 0.3s ease";
							img.style.opacity = "1";
						});
					}, 300);
				};

				img.onerror = () => {
					console.warn(`Failed to load icon image for ${packageName}`);
				};
			} else {
				console.log(`Failed to convert icon to base64 for ${packageName}`);
			}
		} catch (error) {
			console.error(`Error loading icon for ${packageName}:`, error);
		}
	}

	// 动态加载 wrapInputStream 工具
	async loadWrapInputStream() {
		if (typeof window.wrapInputStream === "undefined") {
			try {
				// 使用 eval 避免编译时检查
				const moduleUrl = "https://mui.kernelsu.org/internal/assets/ext/wrapInputStream.mjs";
				const importFn = new Function("url", "return import(url)");
				const module = await importFn(moduleUrl);
				window.wrapInputStream = module.wrapInputStream;
			} catch (error) {
				console.error("Failed to load wrapInputStream:", error);
			}
		}
	}

	// ArrayBuffer 转 Base64（和 COPG 相同的实现）
	arrayBufferToBase64(buffer: ArrayBuffer): string {
		const uint8Array = new Uint8Array(buffer);
		let binary = "";
		for (const byte of uint8Array) {
			binary += String.fromCharCode(byte);
		}
		return btoa(binary);
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
		let gamesContent = "# GPU调速器游戏列表配置文件\n\n";
		this.gamesListData.forEach((game) => {
			gamesContent += "[[games]]\n";
			gamesContent += `package = "${game.package}"\n`;
			gamesContent += `mode = "${game.mode || "balance"}"\n\n`;
		});
		const b64 = btoa(unescape(encodeURIComponent(gamesContent)));
		const writeResult = await exec(`echo '${b64}' | base64 -d > ${PATHS.GAMES_FILE}`);
		if (writeResult.errno === 0)
			toast(getTranslation("toast_games_saved", {}, this.currentLanguage));
		else toast(getTranslation("toast_games_save_fail", {}, this.currentLanguage));
	}
	setLanguage(language: Lang) {
		this.currentLanguage = language;

		// 更新搜索框占位符
		if (this.gamesSearchInput) {
			this.gamesSearchInput.placeholder = getTranslation(
				"config_games_search_placeholder",
				{},
				this.currentLanguage
			);
		}

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
