import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';

interface NavbarProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onBookVaccination: () => void;
}

export function Navbar({ lang, onChangeLang, onBookVaccination }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const copy = PHARMACY_COPY[lang];

  const navLinks = [
    { href: '#servicios', label: copy.nav.servicios },
    { href: '#consejos', label: copy.nav.consejos },
    { href: '#precios', label: copy.nav.precios },
    { href: '#horarios', label: copy.nav.horarios },
    { href: '#preguntas', label: copy.nav.preguntas },
    { href: '#contacto', label: copy.nav.contacto },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#inicio"
          className="font-display text-base sm:text-lg font-semibold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0 hover:text-[var(--brand)] transition-colors"
        >
          {copy.brandName}
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label={lang === 'es' ? 'Navegación principal' : 'Primary navigation'}
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 py-1 hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Language toggle (ES | EN) + primary CTA + mobile toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label={lang === 'es' ? 'Selector de idioma' : 'Language selector'}
            className="inline-flex items-center rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5"
          >
            <button
              type="button"
              onClick={() => onChangeLang('es')}
              aria-pressed={lang === 'es'}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'es'
                  ? 'bg-[var(--brand)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => onChangeLang('en')}
              aria-pressed={lang === 'en'}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'en'
                  ? 'bg-[var(--brand)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onBookVaccination}
            className="hidden md:inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copy.nav.cta}
          </button>

          <button
            type="button"
            className="inline-flex lg:hidden items-center justify-center w-11 h-11 rounded-lg border border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? copy.nav.closeMenu : copy.nav.openMenu}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label={lang === 'es' ? 'Navegación móvil' : 'Mobile navigation'}
          className="lg:hidden border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-4 space-y-1"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onBookVaccination();
              }}
              className="w-full rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] transition-colors cursor-pointer"
            >
              {copy.nav.cta}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
