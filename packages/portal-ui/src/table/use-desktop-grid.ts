import { defineComponent, h } from 'vue';

import { useVbenForm } from '@vben/common-ui';
import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { configureDesktopTable } from './configure';

import './table.css';

setupVbenVxeTable({ configVxeTable: configureDesktopTable, useVbenForm });

export function desktopColumns<T extends Record<string, any>>(
  columns: NonNullable<
    Parameters<typeof useVbenVxeGrid<T>>[0]['gridOptions']
  >['columns'],
) {
  if (!columns) return columns;
  const checkbox = {
    ...columns.find((column) => column?.type === 'checkbox'),
    type: 'checkbox' as const,
    fixed: 'left' as const,
    width: 48,
    minWidth: 48,
    maxWidth: 48,
    resizable: false,
  };
  return [
    checkbox,
    ...columns.filter((column) => column?.type !== 'checkbox'),
  ].map((column) =>
    column?.field === 'operation'
      ? {
          title: '操作',
          width: column.minWidth ?? 160,
          fixed: 'right' as const,
          showOverflow: false,
          ...column,
        }
      : column,
  );
}

export function useDesktopGrid<T extends Record<string, any>>(
  options: Parameters<typeof useVbenVxeGrid<T>>[0],
) {
  const [Grid, api] = useVbenVxeGrid<T>({
    ...options,
    gridClass: ['portal-desktop-grid', options.gridClass],
    gridOptions: {
      border: true,
      headerCellStyle: {
        backgroundColor: '',
        color: '',
        borderRight: '',
        borderBottom: '',
      },
      ...options.gridOptions,
      columns: desktopColumns<T>(options.gridOptions?.columns),
    },
  });
  const DesktopGrid = defineComponent({
    name: 'DesktopGrid',
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(Grid, attrs, {
          ...slots,
          'toolbar-actions': (params: any) =>
            h(
              'div',
              { class: 'portal-desktop-grid__actions' },
              slots['toolbar-actions']?.(params),
            ),
          ...(slots['row-actions']
            ? {
                'row-actions': (params: any) =>
                  h(
                    'div',
                    { class: 'portal-desktop-grid__row-actions' },
                    slots['row-actions']?.(params),
                  ),
              }
            : {}),
        });
    },
  });
  return [DesktopGrid, api] as const;
}

export type * from '@vben/plugins/vxe-table';
