import type { ExtendedDrawerApi } from '../drawer';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { expect, it } from 'vitest';

import { useVbenDrawer } from '../use-drawer';

it('keeps connected and nested drawer data independent after closing and recreating', async () => {
  let main!: ExtendedDrawerApi;
  let picker!: ExtendedDrawerApi;
  const Content = defineComponent(() => {
    [, main] = useVbenDrawer();
    [, picker] = useVbenDrawer({ title: '班组选择' });
    return () => h('div');
  });
  const [Drawer, api] = useVbenDrawer({
    connectedComponent: Content,
    destroyOnClose: true,
    title: '生产线',
  });
  const app = createApp(() => h(Drawer));
  const host = document.createElement('div');
  app.mount(host);
  try {
    api.setData({ id: 'line-1' }).open();
    expect(main.getData()).toEqual({ id: 'line-1' });
    expect(picker.getData()).toEqual({});
    picker.setData({ ids: ['team-1'] }).open();
    await picker.close();
    picker.onClosed();
    await nextTick();
    expect(main.store.state.isOpen).toBe(true);
    await api.close();
    main.onClosed();
    await nextTick();
    await nextTick();
    api.setData({ id: 'line-2' }).open();
    expect(main.getData()).toEqual({ id: 'line-2' });
    expect(main.store.state.title).toBe('生产线');
    expect(picker.store.state.title).toBe('班组选择');
  } finally {
    app.unmount();
  }
});
