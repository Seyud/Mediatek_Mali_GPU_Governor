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

    setLanguage(language) {
        this.currentLanguage = language;
    }
}