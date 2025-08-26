// 电压控制模块
import { VOLT_SETTINGS, VOLT_LIST } from './constants.js';

export class VoltageController {
    constructor() {
        this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT;
        this.isLongPress = false;
        this.decreaseTimer = null;
        this.increaseTimer = null;
        this.voltageEventsInitialized = false;
        
        // DOM元素
        this.voltSelect = document.getElementById('voltSelect');
        this.selectedVolt = document.getElementById('selectedVolt');
        this.voltDecreaseBtn = document.getElementById('voltDecreaseBtn');
        this.voltIncreaseBtn = document.getElementById('voltIncreaseBtn');
    }

    // 初始化电压控制器
    init() {
        this.initVoltSelect();
        this.setupVoltageEvents();
    }

    // 减小电压函数（减小电压值）
    decreaseVolt() {
        let newVolt = this.currentVoltValue - VOLT_SETTINGS.VOLT_STEP;

        if (newVolt >= VOLT_SETTINGS.MIN_VOLT) {
            this.currentVoltValue = newVolt;
            this.updateVoltDisplay();
            return true;
        }
        return false;
    }

    // 增加电压函数（增加电压值）
    increaseVolt() {
        let newVolt = this.currentVoltValue + VOLT_SETTINGS.VOLT_STEP;

        if (newVolt <= VOLT_SETTINGS.MAX_VOLT) {
            this.currentVoltValue = newVolt;
            this.updateVoltDisplay();
            return true;
        }
        return false;
    }

    // 更新电压显示
    updateVoltDisplay() {
        if (this.selectedVolt) {
            this.selectedVolt.textContent = this.currentVoltValue;
        }

        if (this.voltSelect) {
            const voltOption = Array.from(this.voltSelect.options).find(option => parseInt(option.value) === this.currentVoltValue);

            if (voltOption) {
                this.voltSelect.value = voltOption.value;
            } else {
                const option = document.createElement('option');
                option.value = this.currentVoltValue;
                option.textContent = this.currentVoltValue;
                this.voltSelect.appendChild(option);
                this.voltSelect.value = this.currentVoltValue;
            }

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
        if (!this.voltSelect || !this.selectedVolt || !this.voltDecreaseBtn || !this.voltIncreaseBtn) {
            console.error('电压选择器元素不存在');
            return;
        }

        this.voltSelect.innerHTML = '';

        VOLT_LIST.forEach(volt => {
            const selectOption = document.createElement('option');
            selectOption.value = volt;
            selectOption.textContent = volt;
            this.voltSelect.appendChild(selectOption);
        });

        this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT;
        this.selectedVolt.textContent = this.currentVoltValue;
        this.voltSelect.value = this.currentVoltValue;

        this.updateVoltDisplay();
    }

    // 设置电压选择器的事件监听器
    setupVoltageEvents() {
        if (this.voltageEventsInitialized) {
            return;
        }

        if (this.voltDecreaseBtn) {
            this.voltDecreaseBtn.addEventListener('click', () => {
                if (this.isLongPress) {
                    this.isLongPress = false;
                    return;
                }
                this.decreaseVolt();
            });

            this.voltDecreaseBtn.addEventListener('mousedown', () => {
                this.isLongPress = false;
                this.decreaseTimer = setTimeout(() => {
                    this.isLongPress = true;
                    const canContinue = this.decreaseVolt();
                    if (canContinue && this.decreaseTimer) {
                        this.decreaseTimer = setInterval(() => {
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
            this.voltIncreaseBtn.addEventListener('click', () => {
                if (this.isLongPress) {
                    this.isLongPress = false;
                    return;
                }
                this.increaseVolt();
            });

            this.voltIncreaseBtn.addEventListener('mousedown', () => {
                this.isLongPress = false;
                this.increaseTimer = setTimeout(() => {
                    this.isLongPress = true;
                    const canContinue = this.increaseVolt();
                    if (canContinue && this.increaseTimer) {
                        this.increaseTimer = setInterval(() => {
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
            this.clearTimers();
        });

        document.addEventListener('mouseleave', () => {
            this.clearTimers();
        });

        // 触摸事件支持
        this.setupTouchEvents();

        this.voltageEventsInitialized = true;
    }

    // 设置触摸事件
    setupTouchEvents() {
        if (this.voltDecreaseBtn) {
            this.voltDecreaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.isLongPress = false;
                this.decreaseVolt();
                this.decreaseTimer = setTimeout(() => {
                    this.isLongPress = true;
                    this.decreaseTimer = setInterval(() => {
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
                e.preventDefault();
                this.isLongPress = false;
                this.increaseVolt();
                this.increaseTimer = setTimeout(() => {
                    this.isLongPress = true;
                    this.increaseTimer = setInterval(() => {
                        if (!this.increaseVolt()) {
                            clearInterval(this.increaseTimer);
                            this.increaseTimer = null;
                        }
                    }, 150);
                }, 500);
            }, { passive: false });
        }

        document.addEventListener('touchend', () => {
            this.clearTimers();
        });
    }

    // 清除所有定时器
    clearTimers() {
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
    }

    // 获取当前电压值
    getCurrentVoltage() {
        return this.currentVoltValue;
    }

    // 设置电压值
    setVoltage(voltage) {
        this.currentVoltValue = voltage;
        this.updateVoltDisplay();
    }

    // 重置电压到默认值
    reset() {
        this.currentVoltValue = VOLT_SETTINGS.MAX_VOLT;
        this.updateVoltDisplay();
    }
}