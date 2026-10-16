import { defineOverridesPreferences } from '@vben/preferences';

export const overridesPreferences = defineOverridesPreferences({
  app: {
    defaultHomePath: '/home',
    dynamicTitle: false,
    layout: 'header-sidebar-nav',
    name: '武鹰制衣·智能工厂',
  },
  breadcrumb: {
    enable: true,
    hideOnlyOne: false,
    showIcon: true,
  },
  logo: {
    source: import.meta.env.BASE_URL + 'wuying-logo.png',
  },
  tabbar: {
    enable: false,
  },
  widget: {
    fullscreen: false,
    globalSearch: false,
    languageToggle: false,
    notification: false,
    refresh: true,
    sidebarToggle: false,
    themeToggle: false,
    timezone: false,
  },
  theme: {
    mode: 'light',
  },
});
