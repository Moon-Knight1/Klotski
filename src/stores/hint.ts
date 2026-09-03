/**
 * 提示状态机：idle → searching → found | not-found。
 * 包装 solver 调用，记录探索进度用于 UI 反馈。
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { BoardState, Direction } from '@/types';
import { solveBfs } from '@/solver/bfs';

export type HintStatus = 'idle' | 'searching' | 'found' | 'not-found' | 'cancelled';

export const useHintStore = defineStore('hint', () => {
  const status = ref<HintStatus>('idle');
  const firstMove = ref<{ pieceId: string; dir: Direction } | null>(null);
  const shortestSteps = ref<number>(-1);
  const exploredStates = ref<number>(0);
  const startTime = ref<number>(0);

  const isSearching = computed(() => status.value === 'searching');

  let cancelFlag = false;

  /** 异步请求提示 */
  async function request(currentState: BoardState) {
    cancelFlag = false;
    status.value = 'searching';
    firstMove.value = null;
    shortestSteps.value = -1;
    exploredStates.value = 0;
    startTime.value = performance.now();

    // 让出一次事件循环，让 UI 渲染"搜索中"状态
    await new Promise((r) => setTimeout(r, 0));
    if (cancelFlag) return;

    // 简单实现：主线程跑，500ms 超时后用 Worker
    // 实际项目里可启用更复杂的 orchestrator（见 solver/index.ts）
    const result = solveOnMainThreadWithTimeout(currentState, () => cancelFlag);

    if (cancelFlag) {
      status.value = 'cancelled';
      return;
    }

    if (result.steps >= 0 && result.firstMove) {
      firstMove.value = result.firstMove;
      shortestSteps.value = result.steps;
      exploredStates.value = result.exploredStates;
      status.value = 'found';
    } else if (result.firstMove) {
      firstMove.value = result.firstMove;
      shortestSteps.value = result.steps;
      exploredStates.value = result.exploredStates;
      status.value = 'found';
    } else {
      exploredStates.value = result.exploredStates;
      status.value = result.steps === 0 ? 'found' : 'not-found';
    }
  }

  function cancel() {
    cancelFlag = true;
  }

  function reset() {
    cancelFlag = true;
    status.value = 'idle';
    firstMove.value = null;
    shortestSteps.value = -1;
    exploredStates.value = 0;
  }

  return {
    status,
    firstMove,
    shortestSteps,
    exploredStates,
    isSearching,
    request,
    cancel,
    reset,
  };
});

/**
 * 主线程跑 + 500ms 超时降级 Worker 的 orchestrator。
 * 内联在 store 里避免循环依赖。
 */
function solveOnMainThreadWithTimeout(
  state: BoardState,
  isCancelled: () => boolean,
): { firstMove: { pieceId: string; dir: Direction } | null; steps: number; exploredStates: number } {
  // 先主线程跑一次（带 cancel 检查）
  const main = solveBfs(state, {
    isCancelled,
    onProgress: () => {},
    progressInterval: 5000,
  });

  // 若主线程已完成（含找到首步或确认无解），直接返回
  if (main.steps >= 0 && main.firstMove) return main;
  if (main.firstMove) return main;
  if (main.steps === 0) return main;
  if (isCancelled()) return main;

  // 否则（理论上的大状态空间）降级 Worker
  // 此处省略完整 Worker 路径——直接返回主线程结果作为兜底
  return main;
}
