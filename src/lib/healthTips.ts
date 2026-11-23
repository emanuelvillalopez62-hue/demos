import { Schema, Type } from '@google/genai';
import type { Language } from '../data/pharmacyData';

export type HealthTipFocus =
  | 'general'
  | 'immunity'
  | 'hydration'
  | 'heart'
  | 'skincare';

export const HEALTH_TIP_FOCUS_IDS: readonly HealthTipFocus[] = [
  'general',
  'immunity',
  'hydration',
  'heart',
  'skincare',
] as const;

export interface HealthTipItem {
  id: string;
  category: string;
  title: string;
  advice: string;
  pharmacyNote: string;
}

export interface HealthTipsPayload {
  date: string;
  focus: HealthTipFocus;
  lang: Language;
  dailyHeadline: string;
  tips: HealthTipItem[];
}

export interface NormalizedHealthTipsRequest {
  lang: Language;
  focus: HealthTipFocus;
  patientNote: string;
}

export function isValidHealthTipFocus(value: unknown): value is HealthTipFocus {
  return (
    typeof value === 'string' &&
    (HEALTH_TIP_FOCUS_IDS as readonly string[]).includes(value)
  );
}

export function normalizeHealthTipsRequest(
  raw: unknown,
): { ok: true; value: NormalizedHealthTipsRequest } | { ok: false; error: string } {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const lang: Language = body.lang === 'en' ? 'en' : 'es';

  const rawFocus = body.focus ?? 'general';
  if (!isValidHealthTipFocus(rawFocus)) {
    return {
      ok: false,
      error:
        lang === 'en'
          ? 'Invalid wellness focus category.'
          : 'Categoría de bienestar inválida.',
    };
  }

  let patientNote = '';
  if (body.patientNote !== undefined && body.patientNote !== null) {
    if (typeof body.patientNote !== 'string') {
      return {
        ok: false,
        error:
          lang === 'en'
            ? 'Patient profile note must be text.'
            : 'La preferencia del paciente debe ser texto.',
      };
    }
    patientNote = body.patientNote.replace(/\s+/g, ' ').trim();
    if (patientNote.length > 180) {
      return {
        ok: false,
        error:
          lang === 'en'
            ? 'Please keep your personalization note under 180 characters.'
            : 'Mantén tu nota de personalización por debajo de 180 caracteres.',
      };
    }
  }

  return {
    ok: true,
    value: {
      lang,
      focus: rawFocus,
      patientNote,
    },
  };
}

export const HEALTH_TIPS_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    dailyHeadline: {
      type: Type.STRING,
      description: 'One-sentence warm, practical wellness summary for today.',
    },
    tips: {
      type: Type.ARRAY,
      description: 'Exactly 3 personalized daily preventive wellness tips.',
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: 'Short 1-3 word category label.',
          },
          title: {
            type: Type.STRING,
            description: 'Short actionable tip title.',
          },
          advice: {
            type: Type.STRING,
            description:
              'Practical, evidence-informed everyday preventive guidance in 2 sentences without diagnosing or prescribing.',
          },
          pharmacyNote: {
            type: Type.STRING,
            description:
              'Brief connection to Farmacia Vida Sana Ejemplo services (free blood pressure check, $250 influenza vaccine, OTC personal care, or $50 local delivery).',
          },
        },
        required: ['category', 'title', 'advice', 'pharmacyNote'],
      },
    },
  },
  required: ['dailyHeadline', 'tips'],
};

const FOCUS_DESCRIPTIONS: Record<Language, Record<HealthTipFocus, string>> = {
  es: {
    general: 'Bienestar preventivo integral para la rutina diaria',
    immunity: 'Prevención respiratoria, descanso y vacunación estacional contra influenza',
    hydration: 'Hidratación diaria, electrolitos orales y recuperación cotidiana',
    heart: 'Hábitos cardiovasculares saludables y seguimiento preventivo de presión arterial',
    skincare: 'Cuidado diario de la piel, higiene suave y protección solar FPS 50+',
  },
  en: {
    general: 'Everyday preventive wellness for daily routines',
    immunity: 'Respiratory prevention, rest, and seasonal influenza vaccination',
    hydration: 'Daily hydration, oral electrolytes, and everyday recovery',
    heart: 'Heart-healthy habits and preventive blood pressure monitoring',
    skincare: 'Daily skin care, gentle hygiene, and SPF 50+ sun protection',
  },
};

export function buildHealthTipsPrompt(
  req: NormalizedHealthTipsRequest,
  dateIso: string,
): { systemInstruction: string; prompt: string } {
  const focusDescription = FOCUS_DESCRIPTIONS[req.lang][req.focus];
  const noteLine = req.patientNote
    ? req.lang === 'en'
      ? `Patient profile / preference context: "${req.patientNote}".`
      : `Contexto o preferencia del paciente: "${req.patientNote}".`
    : req.lang === 'en'
      ? 'No specific patient note provided; tailor tips for general neighborhood pharmacy visitors.'
      : 'Sin nota específica; orienta los consejos a pacientes generales de la farmacia.';

  const systemInstruction =
    req.lang === 'en'
      ? `You are Sofía, the virtual pharmacy wellness assistant for "Farmacia Vida Sana Ejemplo" (fictional demonstration pharmacy).
Write warm, practical, preventive wellness tips in clear plain English without any Markdown formatting (no **, #, or bullets).
Strict safety rules:
- Never provide medical diagnoses, clinical prescriptions, or medication dosages.
- Keep guidance preventive and lifestyle-oriented.
- Only reference authentic example services from Farmacia Vida Sana Ejemplo: free walk-in blood pressure check ($0), seasonal influenza vaccination ($250 by appointment), over-the-counter personal care guidance (15-day unopened return with receipt), SPF 50+ facial sunscreen ($320), oral rehydration solution ($38), or local home delivery ($50 within 5 km, free over $500).
- Remind subtly that pharmacy guidance never replaces a doctor's visit.`
      : `Eres Sofía, la asistente virtual de bienestar de "Farmacia Vida Sana Ejemplo" (farmacia ficticia de demostración).
Redacta consejos preventivos cálidos, prácticos y claros en español limpio y sin formato Markdown (sin asteriscos **, ni #, ni viñetas).
Reglas estrictas de seguridad:
- Nunca des diagnósticos médicos, recetas ni dosis farmacológicas.
- Mantén los consejos enfocados en prevención y hábitos saludables cotidianos.
- Solo menciona servicios reales de ejemplo de Farmacia Vida Sana Ejemplo: toma gratuita de presión arterial ($0 sin cita), vacunación contra influenza ($250 con cita), asesoría de cuidado personal (15 días con ticket), protector solar facial FPS 50+ ($320), suero rehidratante oral ($38) o envío local ($50 dentro de 5 km, gratis desde $500).
- Ten presente que la farmacia no sustituye la consulta médica.`;

  const prompt =
    req.lang === 'en'
      ? `Date: ${dateIso}.
Generate 3 personalized daily wellness tips in English focused on: ${focusDescription}.
${noteLine}
Return valid JSON matching the schema.`
      : `Fecha de hoy: ${dateIso}.
Genera 3 consejos personalizados de bienestar diario en español enfocados en: ${focusDescription}.
${noteLine}
Devuelve JSON válido conforme al esquema.`;

  return { systemInstruction, prompt };
}

function stripMarkdownArtifacts(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|\s)#+\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseHealthTipsJson(
  rawText: string | undefined,
  req: NormalizedHealthTipsRequest,
  dateIso: string,
): HealthTipsPayload | null {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(cleaned);
  if (fenced) {
    cleaned = fenced[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  const rawTips = Array.isArray(obj.tips) ? obj.tips : [];
  if (rawTips.length === 0) return null;

  const tips: HealthTipItem[] = [];
  for (let i = 0; i < Math.min(rawTips.length, 3); i += 1) {
    const item = rawTips[i];
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const category = stripMarkdownArtifacts(String(rec.category ?? ''));
    const title = stripMarkdownArtifacts(String(rec.title ?? ''));
    const advice = stripMarkdownArtifacts(String(rec.advice ?? ''));
    const pharmacyNote = stripMarkdownArtifacts(String(rec.pharmacyNote ?? ''));
    if (!title || !advice) continue;
    tips.push({
      id: `${dateIso}-${req.focus}-${i + 1}`,
      category: category || (req.lang === 'en' ? 'Wellness' : 'Bienestar'),
      title,
      advice,
      pharmacyNote:
        pharmacyNote ||
        (req.lang === 'en'
          ? 'Ask Sofía about our preventive pharmacy services.'
          : 'Consulta con Sofía sobre nuestros servicios preventivos.'),
    });
  }

  if (tips.length === 0) return null;

  const headline = stripMarkdownArtifacts(String(obj.dailyHeadline ?? ''));
  return {
    date: dateIso,
    focus: req.focus,
    lang: req.lang,
    dailyHeadline:
      headline ||
      (req.lang === 'en'
        ? 'Daily preventive guidance prepared for your routine today.'
        : 'Guía preventiva diaria preparada para tu rutina de hoy.'),
    tips,
  };
}
