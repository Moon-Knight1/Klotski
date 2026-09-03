/**
 * 求解器统一入口（D3 决定 Q3-B）：
 *   1. 主线程跑 BFS，500ms 后若仍未结束则取消
 *   2. 把同一初始状态送入 Worker 继续搜索
 *   3. Worker 完成后返回结果
 *
 * 实际 store 端直接调用 `solveOnMainThread` + 自管理 cancel；
 * 本文件保留 Worker 协议说明与简单包装。
 */
import type { Direction } from '@/types';
import { solveBfs, type SolveProgress, type SolveResult } from './bfs';

export type { SolveResult, SolveProgress };

export interface HintCallbacks {
  onProgress?: (p: SolveProgress) => void;
}

/** 同步在主线程跑一遍（用于简单路径） */
export function solveOnMainThread(
  initial: { pieces: Array<{ id: string; type: 'caocao' | 'general' | 'soldier'; label: string; x: number; y: number }> },
): SolveResult {
  return solveBfs({ pieces: initial.pieces });
}

/** 方向中文标签 */
export const DIRECTION_LABEL: Record<Direction, string> = {
  up: '上',
  down: '下',
  left: '左',
  right: '右',
};
