import { describe, expect, it } from 'vitest';

import {
  toTemplateGridQuery,
  validateTemplateGridCondition,
} from './template-grid-query';

describe('validateTemplateGridCondition', () => {
  it('rejects min > max for number ranges and explains the field', () => {
    const error = validateTemplateGridCondition({
      field: 'plannedQuantity',
      operator: 'between',
      value: { min: 10, max: 1 },
    });
    expect(error).toBe('plannedQuantity 最小值不能大于最大值');
  });

  it('rejects min > max for date ranges', () => {
    expect(
      validateTemplateGridCondition({
        field: 'deliveryDate',
        operator: 'between',
        value: { min: '2026-09-10', max: '2026-09-05' },
      }),
    ).toBe('deliveryDate 最小值不能大于最大值');
  });

  it('accepts single-端点 ranges and treats both-empty as cleared', () => {
    expect(
      validateTemplateGridCondition({
        field: 'count',
        operator: 'between',
        value: { min: 5 },
      }),
    ).toBeNull();
    expect(
      validateTemplateGridCondition({
        field: 'count',
        operator: 'between',
        value: { max: 5 },
      }),
    ).toBeNull();
    expect(
      validateTemplateGridCondition({
        field: 'count',
        operator: 'between',
        value: {},
      }),
    ).toBeNull();
  });

  it('rejects malformed contains and in values', () => {
    expect(
      validateTemplateGridCondition({
        field: 'name',
        operator: 'contains',
        value: 1 as any,
      }),
    ).toBe('name 的 contains 值必须为字符串');
    expect(
      validateTemplateGridCondition({
        field: 'stage',
        operator: 'in',
        value: 'sewing' as any,
      }),
    ).toBe('stage 的 in 值必须为数组');
  });
});

describe('toTemplateGridQuery', () => {
  it('maps page, keyword, conditions and vxe sorts into the semantic contract', () => {
    const query = toTemplateGridQuery({
      keyword: ' Alpha ',
      page: { currentPage: 2, pageSize: 50 },
      conditions: [
        {
          field: 'currentStage',
          operator: 'in' as const,
          value: ['sewing', 'shipped'],
        },
      ],
      sorts: [
        {
          field: 'deliveryDate',
          property: 'deliveryDate',
          order: 'asc' as const,
        },
        {
          field: 'plannedQuantity',
          property: 'plannedQuantity',
          order: 'desc' as const,
        },
      ],
    });
    expect(query).toEqual({
      page: { currentPage: 2, pageSize: 50 },
      keyword: 'alpha',
      conditions: [
        { field: 'currentStage', operator: 'in', value: ['sewing', 'shipped'] },
      ],
      sorts: [
        { field: 'deliveryDate', order: 'asc' },
        { field: 'plannedQuantity', order: 'desc' },
      ],
    });
  });

  it('drops empty conditions and keyword, and non-set sorts', () => {
    const query = toTemplateGridQuery({
      page: { currentPage: 1, pageSize: 20 },
      conditions: [],
      sorts: [],
    });
    expect(query).toEqual({
      page: { currentPage: 1, pageSize: 20 },
      conditions: [],
      sorts: [],
    });
    expect(query.keyword).toBeUndefined();
  });

  it('normalizes vxe sorts with null order away', () => {
    const query = toTemplateGridQuery({
      page: { currentPage: 1, pageSize: 20 },
      conditions: [],
      sorts: [
        { field: 'a', property: 'a', order: null as any },
        { field: 'b', property: 'b', order: 'desc' as const },
      ],
    });
    expect(query.sorts).toEqual([{ field: 'b', order: 'desc' }]);
  });
});
