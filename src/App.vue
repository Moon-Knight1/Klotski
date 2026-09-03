<script setup lang="ts">
import { onMounted, computed, watch } from 'vue';
import { useGameStore } from '@/stores/game';
import { useLayoutStore } from '@/stores/layout';
import { useHintStore } from '@/stores/hint';
import Board from '@/components/Board.vue';
import LayoutPicker from '@/components/LayoutPicker.vue';
import ControlBar from '@/components/ControlBar.vue';
import HintButton from '@/components/HintButton.vue';
import MoveCounter from '@/components/MoveCounter.vue';
import WinModal from '@/components/WinModal.vue';

const game = useGameStore();
const layout = useLayoutStore();
const hint = useHintStore();

onMounted(() => {
  if (layout.current) game.init(layout.current);
});

watch(
  () => layout.currentId,
  () => {
    hint.reset();
    if (layout.current) game.init(layout.current);
  },
);

const title = computed(() => layout.current?.name ?? '华容道');
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1 class="title">{{ title }}</h1>
      <p v-if="layout.current" class="subtitle">{{ layout.current.description }}</p>
    </header>

    <main class="app-main">
      <Board />
      <div class="status-row">
        <MoveCounter />
        <HintButton />
      </div>
      <ControlBar />
    </main>

    <aside class="app-aside">
      <LayoutPicker />
    </aside>

    <WinModal v-if="game.won" />
  </div>
</template>
