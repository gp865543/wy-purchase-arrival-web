<script lang="ts" setup>
import type { ClassType } from '@vben/types';

import { computed, useSlots } from 'vue';

import { cn } from '@vben-core/shared/utils';

interface Props {
  class?: ClassType;
  bodyClass?: ClassType;
  headerClass?: ClassType;
  title?: string;
}

defineOptions({ name: 'VbenPanel' });

const props = withDefaults(defineProps<Props>(), {
  class: undefined,
  bodyClass: undefined,
  headerClass: undefined,
  title: undefined,
});
const slots = useSlots();

const hasHeader = computed(
  () => !!props.title || !!slots.header || !!slots.extra,
);
</script>

<template>
  <section :class="cn('vben-panel', props.class)">
    <header
      v-if="hasHeader"
      :class="cn('vben-panel__header', props.headerClass)"
    >
      <div class="vben-panel__header-main">
        <slot name="header">
          <div v-if="title" class="vben-panel__title">{{ title }}</div>
        </slot>
      </div>
      <div v-if="slots.extra" class="shrink-0">
        <slot name="extra"></slot>
      </div>
    </header>
    <div :class="cn('vben-panel__body', props.bodyClass)">
      <slot></slot>
    </div>
  </section>
</template>
