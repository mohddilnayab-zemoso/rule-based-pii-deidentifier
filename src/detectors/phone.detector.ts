import { Detector, MatchSpan } from '../types';

export class PhoneDetector implements Detector {
  readonly type = 'PHONE' as const;
  readonly priority = 3; // Lower priority than SSN, IP Address & Credit Card

  // Branch 1: Formatted international/US/Indian numbers (+1-415-555-0134, (415) 555-0134, +91 98765 43210)
  // Branch 2: Indian mobile numbers with optional +91/0 prefix (8736222741, +918736222741, 08736222741)
  private readonly regex =
    /(?<!\d)(?<!\d[-.])(?:(?:\+\d{1,3}[-.\s]?)?(?:\(\d{2,5}\)|\d{2,5})(?:[-.\s]\d{2,5}){1,3}|(?:\+91[-.\s]?|0)?[6-9]\d{9})(?!\d)(?![-.]\d)/g;

  detect(text: string): MatchSpan[] {
    const matches: MatchSpan[] = [];
    this.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.regex.exec(text)) !== null) {
      const raw = match[0];
      const digitsOnly = raw.replace(/\D/g, '');

      // ITU-T E.164 standard: international phone numbers have 7 to 15 digits
      if (digitsOnly.length < 7 || digitsOnly.length > 15) continue;

      // Guard against dates (YYYY-MM-DD, DD-MM-YYYY) and US SSNs (XXX-XX-XXXX)
      if (/^(?:\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}[-./]\d{1,2}[-./]\d{2,4})$/.test(raw)) continue;
      if (/^\d{3}-\d{2}-\d{4}$/.test(raw)) continue;

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