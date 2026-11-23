import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, MailCheck, Send } from 'lucide-react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';

interface ContactSectionProps {
  lang: Language;
}

interface FormErrors {
  nombre?: string;
  correo?: string;
  mensaje?: string;
  general?: string;
}

export function ContactSection({ lang }: ContactSectionProps) {
  const copy = PHARMACY_COPY[lang].contactSection;
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    text: string;
    emailSent?: boolean;
    emailNote?: string;
  } | null>(null);

  useEffect(() => {
    setErrors({});
  }, [lang]);

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (nombre.trim().length < 2) {
      next.nombre = copy.errorName;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      next.correo = copy.errorEmail;
    }
    if (mensaje.trim().length < 5) {
      next.mensaje = copy.errorMessage;
    }
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setConfirmation(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          nombre: nombre.trim(),
          correo: correo.trim(),
          mensaje: mensaje.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        id?: string;
        mensaje?: string;
        emailSent?: boolean;
        emailNote?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setErrors({
          general: data.error || copy.errorGeneral,
        });
        return;
      }

      setConfirmation({
        id: data.id ?? 'LEAD-0001',
        text: data.mensaje ?? '',
        emailSent: data.emailSent,
        emailNote: data.emailNote,
      });
      setNombre('');
      setCorreo('');
      setMensaje('');
    } catch {
      setErrors({
        general: copy.errorNetwork,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="contacto"
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[var(--brand)]">
              {copy.kicker}
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl text-balance">
              {copy.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
              {copy.subtitle}
            </p>
            <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
              {copy.privacyNote}
            </p>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-5"
            >
              {confirmation && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-4 text-sm text-[var(--text-primary)]"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">
                      {copy.successTitlePrefix} ({confirmation.id})
                    </p>
                    <p className="mt-0.5 text-[var(--text-secondary)]">
                      {confirmation.text}
                    </p>
                    {confirmation.emailNote && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 font-mono-data text-xs text-[var(--brand)]">
                        {confirmation.emailSent && (
                          <MailCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>{confirmation.emailNote}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {errors.general && (
                <div
                  role="alert"
                  className="rounded-lg border border-[var(--accent)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--accent)] font-medium"
                >
                  {errors.general}
                </div>
              )}

              <div>
                <label
                  htmlFor="contact-nombre"
                  className="block text-sm font-medium text-[var(--text-primary)]"
                >
                  {copy.nameLabel}
                </label>
                <input
                  id="contact-nombre"
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  aria-invalid={Boolean(errors.nombre)}
                  aria-describedby={errors.nombre ? 'error-nombre' : undefined}
                  placeholder={copy.namePlaceholder}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                {errors.nombre && (
                  <p id="error-nombre" className="mt-1.5 text-xs font-medium text-[var(--accent)]">
                    {errors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-correo"
                  className="block text-sm font-medium text-[var(--text-primary)]"
                >
                  {copy.emailLabel}
                </label>
                <input
                  id="contact-correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  aria-invalid={Boolean(errors.correo)}
                  aria-describedby={errors.correo ? 'error-correo' : undefined}
                  placeholder={copy.emailPlaceholder}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                {errors.correo && (
                  <p id="error-correo" className="mt-1.5 text-xs font-medium text-[var(--accent)]">
                    {errors.correo}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-mensaje"
                  className="block text-sm font-medium text-[var(--text-primary)]"
                >
                  {copy.messageLabel}
                </label>
                <textarea
                  id="contact-mensaje"
                  name="mensaje"
                  rows={4}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  aria-invalid={Boolean(errors.mensaje)}
                  aria-describedby={errors.mensaje ? 'error-mensaje' : undefined}
                  placeholder={copy.messagePlaceholder}
                  className="mt-1.5 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                {errors.mensaje && (
                  <p id="error-mensaje" className="mt-1.5 text-xs font-medium text-[var(--accent)]">
                    {errors.mensaje}
                  </p>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>{submitting ? copy.submittingLabel : copy.submitLabel}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
