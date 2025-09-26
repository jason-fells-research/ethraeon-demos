exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Use POST' };
    }
    const { text = "" } = JSON.parse(event.body || "{}");

    // Simple deterministic hash → stable-ish variation by input
    let h = 0;
    for (let i = 0; i < text.length; i++) h = ((h<<5)-h) + text.charCodeAt(i) | 0;
    const rand = (seed) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
    const r1 = rand(h), r2 = rand(h+13), r3 = rand(h+27);

    // Pick signals/actions from pools
    const signalsPool = [
      "no-source-citation","coordinated-amplification","synthetic-media-indicators",
      "low-source-cred","misleading-caption","out-of-context-clip"
    ];
    const actionsPool = [
      "monitor","link-to-official","prepare-FAQ","platform escalation",
      "takedown request","legal review","internal flag"
    ];
    const pick = (arr, r)=> arr[Math.floor(r * arr.length)];
    const score = Math.max(0, Math.min(1, 0.25 + 0.6*r1)); // 25–85%

    // Mock “sources” we can show as credibility anchors (deterministic)
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
