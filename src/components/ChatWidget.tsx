import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  Mic,
  MicOff,
  Minus,
  Phone,
  PhoneOff,
  Send,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Language, PHARMACY_COPY } from '../data/pharmacyData';
import type { ChatAgentStatusKey } from '../lib/pharmacyTools';
import { float32ToPcm16Base64, PcmAudioPlayer } from '../lib/audioClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
  toolNote?: string;
}

interface ChatWidgetProps {
  lang: Language;
  isOpen: boolean;
  isMinimized: boolean;
  prefillPrompt: string | null;
  onOpen: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onConsumePrefill: () => void;
}

function getCurrentTimeLabel(lang: Language): string {
  return new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatWidget({
  lang,
  isOpen,
  isMinimized,
  prefillPrompt,
  onOpen,
  onMinimize,
  onClose,
  onConsumePrefill,
}: ChatWidgetProps) {
  const copy = PHARMACY_COPY[lang].chat;

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'model',
      text: PHARMACY_COPY[lang].chat.welcomeMessage,
      time: getCurrentTimeLabel(lang),
    },
  ]);
  const [input, setInput] = useState('');
  const [statusKey, setStatusKey] = useState<ChatAgentStatusKey>('online');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live voice call state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const voiceActiveRef = useRef(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playerRef = useRef<PcmAudioPlayer | null>(null);

  const liveInputBufferRef = useRef<string>('');
  const liveOutputBufferRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync welcome bubble language if conversation has not yet started
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-1') {
        return [{ ...prev[0], text: PHARMACY_COPY[lang].chat.welcomeMessage }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isVoiceActive]);

  useEffect(() => {
    if (isOpen && !isMinimized && prefillPrompt) {
      setInput(prefillPrompt);
      onConsumePrefill();
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, isMinimized, prefillPrompt, onConsumePrefill]);

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function appendMessage(role: 'user' | 'model', text: string, toolNote?: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        text,
        time: getCurrentTimeLabel(lang),
        toolNote,
      },
    ]);
  }

  async function sendTextMessage(textToSend: string) {
    const clean = textToSend.trim();
    if (!clean || isSending) return;

    setErrorMsg(null);
    setInput('');

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      text: clean,
      time: getCurrentTimeLabel(lang),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);

    // If live voice call is active, send text turn directly into live WebSocket
    if (voiceActiveRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      setStatusKey('processing');
      wsRef.current.send(JSON.stringify({ type: 'text', text: clean }));
      return;
    }

    setIsSending(true);
    setStatusKey('analyzing');
    const startedAt = Date.now();

    const applyStatusPaced = async (nextKey: ChatAgentStatusKey) => {
      if (nextKey === 'processing' && Date.now() - startedAt < 220) {
        await new Promise((r) => setTimeout(r, 220 - (Date.now() - startedAt)));
      }
      setStatusKey(nextKey);
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          lang,
          stream: true,
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let receivedDone = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';

          for (const block of blocks) {
            const lines = block.split('\n');
            let eventName = 'message';
            let dataStr = '';
            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataStr += line.slice(5).trim();
              }
            }
            if (!dataStr) continue;

            try {
              const payload = JSON.parse(dataStr) as {
                statusKey?: ChatAgentStatusKey;
                reply?: string;
                error?: string;
                toolEvents?: Array<{ name: string; ok: boolean; summary: string }>;
              };

              if (eventName === 'status' && payload.statusKey) {
                await applyStatusPaced(payload.statusKey);
              } else if (eventName === 'done' && payload.reply) {
                receivedDone = true;
                const successNote = payload.toolEvents
                  ?.filter((t) => t.ok && /^(CITA|LEAD|ESC|ENV)-/.test(t.summary))
                  .map((t) => t.summary)
                  .join(' · ');
                appendMessage('model', payload.reply, successNote || undefined);
              } else if (eventName === 'error') {
                receivedDone = true;
                setErrorMsg(payload.error || copy.errors.fallbackServer);
              }
            } catch {
              // ignore malformed SSE packet
            }
          }
        }

        if (!receivedDone) {
          setErrorMsg(copy.errors.fallbackServer);
        }
      } else {
        const data = (await res.json()) as {
          reply?: string;
          error?: string;
          toolEvents?: Array<{ name: string; ok: boolean; summary: string }>;
        };

        if (!res.ok || !data.reply) {
          setErrorMsg(data.error || copy.errors.fallbackServer);
          return;
        }

        const successNote = data.toolEvents
          ?.filter((t) => t.ok && /^(CITA|LEAD|ESC|ENV)-/.test(t.summary))
          .map((t) => t.summary)
          .join(' · ');

        appendMessage('model', data.reply, successNote || undefined);
      }
    } catch {
      setErrorMsg(copy.errors.connectionError);
    } finally {
      setIsSending(false);
      setStatusKey(voiceActiveRef.current ? 'listening' : 'online');
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    void sendTextMessage(input);
  }

  function flushLiveTranscripts() {
    const userTxt = liveInputBufferRef.current.trim();
    if (userTxt) {
      appendMessage('user', userTxt);
      liveInputBufferRef.current = '';
    }
    const modelTxt = liveOutputBufferRef.current.trim();
    if (modelTxt) {
      appendMessage('model', modelTxt);
      liveOutputBufferRef.current = '';
    }
  }

  function stopVoiceSession() {
    voiceActiveRef.current = false;
    setIsVoiceActive(false);
    setIsMuted(false);
    setStatusKey('online');
    flushLiveTranscripts();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      void inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }

  async function startVoiceSession() {
    if (voiceActiveRef.current) {
      stopVoiceSession();
      return;
    }

    setErrorMsg(null);
    setStatusKey('connecting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(copy.errors.noMicSupport);
      setStatusKey('online');
      return;
    }

    // Unlock low-latency playback context immediately within user click gesture
    const player = new PcmAudioPlayer();
    player.ensureContext();
    playerRef.current = player;

    let stream: MediaStream;
    try {
      // Request microphone permission ONLY when user clicks voice/call button
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch {
      player.close();
      playerRef.current = null;
      setErrorMsg(copy.errors.micDenied);
      setStatusKey('online');
      return;
    }

    mediaStreamRef.current = stream;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/live?lang=${lang}`);
    wsRef.current = ws;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const inputCtx = new AudioCtx({ sampleRate: 16000, latencyHint: 'interactive' });
    inputAudioCtxRef.current = inputCtx;

    ws.onopen = () => {
      voiceActiveRef.current = true;
      setIsVoiceActive(true);
      setStatusKey('connecting');
      if (inputCtx.state === 'suspended') {
        void inputCtx.resume();
      }

      const source = inputCtx.createMediaStreamSource(stream);
      // 1024 samples (~64ms at 16kHz) vs 4096 (~256ms) reduces call round-trip delay by ~192ms
      const processor = inputCtx.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!voiceActiveRef.current || isMutedRef.current) return;
        if (ws.readyState !== WebSocket.OPEN) return;
        const float32 = event.inputBuffer.getChannelData(0);
        const base64 = float32ToPcm16Base64(float32, inputCtx.sampleRate);
        ws.send(JSON.stringify({ type: 'audio', data: base64 }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string;
          data?: string;
          text?: string;
          error?: string;
          statusKey?: ChatAgentStatusKey;
          name?: string;
          ok?: boolean;
          summary?: string;
        };

        if (msg.type === 'ready') {
          if (voiceActiveRef.current) {
            setStatusKey('listening');
          }
        } else if (msg.type === 'audio' && msg.data) {
          setStatusKey('speaking');
          player.enqueue(msg.data);
        } else if (msg.type === 'interrupted') {
          player.interrupt();
          setStatusKey('listening');
        } else if (msg.type === 'inputTranscript' && msg.text) {
          liveInputBufferRef.current += msg.text;
        } else if (msg.type === 'outputTranscript' && msg.text) {
          if (liveInputBufferRef.current.trim()) {
            appendMessage('user', liveInputBufferRef.current.trim());
            liveInputBufferRef.current = '';
          }
          liveOutputBufferRef.current += msg.text;
        } else if (msg.type === 'turnComplete') {
          flushLiveTranscripts();
          if (voiceActiveRef.current) {
            setStatusKey('listening');
          }
        } else if (msg.type === 'status' && msg.statusKey) {
          setStatusKey(msg.statusKey);
        } else if (msg.type === 'toolEvent' && msg.ok && msg.summary) {
          if (/^(CITA|LEAD|ESC|ENV)-/.test(msg.summary)) {
            appendMessage('model', `${copy.recordCompletedPrefix} ${msg.summary}`);
          }
        } else if (msg.type === 'error') {
          setErrorMsg(msg.error || copy.errors.liveError);
          stopVoiceSession();
        }
      } catch {
        // ignore malformed frame
      }
    };

    ws.onerror = () => {
      setErrorMsg(copy.errors.liveConnectError);
      stopVoiceSession();
    };

    ws.onclose = () => {
      if (voiceActiveRef.current) {
        stopVoiceSession();
      }
    };
  }

  function handleCloseWidget() {
    if (voiceActiveRef.current) {
      stopVoiceSession();
    }
    onClose();
  }

  const currentStatusLabel = copy.statuses[statusKey];
  const isAgentBusy = statusKey !== 'online';

  return (
    <AnimatePresence mode="wait">
      {!isOpen || isMinimized ? (
        <motion.button
          key="sofia-launcher"
          type="button"
          onClick={onOpen}
          aria-label={copy.launcherOpenAria}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-3 right-3 z-40 inline-flex items-center justify-center rounded-full p-1.5 overflow-visible cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
        >
          {/* Stationary pulsing halo inside the button bounds */}
          <motion.span
            aria-hidden="true"
            animate={{ scale: [0.95, 1.24, 0.95], opacity: [0.48, 0, 0.48] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-1.5 rounded-full bg-[var(--brand)]"
          />

          {/* Floating visible Sofía pill that bobs gently without shifting hit target */}
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative inline-flex h-13 w-13 sm:w-auto items-center justify-center sm:gap-2.5 rounded-full bg-[var(--brand)] sm:px-5 text-sm font-semibold text-white shadow-xl hover:bg-[var(--brand-hover)] active:scale-95 transition-colors"
          >
            <motion.span
              aria-hidden="true"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative inline-flex items-center justify-center shrink-0"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-300 ring-2 ring-[var(--brand)]" />
            </motion.span>
            <span className="hidden sm:inline whitespace-nowrap">
              {isMinimized ? copy.launcherResume : copy.launcherLabel}
            </span>
          </motion.span>
        </motion.button>
      ) : (
        <motion.div
          key="sofia-dialog"
          role="dialog"
          aria-label={copy.dialogAria}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-3 sm:inset-auto sm:bottom-5 sm:right-5 z-50 flex flex-col overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-2xl sm:h-[580px] sm:w-[420px] sm:max-h-[calc(100vh-3rem)]"
        >
          {/* Header tipo WhatsApp con estado en tiempo real */}
          <div className="flex items-center justify-between gap-2 bg-[var(--brand)] px-3.5 py-3 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 font-display text-base font-semibold text-white"
                aria-hidden="true"
              >
                S
              </div>
              <div className="min-w-0">
                <p className="text-[13px] sm:text-sm font-semibold leading-tight">
                  {copy.headerTitle}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/90" aria-live="polite">
                  {isAgentBusy && (
                    <motion.span
                      aria-hidden="true"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-block h-1.5 w-1.5 rounded-full bg-white shrink-0"
                    />
                  )}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={statusKey}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.14 }}
                      data-testid="chat-agent-status"
                    >
                      {currentStatusLabel}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => void startVoiceSession()}
                aria-label={isVoiceActive ? copy.callStopAria : copy.callStartAria}
                title={isVoiceActive ? copy.callStopAria : copy.callStartAria}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isVoiceActive
                    ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                {isVoiceActive ? (
                  <PhoneOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Phone className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={onMinimize}
                aria-label={copy.minimizeAria}
                title={copy.minimizeAria}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleCloseWidget}
                aria-label={copy.closeAria}
                title={copy.closeAria}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Aviso visible de IA y privacidad */}
          <div className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-[11px] leading-snug text-[var(--text-secondary)]">
            {copy.privacyBanner}
          </div>

          {/* Barra de llamada de voz activa */}
          {isVoiceActive && (
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] bg-[var(--brand-soft)] px-4 py-2.5 text-xs text-[var(--text-primary)]">
              <div className="flex items-center gap-2 min-w-0">
                <motion.span
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]"
                  aria-hidden="true"
                />
                <span className="truncate font-medium">
                  {isMuted ? copy.liveMutedText : copy.liveActiveText}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                >
                  {isMuted ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{copy.unmuteLabel}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{copy.muteLabel}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={stopVoiceSession}
                  className="rounded-md bg-[var(--accent)] px-2.5 py-1 font-semibold text-white hover:bg-[var(--accent-hover)] cursor-pointer"
                >
                  {copy.hangupLabel}
                </button>
              </div>
            </div>
          )}

          {/* Área de mensajes */}
          <div
            className="flex-1 overflow-y-auto bg-[var(--chat-bg)] px-4 py-4 space-y-3"
            aria-live="polite"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'rounded-br-sm bg-[var(--chat-user)] text-[var(--text-primary)]'
                        : 'rounded-bl-sm border border-[var(--border-hairline)] bg-[var(--chat-agent)] text-[var(--text-primary)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    {msg.toolNote && (
                      <p className="mt-1.5 border-t border-[var(--border-hairline)] pt-1 font-mono-data text-[11px] font-medium text-[var(--brand)]">
                        {copy.refPrefix} {msg.toolNote}
                      </p>
                    )}
                    <p className="mt-1 text-right text-[10px] tabular-nums text-[var(--text-muted)]">
                      {msg.time}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* Sugerencias rápidas iniciales */}
            {messages.length === 1 && !isSending && (
              <div className="pt-1 space-y-1.5">
                <p className="text-[11px] font-medium text-[var(--text-muted)]">
                  {copy.quickPromptsTitle}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {copy.quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendTextMessage(prompt)}
                      className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="rounded-lg border border-[var(--accent)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--accent)]"
              >
                {errorMsg}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Compositor de texto y micrófono */}
          <form
            onSubmit={handleFormSubmit}
            className="flex items-center gap-2 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2.5"
          >
            <button
              type="button"
              onClick={() => void startVoiceSession()}
              aria-label={isVoiceActive ? copy.micStopAria : copy.micStartAria}
              title={isVoiceActive ? copy.micStopAria : copy.micStartAria}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer ${
                isVoiceActive
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={copy.inputPlaceholder}
              aria-label={copy.inputAria}
              disabled={isSending}
              className="h-10 min-w-0 flex-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label={copy.sendAria}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] disabled:opacity-45 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
