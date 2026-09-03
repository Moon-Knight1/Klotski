<script setup lang="ts">
import { computed } from 'vue';
import type { Piece as PieceType } from '@/types';
import { PIECE_DIMS, PIECE_LABELS } from '@/constants';

const props = defineProps<{
  piece: PieceType;
  cellSize: number;
  selected: boolean;
  illegal: boolean;
  hint: boolean;
}>();

const emit = defineEmits<{
  (e: 'pick', id: string): void;
}>();

const dims = computed(() => PIECE_DIMS[props.piece.type]);
const label = computed(() => PIECE_LABELS[props.piece.type]);

const style = computed(() => ({
  left: `${props.piece.x * props.cellSize}px`,
  top: `${props.piece.y * props.cellSize}px`,
  width: `${dims.value.width * props.cellSize}px`,
  height: `${dims.value.height * props.cellSize}px`,
}));

const classNames = computed(() => ({
  piece: true,
  [`piece-${props.piece.type}`]: true,
  'piece-selected': props.selected,
  'piece-illegal': props.illegal,
  'piece-hint': props.hint,
}));

function onClick() {
  emit('pick', props.piece.id);
}
</script>

<template>
  <button
    type="button"
    :class="classNames"
    :style="style"
    :aria-label="`${piece.type === 'caocao' ? '曹操' : piece.type === 'general' ? '武将' : '士兵'} ${piece.id}`"
    @click.stop="onClick"
  >
    <span class="piece-label">{{ label }}</span>
  </button>
</template>
