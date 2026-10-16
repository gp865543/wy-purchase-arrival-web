<script lang="ts" setup>
import type { ClassType } from '@vben/types';

import { cn } from '@vben-core/shared/utils';

interface Props {
  class?: ClassType;
}

defineOptions({ name: 'VbenFilterBar' });

const props = withDefaults(defineProps<Props>(), { class: undefined });
</script>

<template>
  <div :class="cn('vben-filter-bar', props.class)">
    <slot></slot>
  </div>
</template>
