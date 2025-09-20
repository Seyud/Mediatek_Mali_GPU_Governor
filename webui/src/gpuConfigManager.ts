import { getTranslation } from "./i18n";

export interface GpuConfig {
	freq: number;
	volt: number;
	ddr: number;
}
type Lang = "zh" | "en";

export class GpuConfigManager {
	gpuConfigs: GpuConfig[] = [];
	currentLanguage: Lang = "zh";
	gpuFreqTable: HTMLTableSectionElement | null;
	addConfigBtn: HTMLElement | null;
	saveConfigBtn: HTMLElement | null;
	onEditCallback: ((config: GpuConfig | null, index: number) => void) | null = null;
	saveConfigToFile: (() => void) | null = null;

	constructor() {
		this.gpuFreqTable = document
			.getElementById("gpuFreqTable")
			?.querySelector("tbody") as HTMLTableSectionElement | null;
		this.addConfigBtn = document.getElementById("addConfigBtn");
		this.saveConfigBtn = document.getElementById("saveConfigBtn");
	}

	init() {
		this.setupEventListeners();
	}

	setupEventListeners() {
		if (this.addConfigBtn) this.addConfigBtn.addEventListener("click", () => this.openEditModal());
		if (this.saveConfigBtn)
			this.saveConfigBtn.addEventListener("click", () => {
				if (this.saveConfigToFile) this.saveConfigToFile();
			});
	}

	loadConfigs(configs: GpuConfig[]) {
		this.gpuConfigs = configs || [];
		if (this.gpuConfigs.length > 0) {
			this.gpuConfigs.sort((a, b) => a.freq - b.freq);
			this.refreshTable();
		} else this.showEmptyState();
	}
	refreshTable() {
		if (!this.gpuFreqTable) return;
		this.gpuFreqTable.innerHTML = "";
		if (this.gpuConfigs.length === 0) {
			this.showEmptyState();
			return;
		}
		this.gpuConfigs = [...this.gpuConfigs].sort((a, b) => a.freq - b.freq);
		this.gpuConfigs.forEach((cfg, idx) => {
			const row = this.createTableRow(cfg, idx);
			this.gpuFreqTable?.appendChild(row);
		});
	}
	createTableRow(config: GpuConfig, index: number) {
		const row = document.createElement("tr");
		row.dataset.index = String(index);
		row.dataset.freq = String(config.freq);
		const freqCell = document.createElement("td");
		freqCell.textContent = (config.freq / 1000).toFixed(0);
		const voltCell = document.createElement("td");
		voltCell.textContent = String(config.volt);
		const ddrCell = document.createElement("td");
		ddrCell.textContent = String(config.ddr);
		const actionsCell = document.createElement("td");
		const editBtn = this.createEditButton(index);
		actionsCell.appendChild(editBtn);
		row.appendChild(freqCell);
		row.appendChild(voltCell);
		row.appendChild(ddrCell);
		row.appendChild(actionsCell);
		return row;
	}
	createEditButton(index: number) {
		const editBtn = document.createElement("button");
		editBtn.className = "edit-btn";
		editBtn.innerHTML =
			'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
		editBtn.title = "编辑/删除";
		editBtn.onclick = () => {
			this.openEditModal(index);
			return false;
		};
		return editBtn;
	}
	showEmptyState() {
		if (this.gpuFreqTable)
			this.gpuFreqTable.innerHTML = `<tr><td colspan="4" class="loading-text">${getTranslation("config_not_found", {}, this.currentLanguage)}</td></tr>`;
	}
	openEditModal(index = -1) {
		if (this.onEditCallback) {
			const config = index >= 0 ? this.gpuConfigs[index] : null;
			this.onEditCallback(config, index);
		}
	}
	addConfig(config: GpuConfig) {
		this.gpuConfigs.push(config);
		this.refreshTable();
	}
	updateConfig(config: GpuConfig, index: number) {
		if (index >= 0 && index < this.gpuConfigs.length) this.gpuConfigs[index] = config;
		else this.gpuConfigs.push(config);
		this.refreshTable();
	}
	deleteConfig(index: number) {
		if (index >= 0 && index < this.gpuConfigs.length) {
			this.gpuConfigs.splice(index, 1);
			this.refreshTable();
			return true;
		}
		return false;
	}
	getConfigs(): GpuConfig[] {
		return [...this.gpuConfigs];
	}
	setEditCallback(cb: (config: GpuConfig | null, index: number) => void) {
		this.onEditCallback = cb;
	}
	setSaveFileCallback(cb: () => void) {
		this.saveConfigToFile = cb;
	}
	isFrequencyDuplicate(freq: number, excludeIndex = -1) {
		return this.gpuConfigs.some((c, i) => c.freq === freq && i !== excludeIndex);
	}
	getFrequencyRange() {
		if (this.gpuConfigs.length === 0) return { min: 0, max: 0 };
		const freqs = this.gpuConfigs.map((c) => c.freq);
		return { min: Math.min(...freqs), max: Math.max(...freqs) };
	}
	sortByFrequency() {
		this.gpuConfigs.sort((a, b) => a.freq - b.freq);
		this.refreshTable();
	}
	validateConfig(config: GpuConfig) {
		const errors: string[] = [];
		if (!config.freq || Number.isNaN(config.freq) || config.freq <= 0) errors.push("无效的频率值");
		if (!config.volt || Number.isNaN(config.volt) || config.volt <= 0) errors.push("无效的电压值");
		if (config.ddr === undefined || Number.isNaN(config.ddr)) errors.push("无效的DDR档位值");
		return { isValid: errors.length === 0, errors };
	}
	getStatistics() {
		if (this.gpuConfigs.length === 0) {
			return {
				count: 0,
				avgFreq: 0,
				avgVolt: 0,
				freqRange: { min: 0, max: 0 },
				voltRange: { min: 0, max: 0 },
			};
		}
		const freqs = this.gpuConfigs.map((c) => c.freq);
		const volts = this.gpuConfigs.map((c) => c.volt);
		return {
			count: this.gpuConfigs.length,
			avgFreq: freqs.reduce((s, f) => s + f, 0) / freqs.length,
			avgVolt: volts.reduce((s, v) => s + v, 0) / volts.length,
			freqRange: { min: Math.min(...freqs), max: Math.max(...freqs) },
			voltRange: { min: Math.min(...volts), max: Math.max(...volts) },
		};
	}
	setLanguage(language: Lang) {
		this.currentLanguage = language;
		this.refreshTable();
	}
	clearConfigs() {
		this.gpuConfigs = [];
		this.refreshTable();
	}
}
