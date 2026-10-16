import { createApp, watchEffect } from 'vue';

import { registerAccessDirective } from '@vben/access';
import { setDefaultDrawerProps } from '@vben/common-ui';
import { registerLoadingDirective } from '@vben/common-ui/es/loading';
import { preferences } from '@vben/preferences';
import { initStores } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/antdv-next';

// Issue #61: register antdv-next globally so `<a-form>`, `<a-row>`,
// `<a-col>`, `<a-input-number>`, `<a-date-picker>`, `<a-table>`,
// `<a-pagination>`, `<a-tag>` etc. resolve to their components
// instead of falling back to unknown HTML tags. Without this the
// filter row collapses to vertical labels and inputs disappear.
import Antd from 'antdv-next';

import { useTitle } from '@vueuse/core';

import { $t, setupI18n } from '#/locales';

import { initComponentAdapter } from './adapter/component';
import { initSetupVbenForm } from './adapter/form';
import App from './app.vue';
import { router } from './router';

import './styles/wuying2-drawer.css';
import './styles/wuying2-form-readonly.css';
import './styles/wuying2-left-tree.css';
import './styles/wuying2-status-radio.css';

async function bootstrap(namespace: string) {
  // 初始化组件适配器
  await initComponentAdapter();

  // 初始化表单组件
  await initSetupVbenForm();

  setDefaultDrawerProps({
    class: 'wuying2-drawer-default',
    contentClass: 'bg-muted',
    confirmText: '保存',
  });

  const app = createApp(App);
  app.use(Antd);

  // 注册v-loading指令
  registerLoadingDirective(app, {
    loading: 'loading', // 在这里可以自定义指令名称，也可以明确提供false表示不注册这个指令
    spinning: 'spinning',
  });

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-tore
  await initStores(app, { namespace });

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化 tippy
  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);

  // 配置路由及路由守卫
  app.use(router);

  // 配置Motion插件
  const { MotionPlugin } = await import('@vben/plugins/motion');
  app.use(MotionPlugin);

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
