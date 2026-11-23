import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Droplets,
  HeartPulse,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';
import {
  HEALTH_TIP_FOCUS_IDS,
  HealthTipFocus,
  HealthTipsPayload,
} from '../lib/healthTips';

interface HealthTipsSectionProps {
  lang: Language;
  onAskSofia: (prompt: string) => void;
}

const FOCUS_ICONS: Record<HealthTipFocus, typeof Sparkles> = {
  general: Sparkles,
  immunity: ShieldCheck,
  hydration: Droplets,
  heart: HeartPulse,
  skincare: Sun,
};

export function HealthTipsSection({ lang, onAskSofia }: HealthTipsSectionProps) {
  const copy = PHARMACY_COPY[lang].healthTipsSection;

  const [focus, setFocus] = useState<HealthTipFocus>('general');
  const [noteInput, setNoteInput] = useState('');
  const [appliedNote, setAppliedNote] = useState('');
  const [tipsData, setTipsData] = useState<HealthTipsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cacheRef = useRef<Map<string, HealthTipsPayload>>(new Map());
  const requestIdRef = useRef(0);

  const loadTips = useCallback(
    async (
      targetLang: Language,
      targetFocus: HealthTipFocus,
      targetNote: string,
      forceRefresh = false,
    ) => {
      const todayIso = new Date().toISOString().slice(0, 10);
      const cleanNote = targetNote.trim();
      const cacheKey = `${todayIso}::${targetLang}::${targetFocus}::${cleanNote.toLowerCase()}`;
      const storageKey = `vida-sana-tips:${cacheKey}`;
      if (!forceRefresh) {
        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
          setTipsData(cached);
          setErrorMsg(null);
          setLoading(false);
          return;
        }
        try {
          const savedRaw = window.localStorage.getItem(storageKey);
          if (savedRaw) {
            const saved = JSON.parse(savedRaw) as HealthTipsPayload;
            if (saved && saved.date === todayIso && Array.isArray(saved.tips) && saved.tips.length > 0) {
              cacheRef.current.set(cacheKey, saved);
              setTipsData(saved);
              setErrorMsg(null);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore storage errors
        }
      }

      const currentReqId = ++requestIdRef.current;
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch('/api/health-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lang: targetLang,
            focus: targetFocus,
            patientNote: cleanNote,
            refresh: forceRefresh,
          }),
        });

        const data = (await res.json()) as HealthTipsPayload & { error?: string };
        if (currentReqId !== requestIdRef.current) return;

        if (!res.ok || !Array.isArray(data.tips) || data.tips.length === 0) {
          setErrorMsg(data.error || PHARMACY_COPY[targetLang].healthTipsSection.errorFallback);
          return;
        }

        cacheRef.current.set(cacheKey, data);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
          // ignore storage errors
        }
        setTipsData(data);
      } catch {
        if (currentReqId !== requestIdRef.current) return;
        setErrorMsg(PHARMACY_COPY[targetLang].healthTipsSection.errorFallback);
      } finally {
        if (currentReqId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadTips(lang, focus, appliedNote, false);
  }, [lang, focus, appliedNote, loadTips]);

  function handleSelectFocus(nextFocus: HealthTipFocus) {
    setFocus(nextFocus);
  }

  function handlePersonalizeSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = noteInput.trim();
    if (clean === appliedNote) {
      void loadTips(lang, focus, clean, true);
    } else {
      setAppliedNote(clean);
    }
  }

  const ActiveFocusIcon = FOCUS_ICONS[focus];
  const todayFormatted = tipsData?.date ?? new Date().toISOString().slice(0, 10);

  return (
    <section
      id="consejos"
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] py-16 sm:py-20"
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
            <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
              {copy.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono-data text-xs font-medium text-[var(--text-muted)]">
              {copy.todayLabel} · {todayFormatted}
            </span>
            <button
              type="button"
              onClick={() => void loadTips(lang, focus, appliedNote, true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] disabled:opacity-55 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[var(--brand)] ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{copy.refreshLabel}</span>
            </button>
          </div>
        </div>

        {/* Focus selector + optional routine context */}
        <div className="mt-8 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {copy.focusLabel}
            </p>
            <div
              role="group"
              aria-label={copy.focusLabel}
              className="mt-3 flex flex-wrap gap-2"
            >
              {HEALTH_TIP_FOCUS_IDS.map((focusId) => {
                const Icon = FOCUS_ICONS[focusId];
                const active = focus === focusId;
                return (
                  <button
                    key={focusId}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleSelectFocus(focusId)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{copy.focuses[focusId]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handlePersonalizeSubmit}
            className="mt-5 border-t border-[var(--border-hairline)] pt-5"
          >
            <label
              htmlFor="health-tips-note"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
              {copy.noteLabel}
            </label>
            <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
              <input
                id="health-tips-note"
                type="text"
                maxLength={180}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={copy.notePlaceholder}
                className="h-11 min-w-0 flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {loading ? copy.generatingLabel : copy.generateLabel}
              </button>
            </div>
          </form>
        </div>

        {/* Daily AI results area */}
        <div className="mt-8" aria-live="polite" data-testid="health-tips-region">
          {loading ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">{copy.loadingMessage}</p>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-3"
                  >
                    <div className="h-4 w-24 rounded bg-[var(--bg-subtle)] animate-pulse" />
                    <div className="h-6 w-3/4 rounded bg-[var(--bg-subtle)] animate-pulse" />
                    <div className="h-16 w-full rounded bg-[var(--bg-subtle)] animate-pulse" />
                    <div className="h-4 w-5/6 rounded bg-[var(--bg-subtle)] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : errorMsg ? (
            <div
              role="alert"
              className="flex flex-col gap-4 rounded-xl border border-[var(--accent)] bg-[var(--bg-surface)] p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-medium text-[var(--accent)]">{errorMsg}</p>
              <button
                type="button"
                onClick={() => void loadTips(lang, focus, appliedNote, true)}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-hover)] transition-colors shrink-0 cursor-pointer"
              >
                {copy.retryLabel}
              </button>
            </div>
          ) : tipsData ? (
            <>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {tipsData.dailyHeadline}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
                {tipsData.tips.map((tip, idx) => (
                  <motion.article
                    key={tip.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: idx * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--brand)]">
                          <ActiveFocusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>{tip.category}</span>
                        </span>
                        <span className="font-mono-data text-xs font-medium text-[var(--text-muted)]">
                          0{idx + 1}.
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                        {tip.title}
                      </h3>

                      <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {tip.advice}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-[var(--border-hairline)] pt-4 space-y-3">
                      <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                        {tip.pharmacyNote}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onAskSofia(`${copy.askSofiaPromptPrefix} "${tip.title}".`)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:underline underline-offset-4 cursor-pointer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{copy.askSofiaLabel}</span>
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <p className="mt-6 text-xs text-[var(--text-muted)]">
          {copy.medicalDisclaimer}
        </p>
      </div>
    </section>
  );
}
