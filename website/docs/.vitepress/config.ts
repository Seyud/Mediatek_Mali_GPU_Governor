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
    head: [
        ['link', { rel: 'icon', href: '/logo.png' }],
        ['meta', { name: 'theme-color', content: '#646cff' }],
    ],
    sitemap: {
        hostname: 'https://seyud.github.io/Mediatek_Mali_GPU_Governor'
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
