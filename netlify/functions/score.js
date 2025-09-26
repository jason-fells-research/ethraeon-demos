function safeParse(body) {
  try { return JSON.parse(body || "{}"); } catch { function uniqPick(pool, rA, rB){
  const a = pool[Math.floor(rA*pool.length)];
  let b = pool[Math.floor(rB*pool.length)];
  if(b===a) b = pool[(Math.floor(rB*pool.length)+1)%pool.length];
  return [a,b];
}
function srcPick(rA,rB){
  const pool = [
    {name:"AP News", url:"https://apnews.com"},
    {name:"BBC Reality Check", url:"https://www.bbc.co.uk/news/reality_check"},
    {name:"Snopes", url:"https://www.snopes.com"},
    {name:"PolitiFact", url:"https://www.politifact.com"},
    {name:"EU DisinfoLab", url:"https://www.disinfo.eu"}
  ];
  let [s1,s2] = uniqPick(pool, rA, rB);
  return [s1,s2];
}
return {}; }
}
function djb2Hash(str){
  let h = 5381;
  for (let i=0;i<str.length;i++) h = ((h<<5) + h) + str.charCodeAt(i);
  return h >>> 0; // uint
}
exports.handler = async (event) => {
  try {
    const { text = "" } = safeParse(event.body);
    // validate
    if (typeof text !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "text must be a string" }) };
    }
    const t = text.trim().slice(0, 500); // cap length for perf
    if (!t) return { statusCode: 400, body: JSON.stringify({ error: "no text" }) };

    // deterministic but varied
    const h = djb2Hash(t);
    const rnd = s => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
    const r1 = rnd(h), r2 = rnd(h+13), r3 = rnd(h+27);

    const signalsPool = ['no-source-citation','low-source-cred','coordinated-amplification','misleading-caption','out-of-context-clip','synthetic-media-indicators','delegitimizing-language'];
    const actionsPool = ['monitor','prepare-FAQ','link-to-official','internal flag','legal review','platform escalation','takedown request'];
    const pick = (arr, r)=> arr[Math.floor(r * arr.length)];
    const score = Math.max(0, Math.min(1, 0.25 + 0.6*r1)); // 25–85%

    const sourcesPool = [
      {name:"Reuters", url:"https://www.reuters.com"},
      {name:"AP News", url:"https://apnews.com"},
      {name:"CDC", url:"https://www.cdc.gov"},
      {name:"EU DisinfoLab", url:"https://www.disinfo.eu"},
      {name:"WHO", url:"https://www.who.int"}
    ];
    const s1 = sourcesPool[Math.floor(r2 * sourcesPool.length)];
    const s2 = sourcesPool[Math.floor(r3 * sourcesPool.length)];

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify({
        score,
        signals: [pick(signalsPool, r2), pick(signalsPool, r3)],
        actions: [pick(actionsPool, r3), pick(actionsPool, r2)],
        sources: [s1, s2]
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
