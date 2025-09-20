import { PATHS } from "./constants";
import { getTranslation } from "./i18n";
import { exec } from "./utils";

type Lang = "zh" | "en";

export class LogManager {
	currentLanguage: Lang = "zh";
	logContent: HTMLElement | null;
	refreshLogBtn: HTMLElement | null;

	constructor() {
		this.logContent = document.getElementById("logContent");
		this.refreshLogBtn = document.getElementById("refreshLogBtn");
	}

	init() {
		this.setupEventListeners();
		this.initLogFileSelect();
	}

	setupEventListeners() {
		if (this.refreshLogBtn) {
			this.refreshLogBtn.addEventListener("click", () => this.loadLog());
		}
		const logTabBtns = document.querySelectorAll(".log-tab-btn");
		logTabBtns.forEach((btn) => {
			btn.addEventListener("click", () => {
				if (btn.classList.contains("active")) return;
				logTabBtns.forEach((tab) => tab.classList.remove("active"));
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
		try {
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
		} catch (error) {
			console.error("加载日志失败:", error);
			if (this.logContent) this.logContent.textContent = "加载日志失败，请检查权限";
		}
	}

	setLanguage(language: Lang) {
		this.currentLanguage = language;
	}
}
