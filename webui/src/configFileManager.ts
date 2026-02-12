import * as toml from "@ltd/j-toml";
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

interface RawGpuConfigItem {
	freq: number | string;
	volt: number | string;
	ddr_opp: number | string;
}

interface RawConfig {
	freq_table?: RawGpuConfigItem[];
	global?: ModeConfig;
	powersave?: ModeConfig;
	balance?: ModeConfig;
	performance?: ModeConfig;
	fast?: ModeConfig;
	[key: string]: unknown;
}

const normalizePrimitive = (value: unknown): string | number | boolean | undefined => {
	if (typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : undefined;
	if (typeof value === "bigint") return Number(value);
	return undefined;
};

const normalizeModeConfig = (value: unknown): ModeConfig | undefined => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	const normalized: ModeConfig = {};
	Object.entries(value as Record<string, unknown>).forEach(([key, raw]) => {
		const normalizedValue = normalizePrimitive(raw);
		if (normalizedValue !== undefined) normalized[key] = normalizedValue;
	});
	return Object.keys(normalized).length > 0 ? normalized : undefined;
};

export class ConfigFileManager {
	currentLanguage: Lang = "zh";
	async loadGpuConfig() {
		const { errno, stdout } = await exec(`cat ${PATHS.CONFIG_PATH}`);
		if (errno === 0 && stdout.trim()) {
			try {
				const config = toml.parse(stdout) as RawConfig;
				if (config.freq_table && Array.isArray(config.freq_table)) {
					const gpuConfigs: GpuConfig[] = config.freq_table.map((item) => ({
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
		const toInt = (value: number) => {
			if (!Number.isFinite(value)) throw new Error(`Invalid number: ${value}`);
			if (!Number.isInteger(value)) throw new Error(`Value must be an integer: ${value}`);
			return value;
		};
		let content = "";
		try {
			const header = "# GPU 频率表\n# freq 单位: kHz\n# volt 单位: uV\n# ddr_opp: DDR OPP 档位\n\n";
			const lines = [
				"freq_table = [",
				...sortedConfigs.map((c, i) => {
					const suffix = i === sortedConfigs.length - 1 ? "" : ",";
					return `    { freq = ${toInt(c.freq)}, volt = ${toInt(c.volt)}, ddr_opp = ${toInt(c.ddr)} }${suffix}`;
				}),
				"]",
				"",
			];
			content = header + lines.join("\n");
		} catch (error) {
			toast(
				getTranslation("toast_config_parse_error", { error: String(error) }, this.currentLanguage)
			);
			return { success: false, error: "invalid_number" };
		}
		const result = await this.writeFileAtomically(PATHS.CONFIG_PATH, content);
		if (result.errno === 0) {
			toast(getTranslation("toast_freq_table_saved", {}, this.currentLanguage));
			return { success: true };
		}
		toast(getTranslation("toast_freq_table_save_fail", {}, this.currentLanguage));
		return { success: false, error: "save_failed" };
	}

	async loadCustomConfig() {
		const { errno, stdout } = await exec(`cat ${PATHS.CUSTOM_CONFIG_PATH}`);
		if (errno === 0 && stdout.trim()) {
			try {
				const config = toml.parse(stdout) as RawConfig;
				const customConfig: CustomConfig = {};
				const globalConfig = normalizeModeConfig(config.global);
				if (globalConfig) customConfig.global = globalConfig;
				const modes = ["powersave", "balance", "performance", "fast"] as const;
				modes.forEach((mode) => {
					const modeConfig = normalizeModeConfig(config[mode]);
					if (modeConfig) customConfig[mode] = modeConfig;
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
		const tomlConfig: Record<string, ModeConfig> = {};
		if (customConfig.global) tomlConfig.global = customConfig.global;
		const modes = ["powersave", "balance", "performance", "fast"];
		modes.forEach((mode) => {
			if (customConfig[mode]) tomlConfig[mode] = customConfig[mode];
		});
		return header + toml.stringify(tomlConfig, { newline: "\n", newlineAround: "section" });
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
