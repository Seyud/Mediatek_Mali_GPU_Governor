// GPU配置管理模块
import { exec, toast } from './utils.js';
import { PATHS, VOLT_LIST, VOLT_SETTINGS } from './constants.js';
import { getTranslation } from './i18n.js';

export class ConfigManager {
    constructor() {
        this.gpuConfigs = [];
        this.editingIndex = -1;
        this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT;
        this.isLongPress = false;
        this.decreaseTimer = null;
        this.increaseTimer = null;
        this.voltageEventsInitialized = false;
        this.currentLanguage = 'zh';
        this.customConfig = {}; // 存储自定义配置
        
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
        
        // 自定义配置相关DOM元素
        this.loadCustomConfigBtn = document.getElementById('loadCustomConfigBtn');
        this.saveCustomConfigBtn = document.getElementById('saveCustomConfigBtn');
        this.globalModeSelect = document.getElementById('globalMode');
        this.globalModeContainer = document.getElementById('globalModeContainer');
        this.selectedGlobalMode = document.getElementById('selectedGlobalMode');
        this.globalModeOptions = document.getElementById('globalModeOptions');
        this.idleThresholdInput = document.getElementById('idleThreshold');
        
        // 省电模式配置元素
        this.powersaveInputs = {
            margin: document.getElementById('powersaveMargin'),
            sampling_interval: document.getElementById('powersaveSamplingInterval'),
            min_adaptive_interval: document.getElementById('powersaveMinAdaptiveInterval'),
            max_adaptive_interval: document.getElementById('powersaveMaxAdaptiveInterval'),
            up_rate_delay: document.getElementById('powersaveUpRateDelay'),
            down_rate_delay: document.getElementById('powersaveDownRateDelay'),
            aggressive_down: document.getElementById('powersaveAggressiveDown'),
            gaming_mode: document.getElementById('powersaveGamingMode'),
            adaptive_sampling: document.getElementById('powersaveAdaptiveSampling')
        };
        
        // 平衡模式配置元素
        this.balanceInputs = {
            margin: document.getElementById('balanceMargin'),
            sampling_interval: document.getElementById('balanceSamplingInterval'),
            min_adaptive_interval: document.getElementById('balanceMinAdaptiveInterval'),
            max_adaptive_interval: document.getElementById('balanceMaxAdaptiveInterval'),
            up_rate_delay: document.getElementById('balanceUpRateDelay'),
            down_rate_delay: document.getElementById('balanceDownRateDelay'),
            aggressive_down: document.getElementById('balanceAggressiveDown'),
            gaming_mode: document.getElementById('balanceGamingMode'),
            adaptive_sampling: document.getElementById('balanceAdaptiveSampling')
        };
        
        // 性能模式配置元素
        this.performanceInputs = {
            margin: document.getElementById('performanceMargin'),
            sampling_interval: document.getElementById('performanceSamplingInterval'),
            min_adaptive_interval: document.getElementById('performanceMinAdaptiveInterval'),
            max_adaptive_interval: document.getElementById('performanceMaxAdaptiveInterval'),
            up_rate_delay: document.getElementById('performanceUpRateDelay'),
            down_rate_delay: document.getElementById('performanceDownRateDelay'),
            aggressive_down: document.getElementById('performanceAggressiveDown'),
            gaming_mode: document.getElementById('performanceGamingMode'),
            adaptive_sampling: document.getElementById('performanceAdaptiveSampling')
        };
        
        // 极速模式配置元素
        this.fastInputs = {
            margin: document.getElementById('fastMargin'),
            sampling_interval: document.getElementById('fastSamplingInterval'),
            min_adaptive_interval: document.getElementById('fastMinAdaptiveInterval'),
            max_adaptive_interval: document.getElementById('fastMaxAdaptiveInterval'),
            up_rate_delay: document.getElementById('fastUpRateDelay'),
            down_rate_delay: document.getElementById('fastDownRateDelay'),
            aggressive_down: document.getElementById('fastAggressiveDown'),
            gaming_mode: document.getElementById('fastGamingMode'),
            adaptive_sampling: document.getElementById('fastAdaptiveSampling')
        };
    }

    init() {
        this.setupEventListeners();
        this.initVoltSelect();
        this.initGlobalModeSelect();
        this.loadGpuConfig();
        this.loadCustomConfigFromFile();
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

        // 自定义配置按钮事件
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

        // 初始化模式切换事件
        this.initModeSwitchEvents();

        // 自定义内存档位选择事件
        if (this.ddrContainer) {
            this.ddrContainer.addEventListener('click', () => {
                this.ddrContainer.classList.toggle('open');
                
                // 添加延迟以同步动画和选项显示
                if (this.ddrContainer.classList.contains('open')) {
                    // 展开时，先触发动画，再显示选项
                    setTimeout(() => {
                        const options = this.ddrContainer.querySelectorAll('.option');
                        options.forEach((option, index) => {
                            setTimeout(() => {
                                option.style.opacity = '1';
                                option.style.transform = 'translateY(0)';
                            }, index * 50);
                        });
                    }, 10);
                } else {
                    // 关闭时，先隐藏选项，再触发动画
                    const options = this.ddrContainer.querySelectorAll('.option');
                    options.forEach(option => {
                        option.style.opacity = '0';
                        option.style.transform = 'translateY(-10px)';
                    });
                    
                    // 延迟移除open类，使选项先消失
                    setTimeout(() => {
                        this.ddrContainer.classList.remove('open');
                    }, 150);
                }
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

                    // 关闭下拉菜单 - 先隐藏选项再关闭
                    const options = this.ddrContainer.querySelectorAll('.option');
                    options.forEach(option => {
                        option.style.opacity = '0';
                        option.style.transform = 'translateY(-10px)';
                    });
                    
                    // 延迟移除open类，使选项先消失
                    setTimeout(() => {
                        this.ddrContainer.classList.remove('open');
                    }, 150);

                    // 重置选项样式
                    setTimeout(() => {
                        const options = this.ddrContainer.querySelectorAll('.option');
                        options.forEach(option => {
                            option.style.opacity = '';
                            option.style.transform = '';
                        });
                    }, 300);
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
                toast(getTranslation('自定义配置加载完成', {}, this.currentLanguage));
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

    // 解析配置节
    parseSection(sectionContent) {
        const config = {};
        const lines = sectionContent.split('\n');
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, value] = trimmedLine.split('=');
                if (key && value) {
                    const cleanKey = key.trim();
                    const cleanValue = value.trim().replace(/["']/g, '');
                    
                    // 尝试转换为适当的数据类型
                    if (cleanValue === 'true') {
                        config[cleanKey] = true;
                    } else if (cleanValue === 'false') {
                        config[cleanKey] = false;
                    } else if (!isNaN(cleanValue)) {
                        config[cleanKey] = Number(cleanValue);
                    } else {
                        config[cleanKey] = cleanValue;
                    }
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
            if (this.globalModeSelect && this.customConfig.global.mode) {
                this.globalModeSelect.value = this.customConfig.global.mode;
            }
            // 更新全局模式显示文本
            if (this.selectedGlobalMode && this.customConfig.global.mode) {
                let modeText = '';
                let modeI18n = '';
                switch (this.customConfig.global.mode) {
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
                this.selectedGlobalMode.querySelector('span').textContent = modeText;
                this.selectedGlobalMode.querySelector('span').setAttribute('data-i18n', modeI18n);
            }
            if (this.idleThresholdInput && this.customConfig.global.idle_threshold !== undefined) {
                this.idleThresholdInput.value = this.customConfig.global.idle_threshold;
            }
        }

        // 填充省电模式设置
        this.populateModeConfig(this.powersaveInputs, this.customConfig.powersave);
        
        // 填充平衡模式设置
        this.populateModeConfig(this.balanceInputs, this.customConfig.balance);
        
        // 填充性能模式设置
        this.populateModeConfig(this.performanceInputs, this.customConfig.performance);
        
        // 填充极速模式设置
        this.populateModeConfig(this.fastInputs, this.customConfig.fast);
        
        // 同步模式选项卡与全局模式
        if (this.customConfig.global && this.customConfig.global.mode) {
            this.syncModeTabsWithGlobalMode(this.customConfig.global.mode);
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

    // 生成自定义配置内容
    generateCustomConfigContent() {
        let content = '# GPU调速器配置文件\n\n';
        
        // 生成全局配置
        content += '[global]\n';
        content += '# 全局模式设置: powersave, balance, performance, fast\n';
        
        // 确保获取到正确的全局模式值
        let globalModeValue = 'balance'; // 默认值
        if (this.globalModeSelect && this.globalModeSelect.value) {
            globalModeValue = this.globalModeSelect.value;
        } else if (this.selectedGlobalMode) {
            // 从显示的选中项中获取模式值
            const selectedSpan = this.selectedGlobalMode.querySelector('span');
            if (selectedSpan) {
                const selectedText = selectedSpan.textContent.trim();
                // 根据显示文本确定模式值
                if (selectedText.includes('省电') || selectedText.includes('Power Save')) {
                    globalModeValue = 'powersave';
                } else if (selectedText.includes('性能') || selectedText.includes('Performance')) {
                    globalModeValue = 'performance';
                } else if (selectedText.includes('极速') || selectedText.includes('Fast')) {
                    globalModeValue = 'fast';
                } else {
                    globalModeValue = 'balance';
                }
            }
        }
        content += `mode = "${globalModeValue}"\n`;
        
        content += '# 空闲阈值（百分比）\n';
        content += `idle_threshold = ${this.idleThresholdInput?.value || 5}\n\n`;
        
        // 生成省电模式配置
        content += '# 省电模式 - 更高的升频阈值，更激进的降频\n';
        content += '[powersave]\n';
        content += this.generateModeConfigContent(this.powersaveInputs);
        
        // 生成平衡模式配置
        content += '# 平衡模式 - 默认设置\n';
        content += '[balance]\n';
        content += this.generateModeConfigContent(this.balanceInputs);
        
        // 生成性能模式配置
        content += '# 性能模式 - 更低的升频阈值，更保守的降频\n';
        content += '[performance]\n';
        content += this.generateModeConfigContent(this.performanceInputs);
        
        // 生成极速模式配置
        content += '# 极速模式 - 最低的升频阈值，最保守的降频\n';
        content += '[fast]\n';
        content += this.generateModeConfigContent(this.fastInputs);
        
        return content;
    }

    // 生成模式配置内容
    generateModeConfigContent(config) {
        let content = '';
        content += `# 余量\n`;
        content += `margin = ${config.margin?.value || 10}\n`;
        content += `# 是否使用激进降频策略\n`;
        content += `aggressive_down = ${config.aggressive_down?.checked ? 'true' : 'false'}\n`;
        content += `# 采样间隔（毫秒）\n`;
        content += `sampling_interval = ${config.sampling_interval?.value || 16}\n`;
        content += `# 游戏优化 - 启用游戏特殊内存优化\n`;
        content += `gaming_mode = ${config.gaming_mode?.checked ? 'true' : 'false'}\n`;
        content += `# 自适应采样\n`;
        content += `adaptive_sampling = ${config.adaptive_sampling?.checked ? 'true' : 'false'}\n`;
        content += `# 自适应采样最小间隔（毫秒）\n`;
        content += `min_adaptive_interval = ${config.min_adaptive_interval?.value || 4}\n`;
        content += `# 自适应采样最大间隔（毫秒）\n`;
        content += `max_adaptive_interval = ${config.max_adaptive_interval?.value || 20}\n`;
        content += `# 升频延迟（毫秒）\n`;
        content += `up_rate_delay = ${config.up_rate_delay?.value || 1000}\n`;
        content += `# 降频延迟（毫秒）\n`;
        content += `down_rate_delay = ${config.down_rate_delay?.value || 5000}\n\n`;
        return content;
    }

    // 保存自定义配置到文件
    async saveCustomConfigToFile() {
        try {
            const configContent = this.generateCustomConfigContent();
            
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

    // 减小电压函数（减小电压值）
    decreaseVolt() {
        // 直接减625单位
        let newVolt = this.currentVoltValue - VOLT_SETTINGS.VOLT_STEP;

        // 确保不低于最小值
        if (newVolt >= VOLT_SETTINGS.MIN_VOLT) {
            this.currentVoltValue = newVolt;
            this.updateVoltDisplay();
            return true; // 返回true表示操作成功
        }
        return false; // 返回false表示已达到极限
    }

    // 增加电压函数（增加电压值）
    increaseVolt() {
        // 直接加625单位
        let newVolt = this.currentVoltValue + VOLT_SETTINGS.VOLT_STEP;

        // 确保不超过最大值
        if (newVolt <= VOLT_SETTINGS.MAX_VOLT) {
            this.currentVoltValue = newVolt;
            this.updateVoltDisplay();
            return true; // 返回true表示操作成功
        }
        return false; // 返回false表示已达到极限
    }

    // 更新电压显示
    updateVoltDisplay() {
        // 使用当前电压值
        if (this.selectedVolt) {
            this.selectedVolt.textContent = this.currentVoltValue;
        }

        // 尝试在select中找到匹配的选项
        if (this.voltSelect) {
            const voltOption = Array.from(this.voltSelect.options).find(option => parseInt(option.value) === this.currentVoltValue);

            if (voltOption) {
                // 如果找到匹配的选项，直接设置
                this.voltSelect.value = voltOption.value;
            } else {
                // 如果没有找到匹配的选项，添加一个新选项
                const option = document.createElement('option');
                option.value = this.currentVoltValue;
                option.textContent = this.currentVoltValue;
                this.voltSelect.appendChild(option);
                this.voltSelect.value = this.currentVoltValue;
            }

            // 禁用或启用按钮
            if (this.voltDecreaseBtn) {
                this.voltDecreaseBtn.disabled = this.currentVoltValue <= VOLT_SETTINGS.MIN_VOLT;
            }
            if (this.voltIncreaseBtn) {
                this.voltIncreaseBtn.disabled = this.currentVoltValue >= VOLT_SETTINGS.MAX_VOLT;
            }
        }
    }

    // 初始化电压选择器
    initVoltSelect() {
        // 检查元素是否存在
        if (!this.voltSelect || !this.selectedVolt || !this.voltDecreaseBtn || !this.voltIncreaseBtn) {
            console.error('电压选择器元素不存在');
            return;
        }

        // 清空现有选项
        this.voltSelect.innerHTML = '';

        // 添加电压选项到隐藏的select元素
        VOLT_LIST.forEach(volt => {
            const selectOption = document.createElement('option');
            selectOption.value = volt;
            selectOption.textContent = volt;
            this.voltSelect.appendChild(selectOption);
        });

        // 设置默认值
        this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT;
        this.selectedVolt.textContent = this.currentVoltValue;
        this.voltSelect.value = this.currentVoltValue;

        // 初始化按钮状态
        this.updateVoltDisplay();

        // 设置事件监听器（只在第一次初始化时添加）
        this.setupVoltageEvents();
    }
    
    // 初始化全局模式选择器
    initGlobalModeSelect() {
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

    // 设置电压选择器的事件监听器（只调用一次）
    setupVoltageEvents() {
        if (this.voltageEventsInitialized) {
            return; // 如果已经初始化过，则不再重复添加事件监听器
        }

        if (this.voltDecreaseBtn) {
            // 减小电压按钮事件 - 只处理单击
            this.voltDecreaseBtn.addEventListener('click', () => {
                // 如果是长按结束，不执行单击操作
                if (this.isLongPress) {
                    this.isLongPress = false;
                    return;
                }
                this.decreaseVolt();
            });

            // 减小电压按钮长按事件
            this.voltDecreaseBtn.addEventListener('mousedown', () => {
                // 重置长按标记
                this.isLongPress = false;

                // 设置定时器，延迟后才开始连续操作
                this.decreaseTimer = setTimeout(() => {
                    // 标记为长按
                    this.isLongPress = true;

                    // 执行第一次操作
                    const canContinue = this.decreaseVolt();

                    // 如果可以继续减小，设置定时器
                    if (canContinue && this.decreaseTimer) {
                        this.decreaseTimer = setInterval(() => {
                            // 如果不能继续减小，清除定时器
                            if (!this.decreaseVolt()) {
                                clearInterval(this.decreaseTimer);
                                this.decreaseTimer = null;
                            }
                        }, 150);
                    }
                }, 500);
            });
        }

        if (this.voltIncreaseBtn) {
            // 增加电压按钮事件 - 只处理单击
            this.voltIncreaseBtn.addEventListener('click', () => {
                // 如果是长按结束，不执行单击操作
                if (this.isLongPress) {
                    this.isLongPress = false;
                    return;
                }
                this.increaseVolt();
            });

            // 增加电压按钮长按事件
            this.voltIncreaseBtn.addEventListener('mousedown', () => {
                // 重置长按标记
                this.isLongPress = false;

                // 设置定时器，延迟后才开始连续操作
                this.increaseTimer = setTimeout(() => {
                    // 标记为长按
                    this.isLongPress = true;

                    // 执行第一次操作
                    const canContinue = this.increaseVolt();

                    // 如果可以继续增加，设置定时器
                    if (canContinue && this.increaseTimer) {
                        this.increaseTimer = setInterval(() => {
                            // 如果不能继续增加，清除定时器
                            if (!this.increaseVolt()) {
                                clearInterval(this.increaseTimer);
                                this.increaseTimer = null;
                            }
                        }, 150);
                    }
                }, 500);
            });
        }

        // 鼠标松开和离开时清除定时器
        document.addEventListener('mouseup', () => {
            if (this.decreaseTimer) {
                clearTimeout(this.decreaseTimer);
                clearInterval(this.decreaseTimer);
                this.decreaseTimer = null;
            }
            if (this.increaseTimer) {
                clearTimeout(this.increaseTimer);
                clearInterval(this.increaseTimer);
                this.increaseTimer = null;
            }
        });

        document.addEventListener('mouseleave', () => {
            if (this.decreaseTimer) {
                clearTimeout(this.decreaseTimer);
                clearInterval(this.decreaseTimer);
                this.decreaseTimer = null;
            }
            if (this.increaseTimer) {
                clearTimeout(this.increaseTimer);
                clearInterval(this.increaseTimer);
                this.increaseTimer = null;
            }
        });

        // 触摸事件支持
        if (this.voltDecreaseBtn) {
            this.voltDecreaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // 防止触发click事件

                // 重置长按标记
                this.isLongPress = false;

                // 执行一次点击操作
                this.decreaseVolt();

                // 设置定时器，延迟后才开始连续操作
                this.decreaseTimer = setTimeout(() => {
                    // 标记为长按
                    this.isLongPress = true;

                    this.decreaseTimer = setInterval(() => {
                        // 如果不能继续减小，清除定时器
                        if (!this.decreaseVolt()) {
                            clearInterval(this.decreaseTimer);
                            this.decreaseTimer = null;
                        }
                    }, 150);
                }, 500);
            }, { passive: false });
        }

        if (this.voltIncreaseBtn) {
            this.voltIncreaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // 防止触发click事件

                // 重置长按标记
                this.isLongPress = false;

                // 执行一次点击操作
                this.increaseVolt();

                // 设置定时器，延迟后才开始连续操作
                this.increaseTimer = setTimeout(() => {
                    // 标记为长按
                    this.isLongPress = true;

                    this.increaseTimer = setInterval(() => {
                        // 如果不能继续增加，清除定时器
                        if (!this.increaseVolt()) {
                            clearInterval(this.increaseTimer);
                            this.increaseTimer = null;
                        }
                    }, 150);
                }, 500);
            }, { passive: false });
        }

        document.addEventListener('touchend', () => {
            if (this.decreaseTimer) {
                clearTimeout(this.decreaseTimer);
                clearInterval(this.decreaseTimer);
                this.decreaseTimer = null;
            }
            if (this.increaseTimer) {
                clearTimeout(this.increaseTimer);
                clearInterval(this.increaseTimer);
                this.increaseTimer = null;
            }
        });

        // 标记事件已初始化
        this.voltageEventsInitialized = true;
    }

    // 打开编辑模态框
    openEditModal(index = -1) {
        // 检查模态框元素是否存在
        if (!this.editConfigModal) {
            console.error('模态框元素不存在');
            return;
        }

        // 确保电压选择器已初始化
        if (!this.voltageEventsInitialized) {
            this.setupVoltageEvents();
        }

        this.editingIndex = index;

        if (index >= 0 && index < this.gpuConfigs.length) {
            // 编辑现有配置
            const config = this.gpuConfigs[index];

            // 设置频率输入框 - 第一个表单组
            if (this.freqInput) {
                this.freqInput.value = config.freq;
            }

            // 设置电压选择 - 第二个表单组
            const voltValue = config.volt;
            this.currentVoltValue = voltValue;
            
            if (this.selectedVolt) {
                this.selectedVolt.textContent = voltValue;
            }

            // 尝试在select中找到匹配的选项
            if (this.voltSelect) {
                const voltOption = Array.from(this.voltSelect.options).find(option => parseInt(option.value) === voltValue);
                if (voltOption) {
                    // 如果找到匹配的选项，直接设置
                    this.voltSelect.value = voltOption.value;
                } else {
                    // 如果没有找到匹配的电压选项，添加一个新选项
                    const option = document.createElement('option');
                    option.value = voltValue;
                    option.textContent = voltValue;
                    this.voltSelect.appendChild(option);
                    this.voltSelect.value = voltValue;
                }
            }

            // 更新按钮状态
            if (this.voltDecreaseBtn) {
                this.voltDecreaseBtn.disabled = voltValue <= VOLT_SETTINGS.MIN_VOLT;
            }
            if (this.voltIncreaseBtn) {
                this.voltIncreaseBtn.disabled = voltValue >= VOLT_SETTINGS.MAX_VOLT;
            }

            // 设置内存档位选择 - 第三个表单组
            // 更新自定义下拉菜单的显示文本和选中状态
            const ddrOptionElements = document.querySelectorAll('#ddrOptions .option');
            ddrOptionElements.forEach(option => {
                if (parseInt(option.getAttribute('data-value')) === config.ddr) {
                    if (this.selectedDdr) {
                        this.selectedDdr.textContent = option.textContent;
                    }
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });

            // 显示删除按钮
            if (this.deleteItemBtn) {
                this.deleteItemBtn.style.display = 'block';
            }
        } else {
            // 添加新配置
            // 设置频率输入框 - 第一个表单组
            if (this.freqInput) {
                this.freqInput.value = '';
            }

            // 重置电压选择器 - 第二个表单组
            this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT; // 设置为最大值
            if (this.selectedVolt) {
                this.selectedVolt.textContent = this.currentVoltValue;
            }
            if (this.voltSelect) {
                this.voltSelect.value = this.currentVoltValue;
            }

            // 更新按钮状态
            if (this.voltDecreaseBtn) {
                this.voltDecreaseBtn.disabled = this.currentVoltValue <= VOLT_SETTINGS.MIN_VOLT;
            }
            if (this.voltIncreaseBtn) {
                this.voltIncreaseBtn.disabled = this.currentVoltValue >= VOLT_SETTINGS.MAX_VOLT;
            }

            // 重置内存档位选择器 - 第三个表单组
            if (this.selectedDdr) {
                this.selectedDdr.textContent = '999 (不调整)';
            }

            // 更新内存档位选中状态
            document.querySelectorAll('#ddrOptions .option').forEach(opt => {
                opt.classList.toggle('selected', opt.getAttribute('data-value') === '999');
            });

            // 隐藏删除按钮
            if (this.deleteItemBtn) {
                this.deleteItemBtn.style.display = 'none';
            }
        }

        // 显示模态框
        if (this.editConfigModal) {
            this.editConfigModal.style.display = 'block';
        }
    }

    // 关闭编辑模态框
    closeEditModal() {
        if (this.editConfigModal) {
            this.editConfigModal.style.display = 'none';
        }
    }

    // 保存配置项
    saveConfigItem() {
        if (!this.freqInput) return;
        
        const freq = parseInt(this.freqInput.value);
        const volt = parseInt(this.voltSelect.value);
        const ddrText = this.selectedDdr ? this.selectedDdr.textContent : '';
        const ddr = parseInt(ddrText.split(' ')[0]);

        if (!freq || isNaN(freq)) {
            toast(getTranslation('toast_freq_invalid', {}, this.currentLanguage));
            return;
        }

        if (this.editingIndex >= 0 && this.editingIndex < this.gpuConfigs.length) {
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

    // 删除配置项
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

    setLanguage(language) {
        this.currentLanguage = language;
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
                document.getElementById(`${mode}-config`).classList.add('active');
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
}