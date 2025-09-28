import { neon } from "@neondatabase/serverless";

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body, null, 2),
  };
}

export async function handler(event) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const k = event.queryStringParameters?.k || "summary";

    if (k === "summary") {
      const rows = await sql`SELECT * FROM mv_cases_summary LIMIT 20;`;
      return json({ kind: k, rows });
    }

    if (k === "daily_14") {
      const rows = await sql`SELECT * FROM mv_cases_daily14 ORDER BY day DESC LIMIT 14;`;
      return json({ kind: k, rows });
    }

    if (k === "latest") {
      const rows = await sql`SELECT * FROM cases ORDER BY created_at DESC LIMIT 10;`;
      return json({ kind: k, rows });
    }

    return json({ ok: false, error: "unknown key" }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}
