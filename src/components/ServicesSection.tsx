import {
  Activity,
  FileCheck2,
  HeartHandshake,
  Pill,
  Syringe,
  Truck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';

interface ServicesSectionProps {
  lang: Language;
  onSelectVaccination: () => void;
}

const SERVICE_ICONS: Record<string, typeof Pill> = {
  medicamentos: Pill,
  vacunacion: Syringe,
  presion: Activity,
  domicilio: Truck,
  'cuidado-personal': HeartHandshake,
  'recetas-linea': FileCheck2,
};

export function ServicesSection({ lang, onSelectVaccination }: ServicesSectionProps) {
  const copy = PHARMACY_COPY[lang].servicesSection;

  return (
    <section
      id="servicios"
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--brand)]">
            {copy.kicker}
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl text-balance">
            {copy.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {copy.items.map((service, idx) => {
            const Icon = SERVICE_ICONS[service.id] ?? Pill;
            const isVaccination = service.id === 'vacunacion';

            return (
              <motion.article
                key={service.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(idx * 0.04, 0.2),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono-data text-xs font-medium text-[var(--text-muted)]">
                      {service.index}.
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-[var(--border-hairline)] pt-4 flex items-center justify-between gap-3">
                  <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                    {service.detail}
                  </p>
                  {isVaccination && (
                    <button
                      type="button"
                      onClick={onSelectVaccination}
                      className="text-xs font-semibold text-[var(--brand)] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copy.bookAction}
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Illustrative fictional OTC catalog */}
        <div className="mt-12 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {copy.catalogTitle}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {copy.catalogSubtitle}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.catalogItems.map((item) => (
              <div
                key={item.name}
                className="flex flex-col justify-between rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4"
              >
                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {item.category} · {item.prescriptionRequired ? copy.rxLabel : copy.otcLabel}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {item.presentation}
                  </p>
                </div>
                <p className="font-mono-data mt-4 text-base font-semibold text-[var(--brand)]">
                  {item.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
