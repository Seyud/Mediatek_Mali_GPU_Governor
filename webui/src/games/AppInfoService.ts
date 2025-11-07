/**
 * 应用信息服务
 * 负责获取应用名称和图标
 */

import type { WindowWithWebUIX } from "../types/games";
import { exec } from "../utils";

declare const window: WindowWithWebUIX;

export class AppInfoService {
	// 缓存应用名称，避免重复获取
	private static appNameCache: Map<string, string> = new Map();

	/**
	 * 获取应用名称
	 */
	static async fetchAppName(packageName: string): Promise<string> {
		// 检查缓存
		if (AppInfoService.appNameCache.has(packageName)) {
			return AppInfoService.appNameCache.get(packageName) ?? "";
		}

		try {
			// 优先使用 WebUI-X API
			if (typeof window.$packageManager !== "undefined") {
				const info = window.$packageManager.getApplicationInfo(packageName, 0, 0);
				if (info?.getLabel?.()) {
					const appName = info.getLabel();
					AppInfoService.appNameCache.set(packageName, appName);
					return appName;
				}
			}

			// 回退到 shell 命令方法
			const { errno, stdout } = await exec(
				`pm dump ${packageName} 2>/dev/null | grep "label=" | head -1 | sed 's/.*label=//' | cut -d' ' -f1`
			);

			if (errno === 0 && stdout.trim() && stdout.trim() !== "null") {
				const appName = stdout.trim();
				AppInfoService.appNameCache.set(packageName, appName);
				return appName;
			}

			// 再尝试从 APK 获取
			const { errno: pathErrno, stdout: pathStdout } = await exec(
				`pm path ${packageName} 2>/dev/null | head -1 | cut -d':' -f2`
			);

			if (pathErrno === 0 && pathStdout.trim()) {
				const apkPath = pathStdout.trim();
				const { errno: aaptErrno, stdout: aaptStdout } = await exec(
					`aapt dump badging "${apkPath}" 2>/dev/null | grep "application-label:" | head -1 | sed "s/.*application-label:'\\([^']*\\)'.*/\\1/"`
				);

				if (aaptErrno === 0 && aaptStdout.trim()) {
					const appName = aaptStdout.trim();
					AppInfoService.appNameCache.set(packageName, appName);
					return appName;
				}
			}

			// 最后回退到包名处理
			const fallbackName = AppInfoService.getAppNameFromPackage(packageName);
			AppInfoService.appNameCache.set(packageName, fallbackName);
			return fallbackName;
		} catch (_error) {
			const fallbackName = AppInfoService.getAppNameFromPackage(packageName);
			AppInfoService.appNameCache.set(packageName, fallbackName);
			return fallbackName;
		}
	}

	/**
	 * 从包名提取友好名称
	 */
	static getAppNameFromPackage(packageName: string): string {
		const parts = packageName.split(".");
		const lastPart = parts[parts.length - 1];
		// 移除常见的后缀
		const cleanName = lastPart
			.replace(/app$/i, "")
			.replace(/client$/i, "")
			.replace(/mobile$/i, "");
		// 首字母大写，处理驼峰命名
		return (
			cleanName
				.replace(/([A-Z])/g, " $1")
				.trim()
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(" ") || lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
		);
	}

	/**
	 * 异步加载应用图标
	 */
	static async loadAppIcon(
		packageName: string,
		iconContainer: HTMLElement,
		placeholder: HTMLElement
	): Promise<void> {
		try {
			// 优先使用 WebUI-X API
			if (typeof window.$packageManager !== "undefined") {
				try {
					const stream = window.$packageManager.getApplicationIcon(packageName, 0, 0);
					if (stream) {
						// 动态加载 wrapInputStream 工具
						await AppInfoService.loadWrapInputStream();
						const wrapInputStream = window.wrapInputStream;

						if (wrapInputStream) {
							const response = await wrapInputStream(stream);
							const buffer = await response.arrayBuffer();
							const base64 = AppInfoService.arrayBufferToBase64(buffer);

							const img = AppInfoService.createIconImage(packageName, base64);
							AppInfoService.applyIconTransition(img, iconContainer, placeholder);
							return; // 成功使用 API，直接返回
						}
					}
				} catch (_apiError) {
					// API 失败，继续回退到 shell 命令方法
				}
			} // 回退到 shell 命令方法
			const base64Data = await AppInfoService.extractIconFromApk(packageName);
			if (base64Data) {
				const img = AppInfoService.createIconImage(packageName, base64Data);
				AppInfoService.applyIconTransition(img, iconContainer, placeholder);
			}
		} catch (_error) {
			// 图标加载失败，使用默认占位符
		}
	} /**
	 * 从 APK 中提取图标并转换为 base64
	 */
	private static async extractIconFromApk(packageName: string): Promise<string | null> {
		const { errno: pathErrno, stdout: pathStdout } = await exec(
			`pm path ${packageName} 2>/dev/null | head -1 | cut -d':' -f2`
		);

		if (pathErrno !== 0 || !pathStdout.trim()) {
			return null;
		}

		const apkPath = pathStdout.trim();

		const { errno: iconErrno, stdout: iconStdout } = await exec(
			`aapt dump badging "${apkPath}" 2>/dev/null | grep "application-icon-" | tail -1 | sed "s/.*'\\([^']*\\)'.*/\\1/"`
		);

		if (iconErrno !== 0 || !iconStdout.trim()) {
			return null;
		}

		const iconPath = iconStdout.trim();
		const tempFile = `/data/local/tmp/icon_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

		const { errno: unzipErrno } = await exec(
			`unzip -p "${apkPath}" "${iconPath}" > "${tempFile}" 2>/dev/null`
		);

		if (unzipErrno !== 0) {
			await exec(`rm -f "${tempFile}" 2>/dev/null`);
			return null;
		}

		const { errno: base64Errno, stdout: base64Data } = await exec(
			`base64 "${tempFile}" 2>/dev/null`
		);

		await exec(`rm -f "${tempFile}" 2>/dev/null`);

		if (base64Errno === 0 && base64Data.trim()) {
			return base64Data.trim();
		}

		return null;
	}

	/**
	 * 创建图标图片元素
	 */
	private static createIconImage(packageName: string, base64Data: string): HTMLImageElement {
		const img = document.createElement("img");
		img.className = "game-icon-loaded";
		img.src = `data:image/png;base64,${base64Data}`;
		img.alt = packageName;
		return img;
	}

	/**
	 * 应用图标过渡效果
	 */
	private static applyIconTransition(
		img: HTMLImageElement,
		iconContainer: HTMLElement,
		placeholder: HTMLElement
	): void {
		img.onload = () => {
			placeholder.style.opacity = "0";
			placeholder.style.transition = "opacity 0.3s ease";

			setTimeout(() => {
				iconContainer.innerHTML = "";
				img.style.opacity = "0";
				iconContainer.appendChild(img);

				requestAnimationFrame(() => {
					img.style.transition = "opacity 0.3s ease";
					img.style.opacity = "1";
				});
			}, 300);
		};

		img.onerror = () => {
			// 图标加载失败
		};
	}

	/**
	 * 动态加载 wrapInputStream 工具
	 */
	private static async loadWrapInputStream(): Promise<void> {
		if (typeof window.wrapInputStream === "undefined") {
			try {
				// 使用 eval 避免编译时检查
				const moduleUrl = "https://mui.kernelsu.org/internal/assets/ext/wrapInputStream.mjs";
				const importFn = new Function("url", "return import(url)");
				const module = await importFn(moduleUrl);
				window.wrapInputStream = module.wrapInputStream;
			} catch (_error) {
				// 加载失败
			}
		}
	}

	/**
	 * ArrayBuffer 转 Base64
	 */
	private static arrayBufferToBase64(buffer: ArrayBuffer): string {
		const uint8Array = new Uint8Array(buffer);
		let binary = "";
		for (const byte of uint8Array) {
			binary += String.fromCharCode(byte);
		}
		return btoa(binary);
	}
}
