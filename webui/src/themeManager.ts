import { getTranslation } from "./i18n";
import { toast } from "./utils";

type Lang = "zh" | "en";

export class ThemeManager {
	themeToggle: HTMLElement | null;
	followSystemThemeToggle: HTMLInputElement | null;
	followSystemThemeSuperSwitch: HTMLElement | null;
	currentLanguage: Lang = "zh";

	constructor() {
		this.themeToggle = document.getElementById("themeToggle");
		this.followSystemThemeToggle = document.querySelector(
			"#followSystemThemeToggle .miuix-switch-input"
		);
		this.followSystemThemeSuperSwitch = document.getElementById("followSystemThemeSuperSwitch");
	}

	init() {
		this.initTheme();
		this.setupEventListeners();
	}

	initTheme() {
		const savedTheme = localStorage.getItem("theme");
		const prefersDarkMode = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
		const followSystemThemeSetting = localStorage.getItem("followSystemTheme");
		const followSystemTheme =
			followSystemThemeSetting === null ? true : followSystemThemeSetting === "true";
		if (this.followSystemThemeToggle) this.followSystemThemeToggle.checked = followSystemTheme;
		if (followSystemThemeSetting === null) localStorage.setItem("followSystemTheme", "true");
		let theme: string;
		if (followSystemTheme) theme = prefersDarkMode ? "dark" : "light";
		else if (savedTheme) theme = savedTheme;
		else theme = prefersDarkMode ? "dark" : "light";
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("theme", theme);
		if (window.matchMedia) {
			const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			if (darkModeMediaQuery.addEventListener) {
				darkModeMediaQuery.addEventListener("change", (e) => {
					if (localStorage.getItem("followSystemTheme") === "true") {
						const newTheme = e.matches ? "dark" : "light";
						document.documentElement.setAttribute("data-theme", newTheme);
						localStorage.setItem("theme", newTheme);
					}
				});
			}
		}
	}

	setupEventListeners() {
		if (this.themeToggle) {
			this.themeToggle.addEventListener("click", () => this.toggleTheme());
		}
		if (this.followSystemThemeSuperSwitch) {
			this.followSystemThemeSuperSwitch.addEventListener("click", (e) =>
				this.handleFollowSystemToggleClick(e)
			);
			this.followSystemThemeSuperSwitch.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					(e.currentTarget as HTMLElement).click();
				}
			});
			this.followSystemThemeSuperSwitch.setAttribute("tabindex", "0");
			this.followSystemThemeSuperSwitch.setAttribute("role", "switch");
			this.followSystemThemeSuperSwitch.setAttribute(
				"aria-checked",
				this.followSystemThemeToggle?.checked ? "true" : "false"
			);
		}
		if (this.followSystemThemeToggle) {
			this.followSystemThemeToggle.addEventListener("change", () =>
				this.handleFollowSystemChange()
			);
		}
	}

	toggleTheme() {
		if (this.themeToggle) this.themeToggle.classList.add("switching");
		if (localStorage.getItem("followSystemTheme") === "true") {
			localStorage.setItem("followSystemTheme", "false");
			if (this.followSystemThemeToggle) this.followSystemThemeToggle.checked = false;
			toast(getTranslation("toast_theme_follow_disabled", {}, this.currentLanguage));
		}
		const currentTheme = document.documentElement.getAttribute("data-theme");
		const newTheme = currentTheme === "light" ? "dark" : "light";
		document.documentElement.style.transition = "background-color 0.3s ease, color 0.3s ease";
		document.documentElement.setAttribute("data-theme", newTheme);
		localStorage.setItem("theme", newTheme);
		setTimeout(() => {
			if (this.themeToggle) this.themeToggle.classList.remove("switching");
			document.documentElement.style.transition = "";
		}, 600);
		const themeKey =
			newTheme === "dark" ? "toast_theme_switched_dark" : "toast_theme_switched_light";
		toast(getTranslation(themeKey, {}, this.currentLanguage as Lang));
	}

	handleFollowSystemToggleClick(e: Event) {
		if (e.target === this.followSystemThemeToggle) return;
		e.preventDefault();
		if (navigator.vibrate) navigator.vibrate(50);
		if (this.followSystemThemeToggle) {
			this.followSystemThemeToggle.checked = !this.followSystemThemeToggle.checked;
			this.followSystemThemeToggle.dispatchEvent(new Event("change", { bubbles: true }));
		}
	}

	handleFollowSystemChange() {
		const isFollowSystem = !!this.followSystemThemeToggle?.checked;
		localStorage.setItem("followSystemTheme", isFollowSystem.toString());
		if (this.followSystemThemeSuperSwitch)
			this.followSystemThemeSuperSwitch.setAttribute(
				"aria-checked",
				isFollowSystem ? "true" : "false"
			);
		if (this.followSystemThemeSuperSwitch) {
			this.followSystemThemeSuperSwitch.style.transform = "scale(0.98)";
			setTimeout(() => {
				if (this.followSystemThemeSuperSwitch)
					this.followSystemThemeSuperSwitch.style.transform = "";
			}, 150);
		}
		if (isFollowSystem) {
			const systemTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
			document.documentElement.setAttribute("data-theme", systemTheme);
			localStorage.setItem("theme", systemTheme);
			toast(getTranslation("toast_theme_follow_enabled", {}, this.currentLanguage as Lang));
		} else {
			toast(getTranslation("toast_theme_follow_keep", {}, this.currentLanguage as Lang));
		}
	}

	setLanguage(language: Lang) {
		this.currentLanguage = language;
	}
}
