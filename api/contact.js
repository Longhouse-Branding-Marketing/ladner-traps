const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_MIN_SCORE = 0.5;
const RECAPTCHA_ACTION = 'contact_quote';

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(body);
}

function clean(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyRecaptcha(token, secret) {
  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  if (!response.ok) {
    throw new Error('reCAPTCHA verification request failed');
  }

  return response.json();
}

async function sendMailgunMessage({ domain, apiKey, from, to, replyTo, subject, text }) {
  const auth = Buffer.from(`api:${apiKey}`).toString('base64');
  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      from,
      to,
      subject,
      text,
      'h:Reply-To': replyTo,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Mailgun error:', detail);
    throw new Error('Failed to send email');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const {
    MAILGUN_API_KEY,
    MAILGUN_DOMAIN,
    CONTACT_TO_EMAIL,
    CONTACT_FROM_EMAIL,
    RECAPTCHA_SECRET_KEY,
  } = process.env;

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !CONTACT_TO_EMAIL || !RECAPTCHA_SECRET_KEY) {
    console.error('Missing required environment variables');
    return json(res, 500, { error: 'Server configuration error' });
  }

  const body = req.body || {};
  const firstName = clean(body.firstName, 100);
  const lastName = clean(body.lastName, 100);
  const company = clean(body.company, 200);
  const email = clean(body.email, 254);
  const phone = clean(body.phone, 50);
  const location = clean(body.location, 200);
  const productInterest = clean(body.productInterest, 200);
  const notes = clean(body.notes, 5000);
  const recaptchaToken = clean(body.recaptchaToken, 2000);
  const website = clean(body.website, 200);

  if (website) {
    return json(res, 200, { success: true });
  }

  if (!firstName || !lastName || !email || !recaptchaToken) {
    return json(res, 400, { error: 'Please fill in all required fields.' });
  }

  if (!isValidEmail(email)) {
    return json(res, 400, { error: 'Please enter a valid email address.' });
  }

  try {
    const captcha = await verifyRecaptcha(recaptchaToken, RECAPTCHA_SECRET_KEY);

    if (
      !captcha.success ||
      captcha.score < RECAPTCHA_MIN_SCORE ||
      (captcha.action && captcha.action !== RECAPTCHA_ACTION)
    ) {
      return json(res, 403, { error: 'Verification failed. Please try again.' });
    }

    const subjectCompany = company || `${firstName} ${lastName}`;
    const subject = `Quote inquiry: ${productInterest || 'General'} — ${subjectCompany}`;
    const text = [
      'New commercial inquiry from ladnertraps.com',
      '',
      `Name: ${firstName} ${lastName}`,
      `Company/Vessel: ${company || '—'}`,
      `Email: ${email}`,
      `Phone: ${phone || '—'}`,
      `Location: ${location || '—'}`,
      `Product interest: ${productInterest || '—'}`,
      '',
      'Notes:',
      notes || '—',
    ].join('\n');

    const from =
      CONTACT_FROM_EMAIL || `Ladner Traps Website <noreply@${MAILGUN_DOMAIN}>`;

    await sendMailgunMessage({
      domain: MAILGUN_DOMAIN,
      apiKey: MAILGUN_API_KEY,
      from,
      to: CONTACT_TO_EMAIL,
      replyTo: email,
      subject,
      text,
    });

    return json(res, 200, { success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return json(res, 500, { error: 'Unable to send your inquiry. Please email sales@ladnertraps.com.' });
  }
}
