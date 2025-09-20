import { exec, toast } from './utils';
import { PATHS } from './constants';
import { getTranslation } from './i18n';

type Lang = 'zh' | 'en';

export class SettingsManager {
	currentLanguage: Lang = 'zh';
	logLevelContainer: HTMLElement | null;
	languageContainer: HTMLElement | null;

	constructor() {
		this.logLevelContainer = document.getElementById('logLevelContainer');
		this.languageContainer = document.getElementById('languageContainer');
	}

	init() {
		this.setupEventListeners();
		this.loadLogLevel();
	}

	setupEventListeners() {
		if (this.logLevelContainer) {
			const logLevelButtons = this.logLevelContainer.querySelectorAll('.settings-tab-btn');
			logLevelButtons.forEach(button => {
				button.addEventListener('click', (e) => {
					e.preventDefault();
					logLevelButtons.forEach(btn => btn.classList.remove('active'));
					button.classList.add('active');
					this.saveLogLevel();
				});
			});
		}

		if (this.languageContainer) {
			const languageButtons = this.languageContainer.querySelectorAll('.settings-tab-btn');
			languageButtons.forEach(button => {
				button.addEventListener('click', async (e) => {
					e.preventDefault();
					languageButtons.forEach(btn => btn.classList.remove('active'));
						button.classList.add('active');
					const selectedValue = button.getAttribute('data-value') as Lang | 'system';
					localStorage.setItem('languageSetting', selectedValue);
					let currentLanguage: Lang = 'zh';
					if (selectedValue === 'system') {
						try {
							const { errno, stdout } = await exec('getprop persist.sys.locale || getprop ro.product.locale || echo "zh-CN"');
							if (errno === 0 && stdout.trim()) {
								const locale = stdout.trim().toLowerCase();
								currentLanguage = locale.startsWith('en') ? 'en' : 'zh';
							}
						} catch {
							currentLanguage = 'zh';
						}
						localStorage.setItem('language', currentLanguage);
						toast(getTranslation('toast_language_follow_system', {}, this.currentLanguage));
					} else {
						currentLanguage = selectedValue;
						localStorage.setItem('language', selectedValue);
						const languageName = selectedValue === 'zh' ? '中文' : 'English';
						toast(getTranslation('toast_language_changed', { language: languageName }, this.currentLanguage));
					}
					const languageChangeEvent = new CustomEvent('languageChange', { detail: { language: currentLanguage } });
					document.dispatchEvent(languageChangeEvent);
				});
			});
		}
	}

	async loadLogLevel() {
		try {
			const { errno, stdout } = await exec(`cat ${PATHS.LOG_LEVEL_PATH} 2>/dev/null || echo "info"`);
			let logLevel: string = 'info';
			if (errno === 0) {
				const level = stdout.trim().toLowerCase();
				if (['debug','info','warn','error'].includes(level)) logLevel = level; 
			}
			if (this.logLevelContainer) {
				const logLevelButtons = this.logLevelContainer.querySelectorAll('.settings-tab-btn');
				logLevelButtons.forEach(button => {
					if (button.getAttribute('data-value') === logLevel) button.classList.add('active');
					else button.classList.remove('active');
				});
			}
		} catch (error) {
			console.error('加载日志等级设置失败:', error);
			if (this.logLevelContainer) {
				const infoButton = this.logLevelContainer.querySelector('.settings-tab-btn[data-value="info"]');
				if (infoButton) {
					const logLevelButtons = this.logLevelContainer.querySelectorAll('.settings-tab-btn');
					logLevelButtons.forEach(btn => btn.classList.remove('active'));
					infoButton.classList.add('active');
				}
			}
		}
	}

	async saveLogLevel() {
		try {
			if (!this.logLevelContainer) return;
			const selectedButton = this.logLevelContainer.querySelector('.settings-tab-btn.active');
			if (!selectedButton) return;
			const selectedLevel = selectedButton.getAttribute('data-value');
			const { errno } = await exec(`echo "${selectedLevel}" > ${PATHS.LOG_LEVEL_PATH}`);
			if (errno === 0) {
				if (selectedLevel === 'debug') toast(getTranslation('toast_log_level_debug', {}, this.currentLanguage));
				else toast(getTranslation('toast_log_level_set', { level: selectedLevel || '' }, this.currentLanguage));
			} else toast(getTranslation('toast_log_level_fail', {}, this.currentLanguage));
		} catch (error: any) {
			console.error('保存日志等级失败:', error);
			toast(`保存日志等级失败: ${error.message}`);
		}
	}

	setLanguage(language: Lang) { this.currentLanguage = language; }
}
