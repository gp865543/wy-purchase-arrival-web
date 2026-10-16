<script setup lang="ts">
const title = import.meta.env.VITE_APP_NAME;
</script>

<template>
  <main class="blank-page" aria-label="采购入库单推送">
    <h1>{{ title }}</h1>
  </main>
</template>

<style scoped>
.blank-page {
  display: grid;
  place-items: center;
  min-height: calc(100vh - 64px);
}
</style>
