import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';

interface FaqSectionProps {
  lang: Language;
}

export function FaqSection({ lang }: FaqSectionProps) {
  const copy = PHARMACY_COPY[lang].faqSection;
  const [openId, setOpenId] = useState<string | null>(copy.items[0]?.id ?? null);

  function handleToggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <section
      id="preguntas"
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--brand)]">
            {copy.kicker}
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl text-balance">
            {copy.title}
          </h2>
        </div>

        <div className="mt-10 divide-y divide-[var(--border-hairline)] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          {copy.items.map((item) => {
            const isOpen = openId === item.id;
            const buttonId = `btn-${item.id}`;
            const panelId = `panel-${item.id}`;

            return (
              <div key={item.id}>
                <h3 className="m-0">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => handleToggle(item.id)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/60 transition-colors cursor-pointer"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="px-6 pb-5 pt-0 text-sm leading-relaxed text-[var(--text-secondary)]"
                    >
                      {item.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
