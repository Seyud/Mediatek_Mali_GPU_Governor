// 模式配置管理模块
import { getTranslation } from './i18n.js';

export class ModeConfigManager {
    constructor() {
        this.currentLanguage = 'zh';
        this.customConfig = {};
        
        // DOM元素
        this.globalModeSelect = document.getElementById('globalMode');
        this.globalModeContainer = document.getElementById('globalModeContainer');
        this.selectedGlobalMode = document.getElementById('selectedGlobalMode');
        this.globalModeOptions = document.getElementById('globalModeOptions');
        this.idleThresholdInput = document.getElementById('idleThreshold');
        
        // 各模式配置输入元素
        this.powersaveInputs = this.getModeInputs('powersave');
        this.balanceInputs = this.getModeInputs('balance');
        this.performanceInputs = this.getModeInputs('performance');
        this.fastInputs = this.getModeInputs('fast');
    }

    // 获取模式输入元素
    getModeInputs(mode) {
        return {
            margin: document.getElementById(`${mode}Margin`),
            sampling_interval: document.getElementById(`${mode}SamplingInterval`),
            min_adaptive_interval: document.getElementById(`${mode}MinAdaptiveInterval`),
            max_adaptive_interval: document.getElementById(`${mode}MaxAdaptiveInterval`),
            up_rate_delay: document.getElementById(`${mode}UpRateDelay`),
            down_rate_delay: document.getElementById(`${mode}DownRateDelay`),
            aggressive_down: document.getElementById(`${mode}AggressiveDown`),
            gaming_mode: document.getElementById(`${mode}GamingMode`),
            adaptive_sampling: document.getElementById(`${mode}AdaptiveSampling`)
        };
    }

    // 初始化模式配置管理器
    init() {
        this.initGlobalModeSelect();
        this.initModeSwitchEvents();
    }

    // 初始化全局模式选择器
    initGlobalModeSelect() {
        if (!this.selectedGlobalMode || !this.globalModeOptions) return;

        // 点击选中项时切换选项容器的显示状态
        this.selectedGlobalMode.addEventListener('click', (e) => {
            e.stopPropagation();
            this.globalModeContainer.classList.toggle('open');
        });
        
        // 点击选项时更新选中值并隐藏选项容器
        const options = this.globalModeOptions.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                const text = option.textContent;
                
                // 更新选中项的显示文本
                this.selectedGlobalMode.querySelector('span').textContent = text;
                this.selectedGlobalMode.querySelector('span').setAttribute('data-i18n', option.getAttribute('data-i18n'));
                
                // 更新隐藏的select元素的值
                if (this.globalModeSelect) {
                    this.globalModeSelect.value = value;
                    // 触发change事件以同步模式选项卡
                    this.globalModeSelect.dispatchEvent(new Event('change'));
                }
                
                // 隐藏选项容器
                this.globalModeContainer.classList.remove('open');
            });
        });
        
        // 点击其他地方时隐藏选项容器
        document.addEventListener('click', (e) => {
            if (!this.globalModeContainer.contains(e.target)) {
                this.globalModeContainer.classList.remove('open');
            }
        });
    }

    // 初始化模式切换按钮事件
    initModeSwitchEvents() {
        const modeButtons = document.querySelectorAll('.mode-tabs-grid .settings-tab-btn');
        const modeSections = document.querySelectorAll('.mode-config-section');
        
        // 根据全局模式设置默认选中状态
        if (this.globalModeSelect) {
            const globalMode = this.globalModeSelect.value;
            this.syncModeTabsWithGlobalMode(globalMode);
        }
        
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.getAttribute('data-mode');
                
                // 更新按钮状态
                modeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // 显示对应的配置区域
                modeSections.forEach(section => {
                    section.classList.remove('active');
                });
                const targetSection = document.getElementById(`${mode}-config`);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            });
        });
        
        // 监听全局模式选择框的变化
        if (this.globalModeSelect) {
            this.globalModeSelect.addEventListener('change', () => {
                const mode = this.globalModeSelect.value;
                this.syncModeTabsWithGlobalMode(mode);
            });
        }
    }
    
    // 同步模式选项卡与全局模式
    syncModeTabsWithGlobalMode(mode) {
        const modeButtons = document.querySelectorAll('.mode-tabs-grid .settings-tab-btn');
        const modeSections = document.querySelectorAll('.mode-config-section');
        
        // 更新按钮状态
        modeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-mode') === mode) {
                btn.classList.add('active');
            }
        });
        
        // 显示对应的配置区域
        modeSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${mode}-config`) {
                section.classList.add('active');
            }
        });
    }

    // 填充自定义配置表单
    populateCustomConfigForm(customConfig) {
        this.customConfig = customConfig || {};

        // 填充全局设置
        if (this.customConfig.global) {
            if (this.globalModeSelect && this.customConfig.global.mode) {
                this.globalModeSelect.value = this.customConfig.global.mode;
            }
            
            // 更新全局模式显示文本
            if (this.selectedGlobalMode && this.customConfig.global.mode) {
                this.updateGlobalModeDisplay(this.customConfig.global.mode);
            }
            
            if (this.idleThresholdInput && this.customConfig.global.idle_threshold !== undefined) {
                this.idleThresholdInput.value = this.customConfig.global.idle_threshold;
            }
        }

        // 填充各模式设置
        this.populateModeConfig(this.powersaveInputs, this.customConfig.powersave);
        this.populateModeConfig(this.balanceInputs, this.customConfig.balance);
        this.populateModeConfig(this.performanceInputs, this.customConfig.performance);
        this.populateModeConfig(this.fastInputs, this.customConfig.fast);
        
        // 同步模式选项卡与全局模式
        if (this.customConfig.global && this.customConfig.global.mode) {
            this.syncModeTabsWithGlobalMode(this.customConfig.global.mode);
        }
    }

    // 更新全局模式显示
    updateGlobalModeDisplay(mode) {
        let modeText = '';
        let modeI18n = '';
        switch (mode) {
            case 'powersave':
                modeText = getTranslation('config_powersave_mode', {}, this.currentLanguage);
                modeI18n = 'config_powersave_mode';
                break;
            case 'performance':
                modeText = getTranslation('config_performance_mode', {}, this.currentLanguage);
                modeI18n = 'config_performance_mode';
                break;
            case 'fast':
                modeText = getTranslation('config_fast_mode', {}, this.currentLanguage);
                modeI18n = 'config_fast_mode';
                break;
            default: // balance
                modeText = getTranslation('config_balance_mode', {}, this.currentLanguage);
                modeI18n = 'config_balance_mode';
                break;
        }
        
        if (this.selectedGlobalMode) {
            this.selectedGlobalMode.querySelector('span').textContent = modeText;
            this.selectedGlobalMode.querySelector('span').setAttribute('data-i18n', modeI18n);
        }
    }

    // 填充模式配置
    populateModeConfig(inputs, config) {
        if (!config || !inputs) return;
        
        Object.keys(inputs).forEach(key => {
            const element = inputs[key];
            if (element && config[key] !== undefined) {
                if (element.type === 'checkbox') {
                    element.checked = config[key];
                } else {
                    element.value = config[key];
                }
            }
        });
    }

    // 获取当前配置
    getCurrentConfig() {
        const config = {
            global: {
                mode: this.getGlobalMode(),
                idle_threshold: this.getIdleThreshold()
            },
            powersave: this.getModeConfig(this.powersaveInputs),
            balance: this.getModeConfig(this.balanceInputs),
            performance: this.getModeConfig(this.performanceInputs),
            fast: this.getModeConfig(this.fastInputs)
        };

        return config;
    }

    // 获取全局模式
    getGlobalMode() {
        if (this.globalModeSelect && this.globalModeSelect.value) {
            return this.globalModeSelect.value;
        }
        
        // 从显示的选中项中获取模式值
        if (this.selectedGlobalMode) {
            const selectedSpan = this.selectedGlobalMode.querySelector('span');
            if (selectedSpan) {
                const selectedText = selectedSpan.textContent.trim();
                if (selectedText.includes('省电') || selectedText.includes('Power Save')) {
                    return 'powersave';
                } else if (selectedText.includes('性能') || selectedText.includes('Performance')) {
                    return 'performance';
                } else if (selectedText.includes('极速') || selectedText.includes('Fast')) {
                    return 'fast';
                } else {
                    return 'balance';
                }
            }
        }
        
        return 'balance';
    }

    // 获取空闲阈值
    getIdleThreshold() {
        return this.idleThresholdInput ? (this.idleThresholdInput.value || 5) : 5;
    }

    // 获取模式配置
    getModeConfig(inputs) {
        if (!inputs) return {};
        
        const config = {};
        Object.keys(inputs).forEach(key => {
            const element = inputs[key];
            if (element) {
                if (element.type === 'checkbox') {
                    config[key] = element.checked;
                } else {
                    config[key] = element.value ? Number(element.value) : 0;
                }
            }
        });
        
        return config;
    }

    // 设置语言
    setLanguage(language) {
        this.currentLanguage = language;
        
        // 更新全局模式显示
        if (this.customConfig.global && this.customConfig.global.mode) {
            this.updateGlobalModeDisplay(this.customConfig.global.mode);
        }
    }
}