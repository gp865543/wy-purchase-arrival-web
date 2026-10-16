<script setup lang="ts">
/**
 * Web ReceiptList page: 推送采购入库单 list.
 *
 * Issue #61: 把质检结论为通过的相应的采购到货记录列出来，点击生成采购入库单、向 ERP 推送.
 */
import { computed, h, onMounted, ref } from 'vue';
import { Tag, message } from 'antdv-next';
import { useRouter } from 'vue-router';

import { DataPanel, Page } from '@vben/common-ui';

import {
  purchaseArrivalApi,
  type FinalConclusion,
  type QualityReportSummary,
  type Receipt,
  type ReceiptListResponse,
} from '#/api/purchaseArrival';

const router = useRouter();

const receipts = ref<Receipt[]>([]);
const loading = ref(false);
const error = ref('');

const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const filterPoId = ref<number | undefined>(undefined);
const filterPlanNumber = ref('');
const filterCreatedFrom = ref('');
const filterCreatedTo = ref('');

const inspectionByReceiptId = ref<Map<string, FinalConclusion>>(new Map());

const pushDialogOpen = ref(false);
const pushDialogRow = ref<Receipt | null>(null);
const pushDialogQty = ref<number>(1);
const pushDialogSubmitting = ref(false);

onMounted(async () => {
  await Promise.all([load(), loadInspectionMap()]);
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res: ReceiptListResponse = await purchaseArrivalApi.listReceipts({
      po_id: filterPoId.value || undefined,
      plan_number: filterPlanNumber.value.trim() || undefined,
      created_from: filterCreatedFrom.value || undefined,
      created_to: filterCreatedTo.value || undefined,
      sort: 'created_at_desc',
      page: page.value,
      page_size: pageSize.value,
    });
    receipts.value = res.items;
    total.value = res.total;
  } catch (cause) {
    const msg = cause instanceof Error ? cause.message : '加载收货记录失败';
    error.value = msg;
    receipts.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadInspectionMap() {
  try {
    const reports: QualityReportSummary[] = await purchaseArrivalApi.listQualityReports({
      finalConclusion: 'pass',
      procurementSource: 'purchase',
    });
    const m = new Map<string, FinalConclusion>();
    for (const r of reports) {
      m.set(r.inspectionId, r.finalConclusion);
    }
    inspectionByReceiptId.value = m;
  } catch {
    /* keep silent; UI shows "未报检" badge instead */
  }
}

type Row = Receipt & { conclusion?: FinalConclusion };

const rows = computed<Row[]>(() =>
  receipts.value.map((r) => ({
    ...r,
    conclusion: inspectionByReceiptId.value.get(r.id),
  })),
);

function onSearch() {
  page.value = 1;
  load();
}

function onReset() {
  filterPoId.value = undefined;
  filterPlanNumber.value = '';
  filterCreatedFrom.value = '';
  filterCreatedTo.value = '';
  page.value = 1;
  load();
}

function onPageChange(next: number) {
  page.value = next;
  load();
}

function onPageSizeChange(next: number) {
  pageSize.value = next;
  page.value = 1;
  load();
}

function openPushDialog(row: Receipt) {
  pushDialogRow.value = row;
  pushDialogQty.value = row.quantity;
  pushDialogOpen.value = true;
}

async function onPushConfirm() {
  const row = pushDialogRow.value;
  if (!row) return;
  const qty = pushDialogQty.value;
  if (!Number.isInteger(qty) || qty < 1 || qty > row.quantity) {
    message.error(`数量必须是 1..${row.quantity} 的整数`);
    return;
  }
  pushDialogSubmitting.value = true;
  try {
    const locationCode = 'A-01-001';
    const created = await purchaseArrivalApi.createPutaway({
      receiptId: row.id,
      locationCode,
      quantity: qty,
    });
    pushDialogOpen.value = false;
    message.success(
      `已生成入库单 ${String(created.id).slice(0, 8)}…，ERP 推送待 #61.2`,
    );
    await load();
  } catch (cause) {
    message.error(
      cause instanceof Error ? cause.message : '生成入库单失败',
    );
  } finally {
    pushDialogSubmitting.value = false;
  }
}

function onOpenDetail(row: Receipt) {
  router.push({ name: 'PurchaseArrivalPoOverview', params: { poId: String(row.poId) } });
}

const conclusionTagColor = (
  c: FinalConclusion | undefined,
): 'success' | 'error' | 'warning' | 'default' => {
  if (c === 'pass') return 'success';
  if (c === 'fail') return 'error';
  if (c === 'concession') return 'warning';
  return 'default';
};

const conclusionLabel = (c: FinalConclusion | undefined): string => {
  if (c === 'pass') return '通过';
  if (c === 'fail') return '未通过';
  if (c === 'concession') return '让步接收';
  return '未报检';
};

const createdAtLabel = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

// Issue #61: antdv-next a-table defaults to "未找到，请请求的资源存在"
// which is misleading when the list is genuinely empty. Override via
// the locale prop so empty rows read clearly in Chinese.
const tableLocale = {
  emptyText: () => h('div', { style: { padding: '16px', color: 'rgba(0,0,0,0.45)' } }, '暂无收货记录'),
  filterConfirm: '确定',
  filterReset: '重置',
};

// antdv-next 1.3 ignores the v4 customRender prop on columns. Simple
// dataIndex-only columns can stay in this array, but anything that
// needs to render a component lives in the <a-table-column> children
// of the template so we can use #default slot syntax.
const columns = [
  { title: '采购订单', dataIndex: 'poId', key: 'poId', width: 140 },
  { title: '行号', dataIndex: 'rowId', key: 'rowId', width: 100 },
  { title: '计划号', dataIndex: 'planNumber', key: 'planNumber', minWidth: 160 },
  { title: '收货数量', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'right' as const },
  { title: '质检结论', key: 'conclusion', width: 120 },
  { title: '收货时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 240, fixed: 'right' as const },
];
</script>

<template>
  <Page
    title="推送采购入库单"
    description="把质检结论为通过的相应的采购到货记录列出来，点击生成采购入库单、向 ERP 推送"
  >
    <DataPanel>
      <a-form layout="inline" :model="{}" @submit.prevent="onSearch">
        <a-form-item label="采购订单">
          <a-input-number
            v-model:value="filterPoId"
            :min="0"
            placeholder="PO id"
            style="width: 160px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="计划号">
          <a-input
            v-model:value="filterPlanNumber"
            placeholder="精确匹配"
            style="width: 200px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="起始时间">
          <a-date-picker
            v-model:value="filterCreatedFrom"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="起始"
            value-format="YYYY-MM-DDTHH:mm:ss[Z]"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="结束时间">
          <a-date-picker
            v-model:value="filterCreatedTo"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="结束"
            value-format="YYYY-MM-DDTHH:mm:ss[Z]"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="loading" @click="onSearch">
              查询
            </a-button>
            <a-button @click="onReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-alert
        v-if="error"
        class="my-2"
        type="error"
        :message="`加载失败：${error}`"
        description="如果提示「请登录」，请确认 SSO 登录态有效。"
        show-icon
      />

      <a-table
        :loading="loading"
        :columns="columns"
        :data-source="rows"
        :row-key="(r: Row) => r.id"
        :pagination="false"
        :bordered="true"
        :locale="tableLocale"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'conclusion'">
            <Tag :color="conclusionTagColor((record as Row).conclusion)">
              {{ conclusionLabel((record as Row).conclusion) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ createdAtLabel((record as Row).createdAt) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a
              style="margin-right: 8px; cursor: pointer; color: #1677ff"
              @click="onOpenDetail(record as Row)"
            >PO 视角</a>
            <button
              :disabled="(record as Row).conclusion !== 'pass'"
              :style="{
                cursor: (record as Row).conclusion === 'pass' ? 'pointer' : 'not-allowed',
                border: '1px solid #1677ff',
                background: (record as Row).conclusion === 'pass' ? '#1677ff' : '#f5f5f5',
                color: (record as Row).conclusion === 'pass' ? '#fff' : '#bfbfbf',
                padding: '2px 10px',
                borderRadius: '2px',
                fontSize: '13px',
              }" @click="openPushDialog(record as Row)"
            >生成入库单</button>
          </template>
        </template>
      </a-table>

      <div class="mt-3 flex justify-end">
        <a-pagination
          :current="page"
          :page-size="pageSize"
          :total="total"
          :page-size-options="['10', '20', '50', '100']"
          show-size-changer
          show-quick-jumper
          @change="onPageChange"
          @show-size-change="(_size: number, size: number) => onPageSizeChange(size)"
        />
      </div>

      <a-modal
        v-model:open="pushDialogOpen"
        title="生成入库单"
        :confirm-loading="pushDialogSubmitting"
        ok-text="确认上架"
        cancel-text="取消"
        @ok="onPushConfirm"
      >
        <p v-if="pushDialogRow" style="margin-bottom: 12px">
          生成计划号
          <strong>{{ pushDialogRow.planNumber || '(空计划号)' }}</strong>
          的入库单（收货数量 {{ pushDialogRow.quantity }}）。
        </p>
        <p style="margin-bottom: 4px">上架数量</p>
        <a-input-number
          v-model:value="pushDialogQty"
          :min="1"
          :max="pushDialogRow?.quantity ?? 1"
          style="width: 200px"
        />
      </a-modal>
    </DataPanel>
  </Page>
</template>