/**
 * 游戏主状态：当前棋盘、撤销/重做栈、选中棋子、步数、胜负。
 * 历史 = 完整快照栈（D17）。
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { BoardState, Direction, Layout } from '@/types';
import { applyMove, canMove, cloneState, isWin } from '@/game';

export const useGameStore = defineStore('game', () => {
  /** 当前棋盘状态 */
  const pieces = ref<BoardState['pieces']>([]);
  /** 撤销栈：历史快照 */
  const undoStack = ref<BoardState[]>([]);
  /** 重做栈 */
  const redoStack = ref<BoardState[]>([]);
  /** 步数 */
  const moveCount = ref(0);
  /** 选中的棋子 id（用于点选 + 点目标交互） */
  const selectedPieceId = ref<string | null>(null);
  /** 上次非法移动的棋子 id（用于闪烁红边反馈） */
  const illegalFlashId = ref<string | null>(null);

  const won = computed(() => isWin({ pieces: pieces.value }));
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  /** 用布局初始化棋盘（清空历史） */
  function init(layout: Layout) {
    pieces.value = layout.pieces.map((p) => ({ ...p }));
    undoStack.value = [];
    redoStack.value = [];
    moveCount.value = 0;
    selectedPieceId.value = null;
    illegalFlashId.value = null;
  }

  function restart() {
    // 重开 = 把当前布局回到初始：先记录一个 undo 节点不太合适，
    // 直接把当前 pieces 视为初始（更符合玩家预期）
    // 但我们没有保留初始——简单做法：从 layout 重新 init
    // 这里依赖外部传入 layout，或由 LayoutStore 配合
    // 调用方应使用 useGameStore().init(useLayoutStore().currentLayout)
  }

  /** 选中/取消选中棋子 */
  function select(pieceId: string | null) {
    selectedPieceId.value = pieceId;
  }

  /** 让非法移动的棋子 id 进入"闪烁"态，UI 监听后清除 */
  function flashIllegal(pieceId: string) {
    illegalFlashId.value = pieceId;
    setTimeout(() => {
      if (illegalFlashId.value === pieceId) illegalFlashId.value = null;
    }, 400);
  }

  /**
   * 移动棋子：成功 = 推入撤销栈、清重做栈；失败 = false。
   * 点选 + 点目标模式下，dir 由 UI 根据"起点 → 终点"推算。
   */
  function move(pieceId: string, dir: Direction): boolean {
    if (!canMove({ pieces: pieces.value }, pieceId, dir)) {
      flashIllegal(pieceId);
      return false;
    }
    undoStack.value.push(cloneState({ pieces: pieces.value }));
    redoStack.value = [];
    pieces.value = applyMove({ pieces: pieces.value }, pieceId, dir).pieces;
    moveCount.value++;
    selectedPieceId.value = null;
    return true;
  }

  function undo() {
    if (undoStack.value.length === 0) return false;
    redoStack.value.push(cloneState({ pieces: pieces.value }));
    const prev = undoStack.value.pop()!;
    pieces.value = prev.pieces;
    moveCount.value = Math.max(0, moveCount.value - 1);
    return true;
  }

  function redo() {
    if (redoStack.value.length === 0) return false;
    undoStack.value.push(cloneState({ pieces: pieces.value }));
    const next = redoStack.value.pop()!;
    pieces.value = next.pieces;
    moveCount.value++;
    return true;
  }

  /** 当前棋盘快照（给求解器/UI 使用） */
  function snapshot(): BoardState {
    return { pieces: pieces.value.map((p) => ({ ...p })) };
  }

  return {
    pieces,
    undoStack,
    redoStack,
    moveCount,
    selectedPieceId,
    illegalFlashId,
    won,
    canUndo,
    canRedo,
    init,
    restart,
    select,
    flashIllegal,
    move,
    undo,
    redo,
    snapshot,
  };
});
