import { Detector, MatchSpan } from '../types';

export class EmailDetector implements Detector {
  readonly type = 'EMAIL' as const;
  readonly priority = 1;

  // Matches standard RFC-compliant email patterns while avoiding trailing punctuation
  private readonly regex = /\b[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

  detect(text: string): MatchSpan[] {
    const matches: MatchSpan[] = [];
    this.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.regex.exec(text)) !== null) {
      const value = match[0];
      // Prevent consecutive dots in domain or local part
      if (value.includes('..') || value.length > 254) continue;

      matches.push({
        start: match.index,
        end: match.index + value.length,
        type: this.type,
        value,
        priority: this.priority,
      });
    }
    return matches;
  }
}