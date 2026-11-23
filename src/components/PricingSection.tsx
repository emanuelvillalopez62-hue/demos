import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';

interface PricingSectionProps {
  lang: Language;
  onBookVaccination: () => void;
}

export function PricingSection({ lang, onBookVaccination }: PricingSectionProps) {
  const copy = PHARMACY_COPY[lang].pricingSection;

  return (
    <section
      id="precios"
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[var(--brand)]">
              {copy.kicker}
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl text-balance">
              {copy.title}
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {copy.subtitle}
          </p>
        </div>

        {/* Highlighted pricing cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {copy.items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.3,
                delay: idx * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`flex flex-col justify-between rounded-xl border p-6 ${
                item.highlighted
                  ? 'border-[var(--brand)] bg-[var(--bg-surface)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
              }`}
            >
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {item.service}
                </h3>

                <p className="font-display tabular-nums mt-4 text-4xl font-semibold tracking-tight text-[var(--brand)]">
                  {item.price}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.note}
                </p>
              </div>

              {item.highlighted && (
                <div className="mt-6 pt-4 border-t border-[var(--border-hairline)]">
                  <button
                    type="button"
                    onClick={onBookVaccination}
                    className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] transition-colors cursor-pointer"
                  >
                    {copy.bookAction}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Payment methods and policies */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {copy.paymentTitle}
            </h3>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {copy.paymentMethods.map((method) => (
                <li
                  key={method}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <Check className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden="true" />
                  <span>{method}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {copy.policiesTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {copy.cancelPolicy}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {copy.returnPolicy}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
