#!/usr/bin/env node
/**
 * 将构建后 webroot/components/*.html 内的片段内联注入 webroot/index.html 对应占位容器，
 * 以便生产环境只使用一个 index.html（减少首次请求数 & 便于离线/本地 file:// 打开）。
 *
 * 处理流程：
 *  1. 读取 ../webroot/index.html
 *  2. 扫描 ../webroot/components/*.html 按映射关系插入到占位 <div id="...-container"></div>
 *     （仅在容器当前为空或只含空白时注入，避免重复内联导致的重复内容）
 *  3. 写回 index.html
 *  4. 删除 ../webroot/components 目录
 *
 * 可重复执行：已内联情况下会跳过。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, rmSync, existsSync } from 'fs';
import { resolve, extname } from 'path';

const DIST_DIR = resolve(process.cwd(), '../webroot');
const INDEX_HTML = resolve(DIST_DIR, 'index.html');
const COMPONENTS_DIR = resolve(DIST_DIR, 'components');

// 文件名 -> 容器 ID 映射
const CONTAINER_MAP = {
  'header.html': 'header-container',
  'status-page.html': 'status-page-container',
  'config-page.html': 'config-page-container',
  'log-page.html': 'log-page-container',
  'settings-page.html': 'settings-page-container',
  'modals.html': 'modals-container',
  'navigation.html': 'navigation-container'
};

function log(msg) { console.log('[postbuild-html]', msg); }
function warn(msg) { console.warn('[postbuild-html]', msg); }
function error(msg) { console.error('[postbuild-html]', msg); }

function collectComponents() {
  if (!existsSync(COMPONENTS_DIR)) {
    warn('components 目录不存在，可能已被删除，跳过内联');
    return [];
  }
  const list = [];
  for (const f of readdirSync(COMPONENTS_DIR)) {
    const full = resolve(COMPONENTS_DIR, f);
    if (extname(f) === '.html' && statSync(full).isFile()) {
      list.push(f);
    }
  }
  return list;
}

function inline() {
  if (!existsSync(INDEX_HTML)) {
    error('未找到 index.html，请先执行 vite build');
    process.exit(1);
  }
  let html = readFileSync(INDEX_HTML, 'utf-8');
  const components = collectComponents();
  if (!components.length) {
    warn('未发现需要内联的组件文件');
  }

  let changed = false;
  for (const file of components) {
    const containerId = CONTAINER_MAP[file];
    if (!containerId) continue; // 忽略未知
    const fragment = readFileSync(resolve(COMPONENTS_DIR, file), 'utf-8').trim();
    // 匹配 <div id="containerId" ...> ... </div>
    const regex = new RegExp(`<div(\\s+[^>]*?)?id=["']${containerId}["'][^>]*>([\\s\\S]*?)</div>`);
    const m = html.match(regex);
    if (!m) {
      warn(`未在 index.html 中找到容器 #${containerId}`);
      continue;
    }
    const inner = m[2];
    if (inner.trim().length > 0) {
      // 已有内容，跳过（说明可能已被内联过）
      continue;
    }
    // 保持缩进：计算匹配到片段开头前的缩进（上一行的空白）
  // m.index 在 Node 正则匹配对象上一定存在（number | undefined），这里做显式回退
  const before = html.slice(0, typeof m.index === 'number' ? m.index : 0);
    const lastLine = before.split(/\n/).pop() || '';
    const indentMatch = lastLine.match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0] + '  ' : '';
    const formatted = '\n' + fragment.split(/\n/).map(l => indent + l).join('\n') + '\n' + indent.slice(0, -2);
    const replacement = m[0].replace(inner, formatted);
    html = html.replace(m[0], replacement);
    changed = true;
    log(`已内联 ${file} -> #${containerId}`);
  }

  if (changed) {
    writeFileSync(INDEX_HTML, html, 'utf-8');
    log('index.html 已更新');
  } else {
    log('未发生修改（可能已内联过）');
  }

  // 删除目录
  if (existsSync(COMPONENTS_DIR)) {
    try { rmSync(COMPONENTS_DIR, { recursive: true, force: true }); log('已删除 components/ 目录'); } catch (e) { warn('删除 components 目录失败: ' + e); }
  }
}

inline();
