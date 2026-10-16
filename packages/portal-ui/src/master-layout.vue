<script setup lang="ts">
defineProps<{ detail?: boolean }>();
</script>

<template>
  <div class="portal-master" :class="{ 'portal-master--detail': detail }">
    <section class="portal-master__tree">
      <slot name="tree"></slot>
    </section>
    <section class="portal-master__content">
      <slot></slot>
    </section>
  </div>
</template>
