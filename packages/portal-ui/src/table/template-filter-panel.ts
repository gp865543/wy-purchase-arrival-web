import type { Dayjs } from 'dayjs';

import type { TemplateGridCondition } from './template-grid-query';

import { defineComponent, h, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  message,
  Select,
} from 'antdv-next';
import dayjs from 'dayjs';

import { validateTemplateGridCondition } from './template-grid-query';

// 弹层必须挂到筛选面板容器内，否则 VXE 的全局 mousedown 会把面板当作外部点击关闭。
function popupContainer(trigger: HTMLElement) {
  return (
    trigger.closest('.vxe-table--filter-wrapper') ??
    (trigger.ownerDocument.body as HTMLElement)
  );
}

/**
 * 普通筛选面板的自定义模板（#50）。
 *
 * 通过 VXE column.filterRender 渲染；面板内保留草稿，
 * 确定时校验并提交列条件，清空时移除该列条件。
 */
export interface TemplateFilterPanelConfig {
  field?: string;
  label?: string;
  multiple?: boolean;
  options?: Array<{ label: string; value: unknown }>;
  placeholder?: string;
  type: 'date-range' | 'number-range' | 'select' | 'text';
}

export interface TemplateFilterPanelProps {
  apply: (condition?: TemplateGridCondition) => void;
  close: () => void;
  config: TemplateFilterPanelConfig;
  getValue: () => TemplateGridCondition | undefined;
  reset: () => void;
}

interface DateRangeDraft {
  max?: Dayjs;
  min?: Dayjs;
}

function toDayjs(value: unknown): Dayjs | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const TemplateFilterPanel = defineComponent({
  name: 'TemplateFilterPanel',
  props: {
    apply: { type: Function as any, required: true },
    close: { type: Function as any, required: true },
    config: { type: Object as any, required: true },
    getValue: { type: Function as any, required: true },
    reset: { type: Function as any, required: true },
  },
  setup(props: TemplateFilterPanelProps) {
    const current = props.getValue();
    const type = props.config.type;
    const draftText = ref(
      current?.operator === 'contains' ? String(current.value) : '',
    );
    const draftSelect = ref<unknown[]>(
      current?.operator === 'in' && Array.isArray(current.value)
        ? [...current.value]
        : [],
    );
    const draftMin = ref<number | undefined>(
      current?.operator === 'between'
        ? toNumber((current.value as { min?: number | string }).min)
        : undefined,
    );
    const draftMax = ref<number | undefined>(
      current?.operator === 'between'
        ? toNumber((current.value as { max?: number | string }).max)
        : undefined,
    );
    const draftDate = ref<DateRangeDraft>({
      max:
        type === 'date-range' && current?.operator === 'between'
          ? toDayjs((current.value as { max?: string }).max)
          : undefined,
      min:
        type === 'date-range' && current?.operator === 'between'
          ? toDayjs((current.value as { min?: string }).min)
          : undefined,
    });

    function buildCondition(): TemplateGridCondition | undefined {
      const field = props.config.field ?? '';
      if (type === 'text') {
        const value = draftText.value.trim();
        if (!value) return undefined;
        return { field, operator: 'contains', value };
      }
      if (type === 'select') {
        if (draftSelect.value.length === 0) return undefined;
        return { field, operator: 'in', value: [...draftSelect.value] };
      }
      if (type === 'date-range') {
        const { max, min } = draftDate.value;
        if (!min && !max) return undefined;
        return {
          field,
          operator: 'between',
          value: {
            min: min?.format('YYYY-MM-DD'),
            max: max?.format('YYYY-MM-DD'),
          },
        };
      }
      if (draftMin.value === undefined && draftMax.value === undefined)
        return undefined;
      return {
        field,
        operator: 'between',
        value: {
          min:
            draftMin.value === null || draftMin.value === undefined
              ? undefined
              : draftMin.value,
          max:
            draftMax.value === null || draftMax.value === undefined
              ? undefined
              : draftMax.value,
        },
      };
    }

    function applyDraft() {
      const condition = buildCondition();
      const error = condition
        ? validateTemplateGridCondition({
            ...condition,
            field: props.config.label ?? condition.field,
          })
        : null;
      if (error) {
        message.warning(error);
        return;
      }
      props.apply(condition);
      props.close();
    }

    function resetDraft() {
      props.reset();
      props.close();
    }

    function renderControl() {
      const common = {
        'aria-label': props.config.label ?? '筛选条件',
        style: { width: '100%' },
      };
      if (type === 'text') {
        return h(Input, {
          ...common,
          allowClear: true,
          'onUpdate:value': (value: any) => (draftText.value = value),
          placeholder: props.config.placeholder ?? '输入关键字',
          value: draftText.value,
        });
      }
      if (type === 'select') {
        return h(Select as any, {
          ...common,
          getPopupContainer: popupContainer,
          mode: props.config.multiple ? 'multiple' : undefined,
          onChange: (value: any) => {
            if (Array.isArray(value)) {
              draftSelect.value = value;
              return;
            }
            draftSelect.value =
              value === null || value === undefined ? [] : [value];
          },
          options: props.config.options ?? [],
          placeholder: props.config.placeholder ?? '选择选项',
          value: draftSelect.value,
        });
      }
      if (type === 'number-range') {
        return h('div', { class: 'flex items-center gap-2' }, [
          h(InputNumber, {
            'aria-label': '最小值',
            class: 'min-w-0 flex-1',
            onChange: (value: any) => (draftMin.value = value ?? undefined),
            placeholder: '最小',
            value: draftMin.value,
          }),
          h('span', { class: 'text-muted-foreground' }, '至'),
          h(InputNumber, {
            'aria-label': '最大值',
            class: 'min-w-0 flex-1',
            onChange: (value: any) => (draftMax.value = value ?? undefined),
            placeholder: '最大',
            value: draftMax.value,
          }),
        ]);
      }
      return h('div', { class: 'flex items-center gap-2' }, [
        h(DatePicker as any, {
          'aria-label': '开始日期',
          allowClear: true,
          class: 'min-w-0 flex-1',
          getPopupContainer: popupContainer,
          'onUpdate:value': (value: any) =>
            (draftDate.value = { ...draftDate.value, min: value }),
          placeholder: '开始日期',
          value: draftDate.value.min,
        }),
        h('span', { class: 'text-muted-foreground' }, '至'),
        h(DatePicker as any, {
          'aria-label': '结束日期',
          allowClear: true,
          class: 'min-w-0 flex-1',
          getPopupContainer: popupContainer,
          'onUpdate:value': (value: any) =>
            (draftDate.value = { ...draftDate.value, max: value }),
          placeholder: '结束日期',
          value: draftDate.value.max,
        }),
      ]);
    }

    return () =>
      h('div', { class: 'w-[260px] p-3' }, [
        renderControl(),
        h('div', { class: 'mt-3 flex justify-end gap-2' }, [
          h(
            Button,
            {
              'aria-label': '确定',
              onClick: applyDraft,
              size: 'small',
              type: 'primary',
            },
            () => '确定',
          ),
          h(
            Button,
            { 'aria-label': '清空', onClick: resetDraft, size: 'small' },
            () => '清空',
          ),
        ]),
      ]);
  },
});
