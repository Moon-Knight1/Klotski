<script setup lang="ts">
import { useGameStore } from '@/stores/game';
const game = useGameStore();
</script>

<template>
  <div class="move-counter" aria-live="polite">
    <span class="counter-label">步数</span>
    <span class="counter-value">{{ game.moveCount }}</span>
  </div>
</template>
