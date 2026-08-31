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
        // 语言分流：非中文浏览器进中文页自动跳英文；切到与浏览器不符的语言时记忆，切回一致时恢复自动检测
        [
            'script',
            {},
            `            ;(() => {
              try { if (localStorage.getItem('lang-pref:/Mediatek_Mali_GPU_Governor/')) return } catch (e) {}
              const base = '/Mediatek_Mali_GPU_Governor/'
              const path = location.pathname
              if (!path.startsWith(base)) return
              const sub = path.slice(base.length)
              if (sub.startsWith('en/') || sub === 'en') return
              if (!(navigator.language || '').toLowerCase().startsWith('zh')) {
                location.replace(base + 'en/' + sub + location.search + location.hash)
              }
            })()
            ;(() => {
              const base = '/Mediatek_Mali_GPU_Governor/'
              document.addEventListener('click', e => {
                const a = e.target && e.target.closest ? e.target.closest('a') : null
                if (!a) return
                const href = a.getAttribute('href') || ''
                if (!href.startsWith(base)) return
                const sub = href.slice(base.length)
                const cur = location.pathname.slice(base.length)
                const t = sub.startsWith('en/') || sub === 'en'
                const c = cur.startsWith('en/') || cur === 'en'
                if (t !== c) {
                  const lang = t ? 'en' : 'zh'
                  const auto = (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
                  try {
                    if (lang === auto) localStorage.removeItem('lang-pref:/Mediatek_Mali_GPU_Governor/')
                    else localStorage.setItem('lang-pref:/Mediatek_Mali_GPU_Governor/', lang)
                  } catch (err) {}
                }
              })
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
