import type { ServerResponse } from 'http';
import { processContactSubmission } from '../src/lib/apiService';
import { readJsonBody, sendJson, VercelRequestLike } from '../src/lib/vercelHttp';

export default async function handler(req: VercelRequestLike, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  const body = await readJsonBody(req);
  const result = await processContactSubmission(body);
  sendJson(res, result.httpStatus, result.body);
}
