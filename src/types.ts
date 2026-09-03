import type { PieceType } from './constants';

/**
 * 棋盘坐标：(x, y)，x 为列 0..3，y 为行 0..4。
 * 例：曹操 2×2 大方块左上角坐标 (1, 0) 占据 (1,0)(2,0)(1,1)(2,1) 四格。
 */
export interface Position {
  x: number;
  y: number;
}

/** 单个棋子 */
export interface Piece {
  /** 稳定 ID：用于 key 与跨状态追踪 */
  id: string;
  /** 棋子类型 */
  type: PieceType;
  /** 显示标签（中文字符） */
  label: string;
  /** 左上角列 */
  x: number;
  /** 左上角行 */
  y: number;
}

/** 布局（初始棋盘状态） */
export interface Layout {
  /** 唯一 ID，对应文件名 */
  id: string;
  /** 中文名 */
  name: string;
  /** 简要描述 */
  description: string;
  /** 初始棋子列表 */
  pieces: Piece[];
  /** 出口位置（曹操需整体移出此位置） */
  exitAt: Position;
}

/** 当前棋盘状态 = 一组棋子 */
export interface BoardState {
  pieces: Piece[];
}

/** 一步移动：哪个棋子从哪到哪 */
export interface Move {
  pieceId: string;
  from: Position;
  to: Position;
}

/** 方向 */
export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTION_DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
