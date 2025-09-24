import data from '../../data/factpulse.json' assert { type: 'json' };
export async function onRequest() {
  return new Response(JSON.stringify(data), { headers: { 'content-type':'application/json' }});
}