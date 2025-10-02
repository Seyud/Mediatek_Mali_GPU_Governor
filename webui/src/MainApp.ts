import { ConfigManager } from "./configManager";
import { PATHS } from "./constants";
import { GamesManager } from "./gamesManager";
import { getTranslation, type Language, translations } from "./i18n";
import { LogManager } from "./logManager";
import { SettingsManager } from "./settingsManager";
import { ThemeManager } from "./themeManager";
import { exec, toast } from "./utils";

interface LanguageChangeEvent extends CustomEvent {
	detail: {
		language: Language;
	};
}

interface TranslationsType {
	[language: string]: {
		[key: string]: string;
	};
}

export class MainApp {
	currentLanguage: Language = "zh";
	currentPage = "page-status";

	app: HTMLElement | null;
	loading: HTMLElement | null;
	htmlRoot: HTMLElement | null;
	moduleVersion: HTMLElement | null;
	currentMode: HTMLElement | null;
	runningStatus: HTMLElement | null;
	pages: NodeListOf<Element>;
	navItems: NodeListOf<Element>;
	languageContainer: HTMLElement | null;

	themeManager: ThemeManager;
	configManager: ConfigManager;
	gamesManager: GamesManager;
	logManager: LogManager;
	settingsManager: SettingsManager;

	constructor() {
		this.app = document.getElementById("app");
		this.loading = document.getElementById("loading");
		this.htmlRoot = document.getElementById("htmlRoot");
		this.moduleVersion = document.getElementById("moduleVersion");
		this.currentMode = document.getElementById("currentMode");
		this.runningStatus = document.getElementById("runningStatus");
		this.pages = document.querySelectorAll(".page");
		this.navItems = document.querySelectorAll(".nav-item");
		this.languageContainer = document.getElementById("languageContainer");

		this.themeManager = new ThemeManager();
		this.configManager = new ConfigManager();
		this.gamesManager = new GamesManager();
		this.logManager = new LogManager();
		this.settingsManager = new SettingsManager();
	}

	async init() {
		if (this.loading) this.loading.style.display = "none";
		if (this.app) this.app.style.display = "block";

		this.themeManager.init();
		this.configManager.init();
		this.gamesManager.init();
		this.logManager.init();
		this.settingsManager.init();

		await this.initLanguage();
		this.setupLanguageEvents();
		this.setupNavigationEvents();
		await this.loadData();

		setInterval(() => {
			this.loadCurrentMode();
			this.checkModuleStatus();
		}, 2000);

		toast(getTranslation("toast_webui_loaded", {}, this.currentLanguage));
	}

	setupNavigationEvents() {
		this.navItems.forEach((item) => {
			item.addEventListener("click", () => {
				const targetPageId = item.getAttribute("data-page");
				if (targetPageId) this.switchPage(targetPageId);
			});
		});
	}

	setupLanguageEvents() {
		document.addEventListener("languageChange", (e: Event) => {
			const customEvent = e as LanguageChangeEvent;
			const { language } = customEvent.detail;
			this.currentLanguage = language;
			this.themeManager.setLanguage(this.currentLanguage);
			this.configManager.setLanguage(this.currentLanguage);
			this.gamesManager.setLanguage(this.currentLanguage);
			this.logManager.setLanguage(this.currentLanguage);
			this.settingsManager.setLanguage(this.currentLanguage);
			this.applyTranslations();
			// 重新加载状态信息以确保正确的翻译
			this.loadModuleVersion();
			this.loadCurrentMode();
			this.checkModuleStatus();
		});
	}

	async initLanguage() {
		const savedLanguageSetting = localStorage.getItem("languageSetting");
		const savedLanguage = localStorage.getItem("language") as Language | null;
		if (savedLanguageSetting === null) {
			localStorage.setItem("languageSetting", "system");
		}
		if (savedLanguageSetting === "system" || savedLanguageSetting === null) {
			this.currentLanguage = await this.detectSystemLanguage();
			localStorage.setItem("language", this.currentLanguage);
		} else if (savedLanguage) {
			this.currentLanguage = savedLanguage;
		}
		this.themeManager.setLanguage(this.currentLanguage);
		this.configManager.setLanguage(this.currentLanguage);
		this.gamesManager.setLanguage(this.currentLanguage);
		this.logManager.setLanguage(this.currentLanguage);
		this.settingsManager.setLanguage(this.currentLanguage);
		this.applyTranslations();
		this.updateSelectedLanguageText(savedLanguageSetting || "system");
		this.setupLanguageEvents();
	}

	async detectSystemLanguage(): Promise<Language> {
		const navigatorWithLegacy = navigator as Navigator & { userLanguage?: string };
		const browserLanguage = navigator.language || navigatorWithLegacy.userLanguage || "zh-CN";
		const { errno, stdout } = await exec(
			'getprop persist.sys.locale || getprop ro.product.locale || echo "zh-CN"'
		);
		if (errno === 0 && stdout.trim()) {
			const locale = stdout.trim().toLowerCase();
			if (locale.startsWith("en")) return "en";
			return "zh";
		}
		if (browserLanguage.startsWith("en")) return "en";
		return "zh";
	}

	applyTranslations() {
		document.title = getTranslation("title", {}, this.currentLanguage);
		if (this.htmlRoot)
			this.htmlRoot.setAttribute("lang", this.currentLanguage === "en" ? "en" : "zh-CN");
		if (this.loading)
			this.loading.textContent = getTranslation("loading", {}, this.currentLanguage);
		const headerTitle = document.querySelector(".header-content h1");
		if (headerTitle)
			headerTitle.textContent = getTranslation("header_title", {}, this.currentLanguage);
		document.querySelectorAll(".nav-item").forEach((item) => {
			const pageId = item.getAttribute("data-page");
			const navText = item.querySelector(".nav-text");
			if (!navText) return;
			if (pageId === "page-status")
				navText.textContent = getTranslation("nav_status", {}, this.currentLanguage);
			else if (pageId === "page-config")
				navText.textContent = getTranslation("nav_config", {}, this.currentLanguage);
			else if (pageId === "page-log")
				navText.textContent = getTranslation("nav_log", {}, this.currentLanguage);
			else if (pageId === "page-settings")
				navText.textContent = getTranslation("nav_settings", {}, this.currentLanguage);
		});
		document.querySelectorAll("[data-i18n]").forEach((el) => {
			const key = el.getAttribute("data-i18n");
			if (
				key &&
				(translations as TranslationsType)[this.currentLanguage] &&
				(translations as TranslationsType)[this.currentLanguage][key]
			) {
				el.textContent = getTranslation(key, {}, this.currentLanguage);
			}
		});
		document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
			const key = el.getAttribute("data-i18n-placeholder");
			if (
				key &&
				(translations as TranslationsType)[this.currentLanguage] &&
				(translations as TranslationsType)[this.currentLanguage][key]
			) {
				(el as HTMLInputElement).placeholder = getTranslation(key, {}, this.currentLanguage);
			}
		});
	}

	updateSelectedLanguageText(languageSetting: string) {
		if (!this.languageContainer) return;
		const languageButtons = this.languageContainer.querySelectorAll(".settings-tab-btn");
		languageButtons.forEach((btn) => {
			btn.classList.remove("active");
		});
		const selectedButton = this.languageContainer.querySelector(
			`.settings-tab-btn[data-value="${languageSetting}"]`
		);
		if (selectedButton) selectedButton.classList.add("active");
		else {
			const systemButton = this.languageContainer.querySelector(
				'.settings-tab-btn[data-value="system"]'
			);
			if (systemButton) systemButton.classList.add("active");
		}
	}

	async loadData() {
		const tasks: Array<() => Promise<unknown>> = [
			() => this.checkModuleStatus(),
			() => this.loadModuleVersion(),
			() => this.loadCurrentMode(),
			() => this.configManager.loadGpuConfig(),
			() => this.gamesManager.loadGamesList(),
			() => this.logManager.loadLog(),
			() => this.settingsManager.loadLogLevel(),
		];
		for (const task of tasks) {
			await task();
		}
		this.switchPage("page-status");
	}

	switchPage(pageId: string) {
		this.pages.forEach((page) => {
			page.classList.remove("active");
		});
		const targetPage = document.getElementById(pageId);
		if (targetPage) targetPage.classList.add("active");
		this.navItems.forEach((item) => {
			if (item.getAttribute("data-page") === pageId) item.classList.add("active");
			else item.classList.remove("active");
		});
		this.currentPage = pageId;
	}

	async checkModuleStatus() {
		const { errno, stdout } = await exec('pgrep -f gpugovernor || echo ""');
		const newStatus = errno === 0 && stdout.trim();
		const currentStatus = this.runningStatus?.classList.contains("status-running");
		if (newStatus !== currentStatus && this.runningStatus) {
			this.runningStatus.classList.add("status-changing");
			this.runningStatus.removeAttribute("data-i18n");
			setTimeout(() => {
				if (newStatus && this.runningStatus) {
					this.runningStatus.textContent = getTranslation(
						"status_running_active",
						{},
						this.currentLanguage
					);
					this.runningStatus.className = "status-badge status-running";
				} else if (this.runningStatus) {
					this.runningStatus.textContent = getTranslation(
						"status_running_inactive",
						{},
						this.currentLanguage
					);
					this.runningStatus.className = "status-badge status-stopped";
				}
				setTimeout(() => {
					this.runningStatus?.classList.remove("status-changing");
				}, 600);
			}, 100);
		}
	}

	async loadModuleVersion() {
		const { errno, stdout } = await exec(
			'grep -i "^version=" /data/adb/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2'
		);
		if (errno === 0 && stdout.trim()) {
			if (this.moduleVersion) {
				this.moduleVersion.textContent = stdout.trim();
				this.moduleVersion.removeAttribute("data-i18n");
			}
			return;
		}
		const { errno: errno2, stdout: stdout2 } = await exec(
			'grep -i "^version=" /data/adb/ksu/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2'
		);
		if (errno2 === 0 && stdout2.trim()) {
			if (this.moduleVersion) {
				this.moduleVersion.textContent = stdout2.trim();
				this.moduleVersion.removeAttribute("data-i18n");
			}
			return;
		}
		if (this.moduleVersion) {
			this.moduleVersion.textContent = this.currentLanguage === "en" ? "Unknown" : "未知";
			this.moduleVersion.removeAttribute("data-i18n");
		}
	}

	async loadCurrentMode() {
		const { errno, stdout } = await exec(
			`cat ${PATHS.CURRENT_MODE_PATH} 2>/dev/null || echo "unknown"`
		);
		let mode = "unknown";
		if (errno === 0) mode = stdout.trim().toLowerCase();
		const validModes = ["powersave", "balance", "performance", "fast"];
		if (!validModes.includes(mode)) mode = "unknown";
		if (this.currentMode) {
			const modeText: Record<string, string> = {
				powersave: getTranslation("status_mode_powersave", {}, this.currentLanguage),
				balance: getTranslation("status_mode_balance", {}, this.currentLanguage),
				performance: getTranslation("status_mode_performance", {}, this.currentLanguage),
				fast: getTranslation("status_mode_fast", {}, this.currentLanguage),
				unknown: getTranslation("status_mode_unknown", {}, this.currentLanguage),
			};
			this.currentMode.textContent = modeText[mode] || modeText.unknown;
			this.currentMode.className = `mode-badge ${mode}`;
			this.currentMode.removeAttribute("data-i18n");
		}
	}
}
