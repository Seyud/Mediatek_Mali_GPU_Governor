import { ConfigFileManager, type GpuConfig } from "./configFileManager";
import { GpuConfigManager } from "./gpuConfigManager";
import { ModalManager } from "./modalManager";
import { ModeConfigManager } from "./modeConfigManager";
import { VoltageController } from "./voltageController";

type Lang = "zh" | "en";

interface LoadResult<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export class ConfigManager {
	currentLanguage: Lang = "zh";
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
		this.loadCustomConfigBtn = document.getElementById("loadCustomConfigBtn");
		this.saveCustomConfigBtn = document.getElementById("saveCustomConfigBtn");
	}

	init() {
		this.setupEventListeners();
		this.setupModuleCallbacks();
		this.initializeModules();
		// 移除自动加载，改为懒加载
		// this.loadInitialData();
	}
	initializeModules() {
		this.voltageController.init();
		this.modalManager.init();
		this.modeConfigManager.init();
		this.gpuConfigManager.init();
	}
	setupModuleCallbacks() {
		this.gpuConfigManager.setEditCallback((config, index) => {
			this.modalManager.openModal(config, index);
		});
		this.gpuConfigManager.setSaveFileCallback(() => {
			this.saveGpuConfigToFile();
		});
		this.modalManager.setSaveCallback((config: GpuConfig, index: number) => {
			this.gpuConfigManager.updateConfig(config, index);
		});
		this.modalManager.setDeleteCallback((index: number) => {
			this.gpuConfigManager.deleteConfig(index);
		});
	}
	async loadInitialData() {
		await this.loadGpuConfig();
		await this.loadCustomConfigFromFile();
	}

	/**
	 * 加载所有配置页数据（用于懒加载）
	 */
	async loadAllConfigData() {
		await this.loadInitialData();
	}

	setupEventListeners() {
		if (this.loadCustomConfigBtn)
			this.loadCustomConfigBtn.addEventListener("click", () => this.loadCustomConfigFromFile());
		if (this.saveCustomConfigBtn)
			this.saveCustomConfigBtn.addEventListener("click", () => this.saveCustomConfigToFile());
	}
	async loadGpuConfig() {
		const result = (await this.configFileManager.loadGpuConfig()) as LoadResult<GpuConfig[]>;
		if (result.success && result.data) this.gpuConfigManager.loadConfigs(result.data);
		else {
			this.gpuConfigManager.loadConfigs([]);
		}
	}

	async saveGpuConfigToFile() {
		const configs = this.gpuConfigManager.getConfigs();
		await this.configFileManager.saveGpuConfig(configs);
	}

	async loadCustomConfigFromFile() {
		const result = await this.configFileManager.loadCustomConfig();
		if (result.success && result.data) {
			this.modeConfigManager.populateCustomConfigForm(result.data);
		}
	}

	async saveCustomConfigToFile() {
		const customConfig = this.modeConfigManager.getCurrentConfig();
		await this.configFileManager.saveCustomConfig(customConfig);
	}
	setLanguage(language: Lang) {
		this.currentLanguage = language;
		this.configFileManager.setLanguage(language);
		this.modalManager.setLanguage(language);
		this.modeConfigManager.setLanguage(language);
		this.gpuConfigManager.setLanguage(language);
	}
}
