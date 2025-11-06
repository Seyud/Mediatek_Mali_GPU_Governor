/**
 * 游戏编辑模态框管理器
 * 负责游戏添加/编辑模态框的交互逻辑
 */

import { getTranslation, translations } from "../i18n";
import type { Lang, TranslationsType } from "../types/games";

export class GameModal {
	private editGameModal: HTMLElement | null;
	private closeGameModalBtn: Element | null;
	private packageNameInput: HTMLInputElement | null;
	private gameModeSelect: HTMLSelectElement | null;
	private saveGameBtn: HTMLElement | null;
	private cancelGameBtn: HTMLElement | null;
	private gameModeContainer: HTMLElement | null;
	private selectedGameMode: HTMLElement | null;
	private gameModeOptions: HTMLElement | null;
	private currentLanguage: Lang;

	constructor(currentLanguage: Lang) {
		this.currentLanguage = currentLanguage;
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

	/**
	 * 初始化模态框事件监听
	 */
	init(onSave: () => void, onClose: () => void): void {
		if (this.closeGameModalBtn) {
			this.closeGameModalBtn.addEventListener("click", onClose);
		}

		if (this.cancelGameBtn) {
			this.cancelGameBtn.addEventListener("click", onClose);
		}

		if (this.saveGameBtn) {
			this.saveGameBtn.addEventListener("click", onSave);
		}

		window.addEventListener("click", (event) => {
			if (event.target === this.editGameModal) onClose();
		});

		window.addEventListener("keydown", (event) => {
			if (
				event.key === "Escape" &&
				this.editGameModal &&
				this.editGameModal.style.display === "block"
			) {
				onClose();
			}
		});

		this.initGameModeSelect();
	}

	/**
	 * 初始化游戏模式选择器
	 */
	private initGameModeSelect(): void {
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
			if (!this.gameModeContainer?.contains(e.target as Node)) {
				this.gameModeContainer?.classList.remove("open");
			}
		});
	}

	/**
	 * 打开模态框（添加模式）
	 */
	openForAdd(): void {
		if (this.packageNameInput) this.packageNameInput.value = "";
		if (this.gameModeSelect) this.gameModeSelect.value = "balance";
		this.updateGameModeSelectDisplay("balance");
		if (this.editGameModal) this.editGameModal.style.display = "block";
	}

	/**
	 * 打开模态框（编辑模式）
	 */
	openForEdit(packageName: string, mode: string): void {
		if (this.packageNameInput) this.packageNameInput.value = packageName;
		if (this.gameModeSelect) this.gameModeSelect.value = mode;
		this.updateGameModeSelectDisplay(mode);
		if (this.editGameModal) this.editGameModal.style.display = "block";
	}

	/**
	 * 关闭模态框
	 */
	close(): void {
		if (this.editGameModal) this.editGameModal.style.display = "none";
	}

	/**
	 * 获取输入的包名
	 */
	getPackageName(): string {
		return this.packageNameInput?.value.trim() || "";
	}

	/**
	 * 获取选择的游戏模式
	 */
	getGameMode(): string {
		return this.gameModeSelect?.value || "balance";
	}

	/**
	 * 更新游戏模式选择器显示
	 */
	private updateGameModeSelectDisplay(mode: string): void {
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

	/**
	 * 设置语言
	 */
	setLanguage(language: Lang): void {
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
	}
}
