// netlify/functions/cases_analytics.mjs
import { neon } from '@neondatabase/serverless';

const json = (obj, code = 200) => ({
  statusCode: code,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*',            // simple CORS
  },
  body: JSON.stringify(obj),
});

const q = {
  // ---------- MATERIALIZED VIEW READS ----------
  mv_daily_14:        `SELECT day::date AS day, total
                        FROM mv_cases_daily_14 ORDER BY day`,
  mv_daily_cat_14:    `SELECT day::date AS day, category, total
                        FROM mv_cases_daily_by_category_14
                        ORDER BY day, category`,
  mv_weekly_8:        `SELECT week, total
                        FROM mv_cases_weekly_8 ORDER BY week`,
  mv_cum_30:          `SELECT day::date AS day, total, running_total
                        FROM mv_cases_cumulative_30 ORDER BY day`,
  mv_heatmap_7:       `SELECT dow_0_sun, hour_0_23, total
                        FROM mv_cases_heatmap_7 ORDER BY dow_0_sun, hour_0_23`,

  // ---------- ON-THE-FLY FALLBACKS (match MV semantics) ----------
  fb_daily_14:        `
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', now() AT TIME ZONE 'UTC') - interval '13 days',
        date_trunc('day', now() AT TIME ZONE 'UTC'),
        interval '1 day'
      ) AS day
    ),
    counts AS (
      SELECT date_trunc('day', created_at AT TIME ZONE 'UTC') AS day, COUNT(*) AS total
      FROM cases
      GROUP BY 1
    )
    SELECT day::date AS day, COALESCE(counts.total, 0) AS total
    FROM days LEFT JOIN counts USING (day)
    ORDER BY day
  `,
  fb_daily_cat_14:    `
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', now() AT TIME ZONE 'UTC') - interval '13 days',
        date_trunc('day', now() AT TIME ZONE 'UTC'),
        interval '1 day'
      ) AS day
    ),
    cats AS (
      SELECT DISTINCT COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS category
      FROM cases
    ),
    counts AS (
      SELECT
        date_trunc('day', created_at AT TIME ZONE 'UTC') AS day,
        COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS category,
        COUNT(*) AS total
      FROM cases
      GROUP BY 1,2
    )
    SELECT d.day::date AS day, c.category, COALESCE(cnt.total, 0) AS total
    FROM days d
    CROSS JOIN cats c
    LEFT JOIN counts cnt ON cnt.day = d.day AND cnt.category = c.category
    ORDER BY d.day, c.category
  `,
  fb_weekly_8:        `
    SELECT to_char(date_trunc('week', created_at AT TIME ZONE 'UTC'), 'YYYY-"W"IW') AS week,
           COUNT(*) AS total
    FROM cases
    WHERE created_at >= now() - interval '8 weeks'
    GROUP BY 1
    ORDER BY 1
  `,
  fb_cum_30:          `
    WITH d AS (
      SELECT date_trunc('day', created_at AT TIME ZONE 'UTC') AS day, COUNT(*) AS total
      FROM cases
      WHERE created_at >= now() - interval '30 days'
      GROUP BY 1
    )
    SELECT day::date AS day, total, SUM(total) OVER (ORDER BY day) AS running_total
    FROM d ORDER BY day
  `,
  fb_heatmap_7:       `
    SELECT
      EXTRACT(dow  FROM created_at AT TIME ZONE 'UTC')::int AS dow_0_sun,
      EXTRACT(hour FROM created_at AT TIME ZONE 'UTC')::int AS hour_0_23,
      COUNT(*) AS total
    FROM cases
    WHERE created_at >= now() - interval '7 days'
    GROUP BY 1,2
    ORDER BY 1,2
  `,
  summary_counts:     `
    SELECT
      COUNT(*)                                                  AS total,
      COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS last_24h,
      COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')   AS last_7d
    FROM cases
  `,
  sample_rows:        `
    SELECT case_id, COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS category,
           summary, created_at
    FROM cases
    ORDER BY created_at DESC
    LIMIT 10
  `
};

// Utility: try MV first, fallback to FB query if MV missing
async function queryWithFallback(sql, fallbackSql, conn){
  try {
    return await conn(sql);
  } catch (e) {
    const msg = String(e || '');
    const looksMissing = /relation .* does not exist|undefined table|missing FROM-clause/i.test(msg);
    if (!looksMissing) throw e;
    return await conn(fallbackSql);
  }
}

export async function handler(event) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const k = (event.queryStringParameters?.k || 'summary').toLowerCase();

    if (k === 'summary') {
      const [counts, samples] = await Promise.all([
        sql(q.summary_counts),
        sql(q.sample_rows),
      ]);
      return json({ ok: true, counts: counts[0], recent: samples });
    }

    if (k === 'daily_14') {
      const rows = await queryWithFallback(q.mv_daily_14, q.fb_daily_14, sql);
      return json({ ok: true, rows });
    }

    if (k === 'daily_by_category_14') {
      const rows = await queryWithFallback(q.mv_daily_cat_14, q.fb_daily_cat_14, sql);
      return json({ ok: true, rows });
    }

    if (k === 'weekly_8') {
      const rows = await queryWithFallback(q.mv_weekly_8, q.fb_weekly_8, sql);
      return json({ ok: true, rows });
    }

    if (k === 'cumulative_30') {
      const rows = await queryWithFallback(q.mv_cum_30, q.fb_cum_30, sql);
      return json({ ok: true, rows });
    }

    if (k === 'heatmap_7') {
      const rows = await queryWithFallback(q.mv_heatmap_7, q.fb_heatmap_7, sql);
      return json({ ok: true, rows });
    }

    return json({ ok:false, error: 'unknown metric; use one of: summary,daily_14,daily_by_category_14,weekly_8,cumulative_30,heatmap_7' }, 400);
  } catch (e) {
    return json({ ok:false, error: String(e) }, 500);
  }
}
