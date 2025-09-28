import { neon } from '@neondatabase/serverless';

const json = (obj, code=200) => ({
  statusCode: code,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*',
  },
  body: JSON.stringify(obj),
});

export async function handler(){
  try{
    const sql = neon(process.env.NEON_DATABASE_URL);

    // Table guard (no-op if exists)
    await sql`
      CREATE TABLE IF NOT EXISTS cases(
        id BIGSERIAL PRIMARY KEY,
        case_id  TEXT NOT NULL,
        summary  TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        category TEXT
      );
    `;

    const rows = await sql`
      SELECT
        case_id,
        COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS category,
        summary,
        created_at
      FROM cases
      ORDER BY created_at DESC
      LIMIT 25
    `;

    return json({ ok:true, cases: rows });
  }catch(e){
    return json({ ok:false, error:String(e) }, 500);
  }
}
