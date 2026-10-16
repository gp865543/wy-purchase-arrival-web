# portal-ui

门户与桌面模板共用的表格及左树右表组件。源码由消费应用的 Vue/Vite 编译，运行依赖为 Vue 和 Antdv Next。

```ts
import { LeftTree, MasterLayout, useLeftTree } from '@wuying/portal-ui';
import type { LeftTreeNode } from '@wuying/portal-ui';
import '@wuying/portal-ui/styles.css';
```

`MasterLayout` 的 `tree` 插槽放左树，默认插槽放表格。`useLeftTree(nodes)` 提供关键词过滤、命中祖先保留和自动展开；`LeftTree` 接收过滤后的节点，双向绑定关键词、展开键和选中键，`title` 插槽可提供业务右键菜单。节点映射、清空选中的查询含义、隐藏选中节点的处理与表格勾选策略由应用决定。

### 左树拖拽

`LeftTree` 的 `draggable` 默认关闭。开启后可整行拖动：节点前后放置为同级排序，放入节点成为其第一个子节点；根节点可排序、移入其他节点，子节点可提升为根节点，移动携带整棵子树。

节点的 `canReceiveChildren: false` 禁止接收新子节点，仍允许该节点移动和其已有子节点同级排序。两个桌面模板把停用节点映射为此状态。自身及后代不能成为新上级；有搜索关键词或 `moving` 为真时禁用拖拽。

`move` 事件提供 `{ key, parentKey, siblingKeys }`：移动节点、目标父节点（`null` 表示根级）及目标层完整有序节点 ID。`applyLeftTreeMove(records, move)` 更新平铺记录的 `parentId` 和目标层 `sort`（从 0 开始），保留后代关系和其他字段。消费页面在松手后保存；远程保存期间传入 `moving`，失败恢复原记录。

已启用实例：`WEB-MASTER-01` 质检类型树、`WEB-MASTER-02` 部门树。

模板使用 `workspace:*`，同级门户使用 `link:../../../wy-templates/packages/portal-ui`。两仓执行 pnpm install 后启动各自应用。桌面表面 Token 源文件为 `src/tokens.css`，模板原有通用容器同时引用它。

根工程 `scripts/release.sh build` 固定两仓 HEAD，提取门户及共享包到同级隔离目录。共享包 peer 依赖使用门户锁文件安装的依赖，清单记录 `portal_commit` 和 `templates_commit`。发布前提交共享包与门户改动。

## 公共桌面表格

`@wuying/portal-ui/table/use-desktop-grid` 导出 `useDesktopGrid`，接受现有 Vben `gridOptions`、`gridEvents`、`formOptions`。表格配置、通用渲染器、筛选面板和查询契约位于本包的 `src/table`，运行依赖由消费应用提供。

模板使用 `@wuying/portal-ui/table/use-template-grid` 的 `useTemplateGrid`，传入现有 `queryAdapter`；返回 `[Grid, api, queryState]`。关键词、逐列条件和排序合并后交由数据源查询完整数据集。跨页保留选择；查询、排序和刷新清空选择，刷新保留条件。`buildCurrentQuery()` 可供全量导出复用。

| 参数 | 默认与用途 |
| --- | --- |
| `gridOptions.cellConfig.height` | 未指定时跟随公共密度：舒适 48px、紧凑 40px；显式数字由 VXE 同时用于普通列、固定列和滚动定位 |
| `gridOptions.columns[].width/minWidth` | 字段按内容配置；选择列默认 48px；操作列默认 160px，可按按钮数量调整 |
| `gridOptions.columns[].align` | 默认居中，可设置 `left`、`center`、`right` |
| `gridOptions.columns[].fixed` | 由页面配置；选择列默认固定左侧，操作列默认右侧 |
| `gridOptions.pagerConfig.pageSize` | 模板默认 50，页面可指定其他数量 |
| `statusOptions` | 模板紧凑查询栏的可选状态字典；提交 `status in [value]` 条件 |
| `formOptions` / `formConditions(values)` | 多条件表单及业务条件映射；`toolbarConfig.search` 启用展开/收起入口 |

`toolbar-actions` 提供左上业务按钮及选择信息。操作列使用 `slots: { default: 'row-actions' }`，`row-actions` 的参数包含当前 `row`。两个 slot 独立；页面负责按钮、权限、禁用、确认和事件，公共表格负责间距、排列和操作列默认配置。

`CompactQuery` 可从 `@wuying/portal-ui/table/compact-query` 导入，用 `v-model:keyword`、`v-model:status`、`statusOptions` 和 `search/reset` 事件接入业务查询映射。未提供状态字典时只显示关键词、查询和重置。

### 本轮接入清单（corntrace/wuying3#44）

| 实施票 | 范围 | 当前接入 |
| --- | --- | --- |
| #45 | WEB-LIST-01 生产线；公共验收页可操作与只读表 | 已验收，见 `docs/templates/acceptance-wuying3-45.md` |
| #46 | 门户账号、角色成员 | 已接入，验收记录见门户 `docs/verification/wuying3-46-shared-tables.md` |
| #47 | 执行单、生产计划、资产卡片、标签样式、供应商、资产来源、质检项目 | 已验收，见 `docs/templates/acceptance-wuying3-47.md` |
| #48 | 执行单工序/用料；计划产品/来源订单 | 已验收，见 `docs/templates/acceptance-wuying3-48.md` |
| #49 | 计划号型、汇总、套装裁剪、单品裁剪、库提号型、BOM、物料、路线、质检 | 已验收，见 `docs/templates/acceptance-wuying3-49.md` |
| #50 | 订单进度；物料计划/明细/钻取；分析结果/钻取；排程任务 | 已验收，见 `docs/templates/acceptance-wuying3-50.md` |
| #51 | 账号导入预览；旧入口清理、逐表核对、固定双仓离线构建 | 验收记录见 `docs/templates/acceptance-wuying3-51.md` |
