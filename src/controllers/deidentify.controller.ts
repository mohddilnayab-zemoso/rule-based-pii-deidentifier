import { NextFunction, Request, Response } from 'express';
import { DetectorRegistry } from '../detectors';
import { DeidentificationService } from '../engine/deidentifier';
import { BadRequestError } from '../middlewares/error.middleware';

export class DeidentifyController {
  constructor(
    private readonly service: DeidentificationService,
    private readonly registry: DetectorRegistry
  ) {}

  public healthCheck = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'ok',
      supportedEntities: this.registry.getSupportedTypes(),
    });
  };

  public deidentifyText = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { text, entities } = req.body;
      const result = this.service.deidentify(text, entities);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Unsupported entity type')) {
        next(new BadRequestError(error.message));
        return;
      }
      next(error);
    }
  };

  public deidentifyBatch = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { records, entities } = req.body as { records: string[]; entities?: string[] };
      const results = records.map((text) => this.service.deidentify(text, entities));
      res.status(200).json({
        count: results.length,
        results,
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Unsupported entity type')) {
        next(new BadRequestError(error.message));
        return;
      }
      next(error);
    }
  };
}