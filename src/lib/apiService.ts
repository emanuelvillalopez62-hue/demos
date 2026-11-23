import { Content, GoogleGenAI, Part } from '@google/genai';
import type { Language } from '../data/pharmacyData';
import {
  buildHealthTipsPrompt,
  HEALTH_TIPS_RESPONSE_SCHEMA,
  HealthTipsPayload,
  normalizeHealthTipsRequest,
  parseHealthTipsJson,
} from './healthTips';
import {
  generateOpenAiHealthTips,
  getOpenAiApiKey,
  OpenAiHttpError,
  runOpenAiChat,
} from './openaiClient';
import {
  ChatAgentStatusKey,
  ConfirmationRecord,
  createPharmacyStore,
  getStatusKeyForTool,
  PHARMACY_TOOL_DECLARATIONS,
} from './pharmacyTools';
import {
  buildContactConfirmationEmail,
  buildSofiaConfirmationEmail,
  isValidEmailAddress,
  sendResendEmail,
} from './resendEmail';
import { getSofiaSystemInstruction } from './sofiaConfig';

const sharedStore = createPharmacyStore();
const dailyTipsCache = new Map<string, HealthTipsPayload>();

export function getSharedStore() {
  return sharedStore;
}

export function normalizeLang(raw: unknown): Language {
  return raw === 'en' ? 'en' : 'es';
}

export function getGeminiClient(apiVersion?: string): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function getHealthPayload(hasLiveVoice = false) {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  return {
    ok: true,
    hasGeminiKey: Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY'),
    hasOpenAiKey: Boolean(getOpenAiApiKey()),
    hasResendKey: Boolean(resendKey && resendKey !== 'MY_RESEND_API_KEY'),
    hasLiveVoice,
  };
}

export async function dispatchSofiaConfirmationEmail(
  lang: Language,
  conf: ConfirmationRecord,
): Promise<{ emailSent: boolean; emailStatus: string; resendId?: string }> {
  if (!isValidEmailAddress(conf.destinatario)) {
    return { emailSent: false, emailStatus: 'invalid_recipient' };
  }
  const emailRes = await sendResendEmail({
    to: conf.destinatario,
    ...buildSofiaConfirmationEmail({
      lang,
      confirmationId: conf.id,
      tipo: conf.tipo,
      destinatario: conf.destinatario,
      detalles: conf.detalles,
    }),
  });
  return {
    emailSent: emailRes.ok,
    emailStatus: emailRes.status,
    ...(emailRes.emailId ? { resendId: emailRes.emailId } : {}),
  };
}

export async function processContactSubmission(rawBody: unknown): Promise<{
  httpStatus: number;
  body: Record<string, unknown>;
}> {
  const body = (rawBody ?? {}) as Record<string, unknown>;
  const lang = normalizeLang(body.lang);
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const correo = typeof body.correo === 'string' ? body.correo.trim() : '';
  const mensaje = typeof body.mensaje === 'string' ? body.mensaje.trim() : '';

  if (nombre.length < 2 || nombre.length > 120) {
    return {
      httpStatus: 400,
      body: {
        ok: false,
        error:
          lang === 'en'
            ? 'Please enter your full name.'
            : 'Por favor ingresa tu nombre completo.',
      },
    };
  }
  if (!isValidEmailAddress(correo)) {
    return {
      httpStatus: 400,
      body: {
        ok: false,
        error:
          lang === 'en'
            ? 'Please enter a valid email address.'
            : 'Por favor ingresa un correo electrónico válido.',
      },
    };
  }
  if (mensaje.length < 5 || mensaje.length > 1500) {
    return {
      httpStatus: 400,
      body: {
        ok: false,
        error:
          lang === 'en'
            ? 'Please write a message of at least 5 characters.'
            : 'Por favor escribe un mensaje de al menos 5 caracteres.',
      },
    };
  }

  const lead = sharedStore.registrar_lead(nombre, correo, mensaje, 'formulario_web');
  if (!lead.ok) {
    return { httpStatus: 400, body: lead as unknown as Record<string, unknown> };
  }

  const emailContent = buildContactConfirmationEmail({
    lang,
    leadId: lead.id,
    nombre,
    correo,
    mensaje,
  });
  const emailResult = await sendResendEmail({
    to: correo,
    ...emailContent,
  });

  sharedStore.enviar_confirmacion(
    'contacto_web',
    correo,
    `Solicitud ${lead.id}: "${mensaje.slice(0, 120)}" (emailStatus=${emailResult.status})`,
  );

  let emailNote = '';
  let mensajeFinal =
    lang === 'en' ? `Inquiry recorded (${lead.id}).` : `Solicitud registrada (${lead.id}).`;

  if (emailResult.ok) {
    mensajeFinal =
      lang === 'en'
        ? `Message received. We sent a confirmation email with your full summary to ${correo}.`
        : `Mensaje recibido. Enviamos un correo de confirmación con el resumen completo a ${correo}.`;
    emailNote =
      lang === 'en'
        ? `Confirmation email dispatched (ID: ${emailResult.emailId}).`
        : `Correo enviado vía Resend (ID: ${emailResult.emailId}).`;
  } else if (emailResult.status === 'not_configured') {
    mensajeFinal =
      lang === 'en'
        ? `Inquiry recorded (${lead.id}). Automatic email confirmation requires setting RESEND_API_KEY in Settings > Secrets.`
        : `Solicitud registrada (${lead.id}). Para enviar el correo automático al cliente, configura RESEND_API_KEY en Settings > Secrets.`;
    emailNote =
      lang === 'en'
        ? 'Email not sent: RESEND_API_KEY is not configured on the server.'
        : 'Correo pendiente: falta configurar RESEND_API_KEY en el servidor.';
  } else {
    mensajeFinal =
      lang === 'en'
        ? `Inquiry recorded (${lead.id}), but the confirmation email could not be delivered right now.`
        : `Solicitud registrada (${lead.id}), pero no se pudo entregar el correo automático en este momento.`;
    emailNote = emailResult.sandboxRestricted
      ? lang === 'en'
        ? 'Resend test mode (onboarding@resend.dev) only delivers to the verified account owner email until a domain is verified.'
        : 'El modo de prueba de Resend (onboarding@resend.dev) solo envía al correo del dueño de la cuenta hasta verificar un dominio propio.'
      : lang === 'en'
        ? 'Could not complete email delivery via Resend.'
        : 'No se pudo completar el envío por Resend.';
  }

  return {
    httpStatus: 200,
    body: {
      ok: true,
      id: lead.id,
      emailSent: emailResult.ok,
      emailStatus: emailResult.status,
      emailId: emailResult.emailId,
      emailNote,
      mensaje: mensajeFinal,
    },
  };
}

export async function processHealthTipsRequest(rawBody: unknown): Promise<{
  httpStatus: number;
  body: Record<string, unknown>;
}> {
  const parsedReq = normalizeHealthTipsRequest(rawBody);
  if (!parsedReq.ok) {
    return { httpStatus: 400, body: { error: parsedReq.error } };
  }

  const { lang } = parsedReq.value;
  const openAiKey = getOpenAiApiKey();
  const ai = getGeminiClient();

  if (!openAiKey && !ai) {
    return {
      httpStatus: 503,
      body: {
        error:
          lang === 'en'
            ? 'No AI API key is configured on the server. Set OPENAI_API_KEY or GEMINI_API_KEY in Settings > Secrets.'
            : 'No hay una clave de IA configurada en el servidor. Configura OPENAI_API_KEY o GEMINI_API_KEY en Settings > Secrets.',
      },
    };
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const forceRefresh = Boolean((rawBody as Record<string, unknown> | undefined)?.refresh);
  const cacheKey = `${todayIso}::${parsedReq.value.lang}::${parsedReq.value.focus}::${parsedReq.value.patientNote.toLowerCase()}`;

  if (!forceRefresh) {
    const cached = dailyTipsCache.get(cacheKey);
    if (cached) {
      return { httpStatus: 200, body: cached as unknown as Record<string, unknown> };
    }
  }

  const attemptErrors: string[] = [];

  if (openAiKey) {
    try {
      const payload = await generateOpenAiHealthTips({
        request: parsedReq.value,
        todayIso,
      });
      dailyTipsCache.set(cacheKey, payload);
      return { httpStatus: 200, body: payload as unknown as Record<string, unknown> };
    } catch (err: unknown) {
      const oaiErr = err as { status?: number; message?: string };
      attemptErrors.push(`openai[${oaiErr?.status ?? 'ERR'}]: ${(oaiErr?.message ?? '').slice(0, 240)}`);
      if (!ai) {
        return mapAiProviderError(lang, oaiErr?.status, attemptErrors);
      }
    }
  }

  if (!ai) {
    return mapAiProviderError(lang, 502, attemptErrors);
  }

  const { systemInstruction, prompt } = buildHealthTipsPrompt(parsedReq.value, todayIso);
  const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
  let lastErr: unknown;

  try {
    let responseText: string | undefined;

    for (const modelName of modelsToTry) {
      let succeeded = false;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: HEALTH_TIPS_RESPONSE_SCHEMA,
            },
          });
          responseText = result.text;
          succeeded = true;
          break;
        } catch (err: unknown) {
          lastErr = err;
          const apiErr = err as { status?: number; message?: string };
          const status = apiErr?.status;
          attemptErrors.push(`${modelName}[${status ?? 'ERR'}]: ${(apiErr?.message ?? '').slice(0, 240)}`);
          const isRetryable =
            status === 503 ||
            status === 500 ||
            status === 404 ||
            status === 429 ||
            (apiErr?.message ?? '').includes('UNAVAILABLE');
          if (!isRetryable) throw err;
          if (status === 404 || status === 429) break;
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 650));
          }
        }
      }
      if (succeeded) break;
    }

    if (!responseText) {
      throw lastErr ?? new Error('Empty response from Gemini API.');
    }

    const payload = parseHealthTipsJson(responseText, parsedReq.value, todayIso);
    if (!payload) {
      return {
        httpStatus: 502,
        body: {
          error:
            lang === 'en'
              ? 'Could not parse personalized wellness tips right now. Please retry.'
              : 'No se pudo interpretar la respuesta de consejos de bienestar. Intenta nuevamente.',
        },
      };
    }

    dailyTipsCache.set(cacheKey, payload);
    return { httpStatus: 200, body: payload as unknown as Record<string, unknown> };
  } catch (err: unknown) {
    const apiErr = err as { status?: number; message?: string };
    return mapAiProviderError(lang, apiErr?.status, attemptErrors, apiErr?.message);
  }
}

interface ClientChatMessage {
  role: 'user' | 'model';
  text: string;
}

function validateChatMessages(raw: unknown): ClientChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 40) {
    return null;
  }
  const normalized: ClientChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const rec = item as Record<string, unknown>;
    if (rec.role !== 'user' && rec.role !== 'model') return null;
    if (typeof rec.text !== 'string') return null;
    const text = rec.text.trim();
    if (!text || text.length > 2000) return null;
    normalized.push({ role: rec.role, text });
  }
  return normalized;
}

function mapAiProviderError(
  lang: Language,
  rawStatus: number | undefined,
  attemptErrors: string[],
  fallbackMessage = '',
): { httpStatus: number; body: Record<string, unknown> } {
  const allErrorsText = attemptErrors.join(' ; ') || fallbackMessage;
  const status = typeof rawStatus === 'number' ? rawStatus : 502;

  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    allErrorsText.includes('API_KEY_INVALID') ||
    allErrorsText.includes('PERMISSION_DENIED') ||
    allErrorsText.includes('Incorrect API key')
  ) {
    return {
      httpStatus: status === 400 || status === 401 || status === 403 ? status : 403,
      body: {
        error:
          lang === 'en'
            ? 'The configured AI API key is invalid or lacks permissions. Check OPENAI_API_KEY or GEMINI_API_KEY in Settings > Secrets.'
            : 'La clave de IA configurada no es válida o no tiene permisos. Revisa OPENAI_API_KEY o GEMINI_API_KEY en Settings > Secrets.',
        detail: allErrorsText.slice(0, 240),
      },
    };
  }

  if (
    status === 429 ||
    allErrorsText.includes('RESOURCE_EXHAUSTED') ||
    allErrorsText.includes('[429]') ||
    allErrorsText.includes('Rate limit')
  ) {
    return {
      httpStatus: 429,
      body: {
        error:
          lang === 'en'
            ? 'AI API quota limit was temporarily reached. You can retry shortly, use the Live Voice Call button, or configure OPENAI_API_KEY in Settings > Secrets.'
            : 'Se alcanzó temporalmente el límite de cuota de la API de IA. Puedes reintentar en unos momentos, usar la llamada de voz en vivo o configurar OPENAI_API_KEY en Settings > Secrets.',
        detail: allErrorsText.slice(0, 240),
      },
    };
  }

  return {
    httpStatus: 502,
    body: {
      error:
        lang === 'en'
          ? 'Could not reach the AI service right now. Please try again in a few seconds.'
          : 'No se pudo conectar con el servicio de respuesta en este momento. Por favor intenta de nuevo en unos segundos.',
      detail: allErrorsText.slice(0, 240),
    },
  };
}

export async function processChatRequest(params: {
  rawBody: unknown;
  emitStatus?: (statusKey: ChatAgentStatusKey) => void;
}): Promise<
  | { ok: true; reply: string; toolEvents: Array<{ name: string; ok: boolean; summary: string }> }
  | { ok: false; httpStatus: number; error: string; detail?: string }
> {
  const body = (params.rawBody ?? {}) as Record<string, unknown>;
  const lang = normalizeLang(body.lang);
  const messages = validateChatMessages(body.messages);

  if (!messages) {
    return {
      ok: false,
      httpStatus: 400,
      error: lang === 'en' ? 'Invalid conversation payload.' : 'Formato de conversación inválido.',
    };
  }

  const openAiKey = getOpenAiApiKey();
  const ai = getGeminiClient();

  if (!openAiKey && !ai) {
    return {
      ok: false,
      httpStatus: 503,
      error:
        lang === 'en'
          ? 'No AI API key is configured on the server. Set OPENAI_API_KEY or GEMINI_API_KEY in Settings > Secrets.'
          : 'No hay una clave de IA configurada en el servidor. Configura OPENAI_API_KEY o GEMINI_API_KEY en Settings > Secrets.',
    };
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const attemptErrors: string[] = [];
  params.emitStatus?.('analyzing');

  if (openAiKey) {
    try {
      const openAiResult = await runOpenAiChat({
        lang,
        messages,
        todayIso,
        store: sharedStore,
        emitStatus: params.emitStatus,
        onConfirmationCreated: (conf) => dispatchSofiaConfirmationEmail(lang, conf),
      });
      return { ok: true, ...openAiResult };
    } catch (err: unknown) {
      const oaiErr = err as OpenAiHttpError & { status?: number; message?: string };
      attemptErrors.push(`openai[${oaiErr?.status ?? 'ERR'}]: ${(oaiErr?.message ?? '').slice(0, 240)}`);
      if (!ai) {
        const mapped = mapAiProviderError(lang, oaiErr?.status, attemptErrors);
        return {
          ok: false,
          httpStatus: mapped.httpStatus,
          error: String(mapped.body.error),
          detail: String(mapped.body.detail ?? ''),
        };
      }
    }
  }

  if (!ai) {
    const mapped = mapAiProviderError(lang, 502, attemptErrors);
    return {
      ok: false,
      httpStatus: mapped.httpStatus,
      error: String(mapped.body.error),
      detail: String(mapped.body.detail ?? ''),
    };
  }

  const contents: Content[] = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }
  if (contents.length === 0) {
    return {
      ok: false,
      httpStatus: 400,
      error:
        lang === 'en'
          ? 'Please send a message to start the conversation.'
          : 'Envía un mensaje para iniciar la conversación.',
    };
  }

  const systemInstruction = getSofiaSystemInstruction(todayIso, lang, 'text');
  let activeModelIndex = 0;
  const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

  const generateWithResilience = async () => {
    let lastErr: unknown;
    for (let idx = activeModelIndex; idx < modelsToTry.length; idx += 1) {
      const modelName = modelsToTry[idx];
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              tools: [{ functionDeclarations: PHARMACY_TOOL_DECLARATIONS }],
            },
          });
          activeModelIndex = idx;
          return result;
        } catch (err: unknown) {
          lastErr = err;
          const apiErr = err as { status?: number; message?: string };
          const status = apiErr?.status;
          attemptErrors.push(`${modelName}[${status ?? 'ERR'}]: ${(apiErr?.message ?? '').slice(0, 260)}`);
          const isRetryable =
            status === 503 ||
            status === 500 ||
            status === 404 ||
            status === 429 ||
            (apiErr?.message ?? '').includes('UNAVAILABLE');
          if (!isRetryable) throw err;
          if (status === 404 || status === 429) break;
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 650));
          }
        }
      }
    }
    throw lastErr;
  };

  try {
    const toolEvents: Array<{ name: string; ok: boolean; summary: string }> = [];
    params.emitStatus?.('processing');
    let response = await generateWithResilience();

    let steps = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && steps < 6) {
      steps += 1;
      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) {
        contents.push(modelContent);
      }

      const responseParts: Part[] = [];
      for (const call of response.functionCalls) {
        const fnName = call.name ?? '';
        params.emitStatus?.(getStatusKeyForTool(fnName));

        const fnArgs = (call.args ?? {}) as Record<string, unknown>;
        const result = sharedStore.executeToolCall(fnName, fnArgs);
        let toolPayload: Record<string, unknown> = result as unknown as Record<string, unknown>;

        if (
          fnName === 'enviar_confirmacion' &&
          result.ok &&
          'confirmacion' in result &&
          result.confirmacion &&
          typeof result.confirmacion === 'object'
        ) {
          const emailMeta = await dispatchSofiaConfirmationEmail(
            lang,
            result.confirmacion as ConfirmationRecord,
          );
          toolPayload = {
            ...toolPayload,
            ...emailMeta,
          };
        }

        toolEvents.push({
          name: fnName,
          ok: result.ok,
          summary: result.ok
            ? String(('id' in result && result.id) || ('mensaje' in result && result.mensaje) || 'OK')
            : result.error,
        });

        responseParts.push({
          functionResponse: {
            id: call.id,
            name: fnName,
            response: toolPayload,
          },
        });
      }

      contents.push({ role: 'user', parts: responseParts });
      params.emitStatus?.('writing');
      response = await generateWithResilience();
    }

    params.emitStatus?.('writing');
    const replyText =
      response.text?.trim() ||
      (lang === 'en'
        ? 'Sorry, I could not generate a response right now. Please try again.'
        : 'Disculpa, no pude generar una respuesta en este momento. ¿Podrías intentarlo de nuevo?');

    return { ok: true, reply: replyText, toolEvents };
  } catch (err: unknown) {
    const apiErr = err as { status?: number; message?: string };
    const mapped = mapAiProviderError(lang, apiErr?.status, attemptErrors, apiErr?.message);
    return {
      ok: false,
      httpStatus: mapped.httpStatus,
      error: String(mapped.body.error),
      detail: String(mapped.body.detail ?? ''),
    };
  }
}
