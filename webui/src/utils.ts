// 工具函数模块
import { exec as ksuExec, toast as ksuToast, spawn } from "kernelsu";

interface ExecResult {
	errno: number;
	stdout: string;
	stderr: string;
}

export function exec(command: string, options: Record<string, unknown> = {}): Promise<ExecResult> {
	try {
		// 使用kernelsu包的exec函数，提供fallback机制
		if (window?.ksu) {
			return ksuExec(command, options);
		} else {
			console.warn("KernelSU环境不存在，返回模拟数据");
			return Promise.resolve({ errno: 0, stdout: "", stderr: "" });
		}
	} catch (error) {
		console.error("exec执行失败:", error);
		return Promise.reject(error);
	}
}

export function toast(message: string) {
	try {
		// 使用kernelsu包的toast函数，提供fallback机制
		if (window?.ksu) {
			ksuToast(message);
		} else {
			console.info("[Toast]", message);
		}
	} catch (error) {
		console.error("Toast 失败:", error);
	}
}

// 导出spawn函数以供其他模块使用
export { spawn };

export function logError(context: string, error: unknown, extra: Record<string, unknown> = {}) {
	try {
		const errorObj = error as Error;
		const payload = {
			level: "error",
			context,
			message: errorObj?.message || String(error),
			stack: errorObj?.stack,
			...extra,
		};
		console.error(`[${context}]`, payload);
	} catch (e) {
		// 最终兜底，避免日志本身抛错
		console.error("logError failed", e);
	}
}

// 通用执行包装：捕获异常并返回统一结果
export async function withResult<T>(
	fn: () => Promise<T> | T,
	context: string
): Promise<{ ok: true; data: T } | { ok: false; error: unknown; context: string }> {
	try {
		const data = await fn();
		return { ok: true, data };
	} catch (error) {
		logError(context, error);
		return { ok: false, error, context };
	}
}
