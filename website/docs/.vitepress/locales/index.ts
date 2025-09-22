import { defineConfig } from 'vitepress'
import en from './en'
import zh_CN from './zh'

export default defineConfig({
  locales: {
    'zh': {
      label: '简体中文',
      lang: zh_CN.lang,
      themeConfig: zh_CN.themeConfig,
      description: zh_CN.description
    },
    en: {
      label: 'English',
      lang: en.lang,
      themeConfig: en.themeConfig,
      description: en.description
    }
  }
})
