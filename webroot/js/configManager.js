// GPU配置管理模块
import { exec, toast } from './utils.js';
import { PATHS, VOLT_LIST, VOLT_SETTINGS } from './constants.js';
import { getTranslation } from './i18n.js';

export class ConfigManager {
    constructor() {
        this.gpuConfigs = [];
        this.customConfig = {};
        this.editingIndex = -1;
        this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT;
        this.isLongPress = false;
        this.decreaseTimer = null;
        this.increaseTimer = null;
        this.voltageEventsInitialized = false;
        this.currentLanguage = 'zh';
        
        // DOM元素
        this.gpuFreqTable = document.getElementById('gpuFreqTable')?.querySelector('tbody');
        this.addConfigBtn = document.getElementById('addConfigBtn');
        this.saveConfigBtn = document.getElementById('saveConfigBtn');
        this.editConfigModal = document.getElementById('editConfigModal');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.freqInput = document.getElementById('freqInput');
        this.voltSelect = document.getElementById('voltSelect');
        this.saveItemBtn = document.getElementById('saveItemBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.deleteItemBtn = document.getElementById('deleteItemBtn');
        this.selectedVolt = document.getElementById('selectedVolt');
        this.voltDecreaseBtn = document.getElementById('voltDecreaseBtn');
        this.voltIncreaseBtn = document.getElementById('voltIncreaseBtn');
        this.ddrContainer = document.getElementById('ddrContainer');
        this.selectedDdr = document.getElementById('selectedDdr');
        
        // 自定义配置DOM元素
        this.saveCustomConfigBtn = document.getElementById('saveCustomConfigBtn');
        // 全局设置
        this.globalMode = document.getElementById('globalMode');
        this.idleThreshold = document.getElementById('idleThreshold');
        // 模式标签页按钮
        this.modeTabBtns = document.querySelectorAll('.settings-tab-btn');
        // 模式配置区域
        this.modeConfigSections = document.querySelectorAll('.mode-config-section');
        // 省电模式设置
        this.powersaveUltraSimple = document.getElementById('powersaveUltraSimple');
        this.powersaveMargin = document.getElementById('powersaveMargin');
        this.powersaveDownCounter = document.getElementById('powersaveDownCounter');
        this.powersaveAggressiveDown = document.getElementById('powersaveAggressiveDown');
        this.powersaveSamplingInterval = document.getElementById('powersaveSamplingInterval');
        this.powersaveGamingMode = document.getElementById('powersaveGamingMode');
        this.powersaveAdaptiveSampling = document.getElementById('powersaveAdaptiveSampling');
        this.powersaveMinAdaptiveInterval = document.getElementById('powersaveMinAdaptiveInterval');
        this.powersaveMaxAdaptiveInterval = document.getElementById('powersaveMaxAdaptiveInterval');
        this.powersaveUpRateDelay = document.getElementById('powersaveUpRateDelay');
        this.powersaveDownRateDelay = document.getElementById('powersaveDownRateDelay');
        // 平衡模式设置
        this.balanceUltraSimple = document.getElementById('balanceUltraSimple');
        this.balanceMargin = document.getElementById('balanceMargin');
        this.balanceDownCounter = document.getElementById('balanceDownCounter');
        this.balanceAggressiveDown = document.getElementById('balanceAggressiveDown');
        this.balanceSamplingInterval = document.getElementById('balanceSamplingInterval');
        this.balanceGamingMode = document.getElementById('balanceGamingMode');
        this.balanceAdaptiveSampling = document.getElementById('balanceAdaptiveSampling');
        this.balanceMinAdaptiveInterval = document.getElementById('balanceMinAdaptiveInterval');
        this.balanceMaxAdaptiveInterval = document.getElementById('balanceMaxAdaptiveInterval');
        this.balanceUpRateDelay = document.getElementById('balanceUpRateDelay');
        this.balanceDownRateDelay = document.getElementById('balanceDownRateDelay');
        // 性能模式设置
        this.performanceUltraSimple = document.getElementById('performanceUltraSimple');
        this.performanceMargin = document.getElementById('performanceMargin');
        this.performanceDownCounter = document.getElementById('performanceDownCounter');
        this.performanceAggressiveDown = document.getElementById('performanceAggressiveDown');
        this.performanceSamplingInterval = document.getElementById('performanceSamplingInterval');
        this.performanceGamingMode = document.getElementById('performanceGamingMode');
        this.performanceAdaptiveSampling = document.getElementById('performanceAdaptiveSampling');
        this.performanceMinAdaptiveInterval = document.getElementById('performanceMinAdaptiveInterval');
        this.performanceMaxAdaptiveInterval = document.getElementById('performanceMaxAdaptiveInterval');
        this.performanceUpRateDelay = document.getElementById('performanceUpRateDelay');
        this.performanceDownRateDelay = document.getElementById('performanceDownRateDelay');
        // 极速模式设置
        this.fastUltraSimple = document.getElementById('fastUltraSimple');
        this.fastMargin = document.getElementById('fastMargin');
        this.fastDownCounter = document.getElementById('fastDownCounter');
        this.fastAggressiveDown = document.getElementById('fastAggressiveDown');
        this.fastSamplingInterval = document.getElementById('fastSamplingInterval');
        this.fastGamingMode = document.getElementById('fastGamingMode');
        this.fastAdaptiveSampling = document.getElementById('fastAdaptiveSampling');
        this.fastMinAdaptiveInterval = document.getElementById('fastMinAdaptiveInterval');
        this.fastMaxAdaptiveInterval = document.getElementById('fastMaxAdaptiveInterval');
        this.fastUpRateDelay = document.getElementById('fastUpRateDelay');
        this.fastDownRateDelay = document.getElementById('fastDownRateDelay');
    }

    init() {
        this.setupEventListeners();
        this.initVoltSelect();
    }

    setupEventListeners() {
        if (this.addConfigBtn) {
            this.addConfigBtn.addEventListener('click', () => {
                this.openEditModal();
            });
        }

        if (this.saveConfigBtn) {
            this.saveConfigBtn.addEventListener('click', () => {
                this.saveConfigToFile();
            });
        }

        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        if (this.saveItemBtn) {
            this.saveItemBtn.addEventListener('click', () => {
                this.saveConfigItem();
            });
        }

        if (this.deleteItemBtn) {
            this.deleteItemBtn.addEventListener('click', () => {
                this.deleteConfigItem();
            });
        }

        // 自定义配置事件监听器
        if (this.loadCustomConfigBtn) {
            this.loadCustomConfigBtn.addEventListener('click', () => {
                this.loadCustomConfigFromFile();
            });
        }

        if (this.saveCustomConfigBtn) {
            this.saveCustomConfigBtn.addEventListener('click', () => {
                this.saveCustomConfigToFile();
            });
        }

        // 模式标签页切换事件
        this.modeTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode');
                this.switchModeTab(mode);
            });
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            if (event.target === this.editConfigModal) {
                this.closeEditModal();
            }
        });

        // 按ESC键关闭模态框
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.editConfigModal && this.editConfigModal.style.display === 'block') {
                    this.closeEditModal();
                }
            }
        });
        
        // 初始化加载配置
        this.loadGpuConfig();
        this.loadCustomConfigFromFile();

        // 自定义内存档位选择事件
        if (this.ddrContainer) {
            this.ddrContainer.addEventListener('click', () => {
                this.ddrContainer.classList.toggle('open');
            });

            // 点击内存档位选项时
            const ddrOptionElements = document.querySelectorAll('#ddrOptions .option');
            ddrOptionElements.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation(); // 防止事件冒泡到container

                    // 移除所有选项的选中状态
                    ddrOptionElements.forEach(opt => opt.classList.remove('selected'));

                    // 为当前选项添加选中状态
                    option.classList.add('selected');

                    // 更新显示的文本
                    if (this.selectedDdr) {
                        this.selectedDdr.textContent = option.textContent;
                    }

                    // 关闭下拉菜单
                    this.ddrContainer.classList.remove('open');
                });
            });
        }
    }

    async loadGpuConfig() {
        try {
            const { errno, stdout } = await exec(`cat ${PATHS.CONFIG_PATH}`);

            if (errno === 0 && stdout.trim()) {
                const content = stdout.trim();

                // 清空当前配置
                this.gpuConfigs = [];
                let hasConfig = false;

                // 首先尝试匹配数组格式（如mtd8100.toml）
                const arrayRegex = /freq_table\s*=\s*\[([\s\S]*?)\]/;
                const arrayMatch = arrayRegex.exec(content);
                
                if (arrayMatch) {
                    // 解析数组格式
                    const arrayContent = arrayMatch[1];
                    const itemRegex = /\{\s*freq\s*=\s*(\d+),\s*volt\s*=\s*(\d+),\s*ddr_opp\s*=\s*(\d+)\s*\}/g;
                    let itemMatch;
                    
                    while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
                        const freq = parseInt(itemMatch[1]);
                        const volt = parseInt(itemMatch[2]);
                        const ddr = parseInt(itemMatch[3]);

                        if (!isNaN(freq) && !isNaN(volt) && !isNaN(ddr)) {
                            this.gpuConfigs.push({
                                freq: freq,
                                volt: volt,
                                ddr: ddr
                            });
                            hasConfig = true;
                        }
                    }
                }

                // 如果没有找到数组格式，尝试匹配传统格式（[[freq_table]]）
                if (!hasConfig) {
                    const freqTableRegex = /\[\[freq_table\]\][\s\S]*?freq\s*=\s*(\d+)[\s\S]*?volt\s*=\s*(\d+)[\s\S]*?ddr_opp\s*=\s*(\d+)/g;
                    let match;

                    while ((match = freqTableRegex.exec(content)) !== null) {
                        const freq = parseInt(match[1]);
                        const volt = parseInt(match[2]);
                        const ddr = parseInt(match[3]);

                        if (!isNaN(freq) && !isNaN(volt) && !isNaN(ddr)) {
                            this.gpuConfigs.push({
                                freq: freq,
                                volt: volt,
                                ddr: ddr
                            });
                            hasConfig = true;
                        }
                    }
                }

                if (hasConfig) {
                    if (this.gpuFreqTable) {
                        this.gpuFreqTable.innerHTML = '';
                    }

                    // 按频率排序
                    this.gpuConfigs.sort((a, b) => a.freq - b.freq);

                    // 使用refreshGpuTable来显示配置
                    this.refreshGpuTable();

                    // 初始化电压选择下拉框
                    this.initVoltSelect();
                } else {
                    if (this.gpuFreqTable) {
                        this.gpuFreqTable.innerHTML = `<tr><td colspan="4" class="loading-text">${getTranslation('config_not_found', {}, this.currentLanguage)}</td></tr>`;
                    }
                }
            } else {
                if (this.gpuFreqTable) {
                    this.gpuFreqTable.innerHTML = `<tr><td colspan="4" class="loading-text">${getTranslation('config_not_found', {}, this.currentLanguage)}</td></tr>`;
                }
            }
        } catch (error) {
            console.error('加载GPU配置失败:', error);
            if (this.gpuFreqTable) {
                this.gpuFreqTable.innerHTML = '<tr><td colspan="4" class="loading-text">加载失败</td></tr>';
            }
        }
    }

    // 加载自定义配置文件
    async loadCustomConfigFromFile() {
        try {
            const { errno, stdout } = await exec(`cat ${PATHS.CUSTOM_CONFIG_PATH}`);

            if (errno === 0 && stdout.trim()) {
                const content = stdout.trim();
                this.parseCustomConfig(content);
                this.populateCustomConfigForm();
                toast(getTranslation('toast_config_loaded', {}, this.currentLanguage));
            } else {
                toast(getTranslation('toast_config_load_fail', {}, this.currentLanguage));
            }
        } catch (error) {
            console.error('加载自定义配置失败:', error);
            toast(`加载自定义配置失败: ${error.message}`);
        }
    }

    // 解析自定义配置内容
    parseCustomConfig(content) {
        this.customConfig = {};

        // 解析全局设置
        const globalMatch = /\[global\]([\s\S]*?)(?=\n\[|$)/.exec(content);
        if (globalMatch) {
            const globalSection = globalMatch[1];
            this.customConfig.global = this.parseSection(globalSection);
        }

        // 解析各模式设置
        const modes = ['powersave', 'balance', 'performance', 'fast'];
        modes.forEach(mode => {
            const modeMatch = new RegExp(`\\[${mode}\\]([\\s\\S]*?)(?=\\n\\[|$)`).exec(content);
            if (modeMatch) {
                const modeSection = modeMatch[1];
                this.customConfig[mode] = this.parseSection(modeSection);
            }
        });
    }

    // 解析配置段落
    parseSection(section) {
        const config = {};
        const lines = section.split('\n');
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, value] = trimmedLine.split('=');
                if (key && value) {
                    const cleanKey = key.trim();
                    let cleanValue = value.trim();
                    
                    // 处理字符串值（带引号）
                    if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
                        cleanValue = cleanValue.substring(1, cleanValue.length - 1);
                    } 
                    // 处理布尔值
                    else if (cleanValue.toLowerCase() === 'true') {
                        cleanValue = true;
                    } else if (cleanValue.toLowerCase() === 'false') {
                        cleanValue = false;
                    } 
                    // 处理数字值
                    else if (!isNaN(cleanValue)) {
                        cleanValue = Number(cleanValue);
                    }
                    
                    config[cleanKey] = cleanValue;
                }
            }
        });
        
        return config;
    }

    // 填充自定义配置表单
    populateCustomConfigForm() {
        if (!this.customConfig) return;

        // 填充全局设置
        if (this.customConfig.global) {
            if (this.globalMode && this.customConfig.global.mode) {
                this.globalMode.value = this.customConfig.global.mode;
            }
            if (this.idleThreshold && this.customConfig.global.idle_threshold !== undefined) {
                this.idleThreshold.value = this.customConfig.global.idle_threshold;
            }
        }

        // 填充省电模式设置
        this.populateModeSettings('powersave', this.customConfig.powersave);

        // 填充平衡模式设置
        this.populateModeSettings('balance', this.customConfig.balance);

        // 填充性能模式设置
        this.populateModeSettings('performance', this.customConfig.performance);

        // 填充极速模式设置
        this.populateModeSettings('fast', this.customConfig.fast);
    }

    // 填充模式设置
    populateModeSettings(mode, config) {
        if (!config) return;

        // 设置各字段的值
        if (this[`${mode}UltraSimple`] && config.ultra_simple_threshold !== undefined) {
            this[`${mode}UltraSimple`].value = config.ultra_simple_threshold;
        }
        if (this[`${mode}Margin`] && config.margin !== undefined) {
            this[`${mode}Margin`].value = config.margin;
        }
        if (this[`${mode}DownCounter`] && config.down_counter_threshold !== undefined) {
            this[`${mode}DownCounter`].value = config.down_counter_threshold;
        }
        if (this[`${mode}AggressiveDown`] && config.aggressive_down !== undefined) {
            this[`${mode}AggressiveDown`].checked = config.aggressive_down;
        }
        if (this[`${mode}SamplingInterval`] && config.sampling_interval !== undefined) {
            this[`${mode}SamplingInterval`].value = config.sampling_interval;
        }
        if (this[`${mode}GamingMode`] && config.gaming_mode !== undefined) {
            this[`${mode}GamingMode`].checked = config.gaming_mode;
        }
        if (this[`${mode}AdaptiveSampling`] && config.adaptive_sampling !== undefined) {
            this[`${mode}AdaptiveSampling`].checked = config.adaptive_sampling;
        }
        if (this[`${mode}MinAdaptiveInterval`] && config.min_adaptive_interval !== undefined) {
            this[`${mode}MinAdaptiveInterval`].value = config.min_adaptive_interval;
        }
        if (this[`${mode}MaxAdaptiveInterval`] && config.max_adaptive_interval !== undefined) {
            this[`${mode}MaxAdaptiveInterval`].value = config.max_adaptive_interval;
        }
        if (this[`${mode}UpRateDelay`] && config.up_rate_delay !== undefined) {
            this[`${mode}UpRateDelay`].value = config.up_rate_delay;
        }
        if (this[`${mode}DownRateDelay`] && config.down_rate_delay !== undefined) {
            this[`${mode}DownRateDelay`].value = config.down_rate_delay;
        }
    }

    // 保存配置到文件
    async saveConfigToFile() {
        try {
            if (this.gpuConfigs.length === 0) {
                toast(getTranslation('toast_config_empty', {}, this.currentLanguage));
                return;
            }

            // 按频率排序
            this.gpuConfigs.sort((a, b) => a.freq - b.freq);

            // 生成数组格式的toml配置文件内容（如mtd8100.toml格式）
            let configContent = '# GPU 频率表\n';
            configContent += '# freq 单位: kHz\n';
            configContent += '# volt 单位: uV\n';
            configContent += '# ddr_opp: DDR OPP 档位\n';
            configContent += '# Margin: 调整GPU频率计算的余量百分比，默认值为20（非游戏模式）和30（游戏模式）\n';
            configContent += '\n';

            configContent += 'freq_table = [\n';
            this.gpuConfigs.forEach((config, index) => {
                configContent += `    { freq = ${config.freq}, volt = ${config.volt}, ddr_opp = ${config.ddr} }`;
                if (index < this.gpuConfigs.length - 1) {
                    configContent += ',';
                }
                configContent += '\n';
            });
            configContent += ']\n';

            // 保存到文件
            const { errno } = await exec(`echo '${configContent}' > ${PATHS.CONFIG_PATH}`);

            if (errno === 0) {
                toast(getTranslation('toast_config_saved', {}, this.currentLanguage));
            } else {
                toast(getTranslation('toast_config_save_fail', {}, this.currentLanguage));
            }
        } catch (error) {
            console.error('保存配置失败:', error);
            toast(`保存配置失败: ${error.message}`);
        }
    }

    // 保存自定义配置到文件
    async saveCustomConfigToFile() {
        try {
            // 从表单收集数据
            this.collectCustomConfigFromForm();

            // 生成配置文件内容
            let configContent = '# GPU调速器配置文件\n\n';
            
            // 全局设置
            configContent += '[global]\n';
            configContent += '# 全局模式设置: powersave, balance, performance, fast\n';
            configContent += `mode = "${this.customConfig.global.mode}"\n`;
            configContent += '# 空闲阈值（百分比）\n';
            configContent += `idle_threshold = ${this.customConfig.global.idle_threshold}\n\n`;
            
            // 省电模式
            configContent += '# 省电模式 - 更高的升频阈值，更激进的降频\n';
            configContent += '[powersave]\n';
            configContent += this.generateModeConfigContent(this.customConfig.powersave);
            
            // 平衡模式
            configContent += '# 平衡模式 - 默认设置\n';
            configContent += '[balance]\n';
            configContent += this.generateModeConfigContent(this.customConfig.balance);
            
            // 性能模式
            configContent += '# 性能模式 - 更低的升频阈值，更保守的降频\n';
            configContent += '[performance]\n';
            configContent += this.generateModeConfigContent(this.customConfig.performance);
            
            // 极速模式
            configContent += '# 极速模式 - 最低的升频阈值，最保守的降频\n';
            configContent += '[fast]\n';
            configContent += this.generateModeConfigContent(this.customConfig.fast);

            // 保存到文件
            const { errno } = await exec(`echo '${configContent}' > ${PATHS.CUSTOM_CONFIG_PATH}`);

            if (errno === 0) {
                toast(getTranslation('toast_config_saved', {}, this.currentLanguage));
            } else {
                toast(getTranslation('toast_config_save_fail', {}, this.currentLanguage));
            }
        } catch (error) {
            console.error('保存自定义配置失败:', error);
            toast(`保存自定义配置失败: ${error.message}`);
        }
    }

    // 从表单收集自定义配置数据
    collectCustomConfigFromForm() {
        this.customConfig = {
            global: {},
            powersave: {},
            balance: {},
            performance: {},
            fast: {}
        };

        // 收集全局设置
        if (this.globalMode) {
            this.customConfig.global.mode = this.globalMode.value;
        }
        if (this.idleThreshold) {
            this.customConfig.global.idle_threshold = parseInt(this.idleThreshold.value) || 5;
        }

        // 收集省电模式设置
        this.collectModeSettings('powersave');

        // 收集平衡模式设置
        this.collectModeSettings('balance');

        // 收集性能模式设置
        this.collectModeSettings('performance');

        // 收集极速模式设置
        this.collectModeSettings('fast');
    }

    // 收集模式设置
    collectModeSettings(mode) {
        if (this[`${mode}UltraSimple`]) {
            this.customConfig[mode].ultra_simple_threshold = parseInt(this[`${mode}UltraSimple`].value) || 0;
        }
        if (this[`${mode}Margin`]) {
            this.customConfig[mode].margin = parseInt(this[`${mode}Margin`].value) || 0;
        }
        if (this[`${mode}DownCounter`]) {
            this.customConfig[mode].down_counter_threshold = parseInt(this[`${mode}DownCounter`].value) || 0;
        }
        if (this[`${mode}AggressiveDown`]) {
            this.customConfig[mode].aggressive_down = this[`${mode}AggressiveDown`].checked;
        }
        if (this[`${mode}SamplingInterval`]) {
            this.customConfig[mode].sampling_interval = parseInt(this[`${mode}SamplingInterval`].value) || 8;
        }
        if (this[`${mode}GamingMode`]) {
            this.customConfig[mode].gaming_mode = this[`${mode}GamingMode`].checked;
        }
        if (this[`${mode}AdaptiveSampling`]) {
            this.customConfig[mode].adaptive_sampling = this[`${mode}AdaptiveSampling`].checked;
        }
        if (this[`${mode}MinAdaptiveInterval`]) {
            this.customConfig[mode].min_adaptive_interval = parseInt(this[`${mode}MinAdaptiveInterval`].value) || 1;
        }
        if (this[`${mode}MaxAdaptiveInterval`]) {
            this.customConfig[mode].max_adaptive_interval = parseInt(this[`${mode}MaxAdaptiveInterval`].value) || 10;
        }
        if (this[`${mode}UpRateDelay`]) {
            this.customConfig[mode].up_rate_delay = parseInt(this[`${mode}UpRateDelay`].value) || 0;
        }
        if (this[`${mode}DownRateDelay`]) {
            this.customConfig[mode].down_rate_delay = parseInt(this[`${mode}DownRateDelay`].value) || 0;
        }
    }

    // 生成模式配置内容
    generateModeConfigContent(config) {
        let content = '';
        content += `# 极简阈值（百分比）- 达到此阈值时升频\n`;
        content += `ultra_simple_threshold = ${config.ultra_simple_threshold}\n`;
        content += `# 余量\n`;
        content += `# 当设置为0时使用原调频策略\n`;
        content += `# 当设置为N时，降频阈值为(100-N)%\n`;
        content += `margin = ${config.margin}\n`;
        content += `# 降频计数器配置值（0=禁用降频计数器功能）\n`;
        content += `down_counter_threshold = ${config.down_counter_threshold}\n`;
        content += `# 是否使用激进降频策略\n`;
        content += `aggressive_down = ${config.aggressive_down}\n`;
        content += `# 采样间隔（毫秒）\n`;
        content += `sampling_interval = ${config.sampling_interval}\n`;
        content += `# 游戏模式 - 启用游戏特殊内存优化\n`;
        content += `gaming_mode = ${config.gaming_mode}\n`;
        content += `# 自适应采样\n`;
        content += `adaptive_sampling = ${config.adaptive_sampling}\n`;
        content += `# 自适应采样最小间隔（毫秒）\n`;
        content += `min_adaptive_interval = ${config.min_adaptive_interval}\n`;
        content += `# 自适应采样最大间隔（毫秒）\n`;
        content += `max_adaptive_interval = ${config.max_adaptive_interval}\n`;
        content += `# 升频延迟（毫秒）\n`;
        content += `up_rate_delay = ${config.up_rate_delay}\n`;
        content += `# 降频延迟（毫秒）\n`;
        content += `down_rate_delay = ${config.down_rate_delay}\n\n`;
        return content;
    }

    // 切换模式标签页
    switchModeTab(mode) {
        // 更新标签页按钮状态
        this.modeTabBtns.forEach(btn => {
            if (btn.getAttribute('data-mode') === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 显示对应的配置区域
        this.modeConfigSections.forEach(section => {
            if (section.id === `${mode}-config`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    // 刷新GPU配置表格
    refreshGpuTable() {
        if (!this.gpuFreqTable) return;

        // 清空表格
        this.gpuFreqTable.innerHTML = '';

        if (this.gpuConfigs.length === 0) {
            this.gpuFreqTable.innerHTML = `<tr><td colspan="4" class="loading-text">${getTranslation('config_not_found', {}, this.currentLanguage)}</td></tr>`;
            return;
        }

        // 按频率排序
        const sortedConfigs = [...this.gpuConfigs].sort((a, b) => a.freq - b.freq);

        // 更新原始数组
        this.gpuConfigs = sortedConfigs;

        // 创建表格行
        this.gpuConfigs.forEach((config, index) => {
            const row = document.createElement('tr');
            row.dataset.index = index;
            row.dataset.freq = config.freq;

            const freqCell = document.createElement('td');
            freqCell.textContent = (config.freq / 1000).toFixed(0);

            const voltCell = document.createElement('td');
            voltCell.textContent = config.volt;

            const ddrCell = document.createElement('td');
            ddrCell.textContent = config.ddr;

            const actionsCell = document.createElement('td');

            // 创建编辑按钮
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
            `;
            editBtn.title = '编辑/删除';
            editBtn.onclick = () => {
                this.openEditModal(index);
                return false; // 阻止事件冒泡
            };

            actionsCell.appendChild(editBtn);

            row.appendChild(freqCell);
            row.appendChild(voltCell);
            row.appendChild(ddrCell);
            row.appendChild(actionsCell);

            this.gpuFreqTable.appendChild(row);
        });
    }

    openEditModal(index = -1) {
        this.editingIndex = index;

        if (this.editConfigModal) {
            this.editConfigModal.style.display = 'block';
        }

        if (index >= 0 && index < this.gpuConfigs.length) {
            // 编辑现有配置
            const config = this.gpuConfigs[index];
            if (this.freqInput) {
                this.freqInput.value = config.freq;
            }
            this.selectVolt(config.volt);
            this.selectDdr(config.ddr);

            if (this.deleteItemBtn) {
                this.deleteItemBtn.style.display = 'inline-flex';
            }
        } else {
            // 添加新配置
            if (this.freqInput) {
                this.freqInput.value = '';
            }
            this.selectVolt(VOLT_SETTINGS.MAX_VOLT);
            this.selectDdr(999);

            if (this.deleteItemBtn) {
                this.deleteItemBtn.style.display = 'none';
            }
        }
    }

    closeEditModal() {
        if (this.editConfigModal) {
            this.editConfigModal.style.display = 'none';
        }
        this.editingIndex = -1;
    }

    saveConfigItem() {
        if (!this.freqInput) return;

        const freq = parseInt(this.freqInput.value);
        if (isNaN(freq) || freq <= 0) {
            toast(getTranslation('toast_freq_invalid', {}, this.currentLanguage));
            return;
        }

        const volt = this.currentVoltValue;
        const ddr = this.getSelectedDdr();

        if (this.editingIndex >= 0) {
            // 更新现有配置
            this.gpuConfigs[this.editingIndex] = { freq, volt, ddr };
        } else {
            // 添加新配置
            this.gpuConfigs.push({ freq, volt, ddr });
        }

        // 关闭模态框
        this.closeEditModal();

        // 刷新表格
        this.refreshGpuTable();

        toast(getTranslation('toast_config_updated', {}, this.currentLanguage));
    }

    deleteConfigItem() {
        if (this.editingIndex >= 0 && this.editingIndex < this.gpuConfigs.length) {
            // 从数组中删除
            this.gpuConfigs.splice(this.editingIndex, 1);

            // 关闭模态框
            this.closeEditModal();

            // 刷新表格
            this.refreshGpuTable();

            toast(getTranslation('toast_config_deleted', {}, this.currentLanguage));
        } else {
            toast(getTranslation('toast_index_invalid', {}, this.currentLanguage));
        }
    }

    initVoltSelect() {
        if (!this.voltSelect) return;

        // 清空现有选项
        this.voltSelect.innerHTML = '';

        // 添加电压选项
        VOLT_LIST.forEach((volt, index) => {
            const option = document.createElement('option');
            option.value = volt;
            option.textContent = volt;
            if (volt === VOLT_SETTINGS.MAX_VOLT) {
                option.selected = true;
            }
            this.voltSelect.appendChild(option);
        });

        // 如果事件尚未初始化，则初始化电压选择事件
        if (!this.voltageEventsInitialized) {
            this.setupVoltageEvents();
            this.voltageEventsInitialized = true;
        }
    }

    setupVoltageEvents() {
        if (this.voltSelect) {
            this.voltSelect.addEventListener('change', (e) => {
                this.currentVoltValue = parseInt(e.target.value);
                if (this.selectedVolt) {
                    this.selectedVolt.textContent = this.currentVoltValue;
                }
            });
        }

        // 电压减少按钮事件
        if (this.voltDecreaseBtn) {
            this.voltDecreaseBtn.addEventListener('mousedown', () => {
                this.startDecreaseVolt();
            });

            this.voltDecreaseBtn.addEventListener('mouseup', () => {
                this.stopAdjustVolt();
            });

            this.voltDecreaseBtn.addEventListener('mouseleave', () => {
                this.stopAdjustVolt();
            });

            // 触屏设备支持
            this.voltDecreaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startDecreaseVolt();
            });

            this.voltDecreaseBtn.addEventListener('touchend', () => {
                this.stopAdjustVolt();
            });
        }

        // 电压增加按钮事件
        if (this.voltIncreaseBtn) {
            this.voltIncreaseBtn.addEventListener('mousedown', () => {
                this.startIncreaseVolt();
            });

            this.voltIncreaseBtn.addEventListener('mouseup', () => {
                this.stopAdjustVolt();
            });

            this.voltIncreaseBtn.addEventListener('mouseleave', () => {
                this.stopAdjustVolt();
            });

            // 触屏设备支持
            this.voltIncreaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startIncreaseVolt();
            });

            this.voltIncreaseBtn.addEventListener('touchend', () => {
                this.stopAdjustVolt();
            });
        }
    }

    startDecreaseVolt() {
        this.isLongPress = false;
        this.decreaseTimer = setTimeout(() => {
            this.isLongPress = true;
            this.continueDecreaseVolt();
        }, 500); // 长按500ms后开始连续调整

        // 单次减小
        this.adjustVolt(-VOLT_SETTINGS.VOLT_STEP);
    }

    startIncreaseVolt() {
        this.isLongPress = false;
        this.increaseTimer = setTimeout(() => {
            this.isLongPress = true;
            this.continueIncreaseVolt();
        }, 500); // 长按500ms后开始连续调整

        // 单次增加
        this.adjustVolt(VOLT_SETTINGS.VOLT_STEP);
    }

    continueDecreaseVolt() {
        if (this.isLongPress) {
            this.adjustVolt(-VOLT_SETTINGS.VOLT_STEP);
            setTimeout(() => {
                this.continueDecreaseVolt();
            }, 150); // 连续调整间隔150ms
        }
    }

    continueIncreaseVolt() {
        if (this.isLongPress) {
            this.adjustVolt(VOLT_SETTINGS.VOLT_STEP);
            setTimeout(() => {
                this.continueIncreaseVolt();
            }, 150); // 连续调整间隔150ms
        }
    }

    stopAdjustVolt() {
        this.isLongPress = false;
        clearTimeout(this.decreaseTimer);
        clearTimeout(this.increaseTimer);
    }

    adjustVolt(step) {
        const newVolt = this.currentVoltValue + step;
        if (newVolt >= VOLT_SETTINGS.MIN_VOLT && newVolt <= VOLT_SETTINGS.MAX_VOLT) {
            this.currentVoltValue = newVolt;
            this.selectVolt(newVolt);
        }
    }

    selectVolt(volt) {
        this.currentVoltValue = volt;
        if (this.voltSelect) {
            this.voltSelect.value = volt;
        }
        if (this.selectedVolt) {
            this.selectedVolt.textContent = volt;
        }
    }

    selectDdr(ddr) {
        if (!this.selectedDdr) return;

        // 获取所有DDR选项
        const ddrOptions = document.querySelectorAll('#ddrOptions .option');

        // 移除所有选项的选中状态
        ddrOptions.forEach(option => {
            option.classList.remove('selected');
        });

        // 根据ddr值选择对应选项
        const targetOption = Array.from(ddrOptions).find(option => {
            const optionValue = option.dataset.value;
            return optionValue == ddr;
        });

        if (targetOption) {
            targetOption.classList.add('selected');
            this.selectedDdr.textContent = targetOption.textContent;
        }
    }

    getSelectedDdr() {
        const selectedOption = document.querySelector('#ddrOptions .option.selected');
        return selectedOption ? parseInt(selectedOption.dataset.value) : 999;
    }

    setLanguage(language) {
        this.currentLanguage = language;
    }
}