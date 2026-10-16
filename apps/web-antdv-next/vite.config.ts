import { fileURLToPath } from 'node:url';

import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => ({
  application: {},
  vite: {
    server: {
      host: '0.0.0.0',
      port: 16013,
      strictPort: true,
      fs: {
        allow: [fileURLToPath(new URL('../../..', import.meta.url))],
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:16101',
          ws: true,
        },
        // Issue #61: vite base is /apps/purchase-arrival-web/,
        // so SPA calls hit /apps/purchase-arrival-web/api/...
        // which the '/api' proxy above won't match. Add an
        // explicit base-prefixed proxy that rewrites to /.
        '/apps/purchase-arrival-web/api': {
          target: 'http://127.0.0.1:16101',
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(/^\/apps\/purchase-arrival-web\//, '/'),
          ws: true,
        },
      },
    },
  },
}));
