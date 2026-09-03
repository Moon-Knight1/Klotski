<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/game';
import { useHintStore } from '@/stores/hint';
import Piece from './Piece.vue';
import { findPieceAt } from '@/game';
import { BOARD_COLS, BOARD_ROWS, EXIT_X_START, EXIT_X_END } from '@/constants';

const game = useGameStore();
const hint = useHintStore();

const cellSize = ref(72);

function recomputeCellSize() {
  if (typeof window === 'undefined') return;
  // D30：min(80px, 屏宽 / 4.5)，保证触控 ≥44px
  const formula = Math.floor((window.innerWidth - 32) / 4.5);
  cellSize.value = Math.max(48, Math.min(80, formula));
}

onMounted(() => {
  recomputeCellSize();
  window.addEventListener('resize', recomputeCellSize);
});
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', recomputeCellSize);
  }
});

const boardWidth = computed(() => cellSize.value * BOARD_COLS);
const boardHeight = computed(() => cellSize.value * BOARD_ROWS);
const exitWidth = computed(() => (EXIT_X_END - EXIT_X_START + 1) * cellSize.value);
const exitLeft = computed(() => EXIT_X_START * cellSize.value);

function cellStyle(idx: number) {
  const x = idx % BOARD_COLS;
  const y = Math.floor(idx / BOARD_COLS);
  return {
    left: `${(x * 100) / BOARD_COLS}%`,
    top: `${(y * 100) / BOARD_ROWS}%`,
    width: `${100 / BOARD_COLS}%`,
    height: `${100 / BOARD_ROWS}%`,
  };
}

function handleCellClick(x: number, y: number) {
  const piece = findPieceAt({ pieces: game.pieces }, x, y);
  if (!piece) {
    game.select(null); // 点空白：取消选中
    return;
  }
  if (game.selectedPieceId === piece.id) {
    game.select(null); // 再次点同一棋子：取消选中
    return;
  }
  // 点另一棋子或无选中 → 选中
  game.select(piece.id);
}

const highlightedHintPieceId = computed(() => {
  if (hint.status === 'found' && hint.firstMove) return hint.firstMove.pieceId;
  return null;
});
</script>

<template>
  <div class="board-wrapper">
    <div
      class="board"
      :style="{ width: `${boardWidth}px`, height: `${boardHeight}px` }"
      role="grid"
      :aria-label="`华容道棋盘 ${BOARD_COLS} 列 ${BOARD_ROWS} 行`"
    >
      <button
        v-for="(_, idx) in BOARD_COLS * BOARD_ROWS"
        :key="`cell-${idx}`"
        type="button"
        class="cell"
        :style="cellStyle(idx)"
        :aria-label="`第 ${(idx % BOARD_COLS) + 1} 列第 ${Math.floor(idx / BOARD_COLS) + 1} 行`"
        @click="handleCellClick(idx % BOARD_COLS, Math.floor(idx / BOARD_COLS))"
      />
      <Piece
        v-for="piece in game.pieces"
        :key="piece.id"
        :piece="piece"
        :cell-size="cellSize"
        :selected="piece.id === game.selectedPieceId"
        :illegal="piece.id === game.illegalFlashId"
        :hint="piece.id === highlightedHintPieceId"
      />
    </div>
    <div
      class="exit"
      :style="{ left: `${exitLeft}px`, width: `${exitWidth}px` }"
      aria-hidden="true"
    >
      <span class="exit-text">华容道</span>
    </div>
  </div>
</template>
