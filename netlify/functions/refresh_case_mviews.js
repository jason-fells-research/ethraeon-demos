exports.handler = async () => ({
  statusCode: 200,
  headers: { 'content-type':'application/json', 'cache-control':'no-cache' },
  body: JSON.stringify({ ok: true, note: 'No materialized views in use; nothing to refresh.' })
});
