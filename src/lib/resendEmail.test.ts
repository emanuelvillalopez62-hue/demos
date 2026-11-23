import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildContactConfirmationEmail,
  buildSofiaConfirmationEmail,
  escapeHtml,
  isValidEmailAddress,
  sendResendEmail,
} from './resendEmail';

test('escapeHtml neutralizes HTML injection characters', () => {
  const escaped = escapeHtml(`<script>alert("xss")</script> & 'test'`);
  assert.equal(
    escaped,
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;',
  );
});

test('isValidEmailAddress accepts valid emails and rejects CRLF or malformed values', () => {
  assert.equal(isValidEmailAddress('paciente@ejemplo.com'), true);
  assert.equal(isValidEmailAddress('not-an-email'), false);
  assert.equal(isValidEmailAddress('a@b.com\r\nBcc:evil@x.com'), false);
});

test('buildContactConfirmationEmail builds escaped bilingual confirmation content', () => {
  const es = buildContactConfirmationEmail({
    lang: 'es',
    leadId: 'LEAD-0001',
    nombre: 'Ana <López>',
    correo: 'ana@ejemplo.com',
    mensaje: 'Consulta sobre vacuna\nGracias',
  });
  assert.match(es.subject, /LEAD-0001/);
  assert.match(es.html, /Ana &lt;López&gt;/);
  assert.match(es.html, /Consulta sobre vacuna<br \/>Gracias/);

  const en = buildContactConfirmationEmail({
    lang: 'en',
    leadId: 'LEAD-0002',
    nombre: 'John Doe',
    correo: 'john@example.com',
    mensaje: 'Delivery question',
  });
  assert.match(en.subject, /Confirmation \(LEAD-0002\)/);
  assert.match(en.text, /Delivery question/);
});

test('buildSofiaConfirmationEmail creates formatted summary', () => {
  const email = buildSofiaConfirmationEmail({
    lang: 'es',
    confirmationId: 'ENV-0003',
    tipo: 'cita_vacunacion',
    destinatario: 'ana@ejemplo.com',
    detalles: 'Vacuna influenza 2026-11-25 11:30',
  });
  assert.match(email.subject, /ENV-0003/);
  assert.match(email.html, /Vacuna influenza 2026-11-25 11:30/);
});

test('sendResendEmail returns not_configured when API key is missing or placeholder', async () => {
  const missing = await sendResendEmail(
    { to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' },
    { apiKey: '' },
  );
  assert.equal(missing.ok, false);
  assert.equal(missing.status, 'not_configured');

  const placeholder = await sendResendEmail(
    { to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' },
    { apiKey: 'MY_RESEND_API_KEY' },
  );
  assert.equal(placeholder.ok, false);
  assert.equal(placeholder.status, 'not_configured');
});

test('sendResendEmail posts to Resend REST API with Bearer auth and handles sandbox 403', async () => {
  let capturedAuth = '';
  let capturedBody = '';
  const okResult = await sendResendEmail(
    { to: 'paciente@ejemplo.com', subject: 'Confirmación', html: '<p>OK</p>', text: 'OK' },
    {
      apiKey: 're_test_token',
      fromEmail: 'Farmacia <onboarding@resend.dev>',
      fetchImpl: async (_url, init) => {
        const headers = init?.headers as Record<string, string>;
        capturedAuth = headers.Authorization;
        capturedBody = String(init?.body ?? '');
        return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 });
      },
    },
  );
  assert.equal(okResult.ok, true);
  assert.equal(okResult.status, 'sent');
  assert.equal(okResult.emailId, 'email_123');
  assert.equal(capturedAuth, 'Bearer re_test_token');
  assert.match(capturedBody, /paciente@ejemplo\.com/);

  const sandboxFail = await sendResendEmail(
    { to: 'other@ejemplo.com', subject: 'Test', html: '<p>Test</p>', text: 'Test' },
    {
      apiKey: 're_test_token',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            message: 'You can only send testing emails to your own email address.',
          }),
          { status: 403 },
        ),
    },
  );
  assert.equal(sandboxFail.ok, false);
  assert.equal(sandboxFail.status, 'failed');
  assert.equal(sandboxFail.sandboxRestricted, true);
});
