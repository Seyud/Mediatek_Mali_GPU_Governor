import { exec, toast, withResult, logError } from './utils';
import { PATHS } from './constants';
import { getTranslation } from './i18n';

type Lang = 'zh' | 'en';

interface GpuConfig { freq: number; volt: number; ddr: number; }

export class ConfigFileManager {
	currentLanguage: Lang = 'zh';
	async loadGpuConfig() { try { const { errno, stdout } = await exec(`cat ${PATHS.CONFIG_PATH}`); if (errno === 0 && stdout.trim()) { const content = stdout.trim(); const gpuConfigs: GpuConfig[] = []; let hasConfig = false; const arrayRegex = /freq_table\s*=\s*\[([\s\S]*?)\]/; const arrayMatch = arrayRegex.exec(content); if (arrayMatch) { const arrayContent = arrayMatch[1]; const itemRegex = /\{\s*freq\s*=\s*(\d+),\s*volt\s*=\s*(\d+),\s*ddr_opp\s*=\s*(\d+)\s*\}/g; let itemMatch; while ((itemMatch = itemRegex.exec(arrayContent)) !== null) { const freq = parseInt(itemMatch[1]); const volt = parseInt(itemMatch[2]); const ddr = parseInt(itemMatch[3]); if (!isNaN(freq) && !isNaN(volt) && !isNaN(ddr)) { gpuConfigs.push({ freq, volt, ddr }); hasConfig = true; } } }
			if (!hasConfig) { const freqTableRegex = /\[\[freq_table\]\][\s\S]*?freq\s*=\s*(\d+)[\s\S]*?volt\s*=\s*(\d+)[\s\S]*?ddr_opp\s*=\s*(\d+)/g; let match; while ((match = freqTableRegex.exec(content)) !== null) { const freq = parseInt(match[1]); const volt = parseInt(match[2]); const ddr = parseInt(match[3]); if (!isNaN(freq) && !isNaN(volt) && !isNaN(ddr)) { gpuConfigs.push({ freq, volt, ddr }); hasConfig = true; } } }
			if (hasConfig) { gpuConfigs.sort((a,b)=>a.freq-b.freq); return { success: true, data: gpuConfigs }; } return { success: false, error: 'config_not_found' }; } return { success: false, error: 'config_not_found' }; } catch (error: any) { console.error('加载GPU配置失败:', error); return { success: false, error: error.message }; } }
	async saveGpuConfig(gpuConfigs: GpuConfig[]) {
		if (!gpuConfigs || gpuConfigs.length === 0) {
			toast(getTranslation('toast_config_empty', {}, this.currentLanguage));
			return { success: false, error: 'empty_config' };
		}
		const sortedConfigs = [...gpuConfigs].sort((a,b)=>a.freq-b.freq);
		let content = '# GPU 频率表\n# freq 单位: kHz\n# volt 单位: uV\n# ddr_opp: DDR OPP 档位\n\n';
		content += 'freq_table = [\n';
		sortedConfigs.forEach((c,i)=>{ content += `    { freq = ${c.freq}, volt = ${c.volt}, ddr_opp = ${c.ddr} }${i<sortedConfigs.length-1?',':''}\n`; });
		content += ']\n';
		const b64 = btoa(unescape(encodeURIComponent(content)));
		const result = await withResult(async () => await exec(`echo '${b64}' | base64 -d > ${PATHS.CONFIG_PATH}`), 'gpu-config-save');
		if (!result.ok) {
			toast(getTranslation('toast_config_save_fail', {}, this.currentLanguage));
			return { success: false, error: 'exec_failed' };
		}
		if (result.data.errno === 0) { toast(getTranslation('toast_config_saved', {}, this.currentLanguage)); return { success: true }; }
		toast(getTranslation('toast_config_save_fail', {}, this.currentLanguage));
		return { success: false, error: 'save_failed' };
	}

	async loadCustomConfig() { try { const { errno, stdout } = await exec(`cat ${PATHS.CUSTOM_CONFIG_PATH}`); if (errno === 0 && stdout.trim()) { const content = stdout.trim(); const customConfig = this.parseCustomConfig(content); return { success: true, data: customConfig }; } return { success:false, error:'config_not_found'}; } catch (error: any) { console.error('加载自定义配置失败:', error); return { success:false, error: error.message }; } }
	async saveCustomConfig(customConfig: any) {
		const configContent = this.generateCustomConfigContent(customConfig);
		const b64 = btoa(unescape(encodeURIComponent(configContent)));
		const result = await withResult(async () => await exec(`echo '${b64}' | base64 -d > ${PATHS.CUSTOM_CONFIG_PATH}`), 'custom-config-save');
		if (!result.ok) {
			toast(getTranslation('toast_config_save_fail', {}, this.currentLanguage));
			return { success: false, error: 'exec_failed' };
		}
		if (result.data.errno === 0) { toast(getTranslation('toast_config_saved', {}, this.currentLanguage)); return { success: true }; }
		toast(getTranslation('toast_config_save_fail', {}, this.currentLanguage));
		return { success: false, error: 'save_failed' };
	}
	parseCustomConfig(content: string) { const customConfig: any = {}; const globalMatch = /\[global\]([\s\S]*?)(?=\n\[|$)/.exec(content); if (globalMatch) customConfig.global = this.parseSection(globalMatch[1]); const modes = ['powersave','balance','performance','fast']; modes.forEach(mode => { const modeMatch = new RegExp(`\\[${mode}\\]([\\s\\S]*?)(?=\\n\\[|$)`).exec(content); if (modeMatch) customConfig[mode] = this.parseSection(modeMatch[1]); }); return customConfig; }
	parseSection(sectionContent: string) { const config: any = {}; const lines = sectionContent.split('\n'); lines.forEach(line => { const t = line.trim(); if (t && !t.startsWith('#')) { const [key,value] = t.split('='); if (key && value) { const ck = key.trim(); const cv = value.trim().replace(/["']/g,''); if (cv === 'true') config[ck]=true; else if (cv === 'false') config[ck]=false; else if (!isNaN(Number(cv))) config[ck]=Number(cv); else config[ck]=cv; } } }); return config; }
	generateCustomConfigContent(customConfig: any) { let content = '# GPU调速器配置文件\n\n'; content += '[global]\n'; content += '# 全局模式设置: powersave, balance, performance, fast\n'; content += `mode = "${customConfig.global?.mode || 'balance'}"\n`; content += '# 空闲阈值（百分比）\n'; content += `idle_threshold = ${customConfig.global?.idle_threshold ?? 5}\n\n`; const modes = ['powersave','balance','performance','fast']; const modeNames: Record<string,string> = { powersave:'省电模式 - 更高的升频阈值，更激进的降频', balance:'平衡模式 - 默认设置', performance:'性能模式 - 更低的升频阈值，更保守的降频', fast:'极速模式 - 最低的升频阈值，最保守的降频'}; modes.forEach(mode => { content += `# ${modeNames[mode]}\n`; content += `[${mode}]\n`; content += this.generateModeConfigContent(customConfig[mode] || {}); }); return content; }
	generateModeConfigContent(config: any) { let c=''; c += `# 余量\n`; c += `margin = ${config.margin ?? 10}\n`; c += `# 是否使用激进降频策略\n`; c += `aggressive_down = ${config.aggressive_down ? 'true':'false'}\n`; c += `# 采样间隔（毫秒）\n`; c += `sampling_interval = ${config.sampling_interval ?? 16}\n`; c += `# 游戏优化 - 启用游戏特殊内存优化\n`; c += `gaming_mode = ${config.gaming_mode ? 'true':'false'}\n`; c += `# 自适应采样\n`; c += `adaptive_sampling = ${config.adaptive_sampling ? 'true':'false'}\n`; c += `# 自适应采样最小间隔（毫秒）\n`; c += `min_adaptive_interval = ${config.min_adaptive_interval ?? 4}\n`; c += `# 自适应采样最大间隔（毫秒）\n`; c += `max_adaptive_interval = ${config.max_adaptive_interval ?? 20}\n`; c += `# 升频延迟（毫秒）\n`; c += `up_rate_delay = ${config.up_rate_delay ?? 1000}\n`; c += `# 降频延迟（毫秒）\n`; c += `down_rate_delay = ${config.down_rate_delay ?? 5000}\n\n`; return c; }
	setLanguage(language: Lang) { this.currentLanguage = language; }
}
