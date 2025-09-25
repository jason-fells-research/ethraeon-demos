import { neon } from '@neondatabase/serverless';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed, use POST' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { caseId, summary } = body;

    if (!caseId || !summary) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'caseId and summary are required' }),
      };
    }

    const dbUrl =
      process.env.NEON_DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL ||
      process.env.NETLIFY_DATABASE_URL_UNPOOLED;

    if (!dbUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database URL not set in environment' }),
      };
    }

    const sql = neon(dbUrl);

    await sql`
      INSERT INTO cases (case_id, summary)
      VALUES (${caseId}, ${summary})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Case submitted successfully',
        caseId,
        summary,
      }),
    };
  } catch (err) {
    console.error('submit_case error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || 'Unknown error in submit_case',
      }),
    };
  }
}
