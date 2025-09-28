import { neon } from "@neondatabase/serverless";

export async function handler(event) {
  try {
    const { case_id, summary, category } = JSON.parse(event.body || "{}");

    if (!case_id || !summary) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing case_id or summary" })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    const safeCategory = category && category.trim() ? category : "Uncategorized";

    const result = await sql`
      INSERT INTO cases (case_id, summary, category, created_at)
      VALUES (${case_id}, ${summary}, ${safeCategory}, NOW())
      RETURNING *;
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ case: result[0] })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
}
