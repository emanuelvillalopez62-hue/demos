import type { ServerResponse } from 'http';
import { processContactSubmission } from '../src/lib/apiService';
import { readJsonBody, sendJson, VercelRequestLike } from '../src/lib/vercelHttp';

export const maxDuration = 30;

export default async function handler(req: VercelRequestLike, res: ServerResponse) {
  try {
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'Method not allowed' });
      return;
    }
    const body = await readJsonBody(req);
    const result = await processContactSubmission(body);
    sendJson(res, result.httpStatus, result.body);
  } catch (err: unknown) {
    sendJson(res, 500, {
      ok: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}
