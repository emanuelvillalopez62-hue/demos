import 'dotenv/config';
import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  EndSensitivity,
  LiveServerMessage,
  Modality,
  StartSensitivity,
} from '@google/genai';
import {
  ConfirmationRecord,
  getStatusKeyForTool,
  PHARMACY_TOOL_DECLARATIONS,
} from './src/lib/pharmacyTools';
import { getSofiaSystemInstruction } from './src/lib/sofiaConfig';
import {
  dispatchSofiaConfirmationEmail,
  getGeminiClient,
  getHealthPayload,
  getSharedStore,
  normalizeLang,
  processChatRequest,
  processContactSubmission,
  processHealthTipsRequest,
} from './src/lib/apiService';

const PORT = 3000;
const store = getSharedStore();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json(getHealthPayload());
  });

  // [DATOS DE EJEMPLO] Endpoint de formulario de contacto web + correo de confirmación vía Resend
  app.post('/api/contact', async (req, res) => {
    const result = await processContactSubmission(req.body);
    res.status(result.httpStatus).json(result.body);
  });

  // Consejos diarios personalizados con OpenAI / Gemini (structured JSON, server-side)
  app.post('/api/health-tips', async (req, res) => {
    const result = await processHealthTipsRequest(req.body);
    res.status(result.httpStatus).json(result.body);
  });

  // Chat de texto con OpenAI / Gemini + Function Calling + estados SSE en tiempo real
  app.post('/api/chat', async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const wantsStream =
      req.headers.accept?.includes('text/event-stream') || body.stream === true;

    const sendEvent = (event: string, data: unknown) => {
      if (wantsStream && !res.writableEnded) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    if (wantsStream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
    }

    const result = await processChatRequest({
      rawBody: req.body,
      emitStatus: (statusKey) => sendEvent('status', { statusKey }),
    });

    if (result.ok) {
      if (wantsStream) {
        sendEvent('done', { reply: result.reply, toolEvents: result.toolEvents });
        res.end();
      } else {
        res.json({ reply: result.reply, toolEvents: result.toolEvents });
      }
      return;
    }

    if (wantsStream) {
      sendEvent('error', {
        error: result.error,
        status: result.httpStatus,
        detail: result.detail,
      });
      res.end();
    } else {
      res.status(result.httpStatus).json({ error: result.error, detail: result.detail });
    }
  });

  const server = http.createServer(app);

  // Puente WebSocket para Gemini Live API (Voz en vivo gratuita con gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/live', perMessageDeflate: false });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    const reqUrl = new URL(req.url ?? '/live', `http://${req.headers.host ?? 'localhost'}`);
    const lang = normalizeLang(reqUrl.searchParams.get('lang'));

    const ai = getGeminiClient('v1beta');
    if (!ai) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error:
            lang === 'en'
              ? 'Gemini API key is not configured on the server.'
              : 'Clave de Gemini API no disponible en el servidor.',
        }),
      );
      clientWs.close();
      return;
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const systemInstruction = getSofiaSystemInstruction(todayIso, lang, 'voice');
    let sessionClosed = false;
    let activeSession: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
    const pendingClientMessages: Array<{ type?: string; data?: string; text?: string }> = [];

    const forwardToLive = (
      session: Awaited<ReturnType<typeof ai.live.connect>>,
      msg: { type?: string; data?: string; text?: string },
    ) => {
      if (msg.type === 'audio' && typeof msg.data === 'string') {
        session.sendRealtimeInput({
          audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' },
        });
      } else if (msg.type === 'text' && typeof msg.text === 'string' && msg.text.trim()) {
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: msg.text.trim() }] }],
          turnComplete: true,
        });
      }
    };

    clientWs.on('message', (raw) => {
      if (sessionClosed) return;
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: string;
          data?: string;
          text?: string;
        };
        if (!activeSession) {
          pendingClientMessages.push(msg);
          return;
        }
        forwardToLive(activeSession, msg);
      } catch (parseErr) {
        console.error('[Live WS parse error]', parseErr);
      }
    });

    clientWs.on('close', () => {
      if (!sessionClosed) {
        sessionClosed = true;
        if (activeSession) {
          try {
            activeSession.close();
          } catch {
            // ignore close error
          }
        }
      }
    });

    try {
      const session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr',
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
              prefixPaddingMs: 120,
              silenceDurationMs: 300,
            },
          },
          systemInstruction,
          tools: [{ functionDeclarations: PHARMACY_TOOL_DECLARATIONS }],
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready' }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const serverContent = message.serverContent;
            if (serverContent?.modelTurn?.parts) {
              for (const part of serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({ type: 'audio', data: part.inlineData.data }),
                  );
                }
              }
            }

            if (serverContent?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'inputTranscript',
                  text: serverContent.inputTranscription.text,
                }),
              );
            }

            if (serverContent?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'outputTranscript',
                  text: serverContent.outputTranscription.text,
                }),
              );
            }

            if (serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            if (serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }

            if (message.toolCall?.functionCalls?.length && activeSession) {
              const liveSession = activeSession;
              void Promise.all(
                message.toolCall.functionCalls.map(async (call) => {
                  const fnName = call.name ?? '';
                  clientWs.send(
                    JSON.stringify({
                      type: 'status',
                      statusKey: getStatusKeyForTool(fnName),
                    }),
                  );

                  const fnArgs = (call.args ?? {}) as Record<string, unknown>;
                  const result = store.executeToolCall(fnName, fnArgs);
                  let toolPayload: Record<string, unknown> =
                    result as unknown as Record<string, unknown>;

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

                  clientWs.send(
                    JSON.stringify({
                      type: 'toolEvent',
                      name: fnName,
                      ok: result.ok,
                      summary: result.ok
                        ? String(('id' in result && result.id) || 'OK')
                        : result.error,
                    }),
                  );

                  return {
                    id: call.id,
                    name: fnName,
                    response: toolPayload,
                  };
                }),
              ).then((responses) => {
                if (!sessionClosed) {
                  liveSession.sendToolResponse({ functionResponses: responses });
                }
              });
            }
          },
          onerror: (err) => {
            const errObj = err as { message?: string; error?: { message?: string } };
            const detail = errObj?.message || errObj?.error?.message || String(err);
            console.error('[Gemini Live error]', detail);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  error:
                    lang === 'en'
                      ? 'An error occurred during the live voice session.'
                      : 'Ocurrió un error en la sesión de voz en vivo.',
                  detail: detail.slice(0, 200),
                }),
              );
            }
          },
          onclose: (ev) => {
            const closeInfo = ev as { code?: number; reason?: string };
            console.info('[Gemini Live closed]', closeInfo?.code, closeInfo?.reason);
            sessionClosed = true;
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'closed',
                  code: closeInfo?.code,
                  reason: closeInfo?.reason,
                }),
              );
              clientWs.close();
            }
          },
        },
      });

      if (sessionClosed) {
        try {
          session.close();
        } catch {
          // ignore close after disconnect
        }
        return;
      }

      activeSession = session;
      while (pendingClientMessages.length > 0 && !sessionClosed) {
        const queued = pendingClientMessages.shift();
        if (queued) forwardToLive(session, queued);
      }
    } catch (connectErr) {
      console.error('[Live WS connect error]', connectErr);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error:
              lang === 'en'
                ? 'Could not start live voice session.'
                : 'No se pudo iniciar la llamada de voz en vivo.',
          }),
        );
        clientWs.close();
      }
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Farmacia Vida Sana Ejemplo server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
