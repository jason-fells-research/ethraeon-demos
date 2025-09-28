const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const u = new URL(event.rawUrl || ('https://x/?'+(event.queryStringParameters?new URLSearchParams(event.queryStringParameters).toString():'') ));
    const k = u.searchParams.get('k') || 'summary';

    // Ensure table exists (lightweight, safe)
    await sql`CREATE TABLE IF NOT EXISTS cases (
      id BIGSERIAL PRIMARY KEY,
      case_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      category TEXT
    );`;

    if (k === 'latest') {
      const rows = await sql`SELECT case_id, category, summary, created_at
                             FROM cases ORDER BY created_at DESC LIMIT 10;`;
      return ok({ latest: rows });
    }

    if (k === 'daily_14') {
      const rows = await sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               count(*)::int AS count
        FROM cases
        WHERE created_at >= now() - interval '14 days'
        GROUP BY 1
        ORDER BY 1 DESC;
      `;
      return ok({ daily_14: rows });
    }

    // default: summary
    const totals = await sql`SELECT count(*)::int AS total FROM cases;`;
    const byCat  = await sql`
      SELECT coalesce(category,'Uncategorized') AS category, count(*)::int AS count
      FROM cases GROUP BY 1 ORDER BY count DESC;
    `;
    return ok({ summary: { total: totals[0]?.total || 0, by_category: byCat } });

  } catch (e) {
    return fail(e);
  }
};

function ok(obj){
  return { statusCode: 200, headers: jsonNoCache(), body: JSON.stringify(obj) };
}
function fail(e){
  return { statusCode: 500, headers: jsonNoCache(), body: JSON.stringify({ error: String(e) }) };
}
function jsonNoCache(){
  return { 'content-type':'application/json', 'cache-control':'no-cache' };
}
