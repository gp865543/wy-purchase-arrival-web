import type { Ref } from 'vue';

import { computed, ref, watch } from 'vue';

export interface LeftTreeNode {
  canReceiveChildren?: boolean;
  children?: LeftTreeNode[];
  key: string;
  searchText: string;
  title: string;
}

function collectKeys(nodes: LeftTreeNode[]): string[] {
  return nodes.flatMap((node) => [
    node.key,
    ...collectKeys(node.children ?? []),
  ]);
}

export function useLeftTree(nodes: Ref<LeftTreeNode[]>) {
  const keyword = ref('');
  const expandedKeys = ref<string[]>([]);
  const treeData = computed(() => {
    const term = keyword.value.trim().toLowerCase();
    function filter(items: LeftTreeNode[]): LeftTreeNode[] {
      return items.flatMap((node) => {
        const children = filter(node.children ?? []);
        return node.searchText.toLowerCase().includes(term) ||
          children.length > 0
          ? [{ ...node, children }]
          : [];
      });
    }
    return filter(nodes.value);
  });
  const visibleKeys = computed(() => collectKeys(treeData.value));
  const expandAll = () => {
    expandedKeys.value = [...visibleKeys.value];
  };
  watch(treeData, expandAll, { immediate: true });
  return { keyword, expandedKeys, treeData, visibleKeys };
}
