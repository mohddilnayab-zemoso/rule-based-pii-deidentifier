export type CoreEntityType =
  | 'EMAIL'
  | 'PHONE'
  | 'SSN'
  | 'DATE_OF_BIRTH'
  | 'CREDIT_CARD'
  | 'IP_ADDRESS';

export type OptionalEntityType = 'NAME';

export type EntityType = CoreEntityType | OptionalEntityType | (string & {});

export interface MatchSpan {
  start: number;
  end: number;
  type: EntityType;
  value: string;
  priority: number; // Lower number = higher precedence on identical start/length
}

export interface Detector {
  readonly type: EntityType;
  readonly priority: number;
  detect(text: string): MatchSpan[];
}

export interface DeidentifyRequest {
  text: string;
  entities?: EntityType[];
}

export interface DeidentifyResponse {
  deidentifiedText: string;
  entitiesDetected: Partial<Record<EntityType, number>>;
}