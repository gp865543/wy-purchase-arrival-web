import { createApp, defineComponent, h, nextTick } from 'vue';

import { expect, it } from 'vitest';

import { FormFieldArray } from '../src';
import { setupVbenForm } from '../src/config';
import { useVbenForm } from '../src/use-vben-form';

it('adds, edits, removes and refills array rows while locked values stay unchanged', async () => {
  setupVbenForm({ config: {}, defineRules: {} });
  const Input = defineComponent({
    props: { modelValue: { type: String, default: '' } },
    emits: ['update:modelValue'],
    setup:
      (props, { emit }) =>
      () =>
        h('input', {
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        }),
  });
  const [Form, api] = useVbenForm({
    showDefaultActions: false,
    schema: [
      {
        component: FormFieldArray,
        fieldName: 'items',
        defaultValue: [{ name: '上衣' }, { name: '衬衫' }],
        componentProps: {
          schema: [{ component: Input, fieldName: 'name', label: '名称' }],
          createRow: () => ({ name: '' }),
        },
      },
    ],
  });
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(Form);
  app.mount(host);
  const flushPromises = async () => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 20));
  };
  const get = (selector: string) => {
    const element = host.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    return element;
  };
  try {
    await flushPromises();
    get('button[aria-label="删除第 1 行"]').click();
    await flushPromises();
    get('button[data-array-add]').click();
    await flushPromises();
    const input = host.querySelectorAll('input')[1];
    if (!input) throw new Error('Missing second row');
    input.value = '马甲';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(await api.getValues()).toEqual({
      items: [{ name: '衬衫' }, { name: '马甲' }],
    });
    api.updateSchema([
      {
        fieldName: 'items',
        componentProps: { sortable: { orderField: 'sortOrder' } },
      },
    ]);
    await flushPromises();
    get('button[aria-label="排序第 1 行，方向键调整"]').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    await flushPromises();
    expect(await api.getValues()).toEqual({
      items: [
        { name: '马甲', sortOrder: 1 },
        { name: '衬衫', sortOrder: 2 },
      ],
    });
    await api.setValues({ items: [{ name: '回填值' }] });
    await flushPromises();
    expect(host.querySelectorAll('input')).toHaveLength(1);
    expect((get('input') as HTMLInputElement).value).toBe('回填值');
    api.setState({ commonConfig: { disabled: true } });
    await flushPromises();
    expect(Boolean(host.querySelector('button[data-array-add]'))).toBe(false);
    expect(
      Boolean(host.querySelector('button[aria-label="删除第 1 行"]')),
    ).toBe(false);
    expect((get('input') as HTMLInputElement).disabled).toBe(true);
    expect(await api.getValues()).toEqual({ items: [{ name: '回填值' }] });
  } finally {
    app.unmount();
    host.remove();
  }
});
