/**
 * 游戏列表渲染器
 * 负责创建和渲染游戏卡片
 */

import { getTranslation } from "../i18n";
import type { GameItem, Lang } from "../types/games";
import { AppInfoService } from "./AppInfoService";

export class GameRenderer {
	private currentLanguage: Lang;
	private onEdit: (index: number) => void;
	private onDelete: (index: number) => void;

	constructor(
		currentLanguage: Lang,
		onEdit: (index: number) => void,
		onDelete: (index: number) => void
	) {
		this.currentLanguage = currentLanguage;
		this.onEdit = onEdit;
		this.onDelete = onDelete;
	}

	/**
	 * 设置当前语言
	 */
	setLanguage(language: Lang): void {
		this.currentLanguage = language;
	}

	/**
	 * 渲染游戏列表
	 */
	renderGamesList(gamesList: HTMLElement, gamesData: GameItem[]): void {
		gamesList.innerHTML = "";

		if (gamesData.length === 0) {
			gamesList.innerHTML = `<div class="loading-text">${getTranslation("config_games_not_found", {}, this.currentLanguage)}</div>`;
			return;
		}

		gamesData.forEach((game, index) => {
			const gameCard = this.createGameCard(game, index);
			gamesList.appendChild(gameCard);
		});
	}

	/**
	 * 创建游戏卡片
	 */
	private createGameCard(game: GameItem, index: number): HTMLElement {
		const gameCard = document.createElement("div");
		gameCard.className = "game-card";
		gameCard.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;

		const gameHeader = this.createGameHeader(game);
		const gameDetails = this.createGameDetails(game, index);

		gameCard.appendChild(gameHeader);
		gameCard.appendChild(gameDetails);

		return gameCard;
	}

	/**
	 * 创建游戏卡片头部
	 */
	private createGameHeader(game: GameItem): HTMLElement {
		const gameHeader = document.createElement("div");
		gameHeader.className = "game-header";

		const iconContainer = this.createIconContainer(game);
		const gameNameContainer = this.createGameNameContainer(game);

		gameHeader.appendChild(iconContainer);
		gameHeader.appendChild(gameNameContainer);

		return gameHeader;
	}

	/**
	 * 创建图标容器
	 */
	private createIconContainer(game: GameItem): HTMLElement {
		const iconContainer = document.createElement("div");
		iconContainer.className = "game-icon-container";

		const appName = game.name || AppInfoService.getAppNameFromPackage(game.package || "");
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
			AppInfoService.loadAppIcon(game.package, iconContainer, iconPlaceholder);
		}

		return iconContainer;
	}

	/**
	 * 创建游戏名称容器
	 */
	private createGameNameContainer(game: GameItem): HTMLElement {
		const gameNameContainer = document.createElement("div");
		gameNameContainer.className = "game-name-container";

		const appName = game.name || AppInfoService.getAppNameFromPackage(game.package || "");

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

		return gameNameContainer;
	}

	/**
	 * 创建游戏详情区域
	 */
	private createGameDetails(game: GameItem, index: number): HTMLElement {
		const gameDetails = document.createElement("div");
		gameDetails.className = "game-details";

		const modeText = this.getModeText(game.mode || "balance");
		const modeBadge = document.createElement("span");
		modeBadge.className = `game-mode-badge mode-${game.mode || "balance"}`;
		modeBadge.textContent = modeText;

		gameDetails.appendChild(modeBadge);

		const buttonContainer = this.createActionButtons(index);
		gameDetails.appendChild(buttonContainer);

		return gameDetails;
	}

	/**
	 * 创建操作按钮
	 */
	private createActionButtons(index: number): HTMLElement {
		const buttonContainer = document.createElement("div");
		buttonContainer.className = "game-actions";

		const editBtn = document.createElement("button");
		editBtn.className = "game-edit-btn";
		editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
		editBtn.title = "编辑";
		editBtn.onclick = (e) => {
			e.stopPropagation();
			this.onEdit(index);
		};

		const deleteBtn = document.createElement("button");
		deleteBtn.className = "game-delete-btn";
		deleteBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
		deleteBtn.title = "删除";
		deleteBtn.onclick = (e) => {
			e.stopPropagation();
			this.onDelete(index);
		};

		buttonContainer.appendChild(editBtn);
		buttonContainer.appendChild(deleteBtn);

		return buttonContainer;
	}

	/**
	 * 获取模式文本
	 */
	private getModeText(mode: string): string {
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
}
