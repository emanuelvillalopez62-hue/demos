import type { Language } from '../data/pharmacyData';

export interface ResendSendResult {
  ok: boolean;
  status: 'sent' | 'not_configured' | 'invalid_recipient' | 'failed';
  emailId?: string;
  httpStatus?: number;
  sandboxRestricted?: boolean;
  error?: string;
}

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

const DEFAULT_FROM_EMAIL = 'Farmacia Vida Sana Ejemplo <onboarding@resend.dev>';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isValidEmailAddress(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 160) return false;
  if (/[\r\n]/.test(trimmed)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function buildContactConfirmationEmail(params: {
  lang: Language;
  leadId: string;
  nombre: string;
  correo: string;
  mensaje: string;
}): EmailContent {
  const { lang, leadId, nombre, correo, mensaje } = params;
  const safeName = escapeHtml(nombre.trim());
  const safeEmail = escapeHtml(correo.trim());
  const safeMessage = escapeHtml(mensaje.trim()).replace(/\n/g, '<br />');
  const safeLeadId = escapeHtml(leadId.trim());

  if (lang === 'en') {
    const subject = `Confirmation (${leadId}) · Farmacia Vida Sana Ejemplo`;
    const text = [
      `Hello ${nombre},`,
      '',
      `We received your message at Farmacia Vida Sana Ejemplo (Reference: ${leadId}).`,
      '',
      'Submitted summary:',
      `- Name: ${nombre}`,
      `- Email: ${correo}`,
      `- Message: ${mensaje}`,
      '',
      'Pharmacy hours (example): Mon–Fri 08:00–21:00 | Sat 09:00–14:00 | Sun closed.',
      'Address: Calle Ejemplo 123, Col. Centro, Ciudad Demo, CP 00000 | Phone: +00 555 123 456',
      'Health notice: This pharmacy does not replace a medical consultation. Prescription medications require the original prescription.',
    ].join('\n');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #16241d; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f6faf7; border: 1px solid #d9e6de; border-radius: 12px;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #186b49; text-transform: uppercase; letter-spacing: 0.04em;">Farmacia Vida Sana Ejemplo</p>
        <h1 style="margin: 0 0 16px; font-size: 20px; color: #102419;">We received your request (${safeLeadId})</h1>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">Hello <strong>${safeName}</strong>, thank you for contacting us. Here is a full confirmation of the details you sent:</p>
        <div style="background-color: #ffffff; border: 1px solid #d9e6de; border-radius: 8px; padding: 16px; margin-bottom: 16px; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 8px;"><strong>Reference:</strong> ${safeLeadId}</p>
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${safeName}</p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
          <p style="margin: 0;"><strong>Message:</strong><br />${safeMessage}</p>
        </div>
        <p style="margin: 0 0 8px; font-size: 13px; color: #43574c;"><strong>Hours (example):</strong> Monday–Friday 08:00–21:00 · Saturday 09:00–14:00 · Sunday closed</p>
        <p style="margin: 0 0 12px; font-size: 13px; color: #43574c;">Calle Ejemplo 123, Col. Centro, Ciudad Demo · Tel: +00 555 123 456</p>
        <p style="margin: 0; font-size: 11px; color: #677b70; border-top: 1px solid #d9e6de; padding-top: 12px;">Prototype demo notice: This pharmacy does not replace a medical consultation. Prescription medications require presenting the original paper prescription.</p>
      </div>
    `.trim();

    return { subject, text, html };
  }

  const subject = `Confirmación de solicitud (${leadId}) · Farmacia Vida Sana Ejemplo`;
  const text = [
    `Hola ${nombre},`,
    '',
    `Confirmamos que recibimos tu mensaje en Farmacia Vida Sana Ejemplo (Folio: ${leadId}).`,
    '',
    'Resumen de tu solicitud:',
    `- Nombre: ${nombre}`,
    `- Correo: ${correo}`,
    `- Mensaje: ${mensaje}`,
    '',
    'Horario de atención (ejemplo): lunes a viernes 08:00–21:00 | sábados 09:00–14:00 | domingos cerrado.',
    'Dirección: Calle Ejemplo 123, Col. Centro, Ciudad Demo, CP 00000 | Tel: +00 555 123 456',
    'Aviso sanitario: La farmacia no sustituye la consulta médica. Los medicamentos con receta requieren presentar receta original.',
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #16241d; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f6faf7; border: 1px solid #d9e6de; border-radius: 12px;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #186b49; text-transform: uppercase; letter-spacing: 0.04em;">Farmacia Vida Sana Ejemplo</p>
      <h1 style="margin: 0 0 16px; font-size: 20px; color: #102419;">Confirmamos tu solicitud (${safeLeadId})</h1>
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">Hola <strong>${safeName}</strong>, recibimos tu mensaje correctamente. Aquí tienes el resumen completo de confirmación:</p>
      <div style="background-color: #ffffff; border: 1px solid #d9e6de; border-radius: 8px; padding: 16px; margin-bottom: 16px; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 8px;"><strong>Folio:</strong> ${safeLeadId}</p>
        <p style="margin: 0 0 8px;"><strong>Nombre:</strong> ${safeName}</p>
        <p style="margin: 0 0 8px;"><strong>Correo:</strong> ${safeEmail}</p>
        <p style="margin: 0;"><strong>Mensaje:</strong><br />${safeMessage}</p>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #43574c;"><strong>Horario (ejemplo):</strong> Lunes a viernes 08:00–21:00 · Sábados 09:00–14:00 · Domingos cerrado</p>
      <p style="margin: 0 0 12px; font-size: 13px; color: #43574c;">Calle Ejemplo 123, Col. Centro, Ciudad Demo · Tel: +00 555 123 456</p>
      <p style="margin: 0; font-size: 11px; color: #677b70; border-top: 1px solid #d9e6de; padding-top: 12px;">Prototipo de demostración: La farmacia no sustituye la consulta médica. Los medicamentos con receta requieren presentar la receta original.</p>
    </div>
  `.trim();

  return { subject, text, html };
}

export function buildSofiaConfirmationEmail(params: {
  lang: Language;
  confirmationId: string;
  tipo: string;
  destinatario: string;
  detalles: string;
}): EmailContent {
  const { lang, confirmationId, tipo, detalles } = params;
  const safeId = escapeHtml(confirmationId.trim());
  const safeTipo = escapeHtml(tipo.trim());
  const safeDetalles = escapeHtml(detalles.trim()).replace(/\n/g, '<br />');

  if (lang === 'en') {
    const subject = `Appointment / Confirmation (${confirmationId}) · Farmacia Vida Sana Ejemplo`;
    const text = [
      `Hello,`,
      '',
      `Here is your confirmation from Sofía at Farmacia Vida Sana Ejemplo (Ref: ${confirmationId}).`,
      `Type: ${tipo}`,
      `Details: ${detalles}`,
      '',
      'Policy reminder: Free vaccination cancellation up to 2 hours before the scheduled slot.',
      'Address: Calle Ejemplo 123, Col. Centro, Ciudad Demo | Tel: +00 555 123 456',
    ].join('\n');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #16241d; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f6faf7; border: 1px solid #d9e6de; border-radius: 12px;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #186b49; text-transform: uppercase;">Sofía · Farmacia Vida Sana Ejemplo</p>
        <h1 style="margin: 0 0 16px; font-size: 20px; color: #102419;">Confirmation summary (${safeId})</h1>
        <div style="background-color: #ffffff; border: 1px solid #d9e6de; border-radius: 8px; padding: 16px; margin-bottom: 16px; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 8px;"><strong>Reference:</strong> ${safeId}</p>
          <p style="margin: 0 0 8px;"><strong>Type:</strong> ${safeTipo}</p>
          <p style="margin: 0;"><strong>Details:</strong><br />${safeDetalles}</p>
        </div>
        <p style="margin: 0; font-size: 12px; color: #43574c;">Calle Ejemplo 123, Col. Centro, Ciudad Demo · Free cancellation up to 2 hours before your appointment.</p>
      </div>
    `.trim();

    return { subject, text, html };
  }

  const subject = `Confirmación (${confirmationId}) · Farmacia Vida Sana Ejemplo`;
  const text = [
    'Hola,',
    '',
    `Aquí tienes tu confirmación generada por Sofía en Farmacia Vida Sana Ejemplo (Folio: ${confirmationId}).`,
    `Tipo: ${tipo}`,
    `Detalles: ${detalles}`,
    '',
    'Recordatorio: Cancelación de cita de vacunación sin cargo hasta 2 horas antes.',
    'Dirección: Calle Ejemplo 123, Col. Centro, Ciudad Demo | Tel: +00 555 123 456',
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #16241d; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f6faf7; border: 1px solid #d9e6de; border-radius: 12px;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #186b49; text-transform: uppercase;">Sofía · Farmacia Vida Sana Ejemplo</p>
      <h1 style="margin: 0 0 16px; font-size: 20px; color: #102419;">Resumen de confirmación (${safeId})</h1>
      <div style="background-color: #ffffff; border: 1px solid #d9e6de; border-radius: 8px; padding: 16px; margin-bottom: 16px; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 8px;"><strong>Folio:</strong> ${safeId}</p>
        <p style="margin: 0 0 8px;"><strong>Tipo:</strong> ${safeTipo}</p>
        <p style="margin: 0;"><strong>Detalles:</strong><br />${safeDetalles}</p>
      </div>
      <p style="margin: 0; font-size: 12px; color: #43574c;">Calle Ejemplo 123, Col. Centro, Ciudad Demo · Cancelación sin cargo hasta 2 horas antes de la cita.</p>
    </div>
  `.trim();

  return { subject, text, html };
}

export async function sendResendEmail(
  params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  },
  deps?: {
    apiKey?: string;
    fromEmail?: string;
    fetchImpl?: typeof fetch;
  },
): Promise<ResendSendResult> {
  const apiKey = (deps?.apiKey ?? process.env.RESEND_API_KEY ?? '').trim();
  if (!apiKey || apiKey === 'MY_RESEND_API_KEY') {
    return {
      ok: false,
      status: 'not_configured',
      error: 'RESEND_API_KEY is not configured.',
    };
  }

  const recipient = params.to.trim();
  if (!isValidEmailAddress(recipient)) {
    return {
      ok: false,
      status: 'invalid_recipient',
      error: 'Invalid recipient email address.',
    };
  }

  const fromEmail =
    (deps?.fromEmail ?? process.env.RESEND_FROM_EMAIL ?? '').trim() || DEFAULT_FROM_EMAIL;
  const fetchFn = deps?.fetchImpl ?? fetch;

  try {
    const response = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok || !data.id) {
      const msg = data.message || `Resend returned HTTP ${response.status}`;
      const sandboxRestricted =
        response.status === 403 &&
        /testing emails|verify a domain|own email address/i.test(msg);
      return {
        ok: false,
        status: 'failed',
        httpStatus: response.status,
        sandboxRestricted,
        error: msg,
      };
    }

    return {
      ok: true,
      status: 'sent',
      emailId: data.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error calling Resend API';
    return {
      ok: false,
      status: 'failed',
      error: msg,
    };
  }
}
