import { createRequire } from 'module'
import { defineConfig } from 'vitepress'

const require = createRequire(import.meta.url)
const pkg = require('vitepress/package.json')

export default defineConfig({
  lang: 'en-US',
  description: 'Advanced GPU governor designed specifically for MediaTek processors.',

  themeConfig: {
    nav: nav(),

    lastUpdatedText: 'Last updated',

    sidebar: {
      '/en/guide/': sidebarGuide()
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Seyud/Mediatek_Mali_GPU_Governor' }
    ],

    footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2024-present Seyud.'
    },

    editLink: {
        pattern: 'https://github.com/Seyud/Mediatek_Mali_GPU_Governor/edit/main/website/docs/:path',
        text: 'Edit this page on GitHub'
    }
  }
})

function nav() {
  return [
    { text: 'Guide', link: '/en/guide/introduction' },
  ]
}

function sidebarGuide() {
  return [
    {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/en/guide/introduction' },
          { text: 'Installation', link: '/en/guide/installation' },
          { text: 'Configuration', link: '/en/guide/configuration' },
          { text: 'User Guide', link: '/en/guide/usage' },
          { text: 'Compatibility', link: '/en/guide/compatibility' },
          { text: 'FAQ', link: '/en/guide/faq' },
        ]
    }
  ]
}
