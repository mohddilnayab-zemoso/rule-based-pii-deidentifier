import { DEFAULT_ENTITIES, DetectorRegistry } from '../detectors';
import { DeidentifyResponse, EntityType, MatchSpan } from '../types';

export class DeidentificationService {
  constructor(private readonly registry: DetectorRegistry = new DetectorRegistry()) {}

  public deidentify(text: string, requestedEntities?: EntityType[]): DeidentifyResponse {
    if (text.length === 0) {
      return { deidentifiedText: '', entitiesDetected: {} };
    }

    const activeTypes =
      requestedEntities && requestedEntities.length > 0 ? requestedEntities : DEFAULT_ENTITIES;

    // 1. Collect all candidate spans from active detectors
    const candidateSpans: MatchSpan[] = [];
    for (const entityType of new Set(activeTypes)) {
      const detector = this.registry.get(entityType);
      if (!detector) {
        throw new Error(`Unsupported entity type: ${entityType}`);
      }
      candidateSpans.push(...detector.detect(text));
    }

    // 2. Resolve overlapping spans deterministically
    const resolvedSpans = this.resolveOverlaps(candidateSpans);

    // 3. Reconstruct text in a single O(N) pass
    const entitiesDetected: Partial<Record<EntityType, number>> = {};
    let result = '';
    let cursor = 0;

    for (const span of resolvedSpans) {
      result += text.slice(cursor, span.start);
      result += `[${span.type}]`;
      cursor = span.end;

      entitiesDetected[span.type] = (entitiesDetected[span.type] || 0) + 1;
    }

    result += text.slice(cursor);

    return {
      deidentifiedText: result,
      entitiesDetected,
    };
  }

  private resolveOverlaps(spans: MatchSpan[]): MatchSpan[] {
    if (spans.length <= 1) return spans;

    // Sort by: 1) earliest start, 2) longest span, 3) highest priority (lowest number)
    const sorted = [...spans].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      const lenDiff = b.end - b.start - (a.end - a.start);
      if (lenDiff !== 0) return lenDiff;
      return a.priority - b.priority;
    });

    const accepted: MatchSpan[] = [];
    let lastEnd = -1;

    for (const span of sorted) {
      if (span.start >= lastEnd) {
        accepted.push(span);
        lastEnd = span.end;
      }
    }

    return accepted;
  }
}