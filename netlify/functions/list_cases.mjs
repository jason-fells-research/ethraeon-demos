export default async (req) => {
  try {
    const url = process.env.NEON_DATABASE_URL;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25',10), 100);
    const format = (searchParams.get('format') || 'json').toLowerCase();

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(url);
    const rows = await sql`SELECT id, case_id, summary, created_at FROM cases ORDER BY id DESC LIMIT ${limit}`;

    if (format === 'html'){
      const rowsHtml = rows.map(r =>
        `<tr><td>${r.id}</td><td>${escapeHtml(r.case_id)}</td><td>${escapeHtml(r.summary)}</td><td>${new Date(r.created_at).toLocaleString()}</td></tr>`
      ).join('');
      const html = `
        <style>
          table{width:100%;border-collapse:separate;border-spacing:0 6px;font-size:14px}
          th{text-align:left;color:#a5a7ac;font-weight:600}
          td,th{padding:8px 10px}
          tr{background:#111317;border:1px solid #1b1e25}
          tr td:first-child{border-top-left-radius:10px;border-bottom-left-radius:10px}
          tr td:last-child{border-top-right-radius:10px;border-bottom-right-radius:10px}
        </style>
        <table>
          <thead><tr><th>ID</th><th>Case</th><th>Summary</th><th>Created</th></tr></thead>
          <tbody>${rowsHtml || '<tr><td colspan="4">No cases yet.</td></tr>'}</tbody>
        </table>`;
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' }});
    }

    return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' }});
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

function escapeHtml(s=''){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
