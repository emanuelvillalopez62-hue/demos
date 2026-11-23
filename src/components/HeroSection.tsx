import { ArrowRight, CalendarCheck2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';

interface HeroSectionProps {
  lang: Language;
  onBookVaccination: () => void;
}

export function HeroSection({ lang, onBookVaccination }: HeroSectionProps) {
  const copy = PHARMACY_COPY[lang].hero;

  return (
    <section
      id="inicio"
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch lg:gap-12">
          {/* Left column: Value proposition and primary/secondary actions */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-7"
          >
            <p className="text-sm font-medium text-[var(--brand)]">
              {copy.kicker}
            </p>

            <h1 className="font-display mt-3 text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-[var(--text-primary)] text-balance">
              {copy.title}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              {copy.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onBookVaccination}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CalendarCheck2 className="w-4 h-4" aria-hidden="true" />
                <span>{copy.primaryCta}</span>
              </button>

              <a
                href="#servicios"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors whitespace-nowrap shrink-0"
              >
                <span>{copy.secondaryCta}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <p className="mt-8 border-t border-[var(--border-hairline)] pt-4 text-xs leading-relaxed text-[var(--text-muted)]">
              {copy.medicalNotice}
            </p>
          </motion.div>

          {/* Right column: Neutral architectural SVG placeholder (IMAGEN PENDIENTE) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex"
          >
            <figure
              className="flex w-full flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-6 sm:p-8"
              data-image-placeholder="true"
            >
              {/* IMAGEN PENDIENTE: Fotografía de fachada o mostrador de Farmacia Vida Sana Ejemplo */}
              <div className="flex flex-1 items-center justify-center py-4">
                <svg
                  viewBox="0 0 360 280"
                  className="w-full max-w-[340px] h-auto text-[var(--brand)]"
                  role="img"
                  aria-label={copy.svgAria}
                >
                  <rect
                    x="16"
                    y="16"
                    width="328"
                    height="248"
                    rx="14"
                    fill="var(--bg-surface)"
                    stroke="var(--border-hairline)"
                    strokeWidth="1.5"
                  />
                  <line x1="48" y1="88" x2="210" y2="88" stroke="var(--border-hairline)" strokeWidth="1.5" />
                  <line x1="48" y1="138" x2="210" y2="138" stroke="var(--border-hairline)" strokeWidth="1.5" />
                  <rect x="60" y="54" width="22" height="34" rx="4" fill="var(--brand-soft)" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="92" y="60" width="18" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="122" y="50" width="24" height="38" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="158" y="58" width="20" height="30" rx="3" fill="var(--brand-soft)" stroke="currentColor" strokeWidth="1.5" />

                  <rect x="64" y="104" width="28" height="34" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="104" y="110" width="20" height="28" rx="3" fill="var(--brand-soft)" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="136" y="102" width="26" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />

                  <rect x="240" y="52" width="72" height="72" rx="16" fill="var(--brand-soft)" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M276 70v36M258 88h36"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  <rect x="48" y="176" width="264" height="54" rx="8" fill="var(--bg-subtle)" stroke="var(--border-hairline)" strokeWidth="1.5" />
                  <path
                    d="M242 176c0-18 14-30 32-30 0 18-12 30-32 30Z"
                    fill="var(--brand-soft)"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <line x1="72" y1="203" x2="178" y2="203" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <figcaption className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--border-hairline)] pt-4 text-xs text-[var(--text-muted)]">
                <span>{copy.figureCaption}</span>
                <span className="font-mono-data">{copy.imagePending}</span>
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
