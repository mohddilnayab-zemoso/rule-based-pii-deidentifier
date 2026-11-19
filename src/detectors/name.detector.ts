import { Detector, MatchSpan } from '../types';

export class NameDetector implements Detector {
  readonly type = 'NAME' as const;
  readonly priority = 2;

  // Context-anchored capitalized name detection (e.g., "Patient Name: Jane Doe")
  private readonly regex =
    /\b(?:Patient\s+Name|Customer\s+Name|Full\s+Name|Name)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;

  detect(text: string): MatchSpan[] {
    const matches: MatchSpan[] = [];
    this.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const nameValue = match[1];
      if (!nameValue) continue;

      const relativeOffset = fullMatch.lastIndexOf(nameValue);
      const start = match.index + relativeOffset;

      matches.push({
        start,
        end: start + nameValue.length,
        type: this.type,
        value: nameValue,
        priority: this.priority,
      });
    }
    return matches;
  }
}