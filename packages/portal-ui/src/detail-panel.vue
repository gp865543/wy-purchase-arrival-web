<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <section class="portal-detail-panel">
    <header class="portal-detail-panel__header">
      <h2>{{ title }}</h2>
      <div v-if="$slots.extra" class="portal-detail-panel__actions">
        <slot name="extra"></slot>
      </div>
    </header>
    <div class="portal-detail-panel__body"><slot></slot></div>
  </section>
</template>
