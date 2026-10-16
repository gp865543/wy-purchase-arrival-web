# 武鹰制衣智能工厂页面模板库

基于 Vue 3、Vite、TypeScript、Vue Vben Admin 5.7 和 `antdv-next` 的 Web 页面模板库。

## 开发

环境要求：Node.js `^22.18.0 || ^24.0.0`，pnpm `>=10.0.0`。

```bash
pnpm install
pnpm --dir ../wy-portal --filter @vben/backend-mock start # 独立终端，公共 Mock 端口 5321
pnpm dev:antdv-next
```

开发服务默认运行在 `http://localhost:16002`。

## 检查与构建

```bash
pnpm --filter @vben/web-antdv-next typecheck
pnpm build:antdv-next
pnpm lint
```

## 目录约定

- `apps/web-antdv-next`：页面模板应用，使用 `antdv-next`
- `apps/web-antdv-next/src/views`：页面模板实现
- `apps/web-antdv-next/src/router/routes/modules`：模板菜单与路由
- `packages`：Vben 共享能力与组件封装
- `../wy-portal/apps/backend-mock`：独立启动的公共开发 Mock

页面模板优先放在 `apps/web-antdv-next/src/views`，每个模板通过独立路由进入，便于业务项目复用和验收。

## 参考

- [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin)
- [Antdv Next](https://github.com/vueComponent/ant-design-vue-next)

公共 Mock 与共享模板数据由相邻的 `wy-portal` 仓库维护，两仓库保持同级目录。先在 portal 安装依赖并启动公共 Mock（5321），再按需启动桌面（16002）和移动前端（16003）；前端重启保留模拟状态，Mock 重启恢复初始化数据。`apps/template-data` 仅导出 portal 的共享数据定义。
