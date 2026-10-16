# 采购入库单推送

武鹰前端 APP，终端：web。

- APP 地址：/apps/purchase-arrival-web/
- 开发端口：16013（创建时固定，服务启动时不重新选择）
- 后端：共用 /root/projects/wuying3/wy-fastapi，端口 16101
- 门户：16001；移动终端同时使用移动门户 16005

## 开发

    pnpm install
    pnpm dev

从研发门户进入：

- Web：http://127.0.0.1:16001/
- PDA：http://127.0.0.1:16001/pda
- 平板：http://127.0.0.1:16001/tablet

门户入口已登记到 `wy-portal/portal-applications.json`；正式交付仍需把本 APP 与门户一起构建发布。
