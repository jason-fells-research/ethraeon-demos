export async function onRequest() {
  const data = {
    "cases": [
      {"id":"INC-3142","channel":"Social DM","severity":"High","summary":"Threat of self-harm in product community","actions":["escalate to duty officer","send wellbeing resources","suspend workflow"]},
      {"id":"INC-3143","channel":"Email","severity":"Medium","summary":"Data leak allegation","actions":["open legal ticket","pause scheduled posts","prepare holding statement"]}
    ]
  };
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' }
  });
}