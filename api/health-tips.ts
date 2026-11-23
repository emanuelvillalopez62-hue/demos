import type { ServerResponse } from 'http';
import { processHealthTipsRequest } from '../src/lib/apiService';
import { readJsonBody, sendJson, VercelRequestLike } from '../src/lib/vercelHttp';

export default async function handler(req: VercelRequestLike, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  const body = await readJsonBody(req);
  const result = await processHealthTipsRequest(body);
  sendJson(res, result.httpStatus, result.body);
}
