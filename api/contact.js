const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_ACTION = 'contact_quote';

function env(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function isDebugEnabled() {
  return env('RECAPTCHA_DEBUG') === '1' || env('RECAPTCHA_DEBUG') === 'true';
}

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(body);
}

function clean(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function cleanToken(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function parseBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function getMinScore() {
  const configured = Number(env('RECAPTCHA_MIN_SCORE'));
  return Number.isFinite(configured) ? configured : 0.5;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyRecaptcha(token, secret, remoteip) {
  const params = new URLSearchParams({ secret, response: token });
  if (remoteip) {
    params.set('remoteip', remoteip);
  }

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    throw new Error('reCAPTCHA verification request failed');
  }

  return response.json();
}

function getRecaptchaFailure(captcha) {
  if (!captcha.success) {
    return {
      reason: 'verification_rejected',
      errorCodes: captcha['error-codes'] || [],
      hostname: captcha.hostname,
    };
  }

  const minScore = getMinScore();
  if (typeof captcha.score === 'number' && captcha.score < minScore) {
    return {
      reason: 'low_score',
      score: captcha.score,
      minScore,
      hostname: captcha.hostname,
    };
  }

  if (captcha.action && captcha.action !== RECAPTCHA_ACTION) {
    return {
      reason: 'action_mismatch',
      action: captcha.action,
      expected: RECAPTCHA_ACTION,
      hostname: captcha.hostname,
    };
  }

  return null;
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

  const mailgunApiKey = env('MAILGUN_API_KEY');
  const mailgunDomain = env('MAILGUN_DOMAIN');
  const contactToEmail = env('CONTACT_TO_EMAIL');
  const contactFromEmail = env('CONTACT_FROM_EMAIL');
  const recaptchaSecretKey = env('RECAPTCHA_SECRET_KEY');

  if (!mailgunApiKey || !mailgunDomain || !contactToEmail || !recaptchaSecretKey) {
    console.error('Missing required environment variables');
    return json(res, 500, { error: 'Server configuration error' });
  }

  const body = parseBody(req);
  const firstName = clean(body.firstName, 100);
  const lastName = clean(body.lastName, 100);
  const company = clean(body.company, 200);
  const email = clean(body.email, 254);
  const phone = clean(body.phone, 50);
  const location = clean(body.location, 200);
  const productInterest = clean(body.productInterest, 200);
  const notes = clean(body.notes, 5000);
  const recaptchaToken = cleanToken(body.recaptchaToken);
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
    const remoteip =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : '') || req.socket?.remoteAddress || '';

    const captcha = await verifyRecaptcha(
      recaptchaToken,
      recaptchaSecretKey,
      remoteip
    );

    const captchaFailure = getRecaptchaFailure(captcha);
    if (captchaFailure) {
      console.error('reCAPTCHA verification failed:', {
        ...captchaFailure,
        tokenLength: recaptchaToken.length,
        action: captcha.action,
        score: captcha.score,
      });

      const responseBody = { error: 'Verification failed. Please try again.' };
      if (isDebugEnabled()) {
        responseBody.debug = captchaFailure;
      }
      return json(res, 403, responseBody);
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
      contactFromEmail || `Ladner Traps Website <noreply@${mailgunDomain}>`;

    await sendMailgunMessage({
      domain: mailgunDomain,
      apiKey: mailgunApiKey,
      from,
      to: contactToEmail,
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
