import request from 'supertest';
import { createApp } from '../src/app';
import { DetectorRegistry } from '../src/detectors';
import { DeidentificationService } from '../src/engine/deidentifier';

describe('DeidentificationService', () => {
  const service = new DeidentificationService();

  test('matches prompt specification example accurately', () => {
    const input =
      'Patient John Doe can be contacted at john.doe@example.com or +1-415-555-0134. DOB: 1990-05-12.';
    const result = service.deidentify(input);

    expect(result.deidentifiedText).toBe(
      'Patient John Doe can be contacted at [EMAIL] or [PHONE]. DOB: [DATE_OF_BIRTH].'
    );
    expect(result.entitiesDetected).toEqual({
      EMAIL: 1,
      PHONE: 1,
      DATE_OF_BIRTH: 1,
    });
  });

  test('handles empty string gracefully', () => {
    expect(service.deidentify('')).toEqual({
      deidentifiedText: '',
      entitiesDetected: {},
    });
  });

  test('detects valid SSNs and rejects invalid area/serial numbers', () => {
    const input = 'Valid: 123-45-6789. Invalid area: 000-12-3456, 666-12-3456, 912-34-5678.';
    const result = service.deidentify(input, ['SSN']);

    expect(result.deidentifiedText).toBe(
      'Valid: [SSN]. Invalid area: 000-12-3456, 666-12-3456, 912-34-5678.'
    );
    expect(result.entitiesDetected).toEqual({ SSN: 1 });
  });

  test('validates Credit Cards with Luhn check to avoid false positives', () => {
    const input = 'Card: 4532-0151-1283-0366, Order ID: 4532-0151-1283-0367';
    const result = service.deidentify(input, ['CREDIT_CARD']);

    expect(result.deidentifiedText).toBe('Card: [CREDIT_CARD], Order ID: 4532-0151-1283-0367');
    expect(result.entitiesDetected).toEqual({ CREDIT_CARD: 1 });
  });

  test('validates IPv4 octets (0-255) and ignores invalid version numbers', () => {
    const input = 'Server IP: 192.168.1.42, Invalid IP: 999.168.1.1, Leading zero: 10.0.01.5';
    const result = service.deidentify(input, ['IP_ADDRESS']);

    expect(result.deidentifiedText).toBe(
      'Server IP: [IP_ADDRESS], Invalid IP: 999.168.1.1, Leading zero: 10.0.01.5'
    );
    expect(result.entitiesDetected).toEqual({ IP_ADDRESS: 1 });
  });

  test('resolves overlapping matches deterministically (SSN takes precedence over Phone)', () => {
    const input = 'SSN: 123-45-6789 and Phone: (415) 555-0134';
    const result = service.deidentify(input, ['SSN', 'PHONE']);

    expect(result.deidentifiedText).toBe('SSN: [SSN] and Phone: [PHONE]');
    expect(result.entitiesDetected).toEqual({ SSN: 1, PHONE: 1 });
  });

  test('preserves non-DOB dates while redacting DOB contexts', () => {
    const input = 'Appointment: 2026-11-17. Date of Birth: 05/12/1990.';
    const result = service.deidentify(input, ['DATE_OF_BIRTH']);

    expect(result.deidentifiedText).toBe('Appointment: 2026-11-17. Date of Birth: [DATE_OF_BIRTH].');
  });

  test('preserves Unicode, emojis, newlines, and handles multiple occurrences', () => {
    const input = 'Line 1: a@b.com 🚀\nLine 2: c@d.org & a@b.com!';
    const result = service.deidentify(input, ['EMAIL']);

    expect(result.deidentifiedText).toBe('Line 1: [EMAIL] 🚀\nLine 2: [EMAIL] & [EMAIL]!');
    expect(result.entitiesDetected).toEqual({ EMAIL: 3 });
  });

  test('stretch goal: detects context-anchored NAME when requested', () => {
    const input = 'Patient Name: Jane Doe arrived at 10 AM.';
    const result = service.deidentify(input, ['NAME']);

    expect(result.deidentifiedText).toBe('Patient Name: [NAME] arrived at 10 AM.');
  });

  test('stretch goal: allows registering custom entity detectors without modifying engine', () => {
    const customRegistry = new DetectorRegistry();
    customRegistry.register({
      type: 'EMPLOYEE_ID',
      priority: 1,
      detect: (text) => {
        const matches = [];
        const regex = /\bEMP-\d{6}\b/g;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          matches.push({
            start: m.index,
            end: m.index + m[0].length,
            type: 'EMPLOYEE_ID',
            value: m[0],
            priority: 1,
          });
        }
        return matches;
      },
    });

    const customService = new DeidentificationService(customRegistry);
    const result = customService.deidentify('Assigned to EMP-104928.', ['EMPLOYEE_ID']);
    expect(result.deidentifiedText).toBe('Assigned to [EMPLOYEE_ID].');
  });
});

describe('REST API Endpoints', () => {
  const app = createApp();

  test('GET /health returns service status and supported entities', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.supportedEntities).toContain('EMAIL');
  });

  test('POST /deidentify returns 200 with filtered entities', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({
        text: 'Contact john.doe@example.com at +1-415-555-0134',
        entities: ['EMAIL'],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      deidentifiedText: 'Contact [EMAIL] at +1-415-555-0134',
      entitiesDetected: { EMAIL: 1 },
    });
  });

  test('POST /deidentify/batch processes multiple records', async () => {
    const res = await request(app)
      .post('/deidentify/batch')
      .send({
        records: ['Email: a@test.com', 'IP: 10.0.0.1'],
        entities: ['EMAIL', 'IP_ADDRESS'],
      });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.results[0].deidentifiedText).toBe('Email: [EMAIL]');
    expect(res.body.results[1].deidentifiedText).toBe('IP: [IP_ADDRESS]');
  });

  test('returns 400 when text is missing or not a string', async () => {
    const res = await request(app).post('/deidentify').send({ text: 12345 });
    expect(res.status).toBe(400);
  });

  test('returns 400 for malformed JSON body', async () => {
    const res = await request(app)
      .post('/deidentify')
      .set('Content-Type', 'application/json')
      .send('{"text": "broken json"');
    expect(res.status).toBe(400);
  });

  test('returns 400 for unsupported entity types', async () => {
    const res = await request(app)
      .post('/deidentify')
      .send({ text: 'Hello', entities: ['PASSPORT_NUMBER'] });
    expect(res.status).toBe(400);
  });
});
