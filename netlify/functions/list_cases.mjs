import { neon } from "@neondatabase/serverless";

export async function handler() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);

    const rows = await sql`SELECT case_id, summary, category, created_at FROM cases ORDER BY created_at DESC LIMIT 20`;

    // normalize results
    const safe = rows.map(r => ({
      case_id: r.case_id,
      summary: r.summary,
      category: r.category || "Uncategorized",
      created_at: r.created_at
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ cases: safe })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
}
