-- ========================================
-- 合成大MOCHI 排行榜数据库
-- Cloudflare D1 (SQLite)
-- ========================================

-- 玩家分数表
CREATE TABLE IF NOT EXISTS leaderboard (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT    NOT NULL CHECK(length(player_name) BETWEEN 1 AND 10),
  score       INTEGER NOT NULL CHECK(score >= 0),
  mode        TEXT    NOT NULL CHECK(mode IN ('normal', 'infinite')),
  preset_id   TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- 查询索引
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode_score
  ON leaderboard(mode, score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_created
  ON leaderboard(created_at);
