import { createRequire } from 'module'
import { defineConfig } from 'vitepress'

const require = createRequire(import.meta.url)
const pkg = require('vitepress/package.json')

export default defineConfig({
  lang: 'zh',
  description: '专为联发科处理器设计的先进 GPU 调速器。',

  themeConfig: {
    nav: nav(),

    lastUpdatedText: '最后更新',

    sidebar: {
      '/zh/guide/': sidebarGuide()
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Seyud/Mediatek_Mali_GPU_Governor' }
    ],

    footer: {
        message: '在 MIT 许可证下发布。',
        copyright: 'Copyright © 2024-现在 Seyud。'
    },

    editLink: {
        pattern: 'https://github.com/Seyud/Mediatek_Mali_GPU_Governor/edit/main/website/docs/:path',
        text: '在 GitHub 中编辑本页'
    }
  }
})

function nav() {
  return [
    { text: '指南', link: '/zh/guide/introduction' },
  ]
}

function sidebarGuide() {
  return [
    {
        text: '指南',
        items: [
          { text: '简介', link: '/zh/guide/introduction' },
          { text: '安装指南', link: '/zh/guide/installation' },
          { text: '配置指南', link: '/zh/guide/configuration' },
          { text: '使用指南', link: '/zh/guide/usage' },
          { text: '设备兼容性', link: '/zh/guide/compatibility' },
          { text: '常见问题', link: '/zh/guide/faq' },
        ]
    }
  ]
}
