// ===== Cloudflare Pages Function: /api/leaderboard =====
// 处理 GET (查询排行榜) 和 POST (提交分数)

interface Env {
  DB: D1Database;
  LEADERBOARD_MAX_ENTRIES: string;
}

interface LeaderboardRow {
  id: number;
  player_name: string;
  score: number;
  mode: string;
  preset_id: string;
  created_at: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function badRequest(msg: string): Response {
  return json({ ok: false, error: msg }, 400);
}

// ---- GET /api/leaderboard?mode=&limit= ----
async function handleGet(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || '';
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '20', 10),
    100,
  );

  let query = 'SELECT * FROM leaderboard';
  const params: unknown[] = [];

  if (mode && (mode === 'normal' || mode === 'infinite')) {
    query += ' WHERE mode = ?';
    params.push(mode);
  }
  query += ' ORDER BY score DESC LIMIT ?';
  params.push(limit);

  try {
    const { results } = await env.DB.prepare(query).bind(...params).all<LeaderboardRow>();
    return json({ ok: true, data: results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: msg }, 500);
  }
}

// ---- POST /api/leaderboard ----
async function handlePost(request: Request, env: Env): Promise<Response> {
  let body: { player_name?: string; score?: number; mode?: string; preset_id?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest('无效的 JSON');
  }

  const { player_name, score, mode, preset_id = '' } = body;

  // 校验
  if (!player_name || typeof player_name !== 'string') return badRequest('缺少 player_name');
  if (player_name.length > 10) return badRequest('player_name 不能超过 10 个字符');
  if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) return badRequest('score 必须是非负整数');
  if (mode !== 'normal' && mode !== 'infinite') return badRequest('mode 必须为 normal 或 infinite');

  const maxEntries = parseInt(env.LEADERBOARD_MAX_ENTRIES || '100', 10);

  try {
    // 插入新记录
    const insert = await env.DB.prepare(
      `INSERT INTO leaderboard (player_name, score, mode, preset_id)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(player_name.trim(), score, mode, preset_id)
      .run();

    if (!insert.success) {
      return json({ ok: false, error: '插入失败' }, 500);
    }

    // 清理超出上限的旧记录（保留前 N 条）
    await env.DB.prepare(
      `DELETE FROM leaderboard WHERE id NOT IN (
         SELECT id FROM leaderboard ORDER BY score DESC LIMIT ?
       )`,
    )
      .bind(maxEntries)
      .run();

    // 返回刚插入的记录
    const { results } = await env.DB.prepare(
      'SELECT * FROM leaderboard WHERE rowid = last_insert_rowid()',
    ).all<LeaderboardRow>();

    return json({ ok: true, data: results[0] }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: msg }, 500);
  }
}

// ---- 路由 ----
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }

  if (request.method === 'GET') return handleGet(request, env);
  if (request.method === 'POST') return handlePost(request, env);

  return json({ ok: false, error: 'Method Not Allowed' }, 405);
}
