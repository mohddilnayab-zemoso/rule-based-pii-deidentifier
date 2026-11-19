import { Detector, MatchSpan } from '../types';

export class IpAddressDetector implements Detector {
  readonly type = 'IP_ADDRESS' as const;
  readonly priority = 2;

  private readonly regex = /(?<![\d.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\d.])/g;

  detect(text: string): MatchSpan[] {
    const matches: MatchSpan[] = [];
    this.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = this.regex.exec(text)) !== null) {
      const [full, o1, o2, o3, o4] = match;
      const octets = [o1, o2, o3, o4];

      // Validate 0-255 range and disallow leading zeros (e.g., 192.168.01.1)
      const isValid = octets.every((octet) => {
        if (octet.length > 1 && octet.startsWith('0')) return false;
        const num = Number(octet);
        return num >= 0 && num <= 255;
      });

      if (!isValid) continue;

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
}