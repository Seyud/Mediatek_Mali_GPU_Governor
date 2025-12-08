import { getTranslation } from "./i18n";
import { exec, toast } from "./utils";

type Lang = "zh" | "en";

export class SettingsManager {
	currentLanguage: Lang = "zh";
	languageContainer: HTMLElement | null;

	constructor() {
		this.languageContainer = document.getElementById("languageContainer");
	}

	init() {
		this.setupEventListeners();
	}

	setupEventListeners() {
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

	/* Removed loadLogLevel and saveLogLevel methods */

	setLanguage(language: Lang) {
		this.currentLanguage = language;
	}
}
