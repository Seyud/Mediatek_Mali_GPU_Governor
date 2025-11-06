/**
 * 游戏相关类型定义
 */

export type Lang = "zh" | "en";

export interface GameItem {
	package: string;
	mode: string;
	name?: string; // 应用名称
}

export interface GameConfig {
	package?: string;
	mode?: string;
	name?: string;
	trim?: () => string;
}

export interface TranslationsType {
	[language: string]: {
		[key: string]: string;
	};
}

// WebUI-X 类型定义
export interface WindowWithWebUIX extends Window {
	$packageManager?: {
		getApplicationInfo(
			packageName: string,
			flags: number,
			userId: number
		): {
			getLabel(): string;
		} | null;
		getApplicationIcon(packageName: string, flags: number, userId: number): unknown;
	};
	wrapInputStream?: (stream: unknown) => Promise<Response>;
}

declare const window: WindowWithWebUIX;
