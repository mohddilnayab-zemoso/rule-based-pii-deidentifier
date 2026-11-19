import { Router } from 'express';
import { DeidentifyController } from '../controllers/deidentify.controller';
import { DetectorRegistry } from '../detectors';
import { DeidentificationService } from '../engine/deidentifier';
import {
  validateBatchRequest,
  validateDeidentifyRequest,
} from '../middlewares/validate.middleware';

export function createDeidentifyRouter(): Router {
  const router = Router();
  const registry = new DetectorRegistry();
  const service = new DeidentificationService(registry);
  const controller = new DeidentifyController(service, registry);

  router.get('/health', controller.healthCheck);
  router.post('/deidentify', validateDeidentifyRequest, controller.deidentifyText);
  router.post('/deidentify/batch', validateBatchRequest, controller.deidentifyBatch);

  return router;
}