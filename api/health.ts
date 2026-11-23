import type { ServerResponse } from 'http';
import { getHealthPayload } from '../src/lib/apiService';
import { sendJson, VercelRequestLike } from '../src/lib/vercelHttp';

export default function handler(req: VercelRequestLike, res: ServerResponse) {
  try {
    if (req.method !== 'GET') {
      sendJson(res, 405, { ok: false, error: 'Method not allowed' });
      return;
    }
    sendJson(res, 200, getHealthPayload(false));
  } catch (err: unknown) {
    sendJson(res, 500, {
      ok: false,
      error: err instanceof Error ? err.message : 'Health check failed',
    });
  }
}
