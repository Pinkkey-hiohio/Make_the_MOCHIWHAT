// ===== 排行榜前端 API 模块 =====

import type { ApiResponse, LeaderboardEntry, SubmitScoreRequest, LeaderboardQuery } from '../types/leaderboard';

const API_BASE = '/api/leaderboard';

/**
 * 获取排行榜
 * @param mode 游戏模式（可选，不传则返回所有模式）
 * @param limit 返回条数（默认 20）
 */
export async function fetchLeaderboard(
  mode?: string,
  limit = 20,
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams();
  if (mode) params.set('mode', mode);
  params.set('limit', String(limit));

  const res = await fetch(`${API_BASE}?${params}`);
  const json: ApiResponse<LeaderboardEntry[]> = await res.json();
  if (!json.ok) throw new Error(json.error ?? '加载排行榜失败');
  return json.data ?? [];
}

/**
 * 提交分数
 */
export async function submitScore(req: SubmitScoreRequest): Promise<LeaderboardEntry> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const json: ApiResponse<LeaderboardEntry> = await res.json();
  if (!json.ok) throw new Error(json.error ?? '提交分数失败');
  return json.data!;
}
