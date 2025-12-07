/**
 * 应用信息服务
 * 负责获取应用名称和图标
 */

import { getPackagesInfo } from "kernelsu-alt";
import type { WindowWithWebUIX } from "../types/games";

declare const window: WindowWithWebUIX;

// 缓存应用名称，避免重复获取
const appNameCache = new Map<string, string>();

/**
 * 验证应用名称是否有效
 */
function isValidAppName(name: string | null | undefined): name is string {
	if (!name) return false;
	const trimmed = name.trim();
	return trimmed.length > 0 && trimmed.toLowerCase() !== "null";
}

/**
 * 从包名提取友好名称
 */
function getAppNameFromPackage(packageName: string): string {
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
 * 创建图标图片元素
 */
function createIconImage(packageName: string, base64Data: string): HTMLImageElement {
	const img = document.createElement("img");
	img.className = "game-icon-loaded";
	img.src = `data:image/png;base64,${base64Data}`;
	img.alt = packageName;
	return img;
}

/**
 * 应用图标过渡效果
 */
function applyIconTransition(
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
}

/**
 * 动态加载 wrapInputStream 工具
 */
async function loadWrapInputStream(): Promise<void> {
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
function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const uint8Array = new Uint8Array(buffer);
	let binary = "";
	for (const byte of uint8Array) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

/**
 * 获取应用名称
 */
async function fetchAppName(packageName: string): Promise<string> {
	// 检查缓存
	if (appNameCache.has(packageName)) {
		return appNameCache.get(packageName) ?? "";
	}

	try {
		// 1. 优先使用 Native KernelSU API
		const globalWindow = globalThis as unknown as WindowWithWebUIX;
		if (typeof globalWindow.ksu?.getPackagesInfo === "function") {
			try {
				const info = await globalWindow.ksu.getPackagesInfo(packageName);
				if (isValidAppName(info.appLabel)) {
					appNameCache.set(packageName, info.appLabel);
					return info.appLabel;
				}
			} catch (_e) {
				// ignore
			}
		}

		// 2. KernelSU-Next package manager API (via kernelsu-alt)
		try {
			const info = await getPackagesInfo(packageName);
			if (isValidAppName(info.appLabel)) {
				appNameCache.set(packageName, info.appLabel);
				return info.appLabel;
			}
		} catch (_e) {
			// ignore
		}

		// 3. WebUI-X API
		if (typeof window.$packageManager !== "undefined") {
			try {
				const info = window.$packageManager.getApplicationInfo(packageName, 0, 0);
				const appName = info?.getLabel?.();
				if (isValidAppName(appName)) {
					appNameCache.set(packageName, appName);
					return appName;
				}
			} catch (_e) {
				// ignore
			}
		}

		// 最后回退到包名处理
		const fallbackName = getAppNameFromPackage(packageName);
		appNameCache.set(packageName, fallbackName);
		return fallbackName;
	} catch (_error) {
		const fallbackName = getAppNameFromPackage(packageName);
		appNameCache.set(packageName, fallbackName);
		return fallbackName;
	}
}

/**
 * 异步加载应用图标
 */
async function loadAppIcon(
	packageName: string,
	iconContainer: HTMLElement,
	placeholder: HTMLElement
): Promise<void> {
	try {
		// 优先使用新的 KSU API (KernelSU v2.1.2+)
		const globalWindow = globalThis as unknown as WindowWithWebUIX;
		if (typeof globalWindow.ksu?.getPackagesInfo === "function") {
			const img = document.createElement("img");
			img.className = "game-icon-loaded";
			img.alt = packageName;

			img.onload = () => {
				placeholder.style.display = "none";
				img.style.opacity = "1";
				iconContainer.innerHTML = "";
				iconContainer.appendChild(img);
			};

			img.src = `ksu://icon/${packageName}`;
			return;
		}

		// 回退到 WebUI-X API
		if (typeof window.$packageManager !== "undefined") {
			try {
				const stream = window.$packageManager.getApplicationIcon(packageName, 0, 0);
				if (stream) {
					// 动态加载 wrapInputStream 工具
					await loadWrapInputStream();
					const wrapInputStream = window.wrapInputStream;

					if (wrapInputStream) {
						const response = await wrapInputStream(stream);
						const buffer = await response.arrayBuffer();
						const base64 = arrayBufferToBase64(buffer);

						const img = createIconImage(packageName, base64);
						applyIconTransition(img, iconContainer, placeholder);
						return; // 成功使用 API，直接返回
					}
				}
			} catch (_apiError) {
				// API 失败，不再回退到 shell 命令方法
			}
		}
	} catch (_error) {
		// 图标加载失败，使用默认占位符
	}
}

export const AppInfoService = {
	fetchAppName,
	getAppNameFromPackage,
	loadAppIcon,
};
