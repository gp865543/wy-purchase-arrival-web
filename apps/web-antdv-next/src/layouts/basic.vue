<script lang="ts" setup>
import { watch } from 'vue';
import { useRouter } from 'vue-router';

import { useWatermark } from '@vben/hooks';
import { BasicLayout, UserDropdown } from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';

const router = useRouter();
const appName = import.meta.env.VITE_APP_NAME;
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

function returnToDesktop() {
  const prefix = window.location.pathname.split(import.meta.env.BASE_URL)[0];
  const entry = new URLSearchParams(window.location.search).get('portal_entry') || '/desktop';
  const portal = new URL(`${prefix}/#${entry}`, window.location.origin);
  if (import.meta.env.DEV && portal.port === import.meta.env.VITE_PORT)
    portal.port = '16001';
  window.location.assign(portal.href);
}

const menus = [
  {
    handler: () => router.push(preferences.app.defaultHomePath),
    icon: 'lucide:house',
    text: appName,
  },
];

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';
      await updateWatermark({
        advancedStyle: {
          colorStops: [
            { color: watermarkColor, offset: 0 },
            { color: watermarkColor, offset: 1 },
          ],
          type: 'linear',
        },
        content: content || appName,
      });
    } else {
      destroyWatermark();
    }
  },
  { immediate: true },
);
</script>

<template>
  <BasicLayout @click-logo="returnToDesktop">
    <template #user-dropdown>
      <UserDropdown
        :avatar="preferences.app.defaultAvatar"
        :menus
        :show-logout="false"
        :text="appName"
      />
    </template>
  </BasicLayout>
</template>
