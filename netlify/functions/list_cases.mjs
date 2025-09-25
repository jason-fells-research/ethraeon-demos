export default async () => {
  try {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) return new Response(JSON.stringify({ error: 'DB url missing' }), { status: 500 });
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    const rows = await sql`SELECT id, case_id, summary, created_at FROM cases ORDER BY id DESC LIMIT 25`;
    return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' }});
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
