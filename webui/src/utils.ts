// 工具函数模块 (TypeScript 版本)
// 本地声明：若全局声明丢失，保证类型不影响构建
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
				// 开发环境（无 KernelSU）模拟
				console.warn('window.ksu 不存在，返回模拟数据');
				// 简单模拟: 直接 resolve
				// 这里不删除 callbackName 以保持逻辑对称
				// 模拟异步
				setTimeout(() => {
					// @ts-expect-error 调用模拟 callback
						window[callbackName](0, '', '');
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
			console.info('[Toast]', message);
		}
	} catch (error) {
		console.error('Toast 失败:', error);
	}
}
