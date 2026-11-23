import type { Language } from '../data/pharmacyData';
import {
  buildHealthTipsPrompt,
  HealthTipsPayload,
  NormalizedHealthTipsRequest,
  parseHealthTipsJson,
} from './healthTips';
import {
  ChatAgentStatusKey,
  ConfirmationRecord,
  createPharmacyStore,
  getStatusKeyForTool,
  PHARMACY_TOOL_DECLARATIONS,
} from './pharmacyTools';
import { getSofiaSystemInstruction } from './sofiaConfig';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

export function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === 'MY_OPENAI_API_KEY') return null;
  return key;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export interface OpenAiToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

export function toOpenAiTools(): OpenAiToolDefinition[] {
  return PHARMACY_TOOL_DECLARATIONS.map((decl) => {
    const rawProps = (decl.parameters?.properties ?? {}) as Record<
      string,
      { description?: string }
    >;
    const properties: Record<string, { type: string; description: string }> = {};
    for (const [key, val] of Object.entries(rawProps)) {
      properties[key] = {
        type: 'string',
        description: val?.description ?? '',
      };
    }
    return {
      type: 'function',
      function: {
        name: decl.name ?? '',
        description: decl.description ?? '',
        parameters: {
          type: 'object',
          properties,
          required: Array.isArray(decl.parameters?.required)
            ? [...decl.parameters.required]
            : [],
        },
      },
    };
  });
}

export class OpenAiHttpError extends Error {
  public readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'OpenAiHttpError';
    this.status = status;
  }
}

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
}

async function callOpenAiCompletions(
  body: Record<string, unknown>,
  deps?: { apiKey?: string; fetchImpl?: typeof fetch },
): Promise<OpenAiChatResponse> {
  const apiKey = (deps?.apiKey ?? getOpenAiApiKey() ?? '').trim();
  if (!apiKey) {
    throw new OpenAiHttpError(503, 'OPENAI_API_KEY is not configured.');
  }
  const fetchFn = deps?.fetchImpl ?? fetch;

  const res = await fetchFn(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as OpenAiChatResponse;
  if (!res.ok) {
    throw new OpenAiHttpError(
      res.status,
      data.error?.message || `OpenAI API returned HTTP ${res.status}`,
    );
  }
  return data;
}

export async function generateOpenAiHealthTips(
  params: {
    request: NormalizedHealthTipsRequest;
    todayIso: string;
    model?: string;
  },
  deps?: { apiKey?: string; fetchImpl?: typeof fetch },
): Promise<HealthTipsPayload> {
  const { systemInstruction, prompt } = buildHealthTipsPrompt(
    params.request,
    params.todayIso,
  );
  const model = params.model?.trim() || getOpenAiModel();

  const data = await callOpenAiCompletions(
    {
      model,
      temperature: 0.5,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'pharmacy_daily_health_tips',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['dailyHeadline', 'tips'],
            properties: {
              dailyHeadline: { type: 'string' },
              tips: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['category', 'title', 'advice', 'pharmacyNote'],
                  properties: {
                    category: { type: 'string' },
                    title: { type: 'string' },
                    advice: { type: 'string' },
                    pharmacyNote: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    deps,
  );

  const rawText = data.choices?.[0]?.message?.content ?? '';
  const parsed = parseHealthTipsJson(rawText, params.request, params.todayIso);
  if (!parsed) {
    throw new OpenAiHttpError(502, 'Could not parse JSON tips returned by OpenAI.');
  }
  return parsed;
}

export async function runOpenAiChat(
  params: {
    lang: Language;
    messages: Array<{ role: 'user' | 'model'; text: string }>;
    todayIso: string;
    store: ReturnType<typeof createPharmacyStore>;
    emitStatus?: (statusKey: ChatAgentStatusKey) => void;
    onConfirmationCreated?: (conf: ConfirmationRecord) => Promise<{
      emailSent: boolean;
      emailStatus: string;
      resendId?: string;
    }>;
    model?: string;
  },
  deps?: { apiKey?: string; fetchImpl?: typeof fetch },
): Promise<{
  reply: string;
  toolEvents: Array<{ name: string; ok: boolean; summary: string }>;
}> {
  const { lang, messages, todayIso, store, emitStatus, onConfirmationCreated } = params;
  const model = params.model?.trim() || getOpenAiModel();
  const systemInstruction = getSofiaSystemInstruction(todayIso, lang, 'text');
  const tools = toOpenAiTools();

  const openAiMessages: Array<Record<string, unknown>> = [
    { role: 'system', content: systemInstruction },
    ...messages.map((m) => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];

  const toolEvents: Array<{ name: string; ok: boolean; summary: string }> = [];

  emitStatus?.('processing');
  let completion = await callOpenAiCompletions(
    {
      model,
      temperature: 0.4,
      messages: openAiMessages,
      tools,
      tool_choice: 'auto',
    },
    deps,
  );

  let steps = 0;
  while (
    completion.choices?.[0]?.message?.tool_calls &&
    completion.choices[0].message.tool_calls.length > 0 &&
    steps < 6
  ) {
    steps += 1;
    const assistantMsg = completion.choices[0].message;
    const toolCalls = assistantMsg.tool_calls ?? [];

    openAiMessages.push({
      role: 'assistant',
      content: assistantMsg.content ?? null,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      const fnName = call.function.name;
      emitStatus?.(getStatusKeyForTool(fnName));

      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
      } catch {
        parsedArgs = {};
      }

      const result = store.executeToolCall(fnName, parsedArgs);
      let toolPayload: Record<string, unknown> = result as unknown as Record<string, unknown>;

      if (
        fnName === 'enviar_confirmacion' &&
        result.ok &&
        'confirmacion' in result &&
        result.confirmacion &&
        typeof result.confirmacion === 'object' &&
        onConfirmationCreated
      ) {
        const conf = result.confirmacion as ConfirmationRecord;
        const emailMeta = await onConfirmationCreated(conf);
        toolPayload = {
          ...toolPayload,
          emailSent: emailMeta.emailSent,
          emailStatus: emailMeta.emailStatus,
          ...(emailMeta.resendId ? { resendId: emailMeta.resendId } : {}),
        };
      }

      toolEvents.push({
        name: fnName,
        ok: result.ok,
        summary: result.ok
          ? String(('id' in result && result.id) || ('mensaje' in result && result.mensaje) || 'OK')
          : result.error,
      });

      openAiMessages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(toolPayload),
      });
    }

    emitStatus?.('writing');
    completion = await callOpenAiCompletions(
      {
        model,
        temperature: 0.4,
        messages: openAiMessages,
        tools,
        tool_choice: 'auto',
      },
      deps,
    );
  }

  emitStatus?.('writing');
  const reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    (lang === 'en'
      ? 'Sorry, I could not generate a response right now. Please try again.'
      : 'Disculpa, no pude generar una respuesta en este momento. ¿Podrías intentarlo de nuevo?');

  return { reply, toolEvents };
}
