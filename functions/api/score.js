const samples = [
  { score:0.82, signals:["low-source-cred","misleading-caption"], actions:["link-to-official","flag-internal"] },
  { score:0.61, signals:["coordinated-boost"], actions:["monitor","prepare-FAQ"] },
  { score:0.93, signals:["synthetic-face","voice-clone"], actions:["takedown-request","legal-review","platform escalation"] }
];
export async function onRequest({ request }) {
  if (request.method !== 'POST') return new Response('Use POST', { status:405 });
  const { text } = await request.json().catch(()=>({}));
  const pick = samples[Math.floor(Math.random()*samples.length)];
  return new Response(JSON.stringify({ input:text||"", ...pick }), { headers:{'content-type':'application/json'} });
}