// Netlify function: score.js  (returns varied but deterministic-ish results)
exports.handler = async (event) => {
  try{
    let text = "";
    try { ({ text = "" } = JSON.parse(event.body || "{}")); } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
    }
    if (typeof text !== "string") text = String(text||"");
    const t = text.trim();
    if (!t) return { statusCode: 200, body: JSON.stringify({ score: 0.0, signals: [], actions: [], sources: [] }) };

    // simple hash
    let h=0; for(let i=0;i<t.length;i++){ h=((h<<5)-h)+t.charCodeAt(i)|0; }
    const r1 = Math.abs(h%997)/997, r2 = Math.abs(h%313)/313, r3 = Math.abs(h%149)/149;

    const signalsPool = ['no-source-citation','low-source-cred','coordinated-amplification','misleading-caption','out-of-context-clip','synthetic-media-indicators','delegitimizing-language'];
    const actionsPool = ['monitor','link-to-official','prepare-FAQ','internal flag','platform escalation','takedown request','legal review'];
    const sourcesPool = [
      {name:"AP News", url:"https://apnews.com"},
      {name:"EU DisinfoLab", url:"https://www.disinfo.eu"},
      {name:"CDC", url:"https://www.cdc.gov"},
      {name:"WHO", url:"https://www.who.int"}
    ];
    const pick2 = (pool,a,b)=>{ const A=pool[Math.floor(a*pool.length)], i=(Math.floor(b*pool.length)+1)%pool.length, B=pool[i===pool.indexOf(A)?(i+1)%pool.length:i]; return [A,B]; };

    const score = Math.max(0, Math.min(1, 0.32 + (r1-0.5)*0.8));
    const signals = pick2(signalsPool, r2, r3);
    const actions = pick2(actionsPool, r3, r2);
    const sources = pick2(sourcesPool, r2, r3);

    return { statusCode: 200, headers:{'content-type':'application/json','cache-control':'no-cache'},
      body: JSON.stringify({ score, signals, actions, sources }) };
  }catch(e){
    return { statusCode: 200, body: JSON.stringify({ score: 0.0, signals:[], actions:[], sources:[], error:String(e) }) };
  }
};
