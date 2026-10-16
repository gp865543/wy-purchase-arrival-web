/**
 * 模板表格服务端查询契约（#50）。
 *
 * 与 `wy-portal/apps/backend-mock/utils/template-grid.ts` 保持同一语义；
 * 本文件为纯 TS，可在前端单测。
 */

export type TemplateGridOperator = 'between' | 'contains' | 'in';

export interface TemplateGridCondition {
  field: string;
  operator: TemplateGridOperator;
  value: string | unknown[] | { max?: number | string; min?: number | string };
}

export interface TemplateGridSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface TemplateGridQuery {
  conditions: TemplateGridCondition[];
  keyword?: string;
  page: { currentPage: number; pageSize: number };
  sorts: TemplateGridSort[];
}

export interface TemplateGridResult<T> {
  items: T[];
  total: number;
}

/**
 * 校验单条列条件；通过返回 null，否则返回错误消息（用于 min > max 阻止提交）。
 */
export function validateTemplateGridCondition(
  condition: TemplateGridCondition,
): null | string {
  const { field, operator, value } = condition;
  if (operator === 'contains' && typeof value !== 'string') {
    return `${field} 的 contains 值必须为字符串`;
  }
  if (operator === 'in' && !Array.isArray(value)) {
    return `${field} 的 in 值必须为数组`;
  }
  if (operator === 'between') {
    const range =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as { max?: number | string; min?: number | string })
        : null;
    if (
      !range ||
      ((range.min === null || range.min === undefined) &&
        (range.max === null || range.max === undefined))
    )
      return null;
    if (
      range.min !== null &&
      range.min !== undefined &&
      range.max !== null &&
      range.max !== undefined
    ) {
      // 数字范围按数值比较；日期等字符串范围按字典序（YYYY-MM-DD 可直接比较）。
      const minNumber = Number(range.min);
      const maxNumber = Number(range.max);
      const min = Number.isFinite(minNumber) ? minNumber : String(range.min);
      const max = Number.isFinite(maxNumber) ? maxNumber : String(range.max);
      if (min > max) {
        return `${field} 最小值不能大于最大值`;
      }
    }
  }
  return null;
}

export interface ToTemplateGridQueryParams {
  conditions: TemplateGridCondition[];
  keyword?: string;
  page: { currentPage: number; pageSize: number };
  sorts: Array<{
    field?: string;
    order?: null | string;
    property?: string;
  }>;
}

/**
 * 把 VXE 代理查询参数（page、sorts）与共享筛选状态组装成语义查询契约。
 */
export function toTemplateGridQuery(
  params: ToTemplateGridQueryParams,
): TemplateGridQuery {
  const keyword = params.keyword?.trim().toLowerCase();
  return {
    page: params.page,
    ...(keyword ? { keyword } : {}),
    conditions: params.conditions,
    sorts: params.sorts
      .filter(
        (sort): sort is { field: string; order: 'asc' | 'desc' } =>
          !!sort.field && (sort.order === 'asc' || sort.order === 'desc'),
      )
      .map((sort) => ({ field: sort.field, order: sort.order })),
  };
}
