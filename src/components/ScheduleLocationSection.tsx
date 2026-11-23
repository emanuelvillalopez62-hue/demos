import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';

interface ScheduleLocationSectionProps {
  lang: Language;
}

export function ScheduleLocationSection({ lang }: ScheduleLocationSectionProps) {
  const copy = PHARMACY_COPY[lang].scheduleSection;

  return (
    <section
      id="horarios"
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--brand)]">
            {copy.kicker}
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl text-balance">
            {copy.title}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left: Schedule table + Contact info */}
          <div className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-8 lg:col-span-6">
            <div>
              <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
                <Clock className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{copy.hoursHeading}</h3>
              </div>

              <dl className="mt-5 divide-y divide-[var(--border-hairline)]">
                {copy.rows.map((row) => (
                  <div
                    key={row.days}
                    className="flex items-center justify-between gap-4 py-3.5 text-sm"
                  >
                    <dt className="font-medium text-[var(--text-primary)]">{row.days}</dt>
                    <dd
                      className={`font-mono-data ${
                        row.closed
                          ? 'text-[var(--accent)] font-medium'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {row.hours}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-8 space-y-3 border-t border-[var(--border-hairline)] pt-6 text-sm text-[var(--text-secondary)]">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden="true" />
                <span>{copy.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden="true" />
                <a
                  href="tel:+00555123456"
                  className="font-mono-data hover:text-[var(--text-primary)] hover:underline underline-offset-4"
                >
                  {copy.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden="true" />
                <a
                  href={`mailto:${copy.email}`}
                  className="hover:text-[var(--text-primary)] hover:underline underline-offset-4"
                >
                  {copy.email}
                </a>
              </div>
              <p className="pt-2 text-xs text-[var(--text-muted)]">
                {copy.pharmacistNote}
              </p>
            </div>
          </div>

          {/* Right: Neutral map placeholder (IMAGEN PENDIENTE) */}
          <div className="lg:col-span-6 flex">
            <figure
              className="flex w-full flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-6"
              data-image-placeholder="true"
            >
              {/* IMAGEN PENDIENTE: Mapa embebido o imagen de ubicación de Calle Ejemplo 123 */}
              <div className="flex flex-1 items-center justify-center">
                <svg
                  viewBox="0 0 420 260"
                  className="w-full h-auto max-h-[250px]"
                  role="img"
                  aria-label={copy.mapAria}
                >
                  <rect
                    x="4"
                    y="4"
                    width="412"
                    height="252"
                    rx="10"
                    fill="var(--bg-surface)"
                    stroke="var(--border-hairline)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M0 78H420M0 164H420M115 0V260M275 0V260"
                    stroke="var(--border-hairline)"
                    strokeWidth="6"
                  />
                  <path
                    d="M0 78H420M0 164H420M115 0V260M275 0V260"
                    stroke="var(--bg-subtle)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="195"
                    cy="121"
                    r="66"
                    fill="var(--brand-soft)"
                    fillOpacity="0.45"
                    stroke="var(--brand)"
                    strokeDasharray="5 5"
                    strokeWidth="1.5"
                  />
                  <circle cx="195" cy="121" r="10" fill="var(--brand)" />
                  <circle cx="195" cy="121" r="4" fill="#ffffff" />
                  <rect
                    x="130"
                    y="140"
                    width="130"
                    height="26"
                    rx="6"
                    fill="var(--bg-surface)"
                    stroke="var(--border-hairline)"
                  />
                  <text
                    x="195"
                    y="157"
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {copy.mapLabel}
                  </text>
                </svg>
              </div>

              <figcaption className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--border-hairline)] pt-4 text-xs text-[var(--text-muted)]">
                <span>{copy.mapCaption}</span>
                <span className="font-mono-data">{copy.imagePending}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
