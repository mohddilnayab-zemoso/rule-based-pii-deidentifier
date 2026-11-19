import { CoreEntityType } from '../types';

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  bodyLimit: process.env.BODY_LIMIT || '1mb',
  maxBatchSize: 100,
  defaultEntities: [
    'EMAIL',
    'PHONE',
    'SSN',
    'DATE_OF_BIRTH',
    'CREDIT_CARD',
    'IP_ADDRESS',
  ] as CoreEntityType[],
};