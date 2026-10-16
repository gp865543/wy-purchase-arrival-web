import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/blank/index.vue'),
    meta: { affixTab: true, icon: 'lucide:file', title: '首页' },
    name: 'BlankHome',
    path: '/home',
  },
];

export default routes;
