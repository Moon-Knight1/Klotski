<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/game';
import { useHintStore } from '@/stores/hint';
import { DIRECTION_LABEL } from '@/solver';
import { useLayoutStore } from '@/stores/layout';

const game = useGameStore();
const hint = useHintStore();
const layout = useLayoutStore();

async function onHint() {
  if (hint.isSearching) return;
  if (!layout.current) return;
  await hint.request(game.snapshot());
}

function applyHint() {
  if (hint.status !== 'found' || !hint.firstMove) return;
  game.move(hint.firstMove.pieceId, hint.firstMove.dir);
  hint.reset();
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
  if (!e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'h') {
    e.preventDefault();
    onHint();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="hint-area">
    <button
      type="button"
      class="ctrl-btn hint-btn"
      :disabled="hint.isSearching"
      @click="onHint"
    >
      <span v-if="hint.isSearching">搜索中… {{ hint.exploredStates }}</span>
      <span v-else>提示下一步 <span class="kbd">H</span></span>
    </button>
    <button
      v-if="hint.status === 'found' && hint.firstMove"
      type="button"
      class="ctrl-btn apply-btn"
      @click="applyHint"
    >
      应用：{{ hint.firstMove.pieceId }} {{ DIRECTION_LABEL[hint.firstMove.dir] }}（最优 {{ hint.shortestSteps }} 步）
    </button>
  </div>
</template>
