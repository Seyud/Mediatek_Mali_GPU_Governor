// 工具函数模块
import { exec as ksuExec, toast as ksuToast, spawn } from "kernelsu";

interface ExecResult {
	errno: number;
	stdout: string;
	stderr: string;
}

export function exec(command: string, options: Record<string, unknown> = {}): Promise<ExecResult> {
	return ksuExec(command, options);
}

export function toast(message: string) {
	ksuToast(message);
}

// 导出spawn函数以供其他模块使用
export { spawn };

export function logError(context: string, error: unknown, extra: Record<string, unknown> = {}) {
	const errorObj = error as Error;
	const payload = {
		level: "error",
		context,
		message: errorObj?.message || String(error),
		stack: errorObj?.stack,
		...extra,
	};
	console.error(`[${context}]`, payload);
}
