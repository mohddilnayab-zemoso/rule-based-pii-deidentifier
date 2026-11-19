import { CoreEntityType, Detector, EntityType } from '../types';
import { CreditCardDetector } from './creditCard.detector';
import { DobDetector } from './dob.detector';
import { EmailDetector } from './email.detector';
import { IpAddressDetector } from './ipAddress.detector';
import { NameDetector } from './name.detector';
import { PhoneDetector } from './phone.detector';
import { SsnDetector } from './ssn.detector';

export const DEFAULT_ENTITIES: CoreEntityType[] = [
  'EMAIL',
  'PHONE',
  'SSN',
  'DATE_OF_BIRTH',
  'CREDIT_CARD',
  'IP_ADDRESS',
];

export class DetectorRegistry {
  private detectors = new Map<EntityType, Detector>();

  constructor() {
    this.register(new EmailDetector());
    this.register(new PhoneDetector());
    this.register(new SsnDetector());
    this.register(new DobDetector());
    this.register(new CreditCardDetector());
    this.register(new IpAddressDetector());
    this.register(new NameDetector());
  }

  // Allows adding custom detectors at runtime without touching replacement logic
  register(detector: Detector): void {
    this.detectors.set(detector.type, detector);
  }

  get(type: EntityType): Detector | undefined {
    return this.detectors.get(type);
  }

  getSupportedTypes(): EntityType[] {
    return Array.from(this.detectors.keys());
  }
}