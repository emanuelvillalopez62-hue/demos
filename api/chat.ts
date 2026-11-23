import type { ServerResponse } from 'http';
import { processChatRequest } from '../src/lib/apiService';
import { readJsonBody, sendJson, VercelRequestLike } from '../src/lib/vercelHttp';

export const maxDuration = 30;

export default async function handler(req: VercelRequestLike, res: ServerResponse) {
  let wantsStream = false;
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const rawBody = await readJsonBody(req);
    const bodyObj = (rawBody ?? {}) as Record<string, unknown>;
    const acceptHeader = String(req.headers['accept'] ?? '');
    wantsStream = acceptHeader.includes('text/event-stream') || bodyObj.stream === true;

    if (wantsStream) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      (res as ServerResponse & { flushHeaders?: () => void }).flushHeaders?.();
    }

    const sendEvent = (event: string, data: unknown) => {
      if (wantsStream && !res.writableEnded) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    const result = await processChatRequest({
      rawBody,
      emitStatus: (statusKey) => sendEvent('status', { statusKey }),
    });

    if (result.ok) {
      if (wantsStream) {
        sendEvent('done', { reply: result.reply, toolEvents: result.toolEvents });
        res.end();
      } else {
        sendJson(res, 200, { reply: result.reply, toolEvents: result.toolEvents });
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
      sendJson(res, result.httpStatus, {
        error: result.error,
        detail: result.detail,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (wantsStream && !res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: message, status: 500 })}\n\n`);
      res.end();
    } else {
      sendJson(res, 500, { error: message });
    }
  }
}
