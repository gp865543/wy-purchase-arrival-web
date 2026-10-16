import type { LeftTreeNode } from './use-left-tree';

export interface LeftTreeMove {
  key: string;
  parentKey: null | string;
  siblingKeys: string[];
}

export function planLeftTreeMove(
  nodes: LeftTreeNode[],
  key: string,
  targetKey: string,
  position: number,
): LeftTreeMove | undefined {
  const locations = new Map<
    string,
    { node: LeftTreeNode; parentKey: null | string; siblings: LeftTreeNode[] }
  >();
  function visit(siblings: LeftTreeNode[], parentKey: null | string) {
    for (const node of siblings) {
      locations.set(node.key, { node, parentKey, siblings });
      visit(node.children ?? [], node.key);
    }
  }
  visit(nodes, null);
  const source = locations.get(key);
  const target = locations.get(targetKey);
  if (!source || !target || key === targetKey || ![-1, 0, 1].includes(position))
    return;
  const parentKey = position === 0 ? targetKey : target.parentKey;
  const parent = parentKey === null ? undefined : locations.get(parentKey);
  if (
    parent?.node.canReceiveChildren === false &&
    parentKey !== source.parentKey
  )
    return;
  let ancestor = parentKey;
  while (ancestor !== null) {
    if (ancestor === key) return;
    ancestor = locations.get(ancestor)?.parentKey ?? null;
  }
  const siblings =
    position === 0 ? (target.node.children ?? []) : target.siblings;
  const siblingKeys = siblings
    .map((node) => node.key)
    .filter((id) => id !== key);
  const index =
    position === 0
      ? 0
      : siblingKeys.indexOf(targetKey) + (position === 1 ? 1 : 0);
  siblingKeys.splice(index, 0, key);
  return { key, parentKey, siblingKeys };
}

export function applyLeftTreeMove<
  T extends { id: string; parentId?: string; sort?: number },
>(records: T[], move: LeftTreeMove): T[] {
  const order = new Map(move.siblingKeys.map((key, index) => [key, index]));
  return records.map((row) => {
    const sort = order.get(row.id);
    return sort === undefined
      ? row
      : {
          ...row,
          sort,
          ...(row.id === move.key
            ? { parentId: move.parentKey ?? undefined }
            : {}),
        };
  });
}
