<script setup lang="ts">
import { Checkbox, Empty, Input, Spin } from 'antdv-next';

defineProps<{
  disabled?: boolean;
  emptyText: string;
  loading?: boolean;
  options: { description?: string; label: string; value: string }[];
  placeholder: string;
  searchLabel: string;
}>();
const keyword = defineModel<string>('keyword', { required: true });
const selectedIds = defineModel<string[]>('selectedIds', { required: true });

function toggle(id: string, checked: boolean) {
  selectedIds.value = checked
    ? [...selectedIds.value, id]
    : selectedIds.value.filter((value) => value !== id);
}
</script>

<template>
  <div class="portal-relation-picker">
    <Input
      v-model:value="keyword"
      :aria-label="searchLabel"
      :placeholder="placeholder"
      allow-clear
    />
    <div v-if="$slots.summary" class="portal-relation-picker__summary">
      <slot name="summary"></slot>
    </div>
    <slot name="status"></slot>
    <Spin :spinning="loading">
      <div class="portal-relation-picker__options">
        <Checkbox
          v-for="option in options"
          :key="option.value"
          :checked="selectedIds.includes(option.value)"
          :disabled="disabled || loading"
          @change="(event) => toggle(option.value, event.target.checked)"
        >
          <span>{{ option.label }}</span>
          <span
            v-if="option.description"
            class="portal-relation-picker__description"
          >
            {{ option.description }}
          </span>
        </Checkbox>
        <Empty
          v-if="!loading && options.length === 0"
          :description="emptyText"
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
        />
      </div>
    </Spin>
  </div>
</template>
