
exports.handler = async (event) => {
  try {
    let text = "";
    try { ({ text = "" } = JSON.parse(event.body || "{}")); } catch {}
    if (typeof text !== "string") text = String(text || "");
    text = text.slice(0, 2000).trim();

    // hash-ish variability
    let h = 0; for (let i=0;i<text.length;i++){ h = ((h<<5)-h) + text.charCodeAt(i) | 0; }
    const r1 = Math.abs(h % 1000)/1000, r2 = Math.abs((h*9301+49297)%1000)/1000, r3 = Math.abs((h*2333+777)%1000)/1000;

    const clamp = (x,min,max)=>Math.max(min,Math.min(max,x));
    const base = 0.35 + (r1-0.5)*0.5; // 0.1..0.6
    const score = clamp(base, 0.05, 0.95);

    const signalsPool = ['no-source-citation','low-source-cred','coordinated-amplification','misleading-caption','out-of-context-clip','synthetic-media-indicators','delegitimizing-language'];
    const actionsPool = ['monitor','link-to-official','internal flag','prepare-FAQ','legal review','platform escalation','takedown request'];
    const sourcesPool = [
      {name:'AP News', url:'https://apnews.com'},
      {name:'Poynter IFCN', url:'https://www.poynter.org/ifcn/'},
      {name:'EU DisinfoLab', url:'https://www.disinfo.eu'},
      {name:'WHO', url:'https://www.who.int'}
    ];
    function uniqPick(pool, a, b){
      const x = pool[Math.floor(a*pool.length)];
      let y = pool[Math.floor(b*pool.length)];
      if (y===x) y = pool[(Math.floor(b*pool.length)+1)%pool.length];
      return [x,y];
    }

    return {
      statusCode: 200,
      headers: { 'content-type':'application/json','cache-control':'no-cache' },
      body: JSON.stringify({
        score,
        signals: uniqPick(signalsPool, r2, r3),
        actions: uniqPick(actionsPool, r3, r2),
        sources: uniqPick(sourcesPool, r2, r3)
      })
    };
  } catch (e) {
    // never explode the demo; return a soft default
    return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({
      score: 0.42, signals: ['no-source-citation','low-source-cred'], actions: ['monitor','link-to-official'],
      sources: [{name:'AP News',url:'https://apnews.com'},{name:'WHO',url:'https://who.int'}]
    })};
  }
};
