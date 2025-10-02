import { PATHS } from "./constants";
import { getTranslation } from "./i18n";
import { exec, toast } from "./utils";

type Lang = "zh" | "en";

export class SettingsManager {
	currentLanguage: Lang = "zh";
	logLevelContainer: HTMLElement | null;
	languageContainer: HTMLElement | null;

	constructor() {
		this.logLevelContainer = document.getElementById("logLevelContainer");
		this.languageContainer = document.getElementById("languageContainer");
	}

	init() {
		this.setupEventListeners();
		this.loadLogLevel();
	}

	setupEventListeners() {
		if (this.logLevelContainer) {
			const logLevelButtons = this.logLevelContainer.querySelectorAll(".settings-tab-btn");
			logLevelButtons.forEach((button) => {
				button.addEventListener("click", (e) => {
					e.preventDefault();
					logLevelButtons.forEach((btn) => {
						btn.classList.remove("active");
					});
					button.classList.add("active");
					this.saveLogLevel();
				});
			});
		}

		if (this.languageContainer) {
			const languageButtons = this.languageContainer.querySelectorAll(".settings-tab-btn");
			languageButtons.forEach((button) => {
				button.addEventListener("click", async (e) => {
					e.preventDefault();
					languageButtons.forEach((btn) => {
						btn.classList.remove("active");
					});
					button.classList.add("active");
					const selectedValue = button.getAttribute("data-value") as Lang | "system";
					localStorage.setItem("languageSetting", selectedValue);
					let newLanguage: Lang = "zh";
					if (selectedValue === "system") {
						const { errno, stdout } = await exec(
							'getprop persist.sys.locale || getprop ro.product.locale || echo "zh-CN"'
						);
						if (errno === 0 && stdout.trim()) {
							const locale = stdout.trim().toLowerCase();
							newLanguage = locale.startsWith("en") ? "en" : "zh";
						}
						localStorage.setItem("language", newLanguage);
						toast(getTranslation("toast_language_follow_system", {}, newLanguage));
					} else {
						newLanguage = selectedValue;
						localStorage.setItem("language", selectedValue);
						const languageName = selectedValue === "zh" ? "中文" : "English";
						toast(
							getTranslation("toast_language_changed", { language: languageName }, newLanguage)
						);
					}
					this.currentLanguage = newLanguage;
					const languageChangeEvent = new CustomEvent("languageChange", {
						detail: { language: newLanguage },
					});
					document.dispatchEvent(languageChangeEvent);
				});
			});
		}
	}

	async loadLogLevel() {
		const { errno, stdout } = await exec(`cat ${PATHS.LOG_LEVEL_PATH} 2>/dev/null || echo "info"`);
		let logLevel: string = "info";
		if (errno === 0) {
			const level = stdout.trim().toLowerCase();
			if (["debug", "info", "warn", "error"].includes(level)) logLevel = level;
		}
		if (this.logLevelContainer) {
			const logLevelButtons = this.logLevelContainer.querySelectorAll(".settings-tab-btn");
			logLevelButtons.forEach((button) => {
				if (button.getAttribute("data-value") === logLevel) button.classList.add("active");
				else button.classList.remove("active");
			});
		}
	}

	async saveLogLevel() {
		if (!this.logLevelContainer) return;
		const selectedButton = this.logLevelContainer.querySelector(".settings-tab-btn.active");
		if (!selectedButton) return;
		const selectedLevel = selectedButton.getAttribute("data-value");
		const { errno } = await exec(`echo "${selectedLevel}" > ${PATHS.LOG_LEVEL_PATH}`);
		if (errno === 0) {
			if (selectedLevel === "debug")
				toast(getTranslation("toast_log_level_debug", {}, this.currentLanguage));
			else
				toast(
					getTranslation(
						"toast_log_level_set",
						{ level: selectedLevel || "" },
						this.currentLanguage
					)
				);
		} else toast(getTranslation("toast_log_level_fail", {}, this.currentLanguage));
	}

	setLanguage(language: Lang) {
		this.currentLanguage = language;
	}
}
