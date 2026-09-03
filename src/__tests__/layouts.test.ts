import { describe, it, expect } from 'vitest';
import type { Layout, Piece } from '@/types';
import { BOARD_COLS, BOARD_ROWS, PIECE_DIMS } from '@/constants';
import { occupiedCellKeys, replayMoves } from '@/game';
import { applyMove } from '@/game';
import type { Move } from '@/types';

const layoutModules = import.meta.glob<{ default: Layout }>('@/layouts/*.json', { eager: true });
const layouts: Layout[] = Object.values(layoutModules)
  .map((m) => m.default)
  .sort((a, b) => a.id.localeCompare(b.id));

function checkBounds(piece: Piece): boolean {
  const { width, height } = PIECE_DIMS[piece.type];
  return (
    piece.x >= 0 &&
    piece.y >= 0 &&
    piece.x + width <= BOARD_COLS &&
    piece.y + height <= BOARD_ROWS
  );
}

describe('布局完整性', () => {
  for (const layout of layouts) {
    it(`${layout.name}：含 10 个棋子`, () => {
      expect(layout.pieces).toHaveLength(10);
    });

    it(`${layout.name}：1 曹 + 5 将 + 4 卒`, () => {
      const caocao = layout.pieces.filter((p) => p.type === 'caocao');
      const generals = layout.pieces.filter((p) => p.type === 'general');
      const soldiers = layout.pieces.filter((p) => p.type === 'soldier');
      expect(caocao).toHaveLength(1);
      expect(generals).toHaveLength(5);
      expect(soldiers).toHaveLength(4);
    });

    it(`${layout.name}：id 唯一`, () => {
      const ids = layout.pieces.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`${layout.name}：所有棋子都在棋盘内`, () => {
      for (const piece of layout.pieces) {
        expect(checkBounds(piece)).toBe(true);
      }
    });

    it(`${layout.name}：棋子不重叠`, () => {
      const cells = occupiedCellKeys({ pieces: layout.pieces });
      // 1 曹 4 + 5 将 × 2 + 4 卒 × 1 = 18 cells
      expect(cells.size).toBe(18);
    });
  }

  it('所有布局 id 不重复', () => {
    const ids = layouts.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('布局可玩性（移动并回放）', () => {
  for (const layout of layouts) {
    it(`${layout.name}：至少存在一个合法移动`, () => {
      // 至少一个棋子能向某个方向移动
      const initial = { pieces: layout.pieces.map((p) => ({ ...p })) };
      const directions = ['up', 'down', 'left', 'right'] as const;
      let anyMove = false;
      for (const piece of layout.pieces) {
        for (const dir of directions) {
          // 复用 canMove 的逻辑（通过试探 applyMove）
          try {
            applyMove(initial, piece.id, dir);
            anyMove = true;
            break;
          } catch {
            // 非法移动
          }
        }
        if (anyMove) break;
      }
      expect(anyMove).toBe(true);
    });

    it(`${layout.name}：replayMoves 复现走法`, () => {
      // 取布局的一个合法首步，复演一遍应当得到一致状态
      const initial = { pieces: layout.pieces.map((p) => ({ ...p })) };
      const directions = ['up', 'down', 'left', 'right'] as const;
      for (const piece of layout.pieces) {
        for (const dir of directions) {
          try {
            const after = applyMove(initial, piece.id, dir);
            // 构造 Move 对象（from → to）
            const orig = layout.pieces.find((p) => p.id === piece.id)!;
            const dx = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
            const move: Move = {
              pieceId: piece.id,
              from: { x: orig.x, y: orig.y },
              to: { x: orig.x + dx[0], y: orig.y + dx[1] },
            };
            const replayed = replayMoves(initial, [move]);
            expect(replayed.pieces).toEqual(after.pieces);
            return;
          } catch {
            // 试下一个
          }
        }
      }
    });
  }
});
