// GPU配置管理核心模块
import { getTranslation } from './i18n.js';

export class GpuConfigManager {
    constructor() {
        this.gpuConfigs = [];
        this.currentLanguage = 'zh';
        
        // DOM元素
        this.gpuFreqTable = document.getElementById('gpuFreqTable')?.querySelector('tbody');
        this.addConfigBtn = document.getElementById('addConfigBtn');
        this.saveConfigBtn = document.getElementById('saveConfigBtn');
        
        // 回调函数
        this.onEditCallback = null;
    }

    // 初始化GPU配置管理器
    init() {
        this.setupEventListeners();
    }

    // 设置事件监听器
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
    }

    // 加载GPU配置
    loadConfigs(configs) {
        this.gpuConfigs = configs || [];
        
        if (this.gpuConfigs.length > 0) {
            // 按频率排序
            this.gpuConfigs.sort((a, b) => a.freq - b.freq);
            this.refreshTable();
        } else {
            this.showEmptyState();
        }
    }

    // 刷新GPU配置表格
    refreshTable() {
        if (!this.gpuFreqTable) return;

        // 清空表格
        this.gpuFreqTable.innerHTML = '';

        if (this.gpuConfigs.length === 0) {
            this.showEmptyState();
            return;
        }

        // 按频率排序
        const sortedConfigs = [...this.gpuConfigs].sort((a, b) => a.freq - b.freq);
        this.gpuConfigs = sortedConfigs;

        // 创建表格行
        this.gpuConfigs.forEach((config, index) => {
            const row = this.createTableRow(config, index);
            this.gpuFreqTable.appendChild(row);
        });
    }

    // 创建表格行
    createTableRow(config, index) {
        const row = document.createElement('tr');
        row.dataset.index = index;
        row.dataset.freq = config.freq;

        // 频率列 (转换为MHz显示)
        const freqCell = document.createElement('td');
        freqCell.textContent = (config.freq / 1000).toFixed(0);

        // 电压列
        const voltCell = document.createElement('td');
        voltCell.textContent = config.volt;

        // DDR档位列
        const ddrCell = document.createElement('td');
        ddrCell.textContent = config.ddr;

        // 操作列
        const actionsCell = document.createElement('td');
        const editBtn = this.createEditButton(index);
        actionsCell.appendChild(editBtn);

        row.appendChild(freqCell);
        row.appendChild(voltCell);
        row.appendChild(ddrCell);
        row.appendChild(actionsCell);

        return row;
    }

    // 创建编辑按钮
    createEditButton(index) {
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
        return editBtn;
    }

    // 显示空状态
    showEmptyState() {
        if (this.gpuFreqTable) {
            this.gpuFreqTable.innerHTML = `<tr><td colspan="4" class="loading-text">${getTranslation('config_not_found', {}, this.currentLanguage)}</td></tr>`;
        }
    }

    // 打开编辑模态框
    openEditModal(index = -1) {
        if (this.onEditCallback) {
            const config = index >= 0 ? this.gpuConfigs[index] : null;
            this.onEditCallback(config, index);
        }
    }

    // 添加配置项
    addConfig(config) {
        this.gpuConfigs.push(config);
        this.refreshTable();
    }

    // 更新配置项
    updateConfig(config, index) {
        if (index >= 0 && index < this.gpuConfigs.length) {
            this.gpuConfigs[index] = config;
        } else {
            this.gpuConfigs.push(config);
        }
        this.refreshTable();
    }

    // 删除配置项
    deleteConfig(index) {
        if (index >= 0 && index < this.gpuConfigs.length) {
            this.gpuConfigs.splice(index, 1);
            this.refreshTable();
            return true;
        }
        return false;
    }

    // 获取配置列表
    getConfigs() {
        return [...this.gpuConfigs];
    }

    // 设置编辑回调
    setEditCallback(callback) {
        this.onEditCallback = callback;
    }

    // 设置保存文件回调
    setSaveFileCallback(callback) {
        this.saveConfigToFile = callback;
    }

    // 检查频率是否重复
    isFrequencyDuplicate(freq, excludeIndex = -1) {
        return this.gpuConfigs.some((config, index) => {
            return config.freq === freq && index !== excludeIndex;
        });
    }

    // 获取频率范围
    getFrequencyRange() {
        if (this.gpuConfigs.length === 0) {
            return { min: 0, max: 0 };
        }
        
        const frequencies = this.gpuConfigs.map(config => config.freq);
        return {
            min: Math.min(...frequencies),
            max: Math.max(...frequencies)
        };
    }

    // 按频率排序配置
    sortByFrequency() {
        this.gpuConfigs.sort((a, b) => a.freq - b.freq);
        this.refreshTable();
    }

    // 验证配置有效性
    validateConfig(config) {
        const errors = [];

        if (!config.freq || isNaN(config.freq) || config.freq <= 0) {
            errors.push('无效的频率值');
        }

        if (!config.volt || isNaN(config.volt) || config.volt <= 0) {
            errors.push('无效的电压值');
        }

        if (config.ddr === undefined || isNaN(config.ddr)) {
            errors.push('无效的DDR档位值');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // 获取配置统计信息
    getStatistics() {
        if (this.gpuConfigs.length === 0) {
            return {
                count: 0,
                avgFreq: 0,
                avgVolt: 0,
                freqRange: { min: 0, max: 0 },
                voltRange: { min: 0, max: 0 }
            };
        }

        const frequencies = this.gpuConfigs.map(config => config.freq);
        const voltages = this.gpuConfigs.map(config => config.volt);

        return {
            count: this.gpuConfigs.length,
            avgFreq: frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length,
            avgVolt: voltages.reduce((sum, volt) => sum + volt, 0) / voltages.length,
            freqRange: {
                min: Math.min(...frequencies),
                max: Math.max(...frequencies)
            },
            voltRange: {
                min: Math.min(...voltages),
                max: Math.max(...voltages)
            }
        };
    }

    // 设置语言
    setLanguage(language) {
        this.currentLanguage = language;
        this.refreshTable();
    }

    // 清空所有配置
    clearConfigs() {
        this.gpuConfigs = [];
        this.refreshTable();
    }
}