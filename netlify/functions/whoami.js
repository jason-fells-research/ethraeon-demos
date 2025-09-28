exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
    body: JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      env_url: process.env.URL || null,
      site_name: process.env.SITE_NAME || null
    })
  };
};
