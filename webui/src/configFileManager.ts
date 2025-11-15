import { parse as parseTOML, stringify as stringifyTOML } from "smol-toml";
import { PATHS } from "./constants";
import { getTranslation } from "./i18n";
import { exec, toast } from "./utils";

type Lang = "zh" | "en";

export interface GpuConfig {
	freq: number;
	volt: number;
	ddr: number;
}

export interface ModeConfig {
	[key: string]: string | number | boolean;
}

export interface CustomConfig {
	global?: ModeConfig;
	powersave?: ModeConfig;
	balance?: ModeConfig;
	performance?: ModeConfig;
	fast?: ModeConfig;
	[key: string]: ModeConfig | undefined;
}

export class ConfigFileManager {
	currentLanguage: Lang = "zh";
	async loadGpuConfig() {
		const { errno, stdout } = await exec(`cat ${PATHS.CONFIG_PATH}`);
		if (errno === 0 && stdout.trim()) {
			try {
				const config = parseTOML(stdout) as any;
				if (config.freq_table && Array.isArray(config.freq_table)) {
					const gpuConfigs: GpuConfig[] = config.freq_table.map((item: any) => ({
						freq: Number(item.freq),
						volt: Number(item.volt),
						ddr: Number(item.ddr_opp),
					}));
					gpuConfigs.sort((a, b) => a.freq - b.freq);
					return { success: true, data: gpuConfigs };
				}
			} catch (error) {
				toast(
					getTranslation("toast_config_parse_error", { error: String(error) }, this.currentLanguage)
				);
				return { success: false, error: "parse_error" };
			}
		}
		return { success: false, error: "config_not_found" };
	}
	async saveGpuConfig(gpuConfigs: GpuConfig[]) {
		if (!gpuConfigs || gpuConfigs.length === 0) {
			toast(getTranslation("toast_config_empty", {}, this.currentLanguage));
			return { success: false, error: "empty_config" };
		}
		const sortedConfigs = [...gpuConfigs].sort((a, b) => a.freq - b.freq);
		const config = {
			freq_table: sortedConfigs.map((c) => ({
				freq: c.freq,
				volt: c.volt,
				ddr_opp: c.ddr,
			})),
		};
		const header = "# GPU 频率表\n# freq 单位: kHz\n# volt 单位: uV\n# ddr_opp: DDR OPP 档位\n\n";
		const content = header + stringifyTOML(config);
		const result = await this.writeFileAtomically(PATHS.CONFIG_PATH, content);
		if (result.errno === 0) {
			toast(getTranslation("toast_config_saved", {}, this.currentLanguage));
			return { success: true };
		}
		toast(getTranslation("toast_config_save_fail", {}, this.currentLanguage));
		return { success: false, error: "save_failed" };
	}

	async loadCustomConfig() {
		const { errno, stdout } = await exec(`cat ${PATHS.CUSTOM_CONFIG_PATH}`);
		if (errno === 0 && stdout.trim()) {
			try {
				const config = parseTOML(stdout) as any;
				const customConfig: CustomConfig = {};
				if (config.global) customConfig.global = config.global;
				const modes = ["powersave", "balance", "performance", "fast"];
				modes.forEach((mode) => {
					if (config[mode]) customConfig[mode] = config[mode];
				});
				return { success: true, data: customConfig };
			} catch (error) {
				toast(
					getTranslation("toast_config_parse_error", { error: String(error) }, this.currentLanguage)
				);
				return { success: false, error: "parse_error" };
			}
		}
		return { success: false, error: "config_not_found" };
	}
	async saveCustomConfig(customConfig: CustomConfig) {
		const configContent = this.generateCustomConfigContent(customConfig);
		const result = await this.writeFileAtomically(PATHS.CUSTOM_CONFIG_PATH, configContent);
		if (result.errno === 0) {
			toast(getTranslation("toast_config_saved", {}, this.currentLanguage));
			return { success: true };
		}
		toast(getTranslation("toast_config_save_fail", {}, this.currentLanguage));
		return { success: false, error: "save_failed" };
	}
	generateCustomConfigContent(customConfig: CustomConfig) {
		const header = "# GPU调速器配置文件\n\n";
		const tomlConfig: any = {};
		if (customConfig.global) tomlConfig.global = customConfig.global;
		const modes = ["powersave", "balance", "performance", "fast"];
		modes.forEach((mode) => {
			if (customConfig[mode]) tomlConfig[mode] = customConfig[mode];
		});
		return header + stringifyTOML(tomlConfig);
	}
	private async writeFileAtomically(path: string, content: string) {
		const tempPath = `${path}.tmp`;
		const encoded = btoa(unescape(encodeURIComponent(content)));
		const command = `echo '${encoded}' | base64 -d > '${tempPath}' && mv '${tempPath}' '${path}'`;
		const result = await exec(command);
		if (result.errno !== 0) await exec(`rm -f '${tempPath}'`);
		return result;
	}
	setLanguage(language: Lang) {
		this.currentLanguage = language;
	}
}
