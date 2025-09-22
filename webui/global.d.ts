// 为 Vite 提供的 import.meta.env 简单声明，避免 TS 报错
interface ImportMetaEnv {
	readonly DEV: boolean;
	readonly PROD: boolean;
	// 可按需继续扩展
}

declare global {
	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}

	interface ExecResult {
		errno: number;
		stdout: string;
		stderr: string;
	}
}

// KernelSU 原生API
interface KsuAPI {
	exec(command: string, optionsJson: string, callbackName: string): void;
	toast(message: string): void;
	spawn(command: string, argsJson: string, optionsJson: string, childCallbackName: string): void;
	fullScreen(isFullScreen: boolean): void;
}

declare global {
	interface Window {
		ksu: KsuAPI;
	}
}

export {};
