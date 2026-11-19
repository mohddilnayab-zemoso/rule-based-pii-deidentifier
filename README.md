# Rule-Based Text De-identification Service

A lightweight, deterministic Node.js and TypeScript service that detects and redacts Personally Identifiable Information (PII) from free-form text using regular expressions and algorithmic validation—without relying on external PII APIs or third-party ML libraries.

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run in development mode:**
   ```bash
   npm run dev
   ```
3. **Run automated test suite with coverage:**
   ```bash
   npm test
   ```
4. **Build and run production bundle:**
   ```bash
   npm run build
   npm start
   ```
5. **Interactive API Documentation (Swagger UI):**
   Once the server is running, open `http://localhost:3000/api-docs` in your browser.

---

## API Usage

### 1. Single Text De-identification (`POST /deidentify`)
If `entities` is omitted or empty, the service defaults to all six core entities: `["EMAIL", "PHONE", "SSN", "DATE_OF_BIRTH", "CREDIT_CARD", "IP_ADDRESS"]`. Optional stretch entity: `"NAME"`.

**Request:**
```bash
curl -X POST http://localhost:3000/deidentify \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Patient John Doe can be contacted at john.doe@example.com or +1-415-555-0134. DOB: 1990-05-12.",
    "entities": ["EMAIL", "PHONE", "DATE_OF_BIRTH"]
  }'
```

**Response:**
```json
{
  "deidentifiedText": "Patient John Doe can be contacted at [EMAIL] or [PHONE]. DOB: [DATE_OF_BIRTH].",
  "entitiesDetected": {
    "EMAIL": 1,
    "PHONE": 1,
    "DATE_OF_BIRTH": 1
  }
}
```

### 2. Batch De-identification (`POST /deidentify/batch`)
Processes up to 100 text records in a single request:
```json
{
  "records": [
    "Contact alice@example.com",
    "Server IP: 192.168.1.10"
  ],
  "entities": ["EMAIL", "IP_ADDRESS"]
}
```

### 3. Programmatic Module Usage
The core engine is decoupled from Express and can be imported directly:
```typescript
import { DeidentificationService } from './src/engine/deidentifier';

const service = new DeidentificationService();
const result = service.deidentify('Reach me at user@domain.com');
```

---

## Supported Entities & Known Limitations

| Entity | Detection & Validation Logic | Known Limitations |
| :--- | :--- | :--- |
| **`EMAIL`** | RFC-style local/domain pattern + max length (`254`) and consecutive dot (`..`) checks | Does not validate live DNS/MX records or non-ASCII internationalized domain names (IDNs). |
| **`PHONE`** | International & North American formats (`+1-415-555-0134`, `(415) 555-0134`, `+91 98765 43210`) + ITU-T E.164 digit length check (`7–15` digits) | Unformatted digit strings without separators (e.g., `4155550134`) are intentionally ignored to prevent corrupting order IDs or timestamps. |
| **`SSN`** | `XXX-XX-XXXX` format + SSA exclusion rules (rejects `000`, `666`, `900–999` area numbers, `00` group, `0000` serial) | Unhyphenated 9-digit strings (`123456789`) are ignored to minimize false positives on account/tracking numbers. |
| **`DATE_OF_BIRTH`** | Context-anchored regex (`DOB:`, `Date of Birth:`, `Born:`) supporting ISO, slash, and month-name formats | Dates without explicit birth-context labels are left untouched so operational dates (e.g., appointment dates) are preserved. |
| **`CREDIT_CARD`** | 13–19 digit grouping + **Luhn checksum** validation | Any non-card numeric identifier that happens to satisfy the Luhn checksum (~10% of random digit sequences) may trigger a false positive. |
| **`IP_ADDRESS`** | Dotted-quad format + `0–255` octet range & no-leading-zero validation | Software version strings like `2.4.18.1` resemble valid IPv4 addresses and will be redacted. IPv6 is not currently supported. |
| **`NAME`** *(Stretch)* | Context-anchored capitalized tokens following labels like `Patient Name:` or `Full Name:` | Free-form names without explicit labels, mononyms, or lowercase names cannot be reliably distinguished from common nouns using regex alone. |

---

## Architecture, Trade-Offs & Potential Improvements

### Design Decisions
* **Two-Phase Span Architecture (Detection vs. Replacement):** Rather than chaining `.replace()` calls—which shifts character indices and causes cascading false replacements—all detectors scan the original immutable text independently and emit `{ start, end, type, priority }` spans. Overlapping matches are resolved deterministically (longest match wins, then highest detector priority), and the output string is reconstructed in a single $O(N)$ pass.
* **Precision Over Blind Recall:** Algorithmic post-filters (Luhn check, IPv4 octet bounds, SSN invalid area codes, and DOB context anchors) prevent silent corruption of legitimate business numbers and dates.
* **Extensible Registry Pattern:** Each rule implements the `Detector` interface and registers in `DetectorRegistry`, allowing new entity detectors to be plugged in without modifying the core replacement engine.

### Trade-Offs
* **Deterministic Speed vs. Contextual Recall:** Rule-based processing executes in sub-millisecond time with zero external data exposure, at the cost of lower recall on unstructured entities (such as unlabelled person names or street addresses) compared to transformer-based NER models.

### Potential Improvements
* **Deterministic Pseudonymization:** Replacing repeated occurrences with indexed tokens (e.g., `[EMAIL_1]`, `[EMAIL_2]`) so downstream LLMs preserve entity co-reference across multi-turn conversations.
* **Compliance Audit Persistence:** Adding an optional relational database audit log storing non-PII metadata (request IDs, entity counts, processing latency) while keeping raw text strictly transient.
* **Hybrid NER Fallback:** Combining fast regex rules for structured PII with a local, self-hosted NER model for unstructured names and locations.