import type { GpuConfig } from "./configFileManager";
import { getTranslation } from "./i18n";
import { toast } from "./utils";

type Lang = "zh" | "en";

interface VoltageControllerLike {
	setVoltage(v: number): void;
	reset(): void;
	getCurrentVoltage(): number;
}

export class ModalManager {
	voltageController: VoltageControllerLike | null;
	editingIndex = -1;
	currentLanguage: Lang = "zh";
	onSaveCallback: ((config: GpuConfig, index: number) => void) | null = null;
	onDeleteCallback: ((index: number) => void) | null = null;
	editConfigModal: HTMLElement | null;
	closeModalBtn: Element | null;
	freqInput: HTMLInputElement | null;
	saveItemBtn: HTMLElement | null;
	cancelEditBtn: HTMLElement | null;
	deleteItemBtn: HTMLElement | null;
	ddrContainer: HTMLElement | null;
	selectedDdr: HTMLElement | null;

	constructor(voltageController: VoltageControllerLike | null) {
		this.voltageController = voltageController;
		this.editConfigModal = document.getElementById("editConfigModal");
		this.closeModalBtn = document.querySelector(".close-modal");
		this.freqInput = document.getElementById("freqInput") as HTMLInputElement | null;
		this.saveItemBtn = document.getElementById("saveItemBtn");
		this.cancelEditBtn = document.getElementById("cancelEditBtn");
		this.deleteItemBtn = document.getElementById("deleteItemBtn");
		this.ddrContainer = document.getElementById("ddrContainer");
		this.selectedDdr = document.getElementById("selectedDdr");
	}

	init() {
		this.setupEventListeners();
		this.setupDdrSelector();
	}

	setupEventListeners() {
		if (this.closeModalBtn) this.closeModalBtn.addEventListener("click", () => this.closeModal());
		if (this.cancelEditBtn) this.cancelEditBtn.addEventListener("click", () => this.closeModal());
		if (this.saveItemBtn) this.saveItemBtn.addEventListener("click", () => this.saveConfigItem());
		if (this.deleteItemBtn)
			this.deleteItemBtn.addEventListener("click", () => this.deleteConfigItem());
		window.addEventListener("click", (event) => {
			if (event.target === this.editConfigModal) this.closeModal();
		});
		window.addEventListener("keydown", (event) => {
			if (
				event.key === "Escape" &&
				this.editConfigModal &&
				this.editConfigModal.style.display === "block"
			)
				this.closeModal();
		});
	}

	setupDdrSelector() {
		if (!this.ddrContainer) return;
		this.ddrContainer.addEventListener("click", () => {
			this.ddrContainer?.classList.toggle("open");
			if (this.ddrContainer?.classList.contains("open")) {
				setTimeout(() => {
					const options = this.ddrContainer?.querySelectorAll(".option");
					options.forEach((option, index) => {
						setTimeout(() => {
							(option as HTMLElement).style.opacity = "1";
							(option as HTMLElement).style.transform = "translateY(0)";
						}, index * 50);
					});
				}, 10);
			} else {
				const options = this.ddrContainer?.querySelectorAll(".option");
				options.forEach((option) => {
					(option as HTMLElement).style.opacity = "0";
					(option as HTMLElement).style.transform = "translateY(-10px)";
				});
				setTimeout(() => {
					this.ddrContainer?.classList.remove("open");
				}, 150);
			}
		});
		const ddrOptionElements = document.querySelectorAll("#ddrOptions .option");
		ddrOptionElements.forEach((option) => {
			option.addEventListener("click", (e) => {
				e.stopPropagation();
				ddrOptionElements.forEach((opt) => {
					opt.classList.remove("selected");
				});
				option.classList.add("selected");
				if (this.selectedDdr) this.selectedDdr.textContent = option.textContent;
				const options = this.ddrContainer?.querySelectorAll(".option");
				options.forEach((o) => {
					(o as HTMLElement).style.opacity = "0";
					(o as HTMLElement).style.transform = "translateY(-10px)";
				});
				setTimeout(() => {
					this.ddrContainer?.classList.remove("open");
				}, 150);
				setTimeout(() => {
					options.forEach((o) => {
						(o as HTMLElement).style.opacity = "";
						(o as HTMLElement).style.transform = "";
					});
				}, 300);
			});
		});
	}

	openModal(config: GpuConfig | null = null, index = -1) {
		if (!this.editConfigModal) {
			return;
		}
		this.editingIndex = index;
		if (config) {
			if (this.freqInput) this.freqInput.value = String(config.freq);
			if (this.voltageController) this.voltageController.setVoltage(config.volt);
			this.setDdrValue(config.ddr);
			if (this.deleteItemBtn) this.deleteItemBtn.style.display = "block";
		} else {
			if (this.freqInput) this.freqInput.value = "";
			if (this.voltageController) this.voltageController.reset();
			this.setDdrValue(999);
			if (this.deleteItemBtn) this.deleteItemBtn.style.display = "none";
		}
		this.editConfigModal.style.display = "block";
	}

	closeModal() {
		if (this.editConfigModal) this.editConfigModal.style.display = "none";
	}

	setDdrValue(ddrValue: number) {
		if (this.selectedDdr) {
			const ddrOptions = document.querySelectorAll("#ddrOptions .option");
			ddrOptions.forEach((option) => {
				const optionValue = parseInt(option.getAttribute("data-value") || "0", 10);
				if (optionValue === ddrValue) {
					if (this.selectedDdr) {
						this.selectedDdr.textContent = option.textContent;
					}
					option.classList.add("selected");
				} else {
					option.classList.remove("selected");
				}
			});
		}
	}

	getDdrValue(): number {
		if (this.selectedDdr) {
			const ddrText = this.selectedDdr.textContent || "999";
			return parseInt(ddrText.split(" ")[0], 10);
		}
		return 999;
	}

	saveConfigItem() {
		if (!this.freqInput) return;
		const freq = parseInt(this.freqInput.value, 10);
		const volt = this.voltageController ? this.voltageController.getCurrentVoltage() : 0;
		const ddr = this.getDdrValue();
		if (!freq || Number.isNaN(freq)) {
			toast(getTranslation("toast_freq_invalid", {}, this.currentLanguage));
			return;
		}
		const configItem = { freq, volt, ddr };
		if (this.onSaveCallback) this.onSaveCallback(configItem, this.editingIndex);
		this.closeModal();
		toast(getTranslation("toast_config_updated", {}, this.currentLanguage));
	}

	deleteConfigItem() {
		if (this.editingIndex >= 0) {
			if (this.onDeleteCallback) this.onDeleteCallback(this.editingIndex);
			this.closeModal();
			toast(getTranslation("toast_config_deleted", {}, this.currentLanguage));
		} else toast(getTranslation("toast_index_invalid", {}, this.currentLanguage));
	}

	setSaveCallback(cb: (config: GpuConfig, index: number) => void) {
		this.onSaveCallback = cb;
	}
	setDeleteCallback(cb: (index: number) => void) {
		this.onDeleteCallback = cb;
	}
	setLanguage(language: Lang) {
		this.currentLanguage = language;
	}
}
