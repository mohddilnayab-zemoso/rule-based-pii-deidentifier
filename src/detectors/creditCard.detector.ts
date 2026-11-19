import { Detector, MatchSpan } from '../types';

export class CreditCardDetector implements Detector {
  readonly type = 'CREDIT_CARD' as const;
  readonly priority = 1;

  // Matches 13 to 19 digits separated by optional spaces or hyphens
  private readonly regex = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;

  detect(text: string): MatchSpan[] {
    const matches: MatchSpan[] = [];
    this.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.regex.exec(text)) !== null) {
      const raw = match[0];
      const digitsOnly = raw.replace(/[ -]/g, '');

      if (digitsOnly.length < 13 || digitsOnly.length > 19) continue;
      if (!this.passesLuhnCheck(digitsOnly)) continue;

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

  // Luhn Algorithm to eliminate ordinary 13-19 digit IDs/timestamps
  private passesLuhnCheck(digits: string): boolean {
    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits.charCodeAt(i) - 48;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }
}