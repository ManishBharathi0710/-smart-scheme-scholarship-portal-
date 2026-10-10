import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers[REQUEST_ID_HEADER];
  const requestId = typeof existingId === 'string' && existingId.trim() ? existingId : uuidv4();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}
