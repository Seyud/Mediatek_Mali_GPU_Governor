// 入口文件：负责动态加载组件然后初始化 MainApp
import { MainApp } from './MainApp';

async function loadComponent(url: string, containerId: string) {
	try {
		const response = await fetch(url);
		if (response.ok) {
			const html = await response.text();
			const el = document.getElementById(containerId);
			if (el) el.innerHTML = html;
		} else {
			console.error(`加载组件失败 ${url}: ${response.status}`);
		}
	} catch (error) {
		console.error(`加载组件异常 ${url}:`, error);
	}
}

document.addEventListener('DOMContentLoaded', async () => {
	// 兼容性判断：某些非 Vite 环境下 import.meta 可能不含 env
	const isDev = Boolean((import.meta as any)?.env?.DEV);
	if (isDev) {
		// 开发模式仍使用动态加载，方便热更新与独立编辑
		await loadComponent('components/header.html', 'header-container');
		await loadComponent('components/status-page.html', 'status-page-container');
		await loadComponent('components/config-page.html', 'config-page-container');
		await loadComponent('components/log-page.html', 'log-page-container');
		await loadComponent('components/settings-page.html', 'settings-page-container');
		await loadComponent('components/modals.html', 'modals-container');
		await loadComponent('components/navigation.html', 'navigation-container');
	} else {
		// 生产模式：片段已在 postbuild-html 阶段内联
		console.debug('[main] 生产模式：跳过组件动态加载（已内联）');
	}
	const app = new MainApp();
	await app.init();
});
