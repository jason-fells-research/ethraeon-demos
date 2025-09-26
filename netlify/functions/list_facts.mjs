import { neon } from '@neondatabase/serverless';
export async function handler(){
  try{
    const sql = neon(process.env.NEON_DATABASE_URL);
    // table exists from record_fact; SELECT newest 12
    const rows = await sql`SELECT text, score::float, signals, actions, created_at
                           FROM facts ORDER BY created_at DESC LIMIT 12`;
    return { statusCode:200, headers:{'content-type':'application/json'},
             body: JSON.stringify({facts:rows}) };
  }catch(e){
    return { statusCode:500, body: JSON.stringify({error:String(e)}) };
  }
}
