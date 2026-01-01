/**
 * TOML 游戏配置解析器
 */

import * as toml from "@ltd/j-toml";
import type { GameConfig } from "../types/games";

interface RawGameItem {
	package?: string;
	mode?: string;
	[key: string]: unknown;
}

interface RawGameConfig {
	games?: RawGameItem[];
	[key: string]: unknown;
}

/**
 * 解析 TOML 格式的游戏列表
 */
function parseTomlGames(tomlString: string): GameConfig[] {
	try {
		const config = toml.parse(tomlString) as RawGameConfig;
		if (config.games && Array.isArray(config.games)) {
			return config.games.map((game) => ({
				package: game.package || "",
				mode: game.mode || "balance",
			}));
		}
		return [];
	} catch (_error) {
		// 解析失败时返回空数组，由调用方处理错误提示
		return [];
	}
}

/**
 * 转义 TOML 字符串中的特殊字符
 */
function escapeTomlString(str: string): string {
	return str
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/\t/g, "\\t");
}

/**
 * 将游戏列表序列化为 TOML 格式
 * 使用数组表格格式 [[games]] 而不是内联数组格式
 * 以确保与 Rust toml 库的兼容性
 */
function serializeTomlGames(games: GameConfig[]): string {
	const lines: string[] = ["# GPU调速器游戏列表配置文件", ""];

	for (const game of games) {
		lines.push("[[games]]");
		lines.push(`package = "${escapeTomlString(game.package || "")}"`);
		lines.push(`mode = "${escapeTomlString(game.mode || "balance")}"`);
		lines.push("");
	}

	return lines.join("\n");
}

export const GameParser = {
	parseTomlGames,
	serializeTomlGames,
};
