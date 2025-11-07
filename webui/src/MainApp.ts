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

	// 懒加载标记 - 记录每个页面是否已加载
	private statusPageLoaded = false;
	private configPageLoaded = false;
	private logPageLoaded = false;
	private settingsPageLoaded = false;

	// 状态缓存和刷新控制
	private statusCache = {
		mode: { value: "unknown", timestamp: 0, ttl: 2000 }, // 模式缓存，2秒过期
		running: { value: false, timestamp: 0, ttl: 2000 }, // 运行状态缓存，2秒过期
		version: { value: "", timestamp: 0, ttl: 60000 }, // 版本缓存，60秒过期
	};
	private isRefreshing = false; // 防止并发刷新

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
		// 立即显示界面，避免白屏
		if (this.loading) this.loading.style.display = "none";
		if (this.app) this.app.style.display = "block";

		// 先初始化各管理器（同步操作，很快）
		this.themeManager.init();
		this.configManager.init();
		this.gamesManager.init();
		this.logManager.init();
		this.settingsManager.init();

		// 初始化语言（可能需要检测系统语言）
		await this.initLanguage();

		// 设置事件监听（同步操作）
		this.setupLanguageEvents();
		this.setupNavigationEvents();

		// 异步加载状态页数据（不阻塞界面显示）
		this.loadData().catch(() => {});

		// 启动状态刷新循环（使用缓存过期机制）
		this.startStatusRefreshLoop();

		toast(getTranslation("toast_webui_loaded", {}, this.currentLanguage));
	}

	/**
	 * 启动状态刷新循环（基于缓存过期）
	 */
	private async startStatusRefreshLoop() {
		const refresh = async () => {
			// 仅在状态页已加载且当前在状态页时刷新
			if (this.statusPageLoaded && this.currentPage === "page-status") {
				await this.refreshStatusIfNeeded();
			}
			// 递归调用，避免并发问题
			setTimeout(refresh, 1000); // 每1000ms检查一次是否需要刷新
		};
		refresh();
	}

	/**
	 * 根据缓存过期情况刷新状态
	 */
	private async refreshStatusIfNeeded() {
		if (this.isRefreshing) return; // 防止并发刷新

		const now = Date.now();
		const needRefresh = {
			mode: now - this.statusCache.mode.timestamp > this.statusCache.mode.ttl,
			running: now - this.statusCache.running.timestamp > this.statusCache.running.ttl,
			version: now - this.statusCache.version.timestamp > this.statusCache.version.ttl,
		};

		// 如果任何一项需要刷新，则执行刷新
		if (needRefresh.mode || needRefresh.running || needRefresh.version) {
			this.isRefreshing = true;
			try {
				const tasks = [];
				if (needRefresh.mode) tasks.push(this.loadCurrentMode());
				if (needRefresh.running) tasks.push(this.checkModuleStatus());
				if (needRefresh.version) tasks.push(this.loadModuleVersion());

				await Promise.allSettled(tasks); // 即使部分失败也继续
			} finally {
				this.isRefreshing = false;
			}
		}
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
		// 立即加载状态页数据（首页需要快速显示）
		this.statusPageLoaded = true;
		await Promise.all([
			this.checkModuleStatus(),
			this.loadModuleVersion(),
			this.loadCurrentMode(),
		]).catch(() => {});

		// 其他页面改为懒加载
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

		// 懒加载各页面数据 - 只在首次切换到对应页面时加载
		this.lazyLoadPageData(pageId);
	}

	/**
	 * 懒加载页面数据
	 */
	private async lazyLoadPageData(pageId: string): Promise<void> {
		switch (pageId) {
			case "page-status":
				if (!this.statusPageLoaded) {
					this.statusPageLoaded = true;
					// 状态页数据加载
					await Promise.all([
						this.checkModuleStatus(),
						this.loadModuleVersion(),
						this.loadCurrentMode(),
					]).catch(() => {});
				}
				break;

			case "page-config":
				if (!this.configPageLoaded) {
					this.configPageLoaded = true;
					// 配置页数据加载（GPU配置 + 自定义配置 + 游戏列表）
					await Promise.all([
						this.configManager.loadAllConfigData(),
						this.gamesManager.loadGamesList(),
					]).catch(() => {});
				}
				break;

			case "page-log":
				if (!this.logPageLoaded) {
					this.logPageLoaded = true;
					// 日志页数据加载
					this.logManager.loadLog().catch(() => {});
				}
				break;

			case "page-settings":
				if (!this.settingsPageLoaded) {
					this.settingsPageLoaded = true;
					// 设置页数据加载
					this.settingsManager.loadLogLevel().catch(() => {});
				}
				break;
		}
	}

	async checkModuleStatus() {
		try {
			const { errno, stdout } = await exec('pgrep -f gpugovernor || echo ""');
			const newStatus = errno === 0 && stdout.trim();

			// 更新缓存
			this.statusCache.running.value = Boolean(newStatus);
			this.statusCache.running.timestamp = Date.now();

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
		} catch (_error) {
			// 保留旧缓存值，不更新时间戳（下次会重试）
		}
	}
	async loadModuleVersion() {
		try {
			const { errno, stdout } = await exec(
				'grep -i "^version=" /data/adb/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2'
			);
			if (errno === 0 && stdout.trim()) {
				if (this.moduleVersion) {
					this.moduleVersion.textContent = stdout.trim();
					this.moduleVersion.removeAttribute("data-i18n");
					// 更新缓存
					this.statusCache.version.value = stdout.trim();
					this.statusCache.version.timestamp = Date.now();
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
					// 更新缓存
					this.statusCache.version.value = stdout2.trim();
					this.statusCache.version.timestamp = Date.now();
				}
				return;
			}
			if (this.moduleVersion) {
				this.moduleVersion.textContent = this.currentLanguage === "en" ? "Unknown" : "未知";
				this.moduleVersion.removeAttribute("data-i18n");
				// 更新缓存
				this.statusCache.version.value = "unknown";
				this.statusCache.version.timestamp = Date.now();
			}
		} catch (_error) {
			// 保留旧缓存值，不更新时间戳（下次会重试）
		}
	}
	async loadCurrentMode() {
		try {
			const { errno, stdout } = await exec(
				`cat ${PATHS.CURRENT_MODE_PATH} 2>/dev/null || echo "unknown"`
			);
			let mode = "unknown";
			if (errno === 0) mode = stdout.trim().toLowerCase();

			const validModes = ["powersave", "balance", "performance", "fast"];
			if (!validModes.includes(mode)) mode = "unknown";

			// 更新缓存
			this.statusCache.mode.value = mode;
			this.statusCache.mode.timestamp = Date.now();

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
		} catch (_error) {
			// 保留旧缓存值，不更新时间戳（下次会重试）
			// 如果有缓存值，继续使用缓存显示
			if (this.statusCache.mode.value !== "unknown" && this.currentMode) {
				const mode = this.statusCache.mode.value;
				const modeText: Record<string, string> = {
					powersave: getTranslation("status_mode_powersave", {}, this.currentLanguage),
					balance: getTranslation("status_mode_balance", {}, this.currentLanguage),
					performance: getTranslation("status_mode_performance", {}, this.currentLanguage),
					fast: getTranslation("status_mode_fast", {}, this.currentLanguage),
					unknown: getTranslation("status_mode_unknown", {}, this.currentLanguage),
				};
				this.currentMode.textContent = modeText[mode] || modeText.unknown;
				this.currentMode.className = `mode-badge ${mode}`;
			}
		}
	}
}
