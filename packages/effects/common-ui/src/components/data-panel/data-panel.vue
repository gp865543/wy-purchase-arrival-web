<script lang="ts" setup>
import type { ClassType } from '@vben/types';

import { useSlots } from 'vue';

import { cn } from '@vben-core/shared/utils';

import DataGrid from './data-grid.vue';
import Panel from './panel.vue';

interface Props {
  class?: ClassType;
  contentBodyClass?: ClassType;
  contentClass?: ClassType;
  filtersClass?: ClassType;
  title?: string;
}

defineOptions({ name: 'VbenDataPanel' });

const props = withDefaults(defineProps<Props>(), {
  class: undefined,
  contentBodyClass: undefined,
  contentClass: undefined,
  filtersClass: undefined,
  title: undefined,
});
const slots = useSlots();
</script>

<template>
  <div :class="cn('vben-data-panel', props.class)">
    <Panel v-if="slots.filters" :class="props.filtersClass">
      <slot name="filters"></slot>
    </Panel>

    <Panel
      :class="cn('vben-data-panel__content', props.contentClass)"
      :body-class="props.contentBodyClass"
      :title="title"
    >
      <template v-if="slots.header" #header>
        <slot name="header"></slot>
      </template>
      <template v-if="slots.extra" #extra>
        <slot name="extra"></slot>
      </template>
      <DataGrid>
        <slot></slot>
      </DataGrid>
    </Panel>
  </div>
</template>
