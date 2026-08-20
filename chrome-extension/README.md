# Product Requirement Document: webform-copilot

## 1. Executive Summary & Overview

**webform-copilot** is a Chrome Extension (Manifest V3) built with Next.js that automates data entry into web applications (e.g., Odoo CRM, Salesforce, patient portals). It allows authenticated users to capture or upload document images, select a target form profile, process the image via a custom external OCR API, and automatically populate active web page form fields.

---

## 2. Core Technical Architecture

```text
[ User Login ] ──► [ Auth Server ] ──► [ Store JWT Token in chrome.storage ]
                                                  │
[ Mode Selector ] ──► [ Select Local JSON Schema ] ─┤
                                                  │
[ Camera / Upload ] ──────────────────────────────┼──► [ Custom External OCR API ]
                                                  │             │
                                                  │      [ Extracted JSON ]
                                                  │             │
                                                  ▼             ▼
                                         [ Content Script Autofill Engine ]
                                                        │
                                                        ▼
                                             [ Target Web Page DOM ]

```

---

## 3. Feature Requirements

### FR-1: Authentication & Access Control

| Feature ID | Feature Name | Description |
| --- | --- | --- |
| **FR-1.1** | Login Screen | Authentication UI inside the side panel accepting user credentials. |
| **FR-1.2** | Token Management | Securely stores JWT/Auth tokens in `chrome.storage.session`. |
| **FR-1.3** | Session Guard | Blocks camera, upload, and autofill features until session is validated. |

### FR-2: Image Acquisition Engine

| Feature ID | Feature Name | Description |
| --- | --- | --- |
| **FR-2.1** | Live Camera Stream | Embedded HTML5 `<video>` preview allowing snapshot capture. |
| **FR-2.2** | File Drag & Drop | Dropzone accepting `.png`, `.jpg`, `.jpeg`, `.webp`, and `.pdf` files. |
| **FR-2.3** | Preview Pane | Visual confirmation interface prior to dispatching image payloads. |

### FR-3: Form Mode Selector & Mapping (MVP Approach)

| Feature ID | Feature Name | Description |
| --- | --- | --- |
| **FR-3.1** | Profile Mode Selector | Side panel dropdown enabling users to explicitly select target document types (e.g., *Inventory Receipt*, *Patient Registration*). |
| **FR-3.2** | Hardcoded Profile Schemas | Static local JSON configurations bundled inside the extension codebase (`/schemas/inventory.json`, `/schemas/patient.json`) defining expected target field selectors and keys. |
| **FR-3.3** | Dynamic Field Harvester | In addition to static profiles, content script scans visible form controls (`id`, `name`, `<label>`) to send page layout context to the OCR endpoint. |

### FR-4: External OCR API Integration

| Feature ID | Feature Name | Description |
| --- | --- | --- |
| **FR-4.1** | Authorized Transport | Transmits image payload and selected profile schema ID to `POST /api/v1/ocr` with `Authorization: Bearer <token>`. |
| **FR-4.2** | Payload Structure | Sends `multipart/form-data` containing image source and field metadata. |
| **FR-4.3** | Structured Response | Returns standardized key-value JSON matching target input expectations. |

### FR-5: DOM Autofill Engine

| Feature ID | Feature Name | Description |
| --- | --- | --- |
| **FR-5.1** | Framework State Bypass | Uses native JavaScript property descriptors to trigger reactive state updates in React, Vue, and Angular forms. |
| **FR-5.2** | Event Dispatching | Fires synthetic `input`, `change`, and `blur` events on populated elements. |
| **FR-5.3** | Frame Traversal | Executes content script across frames (`"all_frames": true`) for embedded `<iframe>` forms. |

---

## 4. Non-Functional Requirements

* **Security**: All API traffic must use HTTPS. Bearer tokens are kept isolated inside extension storage and never exposed to webpage scripts.
* **Performance**: UI image capture to payload dispatch overhead must remain under 300ms.
* **Reliability**: Displays toast alerts whenever fields fail to match DOM selectors.

---

## 5. Future Roadmap

### Phase 2: Dynamic API Profiles (Option 2)

To remove the need to redeploy extension code when web forms change or new document types are added:

* **Remote Schema Sync (`GET /api/v1/schemas`)**: On application load, the extension will query the central backend API to dynamically fetch up-to-date form definitions and mapping rules.
* **Centralized Schema Admin Panel**: A web portal where system administrators can create, edit, or delete form schemas and field selectors without modifying the extension codebase.
* **Auto-Detect Profile AI**: Automatic classification endpoint that inspects captured images and selects the correct form profile automatically without manual user dropdown selection.
