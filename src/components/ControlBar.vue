<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/game';
import { useLayoutStore } from '@/stores/layout';

const game = useGameStore();
const layout = useLayoutStore();

function restart() {
  if (layout.current) game.init(layout.current);
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault();
    game.undo();
  } else if (mod && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y') && e.shiftKey) {
    e.preventDefault();
    game.redo();
  } else if (!mod && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    restart();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="control-bar" role="toolbar" aria-label="游戏控制">
    <button type="button" class="ctrl-btn" :disabled="!game.canUndo" @click="game.undo()">
      撤销 <span class="kbd">⌘Z</span>
    </button>
    <button type="button" class="ctrl-btn" :disabled="!game.canRedo" @click="game.redo()">
      重做 <span class="kbd">⇧⌘Z</span>
    </button>
    <button type="button" class="ctrl-btn" @click="restart">
      重开 <span class="kbd">R</span>
    </button>
  </div>
</template>
