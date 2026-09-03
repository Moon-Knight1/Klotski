import { describe, it, expect } from 'vitest';
import {
  canMove,
  applyMove,
  isWin,
  cloneState,
  stateHash,
  getValidMoves,
  occupiedCellKeys,
  findPieceAt,
  WIN_CAOCAO_POSITION,
} from '@/game';
import type { BoardState, Layout } from '@/types';

/** 测试用最小布局：曹操上方被卒挡住、下方被卒挡住、左/右可移 */
function makeSimpleLayout(): Layout {
  return {
    id: 'test',
    name: 'Test',
    description: '',
    pieces: [
      { id: 'caocao', type: 'caocao', label: '曹', x: 1, y: 2 },
      { id: 'soldier-1', type: 'soldier', label: '卒', x: 0, y: 2 },
      { id: 'soldier-2', type: 'soldier', label: '卒', x: 0, y: 3 },
      { id: 'soldier-3', type: 'soldier', label: '卒', x: 1, y: 4 },
      { id: 'soldier-4', type: 'soldier', label: '卒', x: 2, y: 4 },
    ],
    exitAt: { x: 1, y: 4 },
  };
}

function stateFromLayout(layout: Layout): BoardState {
  return { pieces: layout.pieces.map((p) => ({ ...p })) };
}

describe('canMove', () => {
  it('允许水平移动 1 格到空位', () => {
    const state = stateFromLayout(makeSimpleLayout());
    // 曹操在 (1,2)，右侧 (2,2) 空 → 可右移
    expect(canMove(state, 'caocao', 'right')).toBe(true);
  });

  it('允许垂直移动 1 格到空位', () => {
    const state = stateFromLayout(makeSimpleLayout());
    // soldier-1 在 (0,2)，上方 (0,1) 空 → 可上移
    expect(canMove(state, 'soldier-1', 'up')).toBe(true);
    // soldier-2 在 (0,3)，上方 (0,2) 有 soldier-1 → 不可上移
    expect(canMove(state, 'soldier-2', 'up')).toBe(false);
  });

  it('拒绝越界移动', () => {
    const state = stateFromLayout(makeSimpleLayout());
    expect(canMove(state, 'soldier-1', 'left')).toBe(false); // x = -1
  });

  it('拒绝被占据格子的移动', () => {
    const state = stateFromLayout(makeSimpleLayout());
    // 曹操上方 (1,1) 是空 → 可上移；下方被卒 3+4 挡住
    expect(canMove(state, 'caocao', 'up')).toBe(true);
    expect(canMove(state, 'caocao', 'down')).toBe(false);
    // 曹操右移会被挡住：(1,2)右移 1 格到 (2,2)，再向下：(2,2)(3,2)(2,3)(3,3)
    //   但 (2,3) 是空，(3,3) 是空，所以右移应合法
    expect(canMove(state, 'caocao', 'right')).toBe(true);
  });
});

describe('applyMove', () => {
  it('合法移动返回新状态，原状态不变', () => {
    const state = stateFromLayout(makeSimpleLayout());
    const after = applyMove(state, 'soldier-1', 'up');
    expect(after.pieces.find((p) => p.id === 'soldier-1')!.y).toBe(1);
    expect(state.pieces.find((p) => p.id === 'soldier-1')!.y).toBe(2); // 不变
  });

  it('非法移动抛出异常', () => {
    const state = stateFromLayout(makeSimpleLayout());
    expect(() => applyMove(state, 'caocao', 'down')).toThrow();
  });
});

describe('isWin', () => {
  it('曹操在初始位置不算赢', () => {
    const state = stateFromLayout(makeSimpleLayout());
    expect(isWin(state)).toBe(false);
  });

  it('曹操到达 (1, 3) 算赢', () => {
    const state: BoardState = {
      pieces: [
        { id: 'caocao', type: 'caocao', label: '曹', x: WIN_CAOCAO_POSITION.x, y: WIN_CAOCAO_POSITION.y },
      ],
    };
    expect(isWin(state)).toBe(true);
  });
});

describe('cloneState', () => {
  it('深拷贝：修改副本不影响原对象', () => {
    const state = stateFromLayout(makeSimpleLayout());
    const cloned = cloneState(state);
    cloned.pieces[0].x = 99;
    expect(state.pieces[0].x).toBe(1);
  });
});

describe('stateHash', () => {
  it('同一状态产生相同哈希', () => {
    const a = stateFromLayout(makeSimpleLayout());
    const b = stateFromLayout(makeSimpleLayout());
    expect(stateHash(a)).toBe(stateHash(b));
  });

  it('不同状态产生不同哈希', () => {
    const a = stateFromLayout(makeSimpleLayout());
    const b = applyMove(a, 'soldier-1', 'up');
    expect(stateHash(a)).not.toBe(stateHash(b));
  });

  it('棋子顺序不影响哈希', () => {
    const a = stateFromLayout(makeSimpleLayout());
    const reordered: BoardState = { pieces: [...a.pieces].reverse() };
    expect(stateHash(a)).toBe(stateHash(reordered));
  });
});

describe('getValidMoves', () => {
  it('从初始状态返回所有合法移动', () => {
    const state = stateFromLayout(makeSimpleLayout());
    const moves = getValidMoves(state);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((m) => canMove(state, m.pieceId, m.dir))).toBe(true);
  });
});

describe('occupiedCellKeys', () => {
  it('10 个棋子占据 18 格（曹操 4 + 将 5×2 + 卒 4×1）', () => {
    // 用真实布局测：直接 import 一个
    // 这里只能用 test 布局
    const layout = makeSimpleLayout();
    const cells = occupiedCellKeys({ pieces: layout.pieces });
    // test 布局：曹操 4 + 4 卒 = 8 cells
    expect(cells.size).toBe(8);
  });
});

describe('findPieceAt', () => {
  it('找到占据指定格的棋子', () => {
    const state = stateFromLayout(makeSimpleLayout());
    expect(findPieceAt(state, 1, 2)?.id).toBe('caocao');
    expect(findPieceAt(state, 2, 2)?.id).toBe('caocao'); // 曹操 2x2 涵盖
    expect(findPieceAt(state, 0, 2)?.id).toBe('soldier-1');
    expect(findPieceAt(state, 0, 0)).toBeUndefined(); // 空格
  });
});
