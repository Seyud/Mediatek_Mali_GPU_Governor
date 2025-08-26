// GPU配置管理模块 - 重构为模块化架构
import { toast } from './utils.js';
import { getTranslation } from './i18n.js';
import { VoltageController } from './voltageController.js';
import { ConfigFileManager } from './configFileManager.js';
import { ModalManager } from './modalManager.js';
import { ModeConfigManager } from './modeConfigManager.js';
import { GpuConfigManager } from './gpuConfigManager.js';

export class ConfigManager {
    constructor() {
        this.currentLanguage = 'zh';
        
        // 初始化各个模块
        this.voltageController = new VoltageController();
        this.configFileManager = new ConfigFileManager();
        this.modalManager = new ModalManager(this.voltageController);
        this.modeConfigManager = new ModeConfigManager();
        this.gpuConfigManager = new GpuConfigManager();
        
        // 自定义配置相关DOM元素
        this.loadCustomConfigBtn = document.getElementById('loadCustomConfigBtn');
        this.saveCustomConfigBtn = document.getElementById('saveCustomConfigBtn');
    }

    init() {
        this.setupEventListeners();
        this.setupModuleCallbacks();
        this.initializeModules();
        this.loadInitialData();
    }

    // 初始化所有模块
    initializeModules() {
        this.voltageController.init();
        this.modalManager.init();
        this.modeConfigManager.init();
        this.gpuConfigManager.init();
    }

    // 设置模块间的回调函数
    setupModuleCallbacks() {
        // 设置GPU配置管理器的回调
        this.gpuConfigManager.setEditCallback((config, index) => {
            this.modalManager.openModal(config, index);
        });
        
        this.gpuConfigManager.setSaveFileCallback(() => {
            this.saveGpuConfigToFile();
        });
        
        // 设置模态框管理器的回调
        this.modalManager.setSaveCallback((config, index) => {
            this.gpuConfigManager.updateConfig(config, index);
        });
        
        this.modalManager.setDeleteCallback((index) => {
            this.gpuConfigManager.deleteConfig(index);
        });
    }

    // 加载初始数据
    async loadInitialData() {
        await this.loadGpuConfig();
        await this.loadCustomConfigFromFile();
    }

    setupEventListeners() {
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
    }

    async loadGpuConfig() {
        try {
            const result = await this.configFileManager.loadGpuConfig();
            
            if (result.success) {
                this.gpuConfigManager.loadConfigs(result.data);
            } else {
                console.error('加载GPU配置失败:', result.error);
                this.gpuConfigManager.loadConfigs([]);
            }
        } catch (error) {
            console.error('加载GPU配置失败:', error);
            this.gpuConfigManager.loadConfigs([]);
        }
    }

    // 保存GPU配置到文件
    async saveGpuConfigToFile() {
        try {
            const configs = this.gpuConfigManager.getConfigs();
            await this.configFileManager.saveGpuConfig(configs);
        } catch (error) {
            console.error('保存GPU配置失败:', error);
        }
    }

    // 加载自定义配置文件
    async loadCustomConfigFromFile() {
        try {
            const result = await this.configFileManager.loadCustomConfig();
            
            if (result.success) {
                this.modeConfigManager.populateCustomConfigForm(result.data);
                toast(getTranslation('自定义配置加载完成', {}, this.currentLanguage));
            } else {
                toast(getTranslation('toast_config_load_fail', {}, this.currentLanguage));
            }
        } catch (error) {
            console.error('加载自定义配置失败:', error);
            toast(`加载自定义配置失败: ${error.message}`);
        }
    }

    // 保存自定义配置到文件
    async saveCustomConfigToFile() {
        try {
            const customConfig = this.modeConfigManager.getCurrentConfig();
            await this.configFileManager.saveCustomConfig(customConfig);
        } catch (error) {
            console.error('保存自定义配置失败:', error);
            toast(`保存自定义配置失败: ${error.message}`);
        }
    }

    // 设置语言
    setLanguage(language) {
        this.currentLanguage = language;
        this.configFileManager.setLanguage(language);
        this.modalManager.setLanguage(language);
        this.modeConfigManager.setLanguage(language);
        this.gpuConfigManager.setLanguage(language);
    }
}