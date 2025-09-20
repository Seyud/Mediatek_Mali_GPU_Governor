import { toast } from './utils';
import { getTranslation } from './i18n';
import { VoltageController } from './voltageController';
import { ConfigFileManager } from './configFileManager';
import { ModalManager } from './modalManager';
import { ModeConfigManager } from './modeConfigManager';
import { GpuConfigManager } from './gpuConfigManager';

type Lang = 'zh' | 'en';

interface LoadResult<T> { success: boolean; data?: T; error?: string; }

export class ConfigManager {
	currentLanguage: Lang = 'zh';
	voltageController: VoltageController;
	configFileManager: ConfigFileManager;
	modalManager: ModalManager;
	modeConfigManager: ModeConfigManager;
	gpuConfigManager: GpuConfigManager;
	loadCustomConfigBtn: HTMLElement | null;
	saveCustomConfigBtn: HTMLElement | null;

	constructor() {
		this.voltageController = new VoltageController();
		this.configFileManager = new ConfigFileManager();
		this.modalManager = new ModalManager(this.voltageController);
		this.modeConfigManager = new ModeConfigManager();
		this.gpuConfigManager = new GpuConfigManager();
		this.loadCustomConfigBtn = document.getElementById('loadCustomConfigBtn');
		this.saveCustomConfigBtn = document.getElementById('saveCustomConfigBtn');
	}

	init() { this.setupEventListeners(); this.setupModuleCallbacks(); this.initializeModules(); this.loadInitialData(); }
	initializeModules() { this.voltageController.init(); this.modalManager.init(); this.modeConfigManager.init(); this.gpuConfigManager.init(); }
		setupModuleCallbacks() { this.gpuConfigManager.setEditCallback((config, index)=>{ this.modalManager.openModal(config, index); }); this.gpuConfigManager.setSaveFileCallback(()=>{ this.saveGpuConfigToFile(); }); this.modalManager.setSaveCallback((config: any, index: number)=>{ this.gpuConfigManager.updateConfig(config, index); }); this.modalManager.setDeleteCallback((index: number)=>{ this.gpuConfigManager.deleteConfig(index); }); }
	async loadInitialData() { await this.loadGpuConfig(); await this.loadCustomConfigFromFile(); }
	setupEventListeners() { if (this.loadCustomConfigBtn) this.loadCustomConfigBtn.addEventListener('click', ()=> this.loadCustomConfigFromFile()); if (this.saveCustomConfigBtn) this.saveCustomConfigBtn.addEventListener('click', ()=> this.saveCustomConfigToFile()); }
		async loadGpuConfig() { try { const result = await this.configFileManager.loadGpuConfig() as LoadResult<any[]>; if (result.success && result.data) this.gpuConfigManager.loadConfigs(result.data); else { console.error('加载GPU配置失败:', result.error); this.gpuConfigManager.loadConfigs([]); } } catch (error) { console.error('加载GPU配置失败:', error); this.gpuConfigManager.loadConfigs([]); } }
	async saveGpuConfigToFile() { try { const configs = this.gpuConfigManager.getConfigs(); await this.configFileManager.saveGpuConfig(configs); } catch (error) { console.error('保存GPU配置失败:', error); } }
	async loadCustomConfigFromFile() { try { const result = await this.configFileManager.loadCustomConfig(); if (result.success && result.data) { this.modeConfigManager.populateCustomConfigForm(result.data); toast(getTranslation('自定义配置加载完成', {}, this.currentLanguage)); } else toast(getTranslation('toast_config_load_fail', {}, this.currentLanguage)); } catch (error: any) { console.error('加载自定义配置失败:', error); toast(`加载自定义配置失败: ${error.message}`); } }
	async saveCustomConfigToFile() { try { const customConfig = this.modeConfigManager.getCurrentConfig(); await this.configFileManager.saveCustomConfig(customConfig); } catch (error: any) { console.error('保存自定义配置失败:', error); toast(`保存自定义配置失败: ${error.message}`); } }
	setLanguage(language: Lang) { this.currentLanguage = language; this.configFileManager.setLanguage(language); this.modalManager.setLanguage(language); this.modeConfigManager.setLanguage(language); this.gpuConfigManager.setLanguage(language); }
}
