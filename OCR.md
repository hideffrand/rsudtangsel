# OCR End-to-End: Extension → Server → Microservice → Autofill

How a photo of a paper form becomes filled inputs in the admin web UI, and how
the extraction rules are managed without rebuilding anything.

```
                        ┌──────────────────────────────────────────────────┐
                        │              CONFIG PLANE (read path)            │
                        │                                                  │
 ┌──────────────┐       │   ┌─────────────┐   SELECT fields   ┌─────────┐  │
 │  Web Admin   │       │   │  Go server  │ ───────────────▶ │Postgres │  │
 │ /admin/jenis-│──────▶│   │ handler/    │                  │ocr_     │  │
 │ dokumen-ocr  │ CRUD  │   │ ocr.go      │ ◀─────────────── │document_│  │
 └──────────────┘       │   └─────────────┘   row.fields     │types    │  │
        │               │          │                         └─────────┘  │
        ▼               │          │ 3. multipart forward:                │
 ┌──────────────┐       │          │    file + doc_type                   │
 │   Postgres   │       │          │    + field_config (JSON rules)       │
 └──────────────┘       │          ▼                                      │
                        │   ┌─────────────────┐                           │
                        │   │ ocr-service     │ CnOCR → raw text          │
                        │   │ doc_parser.py   │ ── apply field_config ──┐ │
                        │   └─────────────────┘                         │ │
                        └──────────────────────────────────────────────┼─┘
                                                                       │
                       DATA PLANE (per request)                        │
 ┌──────────────┐                                                      │
 │  Browser     │ 1. upload image + doc_type                           │
 │  extension   │ ─────────────────────────────────────────────────────┼──▶ Go
 │ (side panel) │    POST /api/admin/ocr/extract (Bearer)              │    server
 └──────┬───────┘                                                      │
        ▲                                                             │
        │ 4. JSON: extracted_fields [{key,value,confidence,...}] ◀────┘
        │
        │ 5. chrome.scripting.executeScript → inject filler into ACTIVE TAB
        ▼
 ┌──────────────────────────────────────────────┐
 │ web/app/admin/pasien  (or any page)          │
 │ <input data-copilot="namalengkap">           │
 │  ← matched by key normalization (see below)  │
 └──────────────────────────────────────────────┘
```

## Components

| Piece | Where | Role |
|---|---|---|
| Doc-type manager | `web/app/admin/jenis-dokumen-ocr/page.tsx` | CRUD for `ocr_document_types`: slug, label, and the **field/regex editor** (structured rows) |
| Master data | `server/migrations` → `ocr_document_types` | TEXT columns only: `id` (= `doc_type`), `name`, `fields` = JSON rule config |
| Seed | `server/cmd/seed/main.go` | Upserts `registrasi-pasien` + `inventory` with full JSON configs |
| Proxy + config push | `server/internal/handler/ocr.go`, `internal/service/ocr_service.go` | On every extract: look up the doc-type row, forward `file + doc_type + field_config` to Python |
| OCR engine | `ocr-service/main.py`, `ocr_engine.py` | CnOCR image → raw text |
| Parser | `ocr-service/doc_parser.py` | `parse_field_config()` applies the pushed rules; built-in parsers (`ktp`, `bpjs`, …) are fallback |
| Autofiller | `browser-extension/src/lib/autofill.ts` | Injected via `chrome.scripting.executeScript`; matches keys against the live DOM |
| Target form | `web/app/admin/pasien/page.tsx` | Demo patient form; every input tagged `data-copilot="<key>"` |

## Field rule config (`ocr_document_types.fields`)

```json
[
  {
    "key": "Nama Lengkap",
    "required": true,
    "patterns": [
      "Nama(?:\\s+(?:Pasien|Lengkap))?(?:[ \\t]*[:\\-][ \\t]*|[ \\t]+)([A-Za-z][^\\n\\r:]+)"
    ]
  },
  {
    "key": "No. Telepon",
    "required": false,
    "transform": "digits",
    "patterns": [
      "(?:No\\.?\\s*)?(?:Telepon|Telp(?:on)?|HP|WA)(?:[ \\t]*[:\\-][ \\t]*|[ \\t]+)(\\+62[\\d\\s\\-]{8,14}|08[\\d\\s\\-]{8,12})",
      "\\b(08\\d{8,12}|\\+628\\d{7,13})\\b"
    ]
  }
]
```

Rules:

- `key` — **exactly the visible label** of the target form field. This is the
  pairing contract; it is *not* bundled anywhere at build time.
- `patterns` — ordered regex list, **first match wins**, case-insensitive.
  Match group(1) is taken as the value (group(0) if no groups). Values are
  searched over the whole OCR text, so position on the paper doesn't matter;
  a later pattern acts as fallback when an earlier one misses.
- `transform: "digits"` (optional) — strips non-digits from the captured value.
- Guards (Python side): ≤20 fields × ≤10 patterns × ≤500 chars each. Invalid
  JSON or a bad regex never fails the request — it logs and falls back to the
  built-in parsers.

## Request flow (data plane)

```
extension            Go server                    Python ocr-service
   │  POST multipart     │                              │
   │  file, doc_type     │                              │
   ├────────────────────▶│ FindByID(doc_type)           │
   │                     │  → row.fields (JSON)         │
   │                     │  multipart forward           │
   │                     │  file,doc_type,field_config  │
   │                     ├─────────────────────────────▶│ CnOCR → raw_text
   │                     │                              │ parse_field_config(raw_text, field_config)
   │                     │   {extracted_fields:[...]}   │   (fallback: built-in parsers)
   │◀────────────────────┴──────────────────────────────┤
   │
   │ tabs.query({active}) → executeScript(fillFieldsInPage)
   │
   │ per field: norm("No. Telepon") == "notelepon"
   │   1. input[data-copilot="notelepon"]         ← explicit hook
   │   2. any <label> whose text normalizes equal → its control   ← fallback
   │
   │ native prototype setter + dispatch input/change events
   │   (React controlled components update correctly)
   ▼
 form filled; debug table shows key/value/target/status per field
```

## Why admin edits need no rebuild

The extension holds **zero key knowledge**. Keys travel only inside the runtime
OCR response and are matched live against whatever page is open. Changing a
regex or key in `/admin/jenis-dokumen-ocr` affects the next extract immediately:
Go reads fresh rows from Postgres on every request; Python re-parses per request.

The only thing to keep in sync manually: a rule's `key` must equal the target
form's visible label (normalized compare ignores case/punctuation), or the form
needs a matching `data-copilot` attribute. A mismatch shows up in the
extension's debug table as "tidak ada di halaman".

## Running the whole loop

```bash
docker compose -f docker-compose.yaml up -d db          # postgres :5432
cd server   && go run ./cmd/api                          # API :8080 (.env SERVER_PORT)
cd ../ocr-service && uvicorn main:app --port 8000 --reload   # needs requirements.txt
cd ../web     && npm run dev                             # :3000
cd ../browser-extension && npm run build                 # load out/ unpacked
```

Smoke test: log into `/admin/login` → open `/admin/pasien` → open the side
panel → login → pick "Registrasi Pasien" → photo/upload a printed form →
"Proses OCR". Fields fill automatically; expand
"Debug: pasangan key → form (autofill)" to see each key → value → match status.
