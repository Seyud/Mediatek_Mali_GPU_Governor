#!/usr/bin/env node
import crypto from "node:crypto";
/**
 * 合并 public/css/main.css 及其 @import 链接的所有文件，生成单文件 CSS
 * 生产阶段：
 *  1. 递归内联 @import
 *  2. 使用 csso 压缩
 *  3. 根据内容生成短 hash（前 10 位）命名 app-[hash].css
 *  4. 清理旧的 app-*.css
 *  5. 修改 webroot/index.html 中的 link
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as csso from "csso";

const _ROOT = resolve(process.cwd(), ".."); // webui -> repo root
const SRC_CSS_ENTRY = resolve(process.cwd(), "public/css/main.css");
const DIST_DIR = resolve(process.cwd(), "../webroot");
const DIST_INDEX = resolve(DIST_DIR, "index.html");
const ASSETS_DIR = resolve(DIST_DIR, "assets");

function collect(cssPath, seen = new Set()) {
	const real = resolve(cssPath);
	if (seen.has(real)) return "";
	seen.add(real);
	let content = readFileSync(real, "utf-8");
	const baseDir = dirname(real);
	// 解析 @import url('...'); 或 @import '...'; 或 @import "...";
	content = content.replace(/@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;?/g, (_m, p1) => {
		if (/^https?:/.test(p1)) return ""; // 外部链接忽略
		const depPath = resolve(baseDir, p1);
		if (!existsSync(depPath)) {
			console.warn(`[postbuild-css] 未找到依赖: ${depPath}`);
			return "";
		}
		return collect(depPath, seen);
	});
	return `\n/* ==== ${cssPath.replace(/.*public\\/, "")} ==== */\n${content.trim()}\n`;
}

function hashContent(str) {
	return crypto.createHash("sha256").update(str).digest("hex").slice(0, 10);
}

function cleanOldHashed() {
	if (!existsSync(ASSETS_DIR)) return;
	for (const f of readdirSync(ASSETS_DIR)) {
		if (/^app-[0-9a-f]{10}\.css$/.test(f)) {
			try {
				rmSync(resolve(ASSETS_DIR, f));
			} catch {}
		}
	}
}

function run() {
	if (!existsSync(SRC_CSS_ENTRY)) {
		console.error(`[postbuild-css] 未找到入口 CSS: ${SRC_CSS_ENTRY}`);
		process.exit(1);
	}
	if (!existsSync(DIST_INDEX)) {
		console.error("[postbuild-css] 先运行 vite build (未找到 index.html)");
		process.exit(1);
	}
	const merged = collect(SRC_CSS_ENTRY);
	// 压缩
	const minified = csso.minify(merged, { restructure: true }).css;
	const h = hashContent(minified);
	cleanOldHashed();
	const outFile = resolve(ASSETS_DIR, `app-${h}.css`);
	writeFileSync(outFile, minified, "utf-8");
	console.log(`[postbuild-css] 生成压缩 CSS -> ${outFile}`);

	let html = readFileSync(DIST_INDEX, "utf-8");
	// 无论之前是什么（旧 hash 或 main.css）都替换为新的 hashed 文件
	const LINK_RE = /<link[^>]+href="(?:\/css\/main.css|\/assets\/app-[0-9a-f]{10}\.css)"[^>]*>/;
	const newTag = `<link rel="stylesheet" href="/assets/app-${h}.css" />`;
	if (LINK_RE.test(html)) {
		html = html.replace(LINK_RE, newTag);
	} else {
		// 回退策略：插入到 <title> 之后
		html = html.replace(/<title>[\s\S]*?<\/title>/, (m) => `${m}\n  ${newTag}`);
	}
	writeFileSync(DIST_INDEX, html, "utf-8");
	console.log(`[postbuild-css] 更新 index.html link 引用 -> app-${h}.css`);

	// 可选：删除已不再需要的原始拆分样式目录 /css
	const legacyCssDir = resolve(DIST_DIR, "css");
	if (existsSync(legacyCssDir)) {
		try {
			rmSync(legacyCssDir, { recursive: true, force: true });
			console.log("[postbuild-css] 已删除原始 css/ 目录 (legacy multi-file styles)");
		} catch (e) {
			console.warn("[postbuild-css] 删除 css/ 目录失败: ", e);
		}
	}
}

run();
