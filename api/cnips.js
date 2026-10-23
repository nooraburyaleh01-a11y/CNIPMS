/**
 * CNIPMS Vercel serverless proxy for Google Apps Script.
 * Required Vercel environment variables:
 *   CNIPMS_GAS_URL       = deployed Apps Script /exec URL
 *   CNIPMS_API_TOKEN     = same token stored in Apps Script Script Properties
 *   CNIPMS_OPERATOR_KEY  = temporary shared operator key for integration testing
 *
 * IMPORTANT: This is an integration scaffold, not production authentication.
 * Do not use for real controlled-drug inventory until a proper identity provider,
 * role-based authorization, audit attribution, and security review are implemented.
 */
const ALLOWED_ACTIONS = new Set([
  'listGenerics', 'getGeneric', 'addGeneric', 'addBrand', 'listBrands'
]);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const gasUrl = process.env.CNIPMS_GAS_URL;
  const gasToken = process.env.CNIPMS_API_TOKEN;
  const operatorKey = process.env.CNIPMS_OPERATOR_KEY;
  if (!gasUrl || !gasToken || !operatorKey) {
    return res.status(500).json({ ok: false, error: 'SERVER_CONFIGURATION_MISSING' });
  }

  const suppliedKey = req.headers['x-cnips-operator-key'];
  if (!safeEqual(String(suppliedKey || ''), operatorKey)) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }

  const { action, data = {} } = req.body || {};
  if (!ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ ok: false, error: 'INVALID_ACTION' });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ ok: false, error: 'INVALID_DATA' });
  }

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data, token: gasToken }),
      redirect: 'follow'
    });
    const text = await response.text();
    let payload;
    try { payload = JSON.parse(text); }
    catch (_) { return res.status(502).json({ ok: false, error: 'INVALID_GAS_RESPONSE' }); }
    return res.status(response.ok ? 200 : 502).json(payload);
  } catch (err) {
    return res.status(502).json({ ok: false, error: 'GAS_UNAVAILABLE' });
  }
};

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
