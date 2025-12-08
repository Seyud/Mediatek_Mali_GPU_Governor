import { PATHS } from "./constants";
import { getTranslation } from "./i18n";
import { exec, toast } from "./utils";

type Lang = "zh" | "en";

export class LogManager {
	currentLanguage: Lang = "zh";
	logContent: HTMLElement | null;
	refreshLogBtn: HTMLElement | null;
	logLevelContainer: HTMLElement | null;

	constructor() {
		this.logContent = document.getElementById("logContent");
		this.refreshLogBtn = document.getElementById("refreshLogBtn");
		this.logLevelContainer = document.getElementById("logLevelContainer");
	}

	init() {
		this.setupEventListeners();
		this.initLogFileSelect();
		this.loadLogLevel();
	}

	setupEventListeners() {
		if (this.refreshLogBtn) {
			this.refreshLogBtn.addEventListener("click", () => this.loadLog());
		}
		const logTabBtns = document.querySelectorAll(".log-tab-btn");
		logTabBtns.forEach((btn) => {
			btn.addEventListener("click", () => {
				if (btn.classList.contains("active")) return;
				logTabBtns.forEach((tab) => {
					tab.classList.remove("active");
				});
				btn.classList.add("active");
				if (this.logContent) {
					this.logContent.style.opacity = "0.5";
					this.logContent.textContent = getTranslation("log_loading", {}, this.currentLanguage);
				}
				setTimeout(() => {
					this.loadLog().then(() => {
						if (this.logContent) this.logContent.style.opacity = "1";
					});
				}, 100);
			});
		});

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
	}

	initLogFileSelect() {
		const activeTab = document.querySelector(".log-tab-btn.active");
		const currentLogFile = activeTab ? activeTab.getAttribute("data-log") : "gpu_gov.log";
		const logTabBtns = document.querySelectorAll(".log-tab-btn");
		logTabBtns.forEach((btn) => {
			if (btn.getAttribute("data-log") === currentLogFile) btn.classList.add("active");
			else btn.classList.remove("active");
		});
	}

	async loadLog() {
		const activeTab = document.querySelector(".log-tab-btn.active");
		const selectedLog = activeTab ? activeTab.getAttribute("data-log") : "gpu_gov.log";
		if (this.logContent)
			this.logContent.textContent = getTranslation("log_loading", {}, this.currentLanguage);
		const { errno, stdout } = await exec(
			`cat ${PATHS.LOG_PATH}/${selectedLog} 2>/dev/null || echo "日志文件不存在"`
		);
		if (stdout.trim() === "日志文件不存在") {
			if (this.logContent)
				this.logContent.textContent = getTranslation("log_not_found", {}, this.currentLanguage);
			return;
		}
		if (errno === 0) {
			const lines = stdout.trim().split("\n");
			const lastLines = lines.slice(-100).join("\n");
			if (this.logContent)
				this.logContent.textContent =
					lastLines || getTranslation("log_empty", {}, this.currentLanguage);
			if (this.logContent) this.logContent.scrollTop = this.logContent.scrollHeight;
		} else if (this.logContent)
			this.logContent.textContent = getTranslation("log_not_found", {}, this.currentLanguage);
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
