import { Detector, MatchSpan } from '../types';

export class PhoneDetector implements Detector {
  readonly type = 'PHONE' as const;
  readonly priority = 3; // Lower priority than SSN, IP Address & Credit Card

  // Supports +1-415-555-0134, (415) 555-0134, 415.555.0134, +91 98765 43210
  private readonly regex =
    /(?<!\d|\d[-.])(?:\+\d{1,3}[-.\s]?)?(?:\(\d{2,4}\)|\d{2,4})[-.\s]\d{3,5}[-.\s]?\d{4}(?![\d]|[-.]\d)/g;

  detect(text: string): MatchSpan[] {
    const matches: MatchSpan[] = [];
    this.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.regex.exec(text)) !== null) {
      const raw = match[0];
      const digitsOnly = raw.replace(/\D/g, '');

      // ITU-T E.164 standard: international phone numbers have 7 to 15 digits
      if (digitsOnly.length < 7 || digitsOnly.length > 15) continue;

      // Guard against ISO dates like 2026-11-17
      if (/^\d{4}[-./]\d{2}[-./]\d{2}$/.test(raw)) continue;

      matches.push({
        start: match.index,
        end: match.index + raw.length,
        type: this.type,
        value: raw,
        priority: this.priority,
      });
    }
    return matches;
  }
}
