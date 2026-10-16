# wy-purchase-arrival-web

本仓库维护武鹰 Web APP，入口基路径为 `/apps/purchase-arrival-web/`。

## 工程边界

- 业务后端使用共享 `wy-fastapi`，开发端口为 `16101`。
- 通过 wy-portal 的 Web 入口进入。
- 项目创建阶段保留基础空白页；业务页面和业务术语由后续开发补充。

## 固定开发配置

- APP 端口为 `16013`，创建时确定并记录在 `wy-project.json`。
- `wy-project.json` 是端口来源；Vite、门户代理、门户应用目录和环境配置与它保持一致。
- 服务启动沿用该端口；端口被占用时先处理占用再启动。

## 技术基线

- Vue 3、Vben、Antdv Next。
- 默认页面保留基础壳和 APP 名称；页面按对应模板约定实现。

## 协作开发

协作开发者应在自己的分支上开发、提交并推送。仅在用户明确提出时创建 Pull Request；提交或推送不会自动创建 PR。主分支仅接收经过评审的 PR 合并结果，严禁直接在主分支修改和提交。

## 共享项目约定

创建或修改 GitHub Issue、执行验收、启动或排查开发服务、连接 PDA／平板无线 ADB、排查 VPN/Wi-Fi 网络、远程启动移动壳时，先读取 [共享项目约定](../AGENTS.shared.md)。

## 发布边界

门户入口由 `wy-portal/portal-applications.json` 定义，开发与生产使用同一清单；正式交付还需构建和发布本 APP。
