import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/purchase-arrival/receipts',
    name: 'PurchaseArrivalReceiptList',
    component: () => import('#/views/receipts/ReceiptList.vue'),
    meta: {
      affixTab: false,
      icon: 'lucide:package',
      title: '收货记录',
    },
  },
  {
    path: '/purchase-arrival/purchase-orders/:poId',
    name: 'PurchaseArrivalPoOverview',
    component: () => import('#/views/po/PoOverview.vue'),
    meta: {
      affixTab: false,
      icon: 'lucide:trending-up',
      title: '采购订单视角',
      hideInMenu: true,
    },
  },
];

export default routes;
