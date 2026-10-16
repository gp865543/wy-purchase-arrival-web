<template>
  <main class="blank-page" aria-label="采购入库单推送">
    <h1>{{ title }}</h1>
  </main>
</template>

<script setup lang="ts">
const title = import.meta.env.VITE_APP_NAME;
</script>

<style scoped>
.blank-page {
  display: grid;
  min-height: calc(100vh - 64px);
  place-items: center;
}
</style>
