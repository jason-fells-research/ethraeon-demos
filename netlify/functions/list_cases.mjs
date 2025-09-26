import { neon } from '@neondatabase/serverless';

export async function handler() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS cases (
      id BIGSERIAL PRIMARY KEY,
      case_id TEXT NOT NULL,
      category TEXT,
      summary TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );`;
    const rows = await sql`SELECT case_id, category, summary, created_at
                           FROM cases ORDER BY created_at DESC LIMIT 25;`;
    return { statusCode: 200, headers: {'content-type':'application/json'},
             body: JSON.stringify({ cases: rows }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
}
