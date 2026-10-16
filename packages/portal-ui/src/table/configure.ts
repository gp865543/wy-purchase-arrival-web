import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import { h } from 'vue';

import { setupVbenVxeTable } from '@vben/plugins/vxe-table';

import { Button, Tag } from 'antdv-next';

import { enabledStatusOptions } from './status';
import { TemplateFilterPanel } from './template-filter-panel';

export const configureDesktopTable: Parameters<
  typeof setupVbenVxeTable
>[0]['configVxeTable'] = (vxeUI) => {
  vxeUI.setConfig({
    grid: {
      align: 'center',
      border: false,
      headerCellStyle: {
        backgroundColor: 'color-mix(in srgb, hsl(var(--primary)) 15%, white)',
        color: '#000',
        borderRight: '1px solid #b6c4d6',
        borderBottom: '1px solid #b6c4d6',
      },
      columnConfig: {
        resizable: true,
      },
      resizableConfig: { showDragTip: false },
      minHeight: 180,
      formConfig: {
        // 全局禁用vxe-table的表单配置，使用formOptions
        enabled: false,
      },
      proxyConfig: {
        autoLoad: true,
        response: {
          result: 'items',
          total: 'total',
          list: 'items',
        },
        showActiveMsg: true,
        showResponseMsg: false,
      },
      round: true,
      showOverflow: true,
      size: 'small',
    } as VxeTableGridOptions,
  });

  // 普通筛选面板自定义模板（#50）：文本/下拉/数字范围/日期范围控件。
  vxeUI.renderer.add('TemplateFilterPanel', {
    renderFilter: (filterRender: any, params: any) =>
      h(TemplateFilterPanel, {
        apply: filterRender?.props?.apply,
        close: () => params?.$table?.closeFilter?.(),
        config: filterRender?.props,
        getValue: filterRender?.props?.getValue,
        reset: filterRender?.props?.reset,
      }),
    showFilterFooter: false,
  } as any);

  // 表格配置项可以用 cellRender: { name: 'CellLink' }，用于把某一列渲染成
  // 点击查看详情/编辑的链接；不传 props.text 时展示该列自身的字段值。
  vxeUI.renderer.add('CellLink', {
    renderTableDefault({ attrs, props }, { column, row }) {
      const value = row[column.field];
      return h(
        Button,
        {
          ...props,
          class: 'h-auto !p-0',
          type: 'link',
          onClick: () => attrs?.onClick?.({ row }),
        },
        { default: () => props?.text ?? value },
      );
    },
  });

  vxeUI.renderer.add('CellTag', {
    renderTableDefault({ options, props }, { column, row }) {
      const value = row[column.field];
      const tagOptions = options ?? enabledStatusOptions;
      const tagItem = tagOptions.find(
        (item: Recordable<any>) => item.value === value,
      );
      return h(
        Tag,
        { ...props, color: tagItem?.color },
        { default: () => tagItem?.label ?? value },
      );
    },
  });
};
