// 模态框管理模块
import { toast } from './utils.js';
import { getTranslation } from './i18n.js';

export class ModalManager {
    constructor(voltageController) {
        this.voltageController = voltageController;
        this.editingIndex = -1;
        this.currentLanguage = 'zh';
        this.onSaveCallback = null;
        this.onDeleteCallback = null;
        
        // DOM元素
        this.editConfigModal = document.getElementById('editConfigModal');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.freqInput = document.getElementById('freqInput');
        this.saveItemBtn = document.getElementById('saveItemBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.deleteItemBtn = document.getElementById('deleteItemBtn');
        this.ddrContainer = document.getElementById('ddrContainer');
        this.selectedDdr = document.getElementById('selectedDdr');
    }

    // 初始化模态框管理器
    init() {
        this.setupEventListeners();
        this.setupDdrSelector();
    }

    // 设置事件监听器
    setupEventListeners() {
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', () => {
                this.closeModal();
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
                this.closeModal();
            }
        });

        // 按ESC键关闭模态框
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.editConfigModal && this.editConfigModal.style.display === 'block') {
                    this.closeModal();
                }
            }
        });
    }

    // 设置DDR选择器
    setupDdrSelector() {
        if (this.ddrContainer) {
            this.ddrContainer.addEventListener('click', () => {
                this.ddrContainer.classList.toggle('open');
                
                if (this.ddrContainer.classList.contains('open')) {
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
                    const options = this.ddrContainer.querySelectorAll('.option');
                    options.forEach(option => {
                        option.style.opacity = '0';
                        option.style.transform = 'translateY(-10px)';
                    });
                    
                    setTimeout(() => {
                        this.ddrContainer.classList.remove('open');
                    }, 150);
                }
            });

            // 点击DDR选项时
            const ddrOptionElements = document.querySelectorAll('#ddrOptions .option');
            ddrOptionElements.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();

                    // 移除所有选项的选中状态
                    ddrOptionElements.forEach(opt => opt.classList.remove('selected'));

                    // 为当前选项添加选中状态
                    option.classList.add('selected');

                    // 更新显示的文本
                    if (this.selectedDdr) {
                        this.selectedDdr.textContent = option.textContent;
                    }

                    // 关闭下拉菜单
                    const options = this.ddrContainer.querySelectorAll('.option');
                    options.forEach(option => {
                        option.style.opacity = '0';
                        option.style.transform = 'translateY(-10px)';
                    });
                    
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

    // 打开编辑模态框
    openModal(config = null, index = -1) {
        if (!this.editConfigModal) {
            console.error('模态框元素不存在');
            return;
        }

        this.editingIndex = index;

        if (config) {
            // 编辑现有配置
            if (this.freqInput) {
                this.freqInput.value = config.freq;
            }

            // 设置电压
            if (this.voltageController) {
                this.voltageController.setVoltage(config.volt);
            }

            // 设置DDR档位
            this.setDdrValue(config.ddr);

            // 显示删除按钮
            if (this.deleteItemBtn) {
                this.deleteItemBtn.style.display = 'block';
            }
        } else {
            // 添加新配置
            if (this.freqInput) {
                this.freqInput.value = '';
            }

            // 重置电压
            if (this.voltageController) {
                this.voltageController.reset();
            }

            // 重置DDR档位
            this.setDdrValue(999);

            // 隐藏删除按钮
            if (this.deleteItemBtn) {
                this.deleteItemBtn.style.display = 'none';
            }
        }

        // 显示模态框
        this.editConfigModal.style.display = 'block';
    }

    // 关闭模态框
    closeModal() {
        if (this.editConfigModal) {
            this.editConfigModal.style.display = 'none';
        }
    }

    // 设置DDR值
    setDdrValue(ddrValue) {
        if (this.selectedDdr) {
            // 根据值设置显示文本
            const ddrOptions = document.querySelectorAll('#ddrOptions .option');
            ddrOptions.forEach(option => {
                const optionValue = parseInt(option.getAttribute('data-value'));
                if (optionValue === ddrValue) {
                    this.selectedDdr.textContent = option.textContent;
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }
    }

    // 获取DDR值
    getDdrValue() {
        if (this.selectedDdr) {
            const ddrText = this.selectedDdr.textContent;
            return parseInt(ddrText.split(' ')[0]);
        }
        return 999;
    }

    // 保存配置项
    saveConfigItem() {
        if (!this.freqInput) return;
        
        const freq = parseInt(this.freqInput.value);
        const volt = this.voltageController ? this.voltageController.getCurrentVoltage() : 0;
        const ddr = this.getDdrValue();

        if (!freq || isNaN(freq)) {
            toast(getTranslation('toast_freq_invalid', {}, this.currentLanguage));
            return;
        }

        const configItem = { freq, volt, ddr };

        // 调用保存回调
        if (this.onSaveCallback) {
            this.onSaveCallback(configItem, this.editingIndex);
        }

        // 关闭模态框
        this.closeModal();

        toast(getTranslation('toast_config_updated', {}, this.currentLanguage));
    }

    // 删除配置项
    deleteConfigItem() {
        if (this.editingIndex >= 0) {
            // 调用删除回调
            if (this.onDeleteCallback) {
                this.onDeleteCallback(this.editingIndex);
            }

            // 关闭模态框
            this.closeModal();

            toast(getTranslation('toast_config_deleted', {}, this.currentLanguage));
        } else {
            toast(getTranslation('toast_index_invalid', {}, this.currentLanguage));
        }
    }

    // 设置保存回调
    setSaveCallback(callback) {
        this.onSaveCallback = callback;
    }

    // 设置删除回调
    setDeleteCallback(callback) {
        this.onDeleteCallback = callback;
    }

    // 设置语言
    setLanguage(language) {
        this.currentLanguage = language;
    }
}