export default async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Use POST', { status: 405 });
    }
    const { text = '' } = await req.json().catch(() => ({ text: '' }));
    const t = (text || '').trim();
    if (!t) return new Response(JSON.stringify({ error: 'no text' }), { status: 400 });

    const lc = t.toLowerCase();

    let score = 0.35;
    const signals = new Set();

    const bumps = [
      { re: /\bdeepfake|ai-generated|voice clone|face swap\b/i, bump: 0.25, signal: 'synthetic-media-indicators' },
      { re: /\bthreatens|exposed|leaked|shocking|breaking\b/i, bump: 0.15, signal: 'sensational-language' },
      { re: /\bsource\b/i, bump: -0.05, signal: 'source-mentioned' },
      { re: /\bfactcheck|fact-check|snopes|politi?fact\b/i, bump: -0.12, signal: 'fact-check-cited' },
      { re: /\babc fake news|lamestream|propaganda\b/i, bump: 0.12, signal: 'delegitimizing-language' },
    ];
    bumps.forEach(({ re, bump, signal }) => {
      if (re.test(t)) {
        score += bump;
        signals.add(signal);
      }
    });

    const capsRatio = (t.replace(/[^A-Z]/g, '').length) / Math.max(1, t.length);
    if (capsRatio > 0.25) { score += 0.08; signals.add('all-caps-emphasis'); }
    const exclam = (t.match(/!/g) || []).length;
    if (exclam >= 2) { score += 0.06; signals.add('exclamation-burst'); }

    if (!/\bhttps?:\/\//i.test(t)) signals.add('no-source-citation');

    score += (Math.random() - 0.5) * 0.06;

    score = Math.max(0.05, Math.min(0.95, score));

    let actions = ['monitor'];
    if (score >= 0.75) actions = ['platform escalation', 'takedown request', 'legal review'];
    else if (score >= 0.55) actions = ['request sources', 'label for context', 'prepare FAQ'];

    return new Response(
      JSON.stringify({
        input: t,
        score: Number(score.toFixed(2)),
        signals: Array.from(signals),
        actions
      }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
