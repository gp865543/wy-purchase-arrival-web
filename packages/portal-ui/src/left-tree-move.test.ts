import type { LeftTreeNode } from './use-left-tree';

import { expect, it } from 'vitest';

import { applyLeftTreeMove, planLeftTreeMove } from './left-tree-move';

it('moves subtrees and preserves sibling order while rejecting invalid destinations', () => {
  const node = (
    key: string,
    children: LeftTreeNode[] = [],
    canReceiveChildren = true,
  ): LeftTreeNode => ({
    key,
    title: key,
    searchText: key,
    children,
    canReceiveChildren,
  });
  const nodes = [
    node('a', [node('a1', [node('leaf')]), node('a2')]),
    node('b'),
    node('off', [node('off1'), node('off2')], false),
  ];
  expect(planLeftTreeMove(nodes, 'b', 'a', -1)).toEqual({
    key: 'b',
    parentKey: null,
    siblingKeys: ['b', 'a', 'off'],
  });
  expect(planLeftTreeMove(nodes, 'a1', 'a2', 1)).toEqual({
    key: 'a1',
    parentKey: 'a',
    siblingKeys: ['a2', 'a1'],
  });
  const move = planLeftTreeMove(nodes, 'a1', 'b', 0);
  if (!move) throw new Error('planLeftTreeMove 未返回移动计划');
  expect(move).toEqual({ key: 'a1', parentKey: 'b', siblingKeys: ['a1'] });
  const records = [
    { id: 'a1', parentId: 'a', sort: 5 },
    { id: 'leaf', parentId: 'a1', sort: 8 },
    { id: 'a2', parentId: 'a', sort: 10 },
  ];
  expect(applyLeftTreeMove(records, move)).toEqual([
    { id: 'a1', parentId: 'b', sort: 0 },
    records[1],
    records[2],
  ]);
  expect(records[0]?.parentId).toBe('a');
  expect(planLeftTreeMove(nodes, 'a1', 'b', -1)?.parentKey).toBeNull();
  expect(planLeftTreeMove(nodes, 'off', 'b', 0)?.parentKey).toBe('b');
  expect(planLeftTreeMove(nodes, 'off2', 'off1', -1)?.siblingKeys).toEqual([
    'off2',
    'off1',
  ]);
  expect(planLeftTreeMove(nodes, 'a1', 'a', 0)?.siblingKeys).toEqual([
    'a1',
    'a2',
  ]);
  for (const [key, target, position] of [
    ['a', 'leaf', 0],
    ['a', 'a1', -1],
    ['a', 'a', 0],
    ['b', 'off', 0],
    ['b', 'off1', -1],
    ['missing', 'a', 0],
  ] as const) {
    expect(planLeftTreeMove(nodes, key, target, position)).toBeUndefined();
  }
});
