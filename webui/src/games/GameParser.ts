/**
 * TOML 游戏配置解析器
 */

import type { GameConfig } from "../types/games";

export class GameParser {
	/**
	 * 解析 TOML 格式的游戏列表
	 */
	static parseTomlGames(tomlString: string): GameConfig[] {
		const games: GameConfig[] = [];
		const lines = tomlString.split("\n");
		let currentGame: GameConfig | null = null;

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;

			if (trimmed.startsWith("[[games]]")) {
				if (currentGame) games.push(currentGame);
				currentGame = {};
				continue;
			}

			if (currentGame && trimmed.includes("=")) {
				const [k, v] = trimmed.split("=");
				const ck = k.trim();
				const cv = v.trim().replace(/"/g, "");
				if (ck === "package") currentGame.package = cv;
				else if (ck === "mode") currentGame.mode = cv;
			}
		}

		if (currentGame) games.push(currentGame);
		return games;
	}

	/**
	 * 将游戏列表序列化为 TOML 格式
	 */
	static serializeTomlGames(games: GameConfig[]): string {
		let content = "# GPU调速器游戏列表配置文件\n\n";

		games.forEach((game) => {
			content += "[[games]]\n";
			content += `package = "${game.package}"\n`;
			content += `mode = "${game.mode || "balance"}"\n\n`;
		});

		return content;
	}
}
