/**
 * 游戏核心逻辑
 * - 棋盘占用关系查询
 * - 移动合法性校验
 * - 应用移动、胜负判定
 * - 状态深拷贝与哈希（用于撤销栈与 BFS 去重）
 */
import type { BoardState, Direction, Move } from './types';
import { DIRECTION_DELTA } from './types';
import { BOARD_COLS, BOARD_ROWS, PIECE_DIMS } from './constants';

/** 胜利位置：曹操左上角 (1, 3)，即占据 (1,3)(2,3)(1,4)(2,4)，底边贴齐出口 */
export const WIN_CAOCAO_POSITION = { x: 1, y: 3 } as const;

/** 给定棋子，返回它占据的所有格子坐标 */
export function pieceCells(piece: BoardState['pieces'][number]): Array<[number, number]> {
  const { width, height } = PIECE_DIMS[piece.type];
  const cells: Array<[number, number]> = [];
  for (let dx = 0; dx < width; dx++) {
    for (let dy = 0; dy < height; dy++) {
      cells.push([piece.x + dx, piece.y + dy]);
    }
  }
  return cells;
}

/** (x, y) 坐标编码为字符串，用于 Set 去重 */
export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

/** 返回当前棋盘所有被占据的格子键集合 */
export function occupiedCellKeys(state: BoardState): Set<string> {
  const keys = new Set<string>();
  for (const piece of state.pieces) {
    for (const [cx, cy] of pieceCells(piece)) {
      keys.add(cellKey(cx, cy));
    }
  }
  return keys;
}

/** 单格是否被任意棋子占据 */
export function isCellOccupied(state: BoardState, x: number, y: number): boolean {
  for (const piece of state.pieces) {
    if (x >= piece.x && x < piece.x + PIECE_DIMS[piece.type].width &&
        y >= piece.y && y < piece.y + PIECE_DIMS[piece.type].height) {
      return true;
    }
  }
  return false;
}

/** 找出占据某格的棋子（未找到返回 undefined） */
export function findPieceAt(
  state: BoardState,
  x: number,
  y: number,
): BoardState['pieces'][number] | undefined {
  for (const piece of state.pieces) {
    if (x >= piece.x && x < piece.x + PIECE_DIMS[piece.type].width &&
        y >= piece.y && y < piece.y + PIECE_DIMS[piece.type].height) {
      return piece;
    }
  }
  return undefined;
}

/**
 * 校验棋子是否可以朝指定方向移动一步。
 * 规则：纯水平或纯垂直 1 格；新位置的所有格子均需在棋盘内且为空
 * （但属于棋子自身的格子不算占用）。
 */
export function canMove(state: BoardState, pieceId: string, dir: Direction): boolean {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece) return false;
  const { width, height } = PIECE_DIMS[piece.type];
  const { x: dx, y: dy } = DIRECTION_DELTA[dir];

  const newX = piece.x + dx;
  const newY = piece.y + dy;

  // 越界检查（出口移动不在此路径——见下）
  if (newX < 0 || newY < 0) return false;
  if (newX + width > BOARD_COLS) return false;
  if (newY + height > BOARD_ROWS) return false;

  // 占用检查：原棋子占据的格子在移动后仍被同一棋子占据，无需再判
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const cx = newX + i;
      const cy = newY + j;
      // 跳过属于原棋子自身位置的格子
      if (cx >= piece.x && cx < piece.x + width &&
          cy >= piece.y && cy < piece.y + height) {
        continue;
      }
      if (isCellOccupied(state, cx, cy)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 应用移动并返回新状态（不可变更新）。
 * 调用前请用 canMove 校验；非法移动抛出异常。
 */
export function applyMove(state: BoardState, pieceId: string, dir: Direction): BoardState {
  if (!canMove(state, pieceId, dir)) {
    throw new Error(`非法移动：${pieceId} ${dir}（state: ${stateHash(state)}）`);
  }
  return {
    pieces: state.pieces.map((p) =>
      p.id === pieceId ? { ...p, x: p.x + DIRECTION_DELTA[dir].x, y: p.y + DIRECTION_DELTA[dir].y } : p,
    ),
  };
}

/** 判定当前状态是否胜利（曹操抵达出口位置） */
export function isWin(state: BoardState): boolean {
  const caocao = state.pieces.find((p) => p.type === 'caocao');
  if (!caocao) return false;
  return caocao.x === WIN_CAOCAO_POSITION.x && caocao.y === WIN_CAOCAO_POSITION.y;
}

/** 深拷贝棋盘状态（用于撤销栈） */
export function cloneState(state: BoardState): BoardState {
  return { pieces: state.pieces.map((p) => ({ ...p })) };
}

/**
 * 棋盘状态规范化哈希：按 id 排序后拼接坐标。
 * 用于 BFS 去重——同一哈希 = 同一棋盘布局。
 */
export function stateHash(state: BoardState): string {
  const sorted = [...state.pieces].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.map((p) => `${p.id}@${p.x},${p.y}`).join('|');
}

/** 枚举所有合法移动（用于 BFS 扩展节点） */
export function getValidMoves(
  state: BoardState,
): Array<{ pieceId: string; dir: Direction }> {
  const moves: Array<{ pieceId: string; dir: Direction }> = [];
  for (const piece of state.pieces) {
    for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
      if (canMove(state, piece.id, dir)) {
        moves.push({ pieceId: piece.id, dir });
      }
    }
  }
  return moves;
}

/** 给定移动序列，从初始状态逐步应用，生成最终状态（用于求解器回放） */
export function replayMoves(initial: BoardState, moves: Move[]): BoardState {
  let cur = initial;
  for (const move of moves) {
    const dir = inferDirection(move);
    cur = applyMove(cur, move.pieceId, dir);
  }
  return cur;
}

function inferDirection(move: Move): Direction {
  if (move.to.x === move.from.x && move.to.y === move.from.y - 1) return 'up';
  if (move.to.x === move.from.x && move.to.y === move.from.y + 1) return 'down';
  if (move.to.y === move.from.y && move.to.x === move.from.x - 1) return 'left';
  if (move.to.y === move.from.y && move.to.x === move.from.x + 1) return 'right';
  throw new Error(`无法推断方向: from ${JSON.stringify(move.from)} to ${JSON.stringify(move.to)}`);
}
