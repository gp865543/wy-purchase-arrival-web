import type {
  TemplateGridCondition,
  TemplateGridQuery,
  TemplateGridResult,
} from './template-grid-query';
import type { VxeGridListeners, VxeTableGridOptions } from './use-desktop-grid';

import { defineComponent, h, ref } from 'vue';

import CompactQuery from './compact-query.vue';
import { toTemplateGridQuery } from './template-grid-query';
import { desktopColumns, useDesktopGrid } from './use-desktop-grid';

type Row = Record<string, any>;
type Column<T extends Row> = NonNullable<
  VxeTableGridOptions<T>['columns']
>[number];
type VxeSort = {
  field?: string;
  order?: null | string;
  property?: string;
};

export interface TemplateVxeGridOptions<T extends Row> {
  formConditions?: (values: Record<string, unknown>) => TemplateGridCondition[];
  formOptions?: Parameters<typeof useDesktopGrid<T>>[0]['formOptions'];
  gridClass?: string;
  gridEvents?: Partial<VxeGridListeners<T>>;
  gridOptions: VxeTableGridOptions<T>;
  onSelection?: (rows: T[]) => void;
  queryAdapter: (query: TemplateGridQuery) => Promise<TemplateGridResult<T>>;
  statusOptions?: Array<{ label: string; value: string }>;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

const appliedFilterOption = {
  checked: true,
  label: '已应用筛选',
  value: '__applied__',
};

export function useTemplateGrid<T extends Row>(
  options: TemplateVxeGridOptions<T>,
) {
  const keyword = ref('');
  const applied = ref('');
  const status = ref<string>();
  const appliedStatus = ref<string>();
  let formValues: Record<string, unknown> = {};
  const columnConditions = ref<Record<string, TemplateGridCondition>>({});
  const remoteSorts = ref<VxeSort[]>([]);
  const columns = options.gridOptions.columns ?? [];
  function withFilterPanel(column: Column<T>): Column<T> {
    const render = column.filterRender as
      | undefined
      | { name?: string; props?: Record<string, any> };
    if (render?.name !== 'TemplateFilterPanel') return column;
    const field = column.field ?? '';
    return {
      ...column,
      filters: columnConditions.value[field] ? [appliedFilterOption] : [],
      filterRender: {
        ...render,
        props: {
          ...render.props,
          field,
          apply: (condition?: TemplateGridCondition) =>
            setColumnCondition(field, condition),
          getValue: () => columnConditions.value[field],
          reset: () => setColumnCondition(field, undefined),
        },
      },
    };
  }

  function withFilters() {
    return desktopColumns<T>(
      columns.map((column) => {
        if (column.type === 'checkbox') return column;
        if (
          typeof column.field !== 'string' ||
          column.field === 'id' ||
          column.field === 'operation'
        ) {
          return column;
        }
        const enriched: Column<T> = {
          ...column,
          // ponytail: 中文表头估宽；真实宽度仍由实例列配置控制。
          minWidth: Math.max(
            Number(column.minWidth) || 0,
            String(column.title ?? '').length * 14 +
              (column.sortable ? 84 : 56),
          ),
        };
        return withFilterPanel(enriched);
      }),
    );
  }

  function syncSelection() {
    options.onSelection?.([
      ...api.grid.getCheckboxRecords(),
      ...api.grid.getCheckboxReserveRecords(),
    ]);
  }

  function clearSelection() {
    // 结果先于条件渲染网格挂载时，api.grid 仍为空对象（#43 回归）。
    api.grid.clearCheckboxRow?.();
    api.grid.clearCheckboxReserve?.();
    options.onSelection?.([]);
  }

  function queryFirstPage() {
    void api.grid.setCurrentPage(1).then(() => api.query());
  }

  function onPageChange({
    currentPage,
    type,
  }: {
    currentPage: number;
    type?: string;
  }) {
    // 修改每页条数回到第 1 页（#50：保留当前条件和排序）。
    if (type === 'size' && currentPage !== 1) {
      void api.grid.setCurrentPage(1);
    }
  }

  function search() {
    applied.value = normalize(keyword.value);
    appliedStatus.value = status.value;
    clearSelection();
    queryFirstPage();
  }

  function reset() {
    keyword.value = '';
    status.value = undefined;
    columnConditions.value = {};
    api.setGridOptions({ columns: withFilters() });
    search();
  }

  function conditions() {
    return [
      ...Object.values(columnConditions.value),
      ...(appliedStatus.value
        ? [
            {
              field: 'status',
              operator: 'in' as const,
              value: [appliedStatus.value],
            },
          ]
        : []),
      ...(options.formConditions?.(formValues) ?? []),
    ];
  }

  function applyFilters(next: Record<string, string[]>) {
    columnConditions.value = Object.fromEntries(
      Object.entries(next).map(([field, value]) => [
        field,
        { field, operator: 'in', value },
      ]),
    );
    keyword.value = '';
    applied.value = '';
    api.setGridOptions({ columns: withFilters() });
    clearSelection();
    queryFirstPage();
  }

  function setColumnCondition(
    field: string,
    condition?: TemplateGridCondition,
  ) {
    columnConditions.value = condition
      ? {
          ...columnConditions.value,
          [field]: condition,
        }
      : Object.fromEntries(
          Object.entries(columnConditions.value).filter(
            ([key]) => key !== field,
          ),
        );
    // 面板已打开时先关闭，避免列配置重建与弹层竞争。
    api.grid.closeFilter?.();
    api.setGridOptions({ columns: withFilters() });
    clearSelection();
    queryFirstPage();
  }

  /** 当前表格完整查询条件（导出等服务端全量查询复用）。 */
  function buildCurrentQuery(): TemplateGridQuery {
    const sorts = api.grid.getSortColumns?.() ?? [];
    return toTemplateGridQuery({
      conditions: conditions(),
      keyword: applied.value,
      page: { currentPage: 1, pageSize: 1 },
      sorts: sorts.length > 0 ? sorts : remoteSorts.value,
    });
  }

  const proxyConfig = options.gridOptions.proxyConfig as
    | undefined
    | { ajax?: Record<string, any> };
  const [Grid, api] = useDesktopGrid<T>({
    formOptions: options.formOptions,
    gridClass: `template-vxe-grid ${options.gridClass ?? 'min-h-0'}`,
    gridOptions: {
      ...options.gridOptions,
      columns: withFilters(),
      border: true,
      minHeight: options.gridOptions.minHeight ?? 0,
      maxHeight:
        options.gridOptions.maxHeight ??
        (options.gridOptions.height === '100%' ? undefined : 420),
      rowConfig: {
        keyField: 'id',
        ...options.gridOptions.rowConfig,
      },
      checkboxConfig: {
        reserve: true,
        ...options.gridOptions.checkboxConfig,
      },
      filterConfig: {
        remote: true,
        ...options.gridOptions.filterConfig,
      },
      sortConfig: { remote: true, ...options.gridOptions.sortConfig },
      pagerConfig: {
        enabled: true,
        pageSize: 50,
        ...options.gridOptions.pagerConfig,
      },
      toolbarConfig: {
        custom: true,
        refresh: true,
        zoom: true,
        ...options.gridOptions.toolbarConfig,
      },
      proxyConfig: {
        ...proxyConfig,
        filter: true,
        sort: true,
        ajax: {
          ...proxyConfig?.ajax,
          query: async (
            {
              page,
              isReload,
              sorts,
            }: {
              isReload?: boolean;
              page: { currentPage: number; pageSize: number };
              sorts: VxeSort[];
            },
            values: Record<string, unknown>,
          ) => {
            formValues = values ?? {};
            if (isReload) {
              // 刷新：保留当前条件、关键词和排序，仅清空选择。
              clearSelection();
            }
            // VXE 在 sort-change 通知前启动查询，先接收本次排序（含取消排序）。
            await Promise.resolve();
            const querySorts = sorts.length > 0 ? sorts : remoteSorts.value;
            if (sorts.length > 0) remoteSorts.value = sorts;
            const query = toTemplateGridQuery({
              conditions: conditions(),
              keyword: applied.value,
              page,
              sorts: querySorts,
            });
            const result = await options.queryAdapter(query);
            return { items: result.items, total: result.total };
          },
        },
      },
    } as VxeTableGridOptions,
    gridEvents: {
      ...options.gridEvents,
      checkboxChange: syncSelection,
      checkboxAll: syncSelection,
      pageChange: onPageChange,
      sortChange: ({ sortList }: { sortList: VxeSort[] }) => {
        remoteSorts.value = sortList;
        clearSelection();
      },
    },
  });

  const TemplateVxeGrid = defineComponent({
    name: 'TemplateVxeGrid',
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(Grid, attrs, {
          ...slots,
          'toolbar-tools': (params: any) =>
            h('div', { class: 'flex flex-wrap items-center gap-2' }, [
              slots['toolbar-tools']?.(params),
              h(CompactQuery, {
                keyword: keyword.value,
                status: status.value,
                statusOptions: options.statusOptions,
                'onUpdate:keyword': (value: string) => {
                  keyword.value = value;
                },
                'onUpdate:status': (value?: string) => {
                  status.value = value;
                },
                onSearch: search,
                onReset: reset,
              }),
            ]),
        });
    },
  });
  return [
    TemplateVxeGrid,
    api,
    {
      applyFilters,
      buildCurrentQuery,
      clearSelection,
      refreshColumns: () => api.setGridOptions({ columns: withFilters() }),
    },
  ] as const;
}
