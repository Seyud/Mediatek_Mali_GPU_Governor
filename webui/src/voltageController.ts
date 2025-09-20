import { VOLT_SETTINGS, VOLT_LIST } from './constants';

export class VoltageController {
	// 使用 number 明确类型
	currentVoltValue: number = VOLT_SETTINGS.MAX_VOLT as number;
	isLongPress = false;
	decreaseTimer: any = null;
	increaseTimer: any = null;
	voltageEventsInitialized = false;
	voltSelect: HTMLSelectElement | null;
	selectedVolt: HTMLElement | null;
	voltDecreaseBtn: HTMLElement | null;
	voltIncreaseBtn: HTMLElement | null;

	constructor() {
		this.voltSelect = document.getElementById('voltSelect') as HTMLSelectElement | null;
		this.selectedVolt = document.getElementById('selectedVolt');
		this.voltDecreaseBtn = document.getElementById('voltDecreaseBtn');
		this.voltIncreaseBtn = document.getElementById('voltIncreaseBtn');
	}
	init() { this.initVoltSelect(); this.setupVoltageEvents(); }
	decreaseVolt() { const newVolt = this.currentVoltValue - VOLT_SETTINGS.VOLT_STEP; if (newVolt >= VOLT_SETTINGS.MIN_VOLT) { this.currentVoltValue = newVolt; this.updateVoltDisplay(); return true; } return false; }
	increaseVolt() { const newVolt = this.currentVoltValue + VOLT_SETTINGS.VOLT_STEP; if (newVolt <= (VOLT_SETTINGS.MAX_VOLT as number)) { this.currentVoltValue = newVolt; this.updateVoltDisplay(); return true; } return false; }
	updateVoltDisplay() { if (this.selectedVolt) this.selectedVolt.textContent = String(this.currentVoltValue); if (this.voltSelect) { const voltOption = Array.from(this.voltSelect.options).find(o => parseInt(o.value) === this.currentVoltValue); if (voltOption) this.voltSelect.value = voltOption.value; else { const option = document.createElement('option'); option.value = String(this.currentVoltValue); option.textContent = String(this.currentVoltValue); this.voltSelect.appendChild(option); this.voltSelect.value = String(this.currentVoltValue); } if (this.voltDecreaseBtn) (this.voltDecreaseBtn as HTMLButtonElement).disabled = this.currentVoltValue <= VOLT_SETTINGS.MIN_VOLT; if (this.voltIncreaseBtn) (this.voltIncreaseBtn as HTMLButtonElement).disabled = this.currentVoltValue >= VOLT_SETTINGS.MAX_VOLT; } }
	initVoltSelect() { if (!this.voltSelect || !this.selectedVolt) return; this.voltSelect.innerHTML=''; VOLT_LIST.forEach(volt => { const opt = document.createElement('option'); opt.value=String(volt); opt.textContent=String(volt); this.voltSelect!.appendChild(opt); }); this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT; this.selectedVolt.textContent=String(this.currentVoltValue); this.voltSelect.value=String(this.currentVoltValue); this.updateVoltDisplay(); }
	setupVoltageEvents() { if (this.voltageEventsInitialized) return; if (this.voltDecreaseBtn) { this.voltDecreaseBtn.addEventListener('click', () => { if (this.isLongPress) { this.isLongPress=false; return; } this.decreaseVolt(); }); this.voltDecreaseBtn.addEventListener('mousedown', () => { this.isLongPress=false; this.decreaseTimer = setTimeout(() => { this.isLongPress=true; const can = this.decreaseVolt(); if (can && this.decreaseTimer) { this.decreaseTimer = setInterval(() => { if (!this.decreaseVolt()) { clearInterval(this.decreaseTimer); this.decreaseTimer=null; } },150); } },500); }); }
		if (this.voltIncreaseBtn) { this.voltIncreaseBtn.addEventListener('click', () => { if (this.isLongPress) { this.isLongPress=false; return; } this.increaseVolt(); }); this.voltIncreaseBtn.addEventListener('mousedown', () => { this.isLongPress=false; this.increaseTimer = setTimeout(() => { this.isLongPress=true; const can = this.increaseVolt(); if (can && this.increaseTimer) { this.increaseTimer = setInterval(() => { if (!this.increaseVolt()) { clearInterval(this.increaseTimer); this.increaseTimer=null; } },150); } },500); }); }
		document.addEventListener('mouseup', () => this.clearTimers());
		document.addEventListener('mouseleave', () => this.clearTimers());
		this.setupTouchEvents(); this.voltageEventsInitialized=true; }
	setupTouchEvents() { if (this.voltDecreaseBtn) { this.voltDecreaseBtn.addEventListener('touchstart',(e)=>{ e.preventDefault(); this.isLongPress=false; this.decreaseVolt(); this.decreaseTimer=setTimeout(()=>{ this.isLongPress=true; this.decreaseTimer=setInterval(()=>{ if(!this.decreaseVolt()){ clearInterval(this.decreaseTimer); this.decreaseTimer=null;} },150); },500); },{ passive:false}); }
		if (this.voltIncreaseBtn) { this.voltIncreaseBtn.addEventListener('touchstart',(e)=>{ e.preventDefault(); this.isLongPress=false; this.increaseVolt(); this.increaseTimer=setTimeout(()=>{ this.isLongPress=true; this.increaseTimer=setInterval(()=>{ if(!this.increaseVolt()){ clearInterval(this.increaseTimer); this.increaseTimer=null;} },150); },500); },{ passive:false}); }
		document.addEventListener('touchend', () => this.clearTimers()); }
	clearTimers() { if (this.decreaseTimer) { clearTimeout(this.decreaseTimer); clearInterval(this.decreaseTimer); this.decreaseTimer=null; } if (this.increaseTimer) { clearTimeout(this.increaseTimer); clearInterval(this.increaseTimer); this.increaseTimer=null; } }
	getCurrentVoltage() { return this.currentVoltValue; }
	setVoltage(voltage: number) { this.currentVoltValue = voltage; this.updateVoltDisplay(); }
	reset() { this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT; this.updateVoltDisplay(); }
}
