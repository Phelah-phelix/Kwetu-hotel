// Talks to Safaricom's Daraja API. All credentials come from .env —
// nothing secret is written in this file.

function baseUrl() {
  return process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

// Step 1 of any Daraja call: swap our Consumer Key + Secret for a
// short-lived access token (valid ~1 hour).
async function getAccessToken() {
  const { MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET } = process.env;
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
    throw new Error('M-Pesa consumer key/secret are missing in .env');
  }

  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) {
    throw new Error(`Could not get M-Pesa access token (HTTP ${res.status}). Check your key/secret.`);
  }
  const data = await res.json();
  return data.access_token;
}

// Daraja wants YYYYMMDDHHmmss. We use Nairobi time (UTC+3).
function timestamp() {
  const nairobi = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return nairobi.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

// Accepts 0712345678, 0112345678, 712345678, +254712345678, 254712345678
// and returns 2547XXXXXXXX / 2541XXXXXXXX, or null if it isn't a valid Kenyan number.
function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  else if (digits.length === 9 && /^[71]/.test(digits)) digits = `254${digits}`;
  return /^254[71]\d{8}$/.test(digits) ? digits : null;
}

// Sends the "enter your M-Pesa PIN" prompt to the customer's phone (STK Push).
async function stkPush({ phone, amount, accountReference, description }) {
  const { MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_BASE_URL, MPESA_CALLBACK_SECRET } = process.env;
  if (!MPESA_SHORTCODE || !MPESA_PASSKEY || !MPESA_CALLBACK_BASE_URL || !MPESA_CALLBACK_SECRET) {
    throw new Error('M-Pesa settings are incomplete in .env');
  }

  const token = await getAccessToken();
  const ts = timestamp();
  // Password = base64(Shortcode + Passkey + Timestamp)
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${ts}`).toString('base64');

  const body = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount), // M-Pesa only accepts whole shillings
    PartyA: phone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: `${MPESA_CALLBACK_BASE_URL}/api/payments/callback/${MPESA_CALLBACK_SECRET}`,
    AccountReference: accountReference.slice(0, 12),
    TransactionDesc: description.slice(0, 13),
  };

  const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.json();
}

module.exports = { stkPush, normalizePhone };
