<script setup lang="ts">
import type { Sortable } from '@vben-core/composables';

import type { FormSchema } from '../types';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { useSortable } from '@vben-core/composables';
import { GripVertical, Plus, X } from '@vben-core/icons';
import {
  VbenButton,
  VbenIconButton,
  VbenRenderContent,
} from '@vben-core/shadcn-ui';
import {
  cloneDeep,
  mergeWithArrayOverride,
  set,
} from '@vben-core/shared/utils';

import { useFieldArray } from 'vee-validate';

import { DEFAULT_FORM_COMMON_CONFIG } from '../config';
import { injectRenderFormProps } from '../form-render/context';
import FormField from '../form-render/form-field.vue';

defineOptions({ name: 'VbenFormFieldArray', inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    columnWidths?: string[];
    createRow?: () => Record<string, any>;
    disabled?: boolean;
    max?: number;
    min?: number;
    name: string;
    schema: FormSchema[];
    sortable?: boolean | { orderField: string };
  }>(),
  {
    columnWidths: undefined,
    createRow: undefined,
    disabled: false,
    min: 0,
    max: Infinity,
    sortable: false,
  },
);
const { fields, push, remove, move, update } = useFieldArray<
  Record<string, any>
>(() => props.name);
const context = injectRenderFormProps();
const rowsRef = ref<HTMLElement>();
const editable = computed(() => !props.disabled);
const gridStyle = computed(() => ({
  gridTemplateColumns: [
    ...(editable.value && props.sortable ? ['2.5rem'] : []),
    ...props.schema.map(
      (_, index) => props.columnWidths?.[index] ?? 'minmax(0, 1fr)',
    ),
    ...(editable.value ? ['3rem'] : []),
  ].join(' '),
}));
function rowSchema(schema: FormSchema, index: number) {
  const form = context.form;
  if (!form) throw new Error('FormFieldArray requires a Vben Form');
  const common = mergeWithArrayOverride(
    context.commonConfig ?? {},
    DEFAULT_FORM_COMMON_CONFIG,
  );
  return {
    ...common,
    ...schema,
    commonComponentProps: {
      'aria-label':
        typeof schema.label === 'string' ? schema.label : schema.fieldName,
      ...(typeof common.componentProps === 'function'
        ? common.componentProps(form.values, form)
        : (common.componentProps ?? {})),
    },
    fieldName: `${props.name}[${index}].${schema.fieldName}`,
    disabled: props.disabled || schema.disabled,
    hideLabel: true,
  };
}
function addRow() {
  if (props.disabled || fields.value.length >= props.max) return;
  const row: Record<string, any> = {};
  for (const col of props.schema)
    set(row, col.fieldName, cloneDeep(col.defaultValue ?? null));
  push(props.createRow?.() ?? row);
  renumber();
}
function renumber() {
  if (typeof props.sortable !== 'object') return;
  const { orderField } = props.sortable;
  fields.value.forEach((field, index) =>
    update(index, { ...field.value, [orderField]: index + 1 }),
  );
}
function removeRow(index: number) {
  if (props.disabled || fields.value.length <= props.min) return;
  remove(index);
  renumber();
}
function moveRow(from: number, to: number) {
  if (props.disabled || to < 0 || to >= fields.value.length) return;
  move(from, to);
  renumber();
}
let sortableInstance: Sortable | undefined;
function destroy() {
  sortableInstance?.destroy();
  sortableInstance = undefined;
}
watch(
  () => editable.value && Boolean(props.sortable),
  async (enabled, _, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
      destroy();
    });
    if (!enabled) return;
    await nextTick();
    if (cancelled || !rowsRef.value) return;
    const { initializeSortable } = useSortable(rowsRef.value, {
      handle: '.vben-form-array__drag-handle',
      onEnd({ item, oldIndex, newIndex }) {
        if (oldIndex === undefined || newIndex === undefined) return;
        const siblings = [...(rowsRef.value?.children ?? [])].filter(
          (row) => row !== item,
        );
        const target = siblings[oldIndex];
        if (target) target.before(item);
        else rowsRef.value?.append(item);
        moveRow(oldIndex, newIndex);
      },
    });
    const instance = await initializeSortable();
    if (cancelled) instance.destroy();
    else sortableInstance = instance;
  },
  { immediate: true, flush: 'post' },
);
onBeforeUnmount(destroy);
</script>

<template>
  <div class="w-full" :class="$attrs.class">
    <div class="overflow-x-auto rounded-md border">
      <div class="bg-muted grid gap-2 border-b p-2" :style="gridStyle">
        <span v-if="editable && sortable"></span>
        <div v-for="column in schema" :key="column.fieldName">
          <VbenRenderContent :content="column.label" />
        </div>
        <span v-if="editable">操作</span>
      </div>
      <div ref="rowsRef" data-form-array-rows>
        <div
          v-for="(field, index) in fields"
          :key="field.key"
          class="grid gap-2 border-b p-2 last:border-0"
          :style="gridStyle"
        >
          <button
            v-if="editable && sortable"
            type="button"
            class="vben-form-array__drag-handle cursor-grab"
            :aria-label="`排序第 ${index + 1} 行，方向键调整`"
            @keydown.up.prevent="moveRow(index, index - 1)"
            @keydown.down.prevent="moveRow(index, index + 1)"
          >
            <GripVertical class="size-4" />
          </button>
          <FormField
            v-for="column in schema"
            :key="column.fieldName"
            v-bind="rowSchema(column, index)"
            class="min-w-0"
          />
          <VbenIconButton
            v-if="editable"
            type="button"
            :aria-label="`删除第 ${index + 1} 行`"
            :disabled="fields.length <= min"
            @click="removeRow(index)"
          >
            <X class="size-4" />
          </VbenIconButton>
        </div>
      </div>
      <p
        v-if="fields.length === 0"
        class="text-muted-foreground p-4 text-center"
      >
        暂无数据
      </p>
    </div>
    <VbenButton
      v-if="editable"
      data-array-add
      type="button"
      variant="outline"
      class="mt-3 w-full"
      :disabled="fields.length >= max"
      @click="addRow"
    >
      <Plus class="mr-1 size-4" />添加一行
    </VbenButton>
  </div>
</template>
