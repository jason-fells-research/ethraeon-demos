import { neon } from '@neondatabase/serverless';

function json(body, code = 200) {
  return {
    statusCode: code,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
    body: JSON.stringify(body),
  };
}

export async function handler() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    await sql`DO $$
      BEGIN
        IF to_regclass('public.mv_cases_summary') IS NOT NULL THEN
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cases_summary;
        END IF;
        IF to_regclass('public.mv_cases_daily14') IS NOT NULL THEN
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cases_daily14;
        END IF;
      END
    $$;`;
    return json({ ok: true, refreshed: ['mv_cases_summary','mv_cases_daily14'] });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}
