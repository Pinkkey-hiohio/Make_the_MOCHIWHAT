// ===== 排行榜数据类型 =====

/** 一条排行榜记录 */
export interface LeaderboardEntry {
  id: number;
  player_name: string;
  score: number;
  mode: GameModeStr;
  preset_id: string;
  created_at: string;
}

/** 游戏模式（字符串形式，用于 API 传输） */
export type GameModeStr = 'normal' | 'infinite';

/** 提交分数的请求体 */
export interface SubmitScoreRequest {
  player_name: string;
  score: number;
  mode: GameModeStr;
  preset_id: string;
}

/** API 响应包装 */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/** 排行榜查询参数 */
export interface LeaderboardQuery {
  mode?: GameModeStr;
  limit?: number;
}
