import type { CustomConfig, ModeConfig } from "./configFileManager";
import { getTranslation } from "./i18n";

type Lang = "zh" | "en";

interface ModeInputs {
	[key: string]: HTMLElement | null;
}

export class ModeConfigManager {
	currentLanguage: Lang = "zh";
	customConfig: CustomConfig = {};
	globalModeSelect: HTMLSelectElement | null;
	globalModeContainer: HTMLElement | null;
	selectedGlobalMode: HTMLElement | null;
	globalModeOptions: HTMLElement | null;
	idleThresholdInput: HTMLInputElement | null;
	powersaveInputs: ModeInputs | null = null;
	balanceInputs: ModeInputs | null = null;
	performanceInputs: ModeInputs | null = null;
	fastInputs: ModeInputs | null = null;
	constructor() {
		this.globalModeSelect = document.getElementById("globalMode") as HTMLSelectElement | null;
		this.globalModeContainer = document.getElementById("globalModeContainer");
		this.selectedGlobalMode = document.getElementById("selectedGlobalMode");
		this.globalModeOptions = document.getElementById("globalModeOptions");
		this.idleThresholdInput = document.getElementById("idleThreshold") as HTMLInputElement | null;
		this.powersaveInputs = this.getModeInputs("powersave");
		this.balanceInputs = this.getModeInputs("balance");
		this.performanceInputs = this.getModeInputs("performance");
		this.fastInputs = this.getModeInputs("fast");
	}
	getModeInputs(mode: string) {
		return {
			margin: document.getElementById(`${mode}Margin`),
			sampling_interval: document.getElementById(`${mode}SamplingInterval`),
			min_adaptive_interval: document.getElementById(`${mode}MinAdaptiveInterval`),
			max_adaptive_interval: document.getElementById(`${mode}MaxAdaptiveInterval`),
			up_rate_delay: document.getElementById(`${mode}UpRateDelay`),
			down_rate_delay: document.getElementById(`${mode}DownRateDelay`),
			aggressive_down: document.getElementById(`${mode}AggressiveDown`),
			gaming_mode: document.getElementById(`${mode}GamingMode`),
			adaptive_sampling: document.getElementById(`${mode}AdaptiveSampling`),
		};
	}
	init() {
		this.initGlobalModeSelect();
		this.initModeSwitchEvents();
	}
	initGlobalModeSelect() {
		if (!this.selectedGlobalMode || !this.globalModeOptions) return;
		this.selectedGlobalMode.addEventListener("click", (e) => {
			e.stopPropagation();
			this.globalModeContainer?.classList.toggle("open");
		});
		const options = this.globalModeOptions.querySelectorAll(".option");
		options.forEach((option) => {
			option.addEventListener("click", (e) => {
				e.stopPropagation();
				const value = option.getAttribute("data-value");
				const text = option.textContent;
				const spanElement = this.selectedGlobalMode?.querySelector("span");
				if (spanElement) {
					spanElement.textContent = text || "";
					spanElement.setAttribute("data-i18n", option.getAttribute("data-i18n") || "");
				}
				if (this.globalModeSelect && value) {
					this.globalModeSelect.value = value;
					this.globalModeSelect.dispatchEvent(new Event("change"));
				}
				this.globalModeContainer?.classList.remove("open");
			});
		});
		document.addEventListener("click", (e) => {
			if (!this.globalModeContainer?.contains(e.target as Node))
				this.globalModeContainer?.classList.remove("open");
		});
	}
	initModeSwitchEvents() {
		const modeButtons = document.querySelectorAll(".mode-tabs-grid .settings-tab-btn");
		const modeSections = document.querySelectorAll(".mode-config-section");
		if (this.globalModeSelect) this.syncModeTabsWithGlobalMode(this.globalModeSelect.value);
		modeButtons.forEach((button) => {
			button.addEventListener("click", () => {
				const mode = button.getAttribute("data-mode");
				modeButtons.forEach((btn) => {
					btn.classList.remove("active");
				});
				button.classList.add("active");
				modeSections.forEach((section) => {
					section.classList.remove("active");
				});
				const target = document.getElementById(`${mode}-config`);
				if (target) target.classList.add("active");
			});
		});
		if (this.globalModeSelect) {
			this.globalModeSelect.addEventListener("change", () => {
				const value = this.globalModeSelect?.value;
				if (value) {
					this.syncModeTabsWithGlobalMode(value);
				}
			});
		}
	}
	syncModeTabsWithGlobalMode(mode: string) {
		const modeButtons = document.querySelectorAll(".mode-tabs-grid .settings-tab-btn");
		const modeSections = document.querySelectorAll(".mode-config-section");
		modeButtons.forEach((btn) => {
			btn.classList.remove("active");
			if (btn.getAttribute("data-mode") === mode) btn.classList.add("active");
		});
		modeSections.forEach((section) => {
			section.classList.remove("active");
			if (section.id === `${mode}-config`) section.classList.add("active");
		});
	}
	populateCustomConfigForm(customConfig: CustomConfig) {
		this.customConfig = customConfig || {};
		if (this.customConfig.global) {
			if (this.globalModeSelect && this.customConfig.global.mode)
				this.globalModeSelect.value = String(this.customConfig.global.mode);
			if (this.selectedGlobalMode && this.customConfig.global.mode)
				this.updateGlobalModeDisplay(String(this.customConfig.global.mode));
			if (this.idleThresholdInput && this.customConfig.global.idle_threshold !== undefined)
				this.idleThresholdInput.value = String(this.customConfig.global.idle_threshold);
		}
		this.populateModeConfig(this.powersaveInputs, this.customConfig.powersave);
		this.populateModeConfig(this.balanceInputs, this.customConfig.balance);
		this.populateModeConfig(this.performanceInputs, this.customConfig.performance);
		this.populateModeConfig(this.fastInputs, this.customConfig.fast);
		if (this.customConfig.global?.mode)
			this.syncModeTabsWithGlobalMode(String(this.customConfig.global.mode));
	}
	updateGlobalModeDisplay(mode: string) {
		let modeText = "";
		let modeI18n = "";
		switch (mode) {
			case "powersave":
				modeText = getTranslation("config_powersave_mode", {}, this.currentLanguage);
				modeI18n = "config_powersave_mode";
				break;
			case "performance":
				modeText = getTranslation("config_performance_mode", {}, this.currentLanguage);
				modeI18n = "config_performance_mode";
				break;
			case "fast":
				modeText = getTranslation("config_fast_mode", {}, this.currentLanguage);
				modeI18n = "config_fast_mode";
				break;
			default:
				modeText = getTranslation("config_balance_mode", {}, this.currentLanguage);
				modeI18n = "config_balance_mode";
				break;
		}
		if (this.selectedGlobalMode) {
			const span = this.selectedGlobalMode.querySelector("span");
			if (span) {
				span.textContent = modeText;
				span.setAttribute("data-i18n", modeI18n);
			}
		}
	}
	populateModeConfig(inputs: ModeInputs | null, config: ModeConfig | undefined) {
		if (!config || !inputs) return;
		Object.keys(inputs).forEach((key) => {
			const element = inputs[key];
			if (element && config[key] !== undefined) {
				const inputElement = element as HTMLInputElement;
				if (inputElement.type === "checkbox") {
					inputElement.checked = Boolean(config[key]);
				} else {
					inputElement.value = String(config[key]);
				}
			}
		});
	}
	getCurrentConfig() {
		return {
			global: { mode: this.getGlobalMode(), idle_threshold: this.getIdleThreshold() },
			powersave: this.getModeConfig(this.powersaveInputs),
			balance: this.getModeConfig(this.balanceInputs),
			performance: this.getModeConfig(this.performanceInputs),
			fast: this.getModeConfig(this.fastInputs),
		};
	}
	getGlobalMode() {
		if (this.globalModeSelect?.value) return this.globalModeSelect.value;
		if (this.selectedGlobalMode) {
			const span = this.selectedGlobalMode.querySelector("span");
			if (span) {
				const t = span.textContent || "";
				if (t.includes("省电") || t.includes("Power Save")) return "powersave";
				if (t.includes("性能") || t.includes("Performance")) return "performance";
				if (t.includes("极速") || t.includes("Fast")) return "fast";
				return "balance";
			}
		}
		return "balance";
	}
	getIdleThreshold() {
		return this.idleThresholdInput ? this.idleThresholdInput.value || 5 : 5;
	}
	getModeConfig(inputs: ModeInputs | null): ModeConfig {
		if (!inputs) return {};
		const config: ModeConfig = {};
		Object.keys(inputs).forEach((key) => {
			const element = inputs[key];
			if (element) {
				if ((element as HTMLInputElement).type === "checkbox")
					config[key] = (element as HTMLInputElement).checked;
				else
					config[key] = (element as HTMLInputElement).value
						? Number((element as HTMLInputElement).value)
						: 0;
			}
		});
		return config;
	}
	setLanguage(language: Lang) {
		this.currentLanguage = language;
		if (this.customConfig.global?.mode)
			this.updateGlobalModeDisplay(String(this.customConfig.global.mode));
	}
}
