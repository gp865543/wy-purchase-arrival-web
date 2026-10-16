<script setup lang="ts">
import type { PutawayRatioResponse } from '#/api/purchaseArrival';

/**
 * Web PoOverview page: 采购订单视角.
 *
 * Issue #61: 采购订单视角，因为采购订单下面会有多项材料、每项材料可能会有
 * 多个采购入库单（比如多次到货）。因此，采购订单上要显示完成入库单的比例.
 *
 * 比例定义: sum(active putaways.quantity) / sum(receipts.quantity)
 *   cancelled putaways 不计入分子
 */
import { computed, h, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { DataPanel, Page } from '@vben/common-ui';

import { Progress, Tag } from 'antdv-next';

import { purchaseArrivalApi } from '#/api/purchaseArrival';

const route = useRoute();
const poId = computed(() => {
  const raw = route.params.poId;
  if (raw === undefined || raw === null) return Number.NaN;
  const first = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(first);
  return Number.isFinite(id) ? id : Number.NaN;
});

const ratio = ref<null | PutawayRatioResponse>(null);
const loading = ref(false);
const error = ref('');

const overallPercent = computed(() => {
  const r = ratio.value?.overall;
  if (!r || r.totalQuantity === 0) return 0;
  return Math.round(r.completionRatio * 100);
});

type StatusTone = 'error' | 'info' | 'success' | 'warning';

const overallStatus = computed<{ label: string; tone: StatusTone }>(() => {
  const r = ratio.value?.overall;
  if (!r || r.totalQuantity === 0) return { tone: 'info', label: '无数据' };
  if (r.isFullyPutaway) return { tone: 'success', label: '全部入库' };
  if (r.completionRatio >= 0.5) return { tone: 'warning', label: '部分入库' };
  return { tone: 'error', label: '未入库' };
});

async function load() {
  const id = poId.value;
  if (!Number.isFinite(id)) {
    error.value = '无效的采购订单 id';
    ratio.value = null;
    return;
  }
  loading.value = true;
  error.value = '';
  ratio.value = null;
  try {
    ratio.value = await purchaseArrivalApi.getPoPutawayRatio(id);
  } catch (error_) {
    error.value =
      error_ instanceof Error ? error_.message : '加载 PO 完成比例失败';
  } finally {
    loading.value = false;
  }
}

watch(poId, load);
onMounted(load);

function rowPercent(ratio: number): number {
  return Math.round(ratio * 100);
}

function rowStatusTone(isFull: boolean): 'success' | 'warning' {
  return isFull ? 'success' : 'warning';
}

function rowStatusLabel(isFull: boolean, percent: number): string {
  if (isFull) return '已完成';
  if (percent === 0) return '未入库';
  return `${percent}%`;
}

const tableLocale = {
  emptyText: () =>
    h(
      'div',
      { style: { padding: '16px', color: 'rgba(0,0,0,0.45)' } },
      '此 PO 尚无材料入库记录',
    ),
  filterConfirm: '确定',
  filterReset: '重置',
};

const columns = [
  { title: '行号', dataIndex: 'rowId', width: 100 },
  { title: '计划号', dataIndex: 'planNumber', minWidth: 160 },
  {
    title: '收货数量',
    dataIndex: 'totalQuantity',
    width: 120,
    align: 'right' as const,
  },
  {
    title: '已上架',
    dataIndex: 'putawayQuantity',
    width: 120,
    align: 'right' as const,
  },
  {
    title: '剩余',
    dataIndex: 'remainingQuantity',
    width: 120,
    align: 'right' as const,
  },
  {
    title: '完成比例',
    key: 'ratio',
    minWidth: 220,
    customRender: ({
      record,
    }: {
      record: PutawayRatioResponse['items'][number];
    }) =>
      h(Progress, {
        percent: rowPercent(record.completionRatio),
        strokeWidth: 10,
        status: record.isFullyPutaway ? 'success' : undefined,
      }),
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    customRender: ({
      record,
    }: {
      record: PutawayRatioResponse['items'][number];
    }) =>
      h(Tag, { color: rowStatusTone(record.isFullyPutaway) }, () =>
        rowStatusLabel(
          record.isFullyPutaway,
          rowPercent(record.completionRatio),
        ),
      ),
  },
];
</script>

<template>
  <Page
    :title="`采购订单 ${Number.isFinite(poId) ? poId : '?'}`"
    description="采购订单视角 · 完成入库单比例"
  >
    <DataPanel>
      <a-alert
        v-if="error"
        class="my-2"
        type="error"
        :message="`加载失败：${error}`"
        show-icon
      />

      <section
        v-else-if="
          ratio && (ratio.overall.totalQuantity > 0 || ratio.items.length > 0)
        "
        class="overall-card"
      >
        <div class="overall-card-header">
          <span class="label">总体完成比例</span>
          <a-tag :color="overallStatus.tone">{{ overallStatus.label }}</a-tag>
        </div>
        <a-progress
          v-if="ratio.overall.totalQuantity > 0"
          :percent="overallPercent"
          :stroke-width="14"
          :status="overallStatus.tone === 'success' ? 'success' : undefined"
        />
        <p v-else class="no-data-hint">此采购订单尚无收货记录</p>
        <div class="overall-figures">
          <span>
            <strong>{{ ratio.overall.putawayQuantity }}</strong>
            / {{ ratio.overall.totalQuantity }} 已上架
          </span>
          <span class="muted">剩余 {{ ratio.overall.remainingQuantity }}</span>
        </div>
      </section>

      <section v-if="ratio" class="mt-3">
        <h3>材料 × 入库单矩阵</h3>
        <a-table
          :loading="loading"
          :columns="columns"
          :data-source="ratio.items"
          :row-key="(r: any) => r.rowId"
          :pagination="false"
          :bordered="true"
          :locale="tableLocale"
          size="small"
        />
      </section>

      <section v-else-if="!loading && !error" class="empty-state">
        <p>暂无数据，请选择一条有效采购订单。</p>
      </section>
    </DataPanel>
  </Page>
</template>

<style scoped>
.overall-card {
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.overall-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.overall-card-header .label {
  font-size: 14px;
  font-weight: 600;
}

.overall-figures {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  color: rgb(0 0 0 / 85%);
}

.muted {
  color: rgb(0 0 0 / 45%);
}

.no-data-hint {
  font-style: italic;
  color: rgb(0 0 0 / 45%);
}

.empty-state {
  padding: 32px;
  color: rgb(0 0 0 / 45%);
  text-align: center;
}
</style>
