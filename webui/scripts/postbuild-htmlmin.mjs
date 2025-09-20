#!/usr/bin/env node
/**
 * 压缩 webroot/index.html：删除多余空白 / 注释 / 内联压缩（不破坏已有模板结构）。
 * 运行时机：在 postbuild-html 与 postbuild-css 之后执行。
 */
import { readFileSync, writeFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { minify } from 'html-minifier-terser';

const DIST_DIR = resolve(process.cwd(), '../webroot');
const INDEX_HTML = resolve(DIST_DIR, 'index.html');

async function run() {
  let original;
  try { original = readFileSync(INDEX_HTML, 'utf-8'); } catch { console.error('[postbuild-htmlmin] 读取 index.html 失败'); process.exit(1); }
  const beforeSize = Buffer.byteLength(original, 'utf-8');
  const minified = await minify(original, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: false,
    keepClosingSlash: true,
    minifyCSS: false, // CSS 已单独处理
    minifyJS: false,  // JS 由 Vite 处理
    sortAttributes: true,
    sortClassName: false
  });
  const afterSize = Buffer.byteLength(minified, 'utf-8');
  if (afterSize < beforeSize) {
    writeFileSync(INDEX_HTML, minified, 'utf-8');
    console.log(`[postbuild-htmlmin] 压缩完成: ${beforeSize}B -> ${afterSize}B (节省 ${(100 - afterSize / beforeSize * 100).toFixed(2)}%)`);
  } else {
    console.log('[postbuild-htmlmin] 压缩后体积未减少，保持原文件');
  }
}
run();
