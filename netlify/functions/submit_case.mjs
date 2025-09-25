import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Use POST' };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch {}

  try {
    // Ensure table exists (idempotent)
    await pool.query(`
      create table if not exists demo_events (
        id bigserial primary key,
        kind text,
        payload jsonb,
        created_at timestamptz default now()
      )
    `);

    const kind = payload.kind || 'factpulse_submission';
    await pool.query(
      'insert into demo_events(kind, payload) values($1, $2)',
      [kind, payload]
    );

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}