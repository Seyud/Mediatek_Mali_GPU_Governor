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
 * 将游戏列表序列化为 TOML 格式
 */
function serializeTomlGames(games: GameConfig[]): string {
	const header = "# GPU调速器游戏列表配置文件\n\n";
	const config = {
		games: games.map((game) => ({
			package: game.package,
			mode: game.mode || "balance",
		})),
	};
	return header + toml.stringify(config);
}

export const GameParser = {
	parseTomlGames,
	serializeTomlGames,
};
