import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;
const sql = neon(process.env.NEON_DATABASE_URL);

export async function handler(event) {
  try {
    const { caseId, summary } = JSON.parse(event.body || "{}");
    if (!caseId || !summary) {
      return { statusCode: 400, body: "Missing caseId or summary" };
    }

    await sql`create table if not exists demo_cases(
      id text primary key,
      summary text,
      created_at timestamptz default now()
    )`;

    await sql`
      insert into demo_cases (id, summary)
      values (${caseId}, ${summary})
      on conflict (id) do update set summary = excluded.summary
    `;

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: String(e?.message || e) };
  }
}
