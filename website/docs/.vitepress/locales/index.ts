import { defineConfig } from 'vitepress'
import en from './en'
import zh from './zh'

export default defineConfig({
  locales: {
    root: {
      label: '中文',
      lang: zh.lang,
      themeConfig: zh.themeConfig,
      description: zh.description
    },
    zh: {
      label: '中文',
      lang: zh.lang,
      themeConfig: zh.themeConfig,
      description: zh.description
    },
    en: {
      label: 'English',
      lang: en.lang,
      themeConfig: en.themeConfig,
      description: en.description
    }
  }
})
