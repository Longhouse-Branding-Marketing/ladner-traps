(function () {
  'use strict';

  const API_URL = '/api/contact';
  const RECAPTCHA_ACTION = 'contact_quote';

  const ready = (fn) =>
    document.readyState !== 'loading'
      ? fn()
      : document.addEventListener('DOMContentLoaded', fn);

  ready(function () {
    const form = document.getElementById('quote-form');
    if (!form) return;

    const siteKey = document
      .querySelector('meta[name="recaptcha-site-key"]')
      ?.getAttribute('content')
      ?.trim();

    const submitBtn = document.getElementById('submit-btn');
    const statusEl = document.getElementById('form-status');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!siteKey) {
        showStatus(
          statusEl,
          'Form is not configured yet. Please email sales@ladnertraps.com.',
          'error'
        );
        return;
      }

      setSubmitting(submitBtn, true);
      hideStatus(statusEl);

      try {
        await loadRecaptcha(siteKey);
        const token = await grecaptcha.execute(siteKey, { action: RECAPTCHA_ACTION });
        const data = Object.fromEntries(new FormData(form));
        data.recaptchaToken = token;

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || 'Submission failed. Please try again.');
        }

        form.reset();
        showStatus(
          statusEl,
          'Thanks — we received your inquiry and will be in touch soon.',
          'success'
        );
      } catch (error) {
        showStatus(
          statusEl,
          error.message || 'Something went wrong. Please email sales@ladnertraps.com.',
          'error'
        );
      } finally {
        setSubmitting(submitBtn, false);
      }
    });
  });

  function loadRecaptcha(siteKey) {
    return new Promise(function (resolve, reject) {
      if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
        window.grecaptcha.ready(resolve);
        return;
      }

      const existing = document.querySelector('script[data-recaptcha]');
      if (existing) {
        existing.addEventListener('load', function () {
          window.grecaptcha.ready(resolve);
        });
        existing.addEventListener('error', function () {
          reject(new Error('Security check failed to load. Please refresh and try again.'));
        });
        return;
      }

      const script = document.createElement('script');
      script.src =
        'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(siteKey);
      script.async = true;
      script.defer = true;
      script.setAttribute('data-recaptcha', 'true');
      script.onload = function () {
        window.grecaptcha.ready(resolve);
      };
      script.onerror = function () {
        reject(new Error('Security check failed to load. Please refresh and try again.'));
      };
      document.head.appendChild(script);
    });
  }

  function setSubmitting(button, isSubmitting) {
    if (!button) return;
    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? 'Sending…' : 'Submit Inquiry';
  }

  function hideStatus(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
    el.classList.remove('is-success', 'is-error');
  }

  function showStatus(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('is-success', 'is-error');
    el.classList.add(type === 'success' ? 'is-success' : 'is-error');
    el.hidden = false;
  }
})();
