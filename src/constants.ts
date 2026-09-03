/**
 * 华容道棋盘常量与棋子尺寸
 * 棋盘 4 列 × 5 行（rule.md § 二）
 */
export const BOARD_COLS = 4;
export const BOARD_ROWS = 5;

/** 出口位于棋盘下方中部 2 格（rule.md § 二）：x ∈ {1,2}, y = BOARD_ROWS（出口在底边外） */
export const EXIT_X_START = 1;
export const EXIT_X_END = 2;
export const EXIT_Y = BOARD_ROWS;

export type PieceType = 'caocao' | 'general' | 'soldier';

/** 各类型棋子的尺寸（占格数）。关羽等长方块统一为横向 2×1。 */
export const PIECE_DIMS: Record<PieceType, { width: number; height: number }> = {
  caocao: { width: 2, height: 2 },
  general: { width: 2, height: 1 },
  soldier: { width: 1, height: 1 },
};

/** 棋子在棋盘上的渲染标签（用于传统中式风格） */
export const PIECE_LABELS: Record<PieceType, string> = {
  caocao: '曹',
  general: '将',
  soldier: '卒',
};

/** 棋子渲染色（仅作为 CSS class 名的语义映射，具体颜色在样式中定义） */
export const PIECE_COLOR_HINT: Record<PieceType, 'red' | 'blue' | 'gray'> = {
  caocao: 'red',
  general: 'blue',
  soldier: 'gray',
};
