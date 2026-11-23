import test from 'node:test';
import assert from 'node:assert/strict';
import { createPharmacyStore } from './pharmacyTools';
import {
  generateOpenAiHealthTips,
  OpenAiHttpError,
  runOpenAiChat,
  toOpenAiTools,
} from './openaiClient';

test('toOpenAiTools maps all pharmacy tool declarations to OpenAI JSON schema format', () => {
  const tools = toOpenAiTools();
  assert.equal(tools.length, 7);
  const avail = tools.find((t) => t.function.name === 'consultar_disponibilidad');
  assert.ok(avail);
  assert.equal(avail.function.parameters.type, 'object');
  assert.equal(avail.function.parameters.properties.fecha.type, 'string');
});

test('generateOpenAiHealthTips posts structured request with Bearer auth and parses response', async () => {
  let capturedAuth = '';
  const result = await generateOpenAiHealthTips(
    {
      request: { lang: 'es', focus: 'general', patientNote: 'oficina' },
      todayIso: '2026-11-23',
      model: 'gpt-4o-mini',
    },
    {
      apiKey: 'sk-test-123',
      fetchImpl: async (_url, init) => {
        const headers = init?.headers as Record<string, string>;
        capturedAuth = headers.Authorization;
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    dailyHeadline: 'Resumen preventivo para tu jornada en oficina.',
                    tips: [
                      {
                        title: 'Pausas activas',
                        category: 'Bienestar diario',
                        advice: 'Levántate cada hora y mantén agua cerca.',
                        pharmacyNote: 'Suero rehidratante oral (ejemplo) en mostrador',
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    },
  );

  assert.equal(capturedAuth, 'Bearer sk-test-123');
  assert.equal(result.tips.length, 1);
  assert.equal(result.tips[0].title, 'Pausas activas');
});

test('runOpenAiChat handles tool calls and emits real-time status progression', async () => {
  const store = createPharmacyStore(() => new Date('2026-11-23T10:00:00Z'));
  const statuses: string[] = [];
  let callIndex = 0;

  const result = await runOpenAiChat(
    {
      lang: 'es',
      messages: [{ role: 'user', text: '¿Qué horarios tienen para vacuna el 2026-11-25?' }],
      todayIso: '2026-11-23',
      store,
      emitStatus: (s) => statuses.push(s),
    },
    {
      apiKey: 'sk-test-123',
      fetchImpl: async () => {
        callIndex += 1;
        if (callIndex === 1) {
          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: null,
                    tool_calls: [
                      {
                        id: 'call_1',
                        type: 'function',
                        function: {
                          name: 'consultar_disponibilidad',
                          arguments: JSON.stringify({
                            servicio: 'Vacunación contra la influenza',
                            fecha: '2026-11-25',
                          }),
                        },
                      },
                    ],
                  },
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: 'Tenemos horarios disponibles a las 09:00, 11:30 y 16:00.',
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    },
  );

  assert.match(result.reply, /09:00/);
  assert.equal(result.toolEvents.length, 1);
  assert.equal(result.toolEvents[0].name, 'consultar_disponibilidad');
  assert.deepEqual(statuses, ['processing', 'toolAvailability', 'writing', 'writing']);
});

test('runOpenAiChat surfaces OpenAiHttpError on invalid key', async () => {
  const store = createPharmacyStore();
  await assert.rejects(
    () =>
      runOpenAiChat(
        {
          lang: 'en',
          messages: [{ role: 'user', text: 'Hello' }],
          todayIso: '2026-11-23',
          store,
        },
        {
          apiKey: 'sk-bad',
          fetchImpl: async () =>
            new Response(JSON.stringify({ error: { message: 'Incorrect API key' } }), {
              status: 401,
            }),
        },
      ),
    (err: unknown) => err instanceof OpenAiHttpError && err.status === 401,
  );
});
