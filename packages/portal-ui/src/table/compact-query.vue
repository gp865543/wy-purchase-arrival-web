<script setup lang="ts">
import { useId } from 'vue';

import { Button, Input, Select } from 'antdv-next';

defineProps<{
  statusOptions?: Array<{ label: string; value: string }>;
}>();
const emit = defineEmits<{ reset: []; search: [] }>();
const statusId = useId();
const keyword = defineModel<string>('keyword', { default: '' });
const status = defineModel<string>('status');
</script>

<template>
  <div class="portal-desktop-grid__query">
    <Input
      v-model:value="keyword"
      aria-label="搜索表格"
      placeholder="搜索表格"
      allow-clear
      class="portal-desktop-grid__keyword"
      @press-enter="emit('search')"
      @update:value="(value) => !value && emit('search')"
    />
    <label v-if="statusOptions" :for="statusId" class="sr-only">状态</label>
    <Select
      v-if="statusOptions"
      v-model:value="status"
      :id="statusId"
      placeholder="全部状态"
      allow-clear
      :options="statusOptions"
      class="portal-desktop-grid__status"
    />
    <Button @click="emit('search')">查询</Button>
    <Button @click="emit('reset')">重置</Button>
  </div>
</template>
