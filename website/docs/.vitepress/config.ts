import { defineConfig } from 'vitepress'
import locales from './locales'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig( {
    title: 'Mediatek Mali GPU Governor',
    base: '/Mediatek_Mali_GPU_Governor/',
    locales: locales.locales,
    srcExclude: ['**/_includes/**'],
    head: [
        ['link', { rel: 'icon', href: '/Mediatek_Mali_GPU_Governor/logo.png' }],
        ['meta', { name: 'theme-color', content: '#0d84ff' }],
        ['style', {}, `
        :root {
          --vp-c-brand-1: #0d84ff;
          --vp-c-brand-2: #0d84ff;
          --vp-c-brand-3: #0d84ff;
          --vp-c-brand-soft: rgba(13, 132, 255, 0.14);
          --vp-c-text-accent-1: #0d84ff;
          --vp-button-brand-bg: #0d84ff;
          --vp-button-brand-hover-bg: #0a6edb;
        }
        .dark {
          --vp-c-brand-1: #0d84ff;
          --vp-c-brand-2: #0d84ff;
          --vp-c-brand-3: #0d84ff;
          --vp-c-brand-soft: rgba(13, 132, 255, 0.16);
          --vp-c-text-accent-1: #0d84ff;
          --vp-button-brand-bg: #0d84ff;
          --vp-button-brand-hover-bg: #3a9bff;
        }
        `],
        // Cloudflare Web Analytics
        [
            'script',
            {
                type: 'module',
                src: 'https://static.cloudflareinsights.com/beacon.min.js',
                'data-cf-beacon': JSON.stringify({ token: '7a60b306ee8f46f38f2699681b26453e' })
            }
        ],
        // 语言分流：有记忆时按记忆语言主动跳转对应版本；无记忆时非中文浏览器自动跳英文
        [
            'script',
            {},
            `                        ;(() => {
              const base = '/Mediatek_Mali_GPU_Governor/'
              const KEY = 'lang-pref:/Mediatek_Mali_GPU_Governor/'
              const LAST = 'lang-last:/Mediatek_Mali_GPU_Governor/'
              const FLAG = 'lang-redir:/Mediatek_Mali_GPU_Governor/'
              const path = location.pathname
              if (!path.startsWith(base)) return
              const sub = path.slice(base.length)
              const cur = sub.startsWith('en/') || sub === 'en'
              const auto = (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
              let pref = null
              try { pref = localStorage.getItem(KEY) } catch (e) {}
              try {
                // 跨语言落地检测：站内语言链接跳转而来（referrer 同源、非前进/后退）
                // 即使用户的点击事件被翻译类扩展拦截，原生导航仍会发生，此检测兜底
                const last = sessionStorage.getItem(LAST)
                if (sessionStorage.getItem(FLAG) !== null) {
                  sessionStorage.removeItem(FLAG)
                } else if (last !== null && last !== (cur ? 'en' : 'zh')) {
                  const nav = performance.getEntriesByType('navigation')[0]
                  const ref = document.referrer
                  const internal = !!ref && new URL(ref).origin === location.origin
                  if (internal && (!nav || nav.type !== 'back_forward')) {
                    const now = cur ? 'en' : 'zh'
                    if (now === auto) { localStorage.removeItem(KEY); pref = null }
                    else { localStorage.setItem(KEY, now); pref = now }
                  }
                }
                sessionStorage.setItem(LAST, cur ? 'en' : 'zh')
              } catch (e) {}
              const go = u => {
                try { sessionStorage.setItem(FLAG, '1') } catch (e) {}
                location.replace(u)
              }
              if (pref === 'zh' || pref === 'en') {
                if (pref === 'en' && !cur) {
                  go(base + 'en/' + sub + location.search + location.hash)
                } else if (pref === 'zh' && cur) {
                  let rest = sub === 'en' ? '' : sub.slice(3)
                  go(base + rest + location.search + location.hash)
                }
                return
              }
              if (!cur && auto !== 'zh') {
                go(base + 'en/' + sub + location.search + location.hash)
              }
            })()
            ;(() => {
              const base = '/Mediatek_Mali_GPU_Governor/'
              const KEY = 'lang-pref:/Mediatek_Mali_GPU_Governor/'
              const onPick = e => {
                const a = e.target && e.target.closest ? e.target.closest('a') : null
                if (!a) return
                const href = a.getAttribute('href') || ''
                let sub = null
                if (href.startsWith(base)) sub = href.slice(base.length)
                else {
                  try {
                    const u = new URL(href, location.origin)
                    if (u.origin === location.origin && u.pathname.startsWith(base)) sub = u.pathname.slice(base.length)
                  } catch (err) {}
                }
                if (sub === null) return
                const cur = location.pathname.slice(base.length)
                const t = sub.startsWith('en/') || sub === 'en'
                const c = cur.startsWith('en/') || cur === 'en'
                if (t !== c) {
                  const lang = t ? 'en' : 'zh'
                  const auto = (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
                  try {
                    if (lang === auto) localStorage.removeItem(KEY)
                    else localStorage.setItem(KEY, lang)
                  } catch (err) {}
                }
              }
              // window 捕获阶段注册早于一切内容脚本，先于扩展的事件拦截
              window.addEventListener('click', onPick, true)
              window.addEventListener('pointerdown', onPick, true)
            })()`
        ]
    ],
    sitemap: {
        hostname: 'https://seyud.github.io/Mediatek_Mali_GPU_Governor/'
    },
    markdown: {
        config: (md) => {
            // 自定义处理 @@include 语法
            md.use((md) => {
                const defaultRender = md.render
                md.render = function(src, env) {
                    // 处理 @@include 语法
                    src = src.replace(/@@include\(([^)]+)\)/g, (match, includePath) => {
                        try {
                            // __dirname 是 .vitepress 目录，所以 docs 目录是上一级
                            const docsDir = path.dirname(__dirname)
                            
                            // 处理相对路径，移除开头的 ../
                            const relativePath = includePath.replace(/^\.\.\//, '')
                            const fullPath = path.join(docsDir, relativePath)
                            
                            return fs.readFileSync(fullPath, 'utf-8')
                        } catch (e) {
                            console.warn(`Failed to include file: ${includePath}, error: ${e}`)
                            return match
                        }
                    })
                    return defaultRender.call(this, src, env)
                }
            })
        }
    }
})
