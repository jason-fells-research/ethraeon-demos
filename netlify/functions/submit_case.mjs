import { neon } from '@neondatabase/serverless';
let ready=false;
async function ensure(sql){
  if(ready) return;
  await sql`CREATE TABLE IF NOT EXISTS cases (
    id BIGSERIAL PRIMARY KEY,
    case_id TEXT NOT NULL,
    category TEXT,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );`;
  ready=true;
}
export async function handler(event){
  try{
    const sql = neon(process.env.NEON_DATABASE_URL);
    await ensure(sql);
    const { caseId="", category="Uncategorized", summary="" } = JSON.parse(event.body||"{}");
    if(!summary) return { statusCode:400, body: JSON.stringify({error:"summary required"}) };
    const id = caseId || ('INC-'+Math.random().toString(36).slice(2,8).toUpperCase());
    await sql`INSERT INTO cases (case_id, category, summary) VALUES (${id}, ${category}, ${summary})`;
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ok:true, caseId:id}) };
  }catch(e){
    return { statusCode:500, body: JSON.stringify({error:String(e)}) };
  }
}
