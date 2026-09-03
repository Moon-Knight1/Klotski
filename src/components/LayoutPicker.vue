<script setup lang="ts">
import { useLayoutStore } from '@/stores/layout';
const layout = useLayoutStore();
</script>

<template>
  <nav class="layout-picker" aria-label="布局选择">
    <h2 class="picker-title">选择布局</h2>
    <ul class="picker-list">
      <li v-for="l in layout.layouts" :key="l.id">
        <button
          type="button"
          class="picker-btn"
          :class="{ active: l.id === layout.currentId }"
          @click="layout.switchTo(l.id)"
        >
          {{ l.name }}
        </button>
      </li>
    </ul>
  </nav>
</template>
