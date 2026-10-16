<script setup lang="ts">
import type { TreeEmits } from 'antdv-next';

import type { LeftTreeMove } from './left-tree-move';
import type { LeftTreeNode } from './use-left-tree';

import { computed } from 'vue';

import { Input, Tree } from 'antdv-next';

import { planLeftTreeMove } from './left-tree-move';

const props = defineProps<{
  draggable?: boolean;
  emptyText: string;
  moving?: boolean;
  nodes: LeftTreeNode[];
  regionLabel: string;
  searchLabel: string;
}>();
const emit = defineEmits<{ move: [move: LeftTreeMove] }>();
const keyword = defineModel<string>('keyword', { required: true });
const expandedKeys = defineModel<string[]>('expandedKeys', { required: true });
const selectedKeys = defineModel<string[]>('selectedKeys', { required: true });
const canDrag = computed(
  () => props.draggable && !props.moving && !keyword.value.trim(),
);
const allowDrop: NonNullable<
  InstanceType<typeof Tree>['$props']['allowDrop']
> = ({ dragNode, dropNode, dropPosition }) =>
  !!canDrag.value &&
  !!planLeftTreeMove(
    props.nodes,
    String(dragNode.key),
    String(dropNode.key),
    dropPosition,
  );
const onDrop: TreeEmits['drop'] = ({
  dragNode,
  node,
  dropPosition,
  dropToGap,
}) => {
  if (!canDrag.value) return;
  const position = dropToGap
    ? dropPosition - Number(node.pos.split('-').at(-1))
    : 0;
  const move = planLeftTreeMove(
    props.nodes,
    String(dragNode.key),
    String(node.key),
    position,
  );
  if (move) emit('move', move);
};
</script>

<template>
  <Input
    v-model:value="keyword"
    :aria-label="searchLabel"
    :placeholder="searchLabel"
    :disabled="moving"
    allow-clear
  />
  <slot name="actions"></slot>
  <div
    class="wuying2-left-tree portal-left-tree"
    role="region"
    :aria-label="regionLabel"
    :aria-busy="moving"
  >
    <Tree
      v-if="props.nodes.length > 0"
      block-node
      show-line
      :show-icon="false"
      :tree-data="nodes"
      :expanded-keys="expandedKeys"
      :selected-keys="selectedKeys"
      :draggable="canDrag ? { icon: false } : false"
      :allow-drop="allowDrop"
      @drop="onDrop"
      @expand="(keys) => (expandedKeys = keys.map(String))"
      @select="(keys) => (selectedKeys = keys.map(String))"
    >
      <template #titleRender="node">
        <slot name="title" v-bind="node">
          <span :title="String(node.title)">{{ node.title }}</span>
        </slot>
      </template>
    </Tree>
    <p v-else class="portal-left-tree__empty">{{ emptyText }}</p>
  </div>
</template>
