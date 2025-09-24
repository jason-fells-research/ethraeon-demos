export async function onRequest() {
  const data = {
    "metrics": [
      {"kpi":"CO₂e (scope 2)","baseline":120,"current":96,"delta":-24},
      {"kpi":"Water use (m³)","baseline":800,"current":760,"delta":-40},
      {"kpi":"Waste to landfill (kg)","baseline":540,"current":420,"delta":-120}
    ]
  };
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' }
  });
}