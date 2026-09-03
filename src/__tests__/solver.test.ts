import { describe, it, expect } from 'vitest';
import { solveBfs } from '@/solver/bfs';
import { applyMove } from '@/game';
import type { Layout } from '@/types';

const layoutModules = import.meta.glob<{ default: Layout }>('@/layouts/*.json', { eager: true });
const layouts: Layout[] = Object.values(layoutModules)
  .map((m) => m.default)
  .sort((a, b) => a.id.localeCompare(b.id));

describe('BFS 求解器', () => {
  for (const layout of layouts) {
    it(`${layout.name}：能在合理时间内找到首步（≤5 秒）`, () => {
      const initial = { pieces: layout.pieces.map((p) => ({ ...p })) };
      const start = Date.now();
      const result = solveBfs(initial, { progressInterval: 5000 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000);
      // 不要求每个布局都"可解"——如果不可解，firstMove 为 null，但 elapsed 必须 < 5s
      // 我们假设所有 5 个布局都是可解的（否则需要修正布局设计）
      expect(result.firstMove).not.toBeNull();
      expect(result.steps).toBeGreaterThan(0);
    }, 10_000);
  }

  it('横刀立马：最短路径应 ≥ 30 步（保证非平凡）', () => {
    const layout = layouts.find((l) => l.id === 'hengdao-lima');
    expect(layout).toBeDefined();
    const result = solveBfs({ pieces: layout!.pieces.map((p) => ({ ...p })) });
    expect(result.steps).toBeGreaterThanOrEqual(30);
    expect(result.steps).toBeLessThanOrEqual(120); // 上限保护
  }, 30_000);
});

describe('求解器输出可复现', () => {
  it('应用求解器返回的首步后，下一次调用仍能找到完整路径', () => {
    const layout = layouts.find((l) => l.id === 'hengdao-lima')!;
    let state = { pieces: layout.pieces.map((p) => ({ ...p })) };
    // 应用 BFS 给出的首步
    const first = solveBfs(state);
    expect(first.firstMove).not.toBeNull();
    state = applyMove(state, first.firstMove!.pieceId, first.firstMove!.dir);
    // 之后 BFS 应该能找到剩余的最短路径
    const next = solveBfs(state);
    expect(next.firstMove).not.toBeNull();
    expect(next.steps).toBe(first.steps - 1);
  }, 30_000);
});
