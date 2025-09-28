exports.handler = async () => ({
  statusCode: 200,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
  body: JSON.stringify({ ok: true, now: new Date().toISOString() })
});
