import { Detector, MatchSpan } from '../types';

export class SsnDetector implements Detector {
  readonly type = 'SSN' as const;
  readonly priority = 1; // High priority so 9-digit SSNs aren't swallowed by phone rules

  private readonly regex = /(?<!\d)(\d{3})-(\d{2})-(\d{4})(?!\d)/g;

  detect(text: string): MatchSpan[] {
    const matches: MatchSpan[] = [];
    this.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.regex.exec(text)) !== null) {
      const [full, area, group, serial] = match;
      if (!this.isValidSsn(area, group, serial)) continue;

      matches.push({
        start: match.index,
        end: match.index + full.length,
        type: this.type,
        value: full,
        priority: this.priority,
      });
    }
    return matches;
  }

  // SSA rules: Area cannot be 000, 666, or 900-999; Group cannot be 00; Serial cannot be 0000
  private isValidSsn(area: string, group: string, serial: string): boolean {
    const areaNum = Number(area);
    if (areaNum === 0 || areaNum === 666 || areaNum >= 900) return false;
    if (Number(group) === 0 || Number(serial) === 0) return false;
    return true;
  }
}