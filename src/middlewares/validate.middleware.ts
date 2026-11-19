import { NextFunction, Request, Response } from 'express';
import { config } from '../config';

export function validateDeidentifyRequest(req: Request, res: Response, next: NextFunction): void {
  const { text, entities } = req.body ?? {};

  if (typeof text !== 'string') {
    res.status(400).json({
      error: 'Validation Error',
      message: '"text" is required and must be a string.',
    });
    return;
  }

  if (entities !== undefined) {
    if (!Array.isArray(entities) || !entities.every((item) => typeof item === 'string')) {
      res.status(400).json({
        error: 'Validation Error',
        message: '"entities" must be an array of valid entity strings.',
      });
      return;
    }
  }

  next();
}

export function validateBatchRequest(req: Request, res: Response, next: NextFunction): void {
  const { records, entities } = req.body ?? {};

  if (!Array.isArray(records) || records.length === 0) {
    res.status(400).json({
      error: 'Validation Error',
      message: '"records" must be a non-empty array of strings.',
    });
    return;
  }

  if (records.length > config.maxBatchSize || !records.every((r) => typeof r === 'string')) {
    res.status(400).json({
      error: 'Validation Error',
      message: `"records" must contain at most ${config.maxBatchSize} string items.`,
    });
    return;
  }

  if (entities !== undefined) {
    if (!Array.isArray(entities) || !entities.every((item) => typeof item === 'string')) {
      res.status(400).json({
        error: 'Validation Error',
        message: '"entities" must be an array of valid entity strings.',
      });
      return;
    }
  }

  next();
}
