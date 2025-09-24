import data from '../../data/ecotrack.json' assert { type: 'json' };
export async function onRequest() {
  return new Response(JSON.stringify(data), { headers: { 'content-type':'application/json' }});
}