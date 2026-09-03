<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStore } from '@/stores/game';
import { useLayoutStore } from '@/stores/layout';
import { useHintStore } from '@/stores/hint';

const game = useGameStore();
const layout = useLayoutStore();
const hint = useHintStore();

function restart() {
  if (layout.current) game.init(layout.current);
}

onMounted(() => {
  const btn = document.getElementById('win-restart-btn');
  btn?.focus();
});
</script>

<template>
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="win-title">
    <div class="modal">
      <h2 id="win-title" class="win-title">曹操逃脱！</h2>
      <p class="win-subtitle">
        仅用 <strong>{{ game.moveCount }}</strong> 步通关
      </p>
      <p class="win-hint" v-if="hint.shortestSteps > 0">
        求解器测得此布局最短路径为 {{ hint.shortestSteps }} 步（rule.md 中"横刀立马"已知最优 81 步）
      </p>
      <button id="win-restart-btn" type="button" class="ctrl-btn primary" @click="restart">
        再来一局
      </button>
    </div>
  </div>
</template>
