import { neon } from '@neondatabase/serverless';

let ready=false;
async function ensure(sql){
  if(ready) return;
  await sql`CREATE TABLE IF NOT EXISTS facts(
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    score NUMERIC NOT NULL,
    signals TEXT[],
    actions TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
  );`;
  ready=true;
}

export async function handler(event){
  try{
    const { text="", score=0, signals=[], actions=[] } = JSON.parse(event.body||"{}");
    const sql = neon(process.env.NEON_DATABASE_URL);
    await ensure(sql);
    await sql`INSERT INTO facts(text,score,signals,actions) VALUES(${text},${score},${signals},${actions})`;
    return { statusCode:200, body: JSON.stringify({ok:true}) };
  }catch(e){
    return { statusCode:500, body: JSON.stringify({error:String(e)}) };
  }
}
