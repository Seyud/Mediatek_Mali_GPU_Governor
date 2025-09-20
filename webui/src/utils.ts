// 工具函数模块
interface ExecResult {
	errno: number;
	stdout: string;
	stderr: string;
}

export function exec(command: string, options: Record<string, unknown> = {}): Promise<ExecResult> {
	return new Promise((resolve, reject) => {
		try {
			const callbackName = `exec_callback_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
			// @ts-expect-error 运行环境中提供 ksu
			window[callbackName] = (errno: number, stdout: string, stderr: string) => {
				resolve({ errno, stdout, stderr });
				// @ts-expect-error 删除动态挂载
				delete window[callbackName];
			};
			if ((window as any).ksu) {
				(window as any).ksu.exec(command, JSON.stringify(options), callbackName);
			} else {
				console.warn("window.ksu 不存在，返回模拟数据");
				setTimeout(() => {
					// @ts-expect-error 调用模拟 callback
					window[callbackName](0, "", "");
				}, 10);
			}
		} catch (error) {
			reject(error);
		}
	});
}

export function toast(message: string) {
	try {
		if ((window as any).ksu) {
			(window as any).ksu.toast(message);
		} else {
			console.info("[Toast]", message);
		}
	} catch (error) {
		console.error("Toast 失败:", error);
	}
}

export function logError(context: string, error: any, extra: Record<string, unknown> = {}) {
	try {
		const payload = {
			level: "error",
			context,
			message: error?.message || String(error),
			stack: error?.stack,
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
): Promise<{ ok: true; data: T } | { ok: false; error: any; context: string }> {
	try {
		const data = await fn();
		return { ok: true, data };
	} catch (error) {
		logError(context, error);
		return { ok: false, error, context };
	}
}
