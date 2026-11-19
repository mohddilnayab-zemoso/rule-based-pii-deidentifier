import { Detector, MatchSpan } from '../types';

export class DobDetector implements Detector {
  readonly type = 'DATE_OF_BIRTH' as const;
  readonly priority = 1;

  // Requires explicit DOB context so general dates (e.g., invoice/visit dates) are preserved
  private readonly regex =
    /\b(?:DOB|Date\s+of\s+Birth|Birth\s*Date|Born(?:\s+on)?)\s*[:\-]?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi;

  detect(text: string): MatchSpan[] {
    const matches: MatchSpan[] = [];
    this.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const dateValue = match[1];
      if (!dateValue) continue;

      // Calculate exact span of the date value only, leaving "DOB: " intact
      const relativeOffset = fullMatch.lastIndexOf(dateValue);
      const start = match.index + relativeOffset;

      matches.push({
        start,
        end: start + dateValue.length,
        type: this.type,
        value: dateValue,
        priority: this.priority,
      });
    }
    return matches;
  }
}