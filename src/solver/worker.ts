/**
 * Web Worker 入口：在后台跑 BFS，主线程不会被阻塞。
 * 协议：
 *   主线程 → Worker：{ type: 'solve', id, state }
 *   Worker → 主线程：{ type: 'progress', id, explored, depth, frontierSize }
 *                  或 { type: 'result', id, result }
 *                  或 { type: 'error', id, message }
 *   主线程 → Worker：{ type: 'cancel', id }
 */
import type { BoardState } from '../types';
import { solveBfs, type SolveProgress } from './bfs';

interface SolveRequest {
  type: 'solve';
  id: number;
  state: BoardState;
}

interface CancelRequest {
  type: 'cancel';
  id: number;
}

type IncomingMessage = SolveRequest | CancelRequest;

const cancelFlags = new Map<number, boolean>();

self.addEventListener('message', (event: MessageEvent<IncomingMessage>) => {
  const data = event.data;
  if (data.type === 'solve') {
    cancelFlags.set(data.id, false);
    try {
      const result = solveBfs(data.state, {
        isCancelled: () => cancelFlags.get(data.id) === true,
        onProgress: (p: SolveProgress) => {
          (self as unknown as Worker).postMessage({
            type: 'progress',
            id: data.id,
            explored: p.explored,
            depth: p.depth,
            frontierSize: p.frontierSize,
          });
        },
        progressInterval: 5000,
      });
      (self as unknown as Worker).postMessage({ type: 'result', id: data.id, result });
    } catch (err) {
      (self as unknown as Worker).postMessage({
        type: 'error',
        id: data.id,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      cancelFlags.delete(data.id);
    }
  } else if (data.type === 'cancel') {
    cancelFlags.set(data.id, true);
  }
});
