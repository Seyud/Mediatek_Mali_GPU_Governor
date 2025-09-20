import { exec, toast, withResult, logError } from './utils';
import { PATHS } from './constants';
import { translations, getTranslation, Language } from './i18n';

import { ThemeManager } from './themeManager';
import { ConfigManager } from './configManager';
import { GamesManager } from './gamesManager';
import { LogManager } from './logManager';
import { SettingsManager } from './settingsManager';
import { ModalManager } from './modalManager'; // 可能被 configManager 间接需要

export class MainApp {
	currentLanguage: Language = 'zh';
	currentPage = 'page-status';

	app: HTMLElement | null;
	loading: HTMLElement | null;
	htmlRoot: HTMLElement | null;
	moduleVersion: HTMLElement | null;
	currentMode: HTMLElement | null;
	runningStatus: HTMLElement | null;
	pages: NodeListOf<Element>;
	navItems: NodeListOf<Element>;
	languageContainer: HTMLElement | null;

	themeManager: any;
	configManager: any;
	gamesManager: any;
	logManager: any;
	settingsManager: any;

	constructor() {
		this.app = document.getElementById('app');
		this.loading = document.getElementById('loading');
		this.htmlRoot = document.getElementById('htmlRoot');
		this.moduleVersion = document.getElementById('moduleVersion');
		this.currentMode = document.getElementById('currentMode');
		this.runningStatus = document.getElementById('runningStatus');
		this.pages = document.querySelectorAll('.page');
		this.navItems = document.querySelectorAll('.nav-item');
		this.languageContainer = document.getElementById('languageContainer');

		this.themeManager = new ThemeManager();
		this.configManager = new ConfigManager();
		this.gamesManager = new GamesManager();
		this.logManager = new LogManager();
		this.settingsManager = new SettingsManager();
	}

	async init() {
		try {
			if (this.loading) this.loading.style.display = 'none';
			if (this.app) this.app.style.display = 'block';

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

			toast(getTranslation('toast_webui_loaded', {}, this.currentLanguage));
		} catch (error) {
			console.error('初始化失败:', error);
			if (this.loading) this.loading.style.display = 'none';
			if (this.app) this.app.style.display = 'block';
		}
	}

	setupNavigationEvents() {
		this.navItems.forEach(item => {
			item.addEventListener('click', () => {
				const targetPageId = item.getAttribute('data-page');
				if (targetPageId) this.switchPage(targetPageId);
			});
		});
	}

	setupLanguageEvents() {
		document.addEventListener('languageChange', (e: any) => {
			const { language } = e.detail;
			this.currentLanguage = language;
			this.themeManager.setLanguage(this.currentLanguage);
			this.configManager.setLanguage(this.currentLanguage);
			this.gamesManager.setLanguage(this.currentLanguage);
			this.logManager.setLanguage(this.currentLanguage);
			this.settingsManager.setLanguage(this.currentLanguage);
			this.applyTranslations();
		});
	}

	async initLanguage() {
		const savedLanguageSetting = localStorage.getItem('languageSetting');
		const savedLanguage = localStorage.getItem('language') as Language | null;
		if (savedLanguageSetting === null) {
			localStorage.setItem('languageSetting', 'system');
		}
		if (savedLanguageSetting === 'system' || savedLanguageSetting === null) {
			this.currentLanguage = await this.detectSystemLanguage();
			localStorage.setItem('language', this.currentLanguage);
		} else if (savedLanguage) {
			this.currentLanguage = savedLanguage;
		}
		this.themeManager.setLanguage(this.currentLanguage);
		this.configManager.setLanguage(this.currentLanguage);
		this.gamesManager.setLanguage(this.currentLanguage);
		this.logManager.setLanguage(this.currentLanguage);
		this.settingsManager.setLanguage(this.currentLanguage);
		this.applyTranslations();
		this.updateSelectedLanguageText(savedLanguageSetting || 'system');
		this.setupLanguageEvents();
	}

	async detectSystemLanguage(): Promise<Language> {
		try {
			const browserLanguage = navigator.language || (navigator as any).userLanguage || 'zh-CN';
			try {
				const { errno, stdout } = await exec('getprop persist.sys.locale || getprop ro.product.locale || echo "zh-CN"');
				if (errno === 0 && stdout.trim()) {
					const locale = stdout.trim().toLowerCase();
						if (locale.startsWith('en')) return 'en';
						return 'zh';
				}
			} catch {
				console.log('无法通过系统属性检测语言，将使用浏览器语言');
			}
			if (browserLanguage.startsWith('en')) return 'en';
			return 'zh';
		} catch (error) {
			console.error('检测系统语言失败:', error);
			return 'zh';
		}
	}

	applyTranslations() {
		try {
			document.title = getTranslation('title', {}, this.currentLanguage);
			if (this.htmlRoot) this.htmlRoot.setAttribute('lang', this.currentLanguage === 'en' ? 'en' : 'zh-CN');
			if (this.loading) this.loading.textContent = getTranslation('loading', {}, this.currentLanguage);
			const headerTitle = document.querySelector('.header-content h1');
			if (headerTitle) headerTitle.textContent = getTranslation('header_title', {}, this.currentLanguage);
			document.querySelectorAll('.nav-item').forEach(item => {
				const pageId = item.getAttribute('data-page');
				const navText = item.querySelector('.nav-text');
				if (!navText) return;
				if (pageId === 'page-status') navText.textContent = getTranslation('nav_status', {}, this.currentLanguage);
				else if (pageId === 'page-config') navText.textContent = getTranslation('nav_config', {}, this.currentLanguage);
				else if (pageId === 'page-log') navText.textContent = getTranslation('nav_log', {}, this.currentLanguage);
				else if (pageId === 'page-settings') navText.textContent = getTranslation('nav_settings', {}, this.currentLanguage);
			});
		} catch (e) {
			console.error('应用基本翻译失败:', e);
		}
		// 复用原批量 data-i18n
		try {
			document.querySelectorAll('[data-i18n]').forEach(el => {
				const key = el.getAttribute('data-i18n');
				if (key && (translations as any)[this.currentLanguage] && (translations as any)[this.currentLanguage][key]) {
					el.textContent = getTranslation(key, {}, this.currentLanguage);
				}
			});
		} catch {
			console.error('批量应用 data-i18n 国际化失败');
		}
	}

	updateSelectedLanguageText(languageSetting: string) {
		try {
			if (!this.languageContainer) return;
			const languageButtons = this.languageContainer.querySelectorAll('.settings-tab-btn');
			languageButtons.forEach(btn => btn.classList.remove('active'));
			const selectedButton = this.languageContainer.querySelector(`.settings-tab-btn[data-value="${languageSetting}"]`);
			if (selectedButton) selectedButton.classList.add('active');
			else {
				const systemButton = this.languageContainer.querySelector('.settings-tab-btn[data-value="system"]');
				if (systemButton) systemButton.classList.add('active');
			}
		} catch (e) {
			console.error('更新语言按钮状态失败:', e);
		}
	}

	async loadData() {
		const tasks: Array<{ fn: () => Promise<any>; context: string; failMsg: string }> = [
			{ fn: () => this.checkModuleStatus(), context: 'check-module-status', failMsg: '检查模块状态失败' },
			{ fn: () => this.loadModuleVersion(), context: 'load-module-version', failMsg: '加载模块版本失败' },
			{ fn: () => this.loadCurrentMode(), context: 'load-current-mode', failMsg: '加载当前模式失败' },
			{ fn: () => this.configManager.loadGpuConfig(), context: 'load-gpu-config', failMsg: '加载GPU配置失败' },
			{ fn: () => this.gamesManager.loadGamesList(), context: 'load-games-list', failMsg: '加载游戏列表失败' },
			{ fn: () => this.logManager.loadLog(), context: 'load-log', failMsg: '加载日志失败' },
			{ fn: () => this.settingsManager.loadLogLevel(), context: 'load-log-level', failMsg: '加载日志等级设置失败' }
		];
		for (const task of tasks) {
			const r = await withResult(task.fn, task.context);
			if (!r.ok) {
				logError(task.context, r.error);
				console.error(task.failMsg, r.error);
			}
		}
		this.switchPage('page-status');
	}

	switchPage(pageId: string) {
		this.pages.forEach(page => page.classList.remove('active'));
		const targetPage = document.getElementById(pageId);
		if (targetPage) targetPage.classList.add('active');
		this.navItems.forEach(item => {
			if (item.getAttribute('data-page') === pageId) item.classList.add('active');
			else item.classList.remove('active');
		});
		this.currentPage = pageId;
	}

	async checkModuleStatus() {
		try {
			const { errno, stdout } = await exec('pgrep -f gpugovernor || echo ""');
			const newStatus = errno === 0 && stdout.trim();
			const currentStatus = this.runningStatus && this.runningStatus.classList.contains('status-running');
			if (newStatus !== currentStatus && this.runningStatus) {
				this.runningStatus.classList.add('status-changing');
				setTimeout(() => {
					if (newStatus) {
						this.runningStatus!.textContent = getTranslation('status_running_active', {}, this.currentLanguage);
						this.runningStatus!.className = 'status-badge status-running';
					} else {
						this.runningStatus!.textContent = getTranslation('status_running_inactive', {}, this.currentLanguage);
						this.runningStatus!.className = 'status-badge status-stopped';
					}
					setTimeout(() => { this.runningStatus && this.runningStatus.classList.remove('status-changing'); }, 600);
				}, 100);
			}
		} catch (error) {
			console.error('检查模块状态失败:', error);
			if (this.runningStatus) {
				this.runningStatus.textContent = getTranslation('status_checking', {}, this.currentLanguage);
				this.runningStatus.className = 'status-badge status-stopped';
			}
		}
	}

	async loadModuleVersion() {
		try {
			const { errno, stdout } = await exec('grep -i "^version=" /data/adb/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2');
			if (errno === 0 && stdout.trim()) {
				if (this.moduleVersion) this.moduleVersion.textContent = stdout.trim();
			} else {
				const { errno: errno2, stdout: stdout2 } = await exec('grep -i "^version=" /data/adb/ksu/modules/Mediatek_Mali_GPU_Governor/module.prop | cut -d= -f2');
				if (errno2 === 0 && stdout2.trim()) {
					if (this.moduleVersion) this.moduleVersion.textContent = stdout2.trim();
				} else if (this.moduleVersion) {
					this.moduleVersion.textContent = this.currentLanguage === 'en' ? 'Unknown' : '未知';
				}
			}
		} catch (error) {
			console.error('加载模块版本失败:', error);
			if (this.moduleVersion) this.moduleVersion.textContent = this.currentLanguage === 'en' ? 'Unknown' : '未知';
		}
	}

	async loadCurrentMode() {
		try {
			const { errno, stdout } = await exec(`cat ${PATHS.CURRENT_MODE_PATH} 2>/dev/null || echo "unknown"`);
			let mode = 'unknown';
			if (errno === 0) mode = stdout.trim().toLowerCase();
			const validModes = ['powersave', 'balance', 'performance', 'fast'];
			if (!validModes.includes(mode)) mode = 'unknown';
			if (this.currentMode) {
				const modeText: Record<string, string> = {
					powersave: getTranslation('status_mode_powersave', {}, this.currentLanguage),
					balance: getTranslation('status_mode_balance', {}, this.currentLanguage),
					performance: getTranslation('status_mode_performance', {}, this.currentLanguage),
					fast: getTranslation('status_mode_fast', {}, this.currentLanguage),
					unknown: getTranslation('status_mode_unknown', {}, this.currentLanguage)
				};
				this.currentMode.textContent = modeText[mode] || modeText['unknown'];
				this.currentMode.className = `mode-badge ${mode}`;
			}
		} catch (error) {
			console.error('加载当前模式失败:', error);
			if (this.currentMode) {
				this.currentMode.textContent = getTranslation('status_mode_unknown', {}, this.currentLanguage);
				this.currentMode.className = 'mode-badge default';
			}
		}
	}
}
