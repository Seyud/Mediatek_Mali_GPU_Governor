// 主题管理模块
import { toast } from './utils.js';
import { getTranslation } from './i18n.js';

export class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.followSystemThemeToggle = document.querySelector('#followSystemThemeToggle .miuix-switch-input');
        this.followSystemThemeSuperSwitch = document.getElementById('followSystemThemeSuperSwitch');
        this.currentLanguage = 'zh'; // 默认语言
    }

    init() {
        this.initTheme();
        this.setupEventListeners();
    }

    initTheme() {
        // 检查是否有用户保存的主题设置
        const savedTheme = localStorage.getItem('theme');

        // 检查系统是否支持深色模式检测
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        // 检查用户是否设置了跟随系统主题，默认为true（跟随系统）
        const followSystemThemeSetting = localStorage.getItem('followSystemTheme');
        const followSystemTheme = followSystemThemeSetting === null ? true : followSystemThemeSetting === 'true';

        // 设置跟随系统主题开关的状态
        this.followSystemThemeToggle.checked = followSystemTheme;

        // 如果是首次使用，将跟随系统设置保存到localStorage
        if (followSystemThemeSetting === null) {
            localStorage.setItem('followSystemTheme', 'true');
        }

        // 根据设置决定使用哪个主题
        let theme;
        if (followSystemTheme) {
            // 如果设置了跟随系统，则使用系统主题
            theme = prefersDarkMode ? 'dark' : 'light';
        } else if (savedTheme) {
            // 如果没有设置跟随系统，但有保存的主题，则使用保存的主题
            theme = savedTheme;
        } else {
            // 如果既没有设置跟随系统，也没有保存的主题，则默认使用系统主题
            theme = prefersDarkMode ? 'dark' : 'light';
        }

        // 应用主题
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // 监听系统主题变化
        if (window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (darkModeMediaQuery.addEventListener) {
                darkModeMediaQuery.addEventListener('change', (e) => {
                    // 只有当设置了跟随系统主题时，才跟随系统设置
                    if (localStorage.getItem('followSystemTheme') === 'true') {
                        const newTheme = e.matches ? 'dark' : 'light';
                        document.documentElement.setAttribute('data-theme', newTheme);
                        localStorage.setItem('theme', newTheme);
                    }
                });
            }
        }
    }

    setupEventListeners() {
        // 主题切换按钮点击事件
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 跟随系统主题SuperSwitch事件 - 支持点击整个区域
        this.followSystemThemeSuperSwitch.addEventListener('click', (e) => {
            this.handleFollowSystemToggleClick(e);
        });

        // 为SuperSwitch添加键盘导航支持
        this.followSystemThemeSuperSwitch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.followSystemThemeSuperSwitch.click();
            }
        });

        // 使SuperSwitch可以通过Tab键聚焦
        this.followSystemThemeSuperSwitch.setAttribute('tabindex', '0');
        this.followSystemThemeSuperSwitch.setAttribute('role', 'switch');
        this.followSystemThemeSuperSwitch.setAttribute('aria-checked', this.followSystemThemeToggle.checked);

        // 跟随系统主题开关状态变化事件
        this.followSystemThemeToggle.addEventListener('change', () => {
            this.handleFollowSystemChange();
        });
    }

    toggleTheme() {
        // 添加切换动画类
        this.themeToggle.classList.add('switching');

        // 如果设置了跟随系统主题，则先关闭跟随系统
        if (localStorage.getItem('followSystemTheme') === 'true') {
            localStorage.setItem('followSystemTheme', 'false');
            this.followSystemThemeToggle.checked = false;
            toast(getTranslation('toast_theme_follow_disabled', {}, this.currentLanguage));
        }

        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        // 添加平滑过渡效果
        document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // 移除切换动画类
        setTimeout(() => {
            this.themeToggle.classList.remove('switching');
            document.documentElement.style.transition = '';
        }, 600);

        // 显示主题切换提示
        const themeKey = newTheme === 'dark' ? 'toast_theme_switched_dark' : 'toast_theme_switched_light';
        toast(getTranslation(themeKey, {}, this.currentLanguage));
    }

    handleFollowSystemToggleClick(e) {
        // 如果点击的是switch输入框本身，让它正常处理
        if (e.target === this.followSystemThemeToggle) {
            return;
        }

        // 阻止事件冒泡并切换开关状态
        e.preventDefault();

        // 添加触觉反馈（如果支持）
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        this.followSystemThemeToggle.checked = !this.followSystemThemeToggle.checked;

        // 手动触发change事件
        const changeEvent = new Event('change', { bubbles: true });
        this.followSystemThemeToggle.dispatchEvent(changeEvent);
    }

    handleFollowSystemChange() {
        const isFollowSystem = this.followSystemThemeToggle.checked;
        localStorage.setItem('followSystemTheme', isFollowSystem.toString());

        // 更新aria-checked属性
        this.followSystemThemeSuperSwitch.setAttribute('aria-checked', isFollowSystem);

        // 添加状态切换动画
        this.followSystemThemeSuperSwitch.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.followSystemThemeSuperSwitch.style.transform = '';
        }, 150);

        if (isFollowSystem) {
            // 如果开启了跟随系统，则立即应用系统主题
            const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', systemTheme);
            localStorage.setItem('theme', systemTheme);
            toast(getTranslation('toast_theme_follow_enabled', {}, this.currentLanguage));
        } else {
            toast(getTranslation('toast_theme_follow_keep', {}, this.currentLanguage));
        }
    }

    setLanguage(language) {
        this.currentLanguage = language;
    }
}