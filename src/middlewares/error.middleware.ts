import { NextFunction, Request, Response } from 'express';

export class BadRequestError extends Error {
  public readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Handle invalid JSON syntax thrown by express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Malformed JSON',
      message: 'Request body contains invalid JSON.',
    });
    return;
  }

  if (err instanceof BadRequestError) {
    res.status(400).json({
      error: 'Bad Request',
      message: err.message,
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred while processing the request.',
  });
}