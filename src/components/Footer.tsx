import { BUSINESS_INFO, Language, PHARMACY_COPY } from '../data/pharmacyData';

interface FooterProps {
  lang: Language;
}

export function Footer({ lang }: FooterProps) {
  const copy = PHARMACY_COPY[lang];

  return (
    <footer className="bg-[var(--bg-canvas)] py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 border-b border-[var(--border-hairline)] pb-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
              {copy.brandName}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {BUSINESS_INFO.address}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              <span className="font-mono-data">{BUSINESS_INFO.phone}</span> ·{' '}
              <span>{BUSINESS_INFO.email}</span>
            </p>
          </div>

          <nav
            aria-label={lang === 'es' ? 'Enlaces del pie de página' : 'Footer links'}
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]"
          >
            <a href="#servicios" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">
              {copy.nav.servicios}
            </a>
            <a href="#consejos" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">
              {copy.nav.consejos}
            </a>
            <a href="#precios" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">
              {copy.nav.precios}
            </a>
            <a href="#horarios" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">
              {copy.nav.horarios}
            </a>
            <a href="#preguntas" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">
              {copy.nav.preguntas}
            </a>
            <a href="#contacto" className="hover:text-[var(--text-primary)] hover:underline underline-offset-4">
              {copy.nav.contacto}
            </a>
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-xs leading-relaxed text-[var(--text-muted)]">
          <p>{copy.footer.legalDisclaimer}</p>
          <p>{copy.footer.medicalNotice}</p>
        </div>
      </div>
    </footer>
  );
}
