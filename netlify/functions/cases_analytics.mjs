import { neon } from '@neondatabase/serverless';

function json(body, code = 200) {
  return {
    statusCode: code,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const k = (event.queryStringParameters && event.queryStringParameters.k) || 'summary';

    if (k === 'summary') {
      const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM cases;`;
      const byCat =
        await sql`SELECT category, COUNT(*)::int AS count
                  FROM cases
                  GROUP BY category
                  ORDER BY count DESC NULLS LAST;`;
      return json({ ok: true, total, by_category: byCat });
    }

    if (k === 'daily_14') {
      const rows =
        await sql`WITH days AS (
                    SELECT generate_series(current_date - interval '13 day',
                                           current_date, '1 day')::date AS d
                  ),
                  counts AS (
                    SELECT date_trunc('day', created_at)::date AS d,
                           COUNT(*)::int AS c
                    FROM cases
                    GROUP BY 1
                  )
                  SELECT days.d AS day, COALESCE(counts.c,0) AS count
                  FROM days
                  LEFT JOIN counts ON counts.d = days.d
                  ORDER BY day;`;
      return json({ ok: true, days: rows });
    }

    if (k === 'latest') {
      const rows =
        await sql`SELECT case_id, category, summary, created_at
                  FROM cases
                  ORDER BY created_at DESC
                  LIMIT 25;`;
      return json({ ok: true, cases: rows });
    }

    return json({ ok: false, error: 'unknown k' }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}
