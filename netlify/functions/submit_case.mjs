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

export async function handler(event){
  try{
    if (event.httpMethod !== 'POST') {
      return json({ error: 'Use POST' }, 405);
    }

    let body = {};
    try { body = JSON.parse(event.body || '{}'); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    const cid      = (body.caseId   && String(body.caseId).trim())   || `INC-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const summary  = (body.summary  && String(body.summary).trim())  || '';
    const category = (body.category && String(body.category).trim()) || 'Uncategorized';

    if (!summary) return json({ error: 'summary required' }, 400);

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Ensure table exists (cheap if already created)
    await sql`
      CREATE TABLE IF NOT EXISTS cases(
        id BIGSERIAL PRIMARY KEY,
        case_id  TEXT NOT NULL,
        summary  TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        category TEXT
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cases_case_id ON cases(case_id);
    `;

    await sql`
      INSERT INTO cases (case_id, category, summary)
      VALUES (${cid}, ${category}, ${summary})
    `;

    return json({ ok:true, caseId: cid, category, summary });
  }catch(e){
    return json({ ok:false, error:String(e) }, 500);
  }
}
