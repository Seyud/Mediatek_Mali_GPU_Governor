// 配置文件操作模块
import { exec, toast } from './utils.js';
import { PATHS } from './constants.js';
import { getTranslation } from './i18n.js';

export class ConfigFileManager {
    constructor() {
        this.currentLanguage = 'zh';
    }

    // 加载GPU配置文件
    async loadGpuConfig() {
        try {
            const { errno, stdout } = await exec(`cat ${PATHS.CONFIG_PATH}`);

            if (errno === 0 && stdout.trim()) {
                const content = stdout.trim();
                const gpuConfigs = [];
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
                            gpuConfigs.push({
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
                            gpuConfigs.push({
                                freq: freq,
                                volt: volt,
                                ddr: ddr
                            });
                            hasConfig = true;
                        }
                    }
                }

                if (hasConfig) {
                    // 按频率排序
                    gpuConfigs.sort((a, b) => a.freq - b.freq);
                    return { success: true, data: gpuConfigs };
                } else {
                    return { success: false, error: 'config_not_found' };
                }
            } else {
                return { success: false, error: 'config_not_found' };
            }
        } catch (error) {
            console.error('加载GPU配置失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 保存GPU配置到文件
    async saveGpuConfig(gpuConfigs) {
        try {
            if (!gpuConfigs || gpuConfigs.length === 0) {
                toast(getTranslation('toast_config_empty', {}, this.currentLanguage));
                return { success: false, error: 'empty_config' };
            }

            // 按频率排序
            const sortedConfigs = [...gpuConfigs].sort((a, b) => a.freq - b.freq);

            // 生成数组格式的toml配置文件内容（如mtd8100.toml格式）
            let configContent = '# GPU 频率表\n';
            configContent += '# freq 单位: kHz\n';
            configContent += '# volt 单位: uV\n';
            configContent += '# ddr_opp: DDR OPP 档位\n';
            configContent += '\n';

            configContent += 'freq_table = [\n';
            sortedConfigs.forEach((config, index) => {
                configContent += `    { freq = ${config.freq}, volt = ${config.volt}, ddr_opp = ${config.ddr} }`;
                if (index < sortedConfigs.length - 1) {
                    configContent += ',';
                }
                configContent += '\n';
            });
            configContent += ']\n';

            // 保存到文件
            const { errno } = await exec(`echo '${configContent}' > ${PATHS.CONFIG_PATH}`);

            if (errno === 0) {
                toast(getTranslation('toast_config_saved', {}, this.currentLanguage));
                return { success: true };
            } else {
                toast(getTranslation('toast_config_save_fail', {}, this.currentLanguage));
                return { success: false, error: 'save_failed' };
            }
        } catch (error) {
            console.error('保存配置失败:', error);
            toast(`保存配置失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // 加载自定义配置文件
    async loadCustomConfig() {
        try {
            const { errno, stdout } = await exec(`cat ${PATHS.CUSTOM_CONFIG_PATH}`);

            if (errno === 0 && stdout.trim()) {
                const content = stdout.trim();
                const customConfig = this.parseCustomConfig(content);
                return { success: true, data: customConfig };
            } else {
                return { success: false, error: 'config_not_found' };
            }
        } catch (error) {
            console.error('加载自定义配置失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 保存自定义配置到文件
    async saveCustomConfig(customConfig) {
        try {
            const configContent = this.generateCustomConfigContent(customConfig);
            
            // 保存到文件
            const { errno } = await exec(`echo '${configContent}' > ${PATHS.CUSTOM_CONFIG_PATH}`);

            if (errno === 0) {
                toast(getTranslation('toast_config_saved', {}, this.currentLanguage));
                return { success: true };
            } else {
                toast(getTranslation('toast_config_save_fail', {}, this.currentLanguage));
                return { success: false, error: 'save_failed' };
            }
        } catch (error) {
            console.error('保存自定义配置失败:', error);
            toast(`保存自定义配置失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // 解析自定义配置内容
    parseCustomConfig(content) {
        const customConfig = {};

        // 解析全局设置
        const globalMatch = /\[global\]([\s\S]*?)(?=\n\[|$)/.exec(content);
        if (globalMatch) {
            const globalSection = globalMatch[1];
            customConfig.global = this.parseSection(globalSection);
        }

        // 解析各模式设置
        const modes = ['powersave', 'balance', 'performance', 'fast'];
        modes.forEach(mode => {
            const modeMatch = new RegExp(`\\[${mode}\\]([\\s\\S]*?)(?=\\n\\[|$)`).exec(content);
            if (modeMatch) {
                const modeSection = modeMatch[1];
                customConfig[mode] = this.parseSection(modeSection);
            }
        });

        return customConfig;
    }

    // 解析配置节
    parseSection(sectionContent) {
        const config = {};
        const lines = sectionContent.split('\n');
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, value] = trimmedLine.split('=');
                if (key && value) {
                    const cleanKey = key.trim();
                    const cleanValue = value.trim().replace(/["']/g, '');
                    
                    // 尝试转换为适当的数据类型
                    if (cleanValue === 'true') {
                        config[cleanKey] = true;
                    } else if (cleanValue === 'false') {
                        config[cleanKey] = false;
                    } else if (!isNaN(cleanValue)) {
                        config[cleanKey] = Number(cleanValue);
                    } else {
                        config[cleanKey] = cleanValue;
                    }
                }
            }
        });
        
        return config;
    }

    // 生成自定义配置内容
    generateCustomConfigContent(customConfig) {
        let content = '# GPU调速器配置文件\n\n';
        
        // 生成全局配置
        content += '[global]\n';
        content += '# 全局模式设置: powersave, balance, performance, fast\n';
        content += `mode = "${customConfig.global?.mode || 'balance'}"\n`;
        content += '# 空闲阈值（百分比）\n';
        content += `idle_threshold = ${customConfig.global?.idle_threshold || 5}\n\n`;
        
        // 生成各模式配置
        const modes = ['powersave', 'balance', 'performance', 'fast'];
        const modeNames = {
            'powersave': '省电模式 - 更高的升频阈值，更激进的降频',
            'balance': '平衡模式 - 默认设置',
            'performance': '性能模式 - 更低的升频阈值，更保守的降频',
            'fast': '极速模式 - 最低的升频阈值，最保守的降频'
        };

        modes.forEach(mode => {
            content += `# ${modeNames[mode]}\n`;
            content += `[${mode}]\n`;
            content += this.generateModeConfigContent(customConfig[mode] || {});
        });
        
        return content;
    }

    // 生成模式配置内容
    generateModeConfigContent(config) {
        let content = '';
        content += `# 余量\n`;
        content += `margin = ${config.margin || 10}\n`;
        content += `# 是否使用激进降频策略\n`;
        content += `aggressive_down = ${config.aggressive_down ? 'true' : 'false'}\n`;
        content += `# 采样间隔（毫秒）\n`;
        content += `sampling_interval = ${config.sampling_interval || 16}\n`;
        content += `# 游戏优化 - 启用游戏特殊内存优化\n`;
        content += `gaming_mode = ${config.gaming_mode ? 'true' : 'false'}\n`;
        content += `# 自适应采样\n`;
        content += `adaptive_sampling = ${config.adaptive_sampling ? 'true' : 'false'}\n`;
        content += `# 自适应采样最小间隔（毫秒）\n`;
        content += `min_adaptive_interval = ${config.min_adaptive_interval || 4}\n`;
        content += `# 自适应采样最大间隔（毫秒）\n`;
        content += `max_adaptive_interval = ${config.max_adaptive_interval || 20}\n`;
        content += `# 升频延迟（毫秒）\n`;
        content += `up_rate_delay = ${config.up_rate_delay || 1000}\n`;
        content += `# 降频延迟（毫秒）\n`;
        content += `down_rate_delay = ${config.down_rate_delay || 5000}\n\n`;
        return content;
    }

    // 设置语言
    setLanguage(language) {
        this.currentLanguage = language;
    }
}