/**
 * 纯 BFS 求解器：从 initial 出发找最短路径到曹操抵达出口。
 * 层序 BFS 保证首步一定属于某条最短路径。
 *
 * 设计要点：
 * - 用 `stateHash` 字符串做 visited 去重
 * - 返回 `firstMove`：仅返回首步（用户视角只需要"提示下一步"）
 * - 支持取消与进度回调，便于主线程超时降级到 Worker
 */
import type { BoardState, Direction } from '../types';
import { applyMove, isWin, stateHash, getValidMoves } from '../game';

export interface SolveResult {
  /** 首步（null 表示当前已是终态或无解） */
  firstMove: { pieceId: string; dir: Direction } | null;
  /** 最短路径总步数（-1 表示无解/取消） */
  steps: number;
  /** 探索过的状态数 */
  exploredStates: number;
  /** 终态（用于回放/对比） */
  goalState?: BoardState;
}

export interface SolveProgress {
  explored: number;
  depth: number;
  /** 当前队列大小 */
  frontierSize: number;
}

export interface SolveOptions {
  onProgress?: (p: SolveProgress) => void;
  isCancelled?: () => boolean;
  /** 每多少节点报告一次进度，默认 2000 */
  progressInterval?: number;
}

interface QueueNode {
  state: BoardState;
  path: Array<{ pieceId: string; dir: Direction }>;
}

/** 层序 BFS：返回最短路径首步 */
export function solveBfs(initial: BoardState, opts: SolveOptions = {}): SolveResult {
  const progressInterval = opts.progressInterval ?? 2000;

  if (isWin(initial)) {
    return { firstMove: null, steps: 0, exploredStates: 1, goalState: initial };
  }

  const visited = new Set<string>([stateHash(initial)]);
  let queue: QueueNode[] = [{ state: initial, path: [] }];
  let explored = 1;
  let depth = 0;

  while (queue.length > 0) {
    if (opts.isCancelled?.()) {
      return { firstMove: null, steps: -1, exploredStates: explored };
    }

    const nextQueue: QueueNode[] = [];
    for (const node of queue) {
      for (const move of getValidMoves(node.state)) {
        const newState = applyMove(node.state, move.pieceId, move.dir);
        const hash = stateHash(newState);
        if (visited.has(hash)) continue;
        visited.add(hash);
        explored++;

        const newPath = [...node.path, move];
        if (isWin(newState)) {
          return {
            firstMove: newPath[0] ?? null,
            steps: newPath.length,
            exploredStates: explored,
            goalState: newState,
          };
        }
        nextQueue.push({ state: newState, path: newPath });
      }
    }
    queue = nextQueue;
    depth++;

    if (opts.onProgress && explored % progressInterval === 0) {
      opts.onProgress({ explored, depth, frontierSize: queue.length });
    }
  }

  return { firstMove: null, steps: -1, exploredStates: explored };
}
