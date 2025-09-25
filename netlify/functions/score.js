// netlify/functions/score.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Use POST' };
  }

  let text = '';
  try {
    const body = JSON.parse(event.body || '{}');
    text = (body.text || '').toLowerCase();
  } catch (_) {}

  const signals = [];
  let score = 0.35;

  const add = (n, s) => { score += n; signals.push(s); };

  if (/\bdeepfake|voice clone|face swap\b/.test(text)) add(0.35, 'synthetic-media-indicators');
  if (/\bbanned|outlawed|illegal\b/.test(text))        add(0.15, 'loaded-language');
  if (/\bsource\b/.test(text) === false && text.length > 20) add(0.10, 'no-source-citation');
  if (/\bshare|boost|retweet|viral\b/.test(text))      add(0.05, 'coordinated-amplification');
  if (/\b5g|chemtrails|flat earth|crisis actor\b/.test(text)) add(0.25, 'known-disinfo-memes');

  score = Math.max(0, Math.min(0.99, score));

  let actions = ['monitor'];
  if (score >= 0.7) actions = ['platform escalation', 'takedown request', 'legal review'];
  else if (score >= 0.5) actions = ['add source link', 'internal flag', 'prepare FAQ'];

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ score, signals, actions })
  };
};