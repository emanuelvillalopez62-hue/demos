import type { ServerResponse } from 'http';
import { getHealthPayload } from '../src/lib/apiService';
import { sendJson, VercelRequestLike } from '../src/lib/vercelHttp';

export default function handler(req: VercelRequestLike, res: ServerResponse) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  sendJson(res, 200, getHealthPayload());
}
