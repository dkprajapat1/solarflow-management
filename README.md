# SolarFlow
### AI-Powered Rooftop Solar Management Platform

SolarFlow is a rooftop solar management platform that connects homeowners with solar installation providers.

It simplifies the solar onboarding process by allowing customers to submit their electricity details, upload utility bills, and track their solar installation applications.

This documentation covers the **Electricity Bill OCR and AI Verification System** implemented in the Customer Application.

---

## 1. Overview

During solar application submission, customers provide their electricity connection details and upload a recent electricity bill.

SolarFlow uses OCR and Google Gemini AI to extract information from the uploaded bill and compare it with the details entered by the customer.

The system verifies five important parameters:

- Consumer Number
- Tariff Category
- Sanctioned Load
- Monthly Electricity Consumption
- Monthly Bill Amount

The objective is to reduce manual data entry errors and help the company review customer applications more efficiently.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework and API routes |
| React | User interface |
| JavaScript | Application logic |
| Tailwind CSS | UI styling |
| Tesseract.js | Electricity bill OCR |
| Google Gemini API | AI extraction and verification |
| MongoDB | Persistent data storage |
| Mongoose | MongoDB object modeling |
| SHA-256 | Document identification |

## 3. System Architecture

The verification process follows this sequence:

```text
Customer Application
        |
        v
Electricity Bill Upload
        |
        v
File Validation
        |
        v
SHA-256 Document Identification
        |
        v
Tesseract.js OCR
        |
        v
Raw OCR Text
        |
        v
POST /api/ocr
        |
        v
Duplicate Document Check
        |
        v
Google Gemini API
        |
        v
Structured JSON Response
        |
        v
Backend Validation
        |
        v
MongoDB Storage
        |
        v
Customer Review
```

### Component Responsibilities

**Customer Application**
- Collects electricity connection information.
- Accepts electricity bill uploads.
- Displays OCR progress.
- Presents verification results.

**Tesseract.js**
- Extracts text from uploaded electricity bills.
- Supports English and Hindi language recognition.
- Returns raw OCR text for further processing.

**Gemini AI**
- Understands different electricity bill formats.
- Identifies relevant electricity fields.
- Understands equivalent Hindi and English terminology.
- Compares extracted information with customer-entered values.
- Returns structured JSON.

**Backend**
- Validates incoming requests.
- Prevents duplicate document scans.
- Communicates with Gemini securely.
- Validates AI responses.
- Stores verification results.

**MongoDB**
- Stores document scan records.
- Maintains API usage information.
- Preserves verification results across server restarts.

## 4. Electricity Bill Verification Workflow

### Step 1: Bill Upload

The customer uploads an electricity bill.

Supported formats:

- JPG / JPEG
- PNG
- WebP
- PDF

Maximum file size: 10 MB.

The application validates the uploaded file before processing.

### Step 2: Document Identification

A SHA-256 hash is generated from the document's file content.

This fingerprint helps identify previously submitted documents.

The backend uses the document hash to check whether the document has already been processed.

### Step 3: OCR Processing

Tesseract.js extracts the complete text from the uploaded document.

The OCR process uses English and Hindi language recognition.

The extracted text is not interpreted through a collection of fixed electricity bill regex patterns.

Instead, the raw text is passed to Gemini for contextual understanding.

### Step 4: Gemini AI Verification

The backend sends two inputs to Gemini:

1. Raw OCR text extracted from the electricity bill.
2. Relevant electricity details entered by the customer.

Gemini identifies and compares the following fields:

| Field | Description |
|---|---|
| Consumer Number | Electricity connection identifier |
| Tariff Category | Residential, Domestic, Commercial, etc. |
| Sanctioned Load | Approved electricity load in kW |
| Monthly Units | Electricity consumption in kWh |
| Bill Amount | Payable electricity bill amount in INR |

The AI must not invent missing information.

Unidentified values should be returned as `null`.

### Step 5: Verification Result

The verification response contains:

- `verificationStatus`
- `extractedData`
- `comparison`
- `mismatches`
- `missingFields`
- `confidence`
- `notes`

Possible verification statuses:

| Status | Meaning |
|---|---|
| Verified | Required fields match |
| Mismatch | One or more fields differ |
| Partial | Some information is missing |
| Unreadable | The document cannot be reliably interpreted |

### Step 6: Backend Validation

The backend validates the Gemini response before returning it to the customer.

It checks:

- Response structure.
- Allowed verification statuses.
- Extracted field types.
- Missing values.
- Mismatch information.

A response containing mismatches must never be returned as verified.

### Step 7: Customer Review

The customer reviews the extracted information and its comparison with the entered details.

The customer can correct their information before submitting the solar application.

---

## 5. Duplicate Document Prevention

SolarFlow follows a strict rule:

**One unique document must trigger a maximum of one Gemini verification request.**

The system uses the SHA-256 document hash to identify duplicate uploads.

The scan record maintains information such as:

- Document hash.
- Processing status.
- Verification result.
- Gemini API usage.

### Duplicate Handling

| Situation | Expected Behaviour |
|---|---|
| New document | Start verification |
| Previously completed document | Return stored result |
| Document currently processing | Reject duplicate request |
| Previously failed document | Do not automatically retry |

The scan information is stored in MongoDB to preserve the restriction across server restarts.

## 6. Gemini API Usage Tracking

SolarFlow maintains a persistent counter for outgoing Gemini API requests.

The counter is stored in MongoDB rather than relying on a temporary JavaScript variable.

Example console output:

```text
[Gemini API] Document: abc123
[Gemini API] Request #1
[Gemini API] Status: Success
[Gemini API] Total API Calls: 1
```

When an already scanned document is submitted:

```text
[Bill Verification] Document already scanned.
[Bill Verification] Returning existing result.
[Gemini API] No new API call made.
[Gemini API] Total API Calls: 1
```

OCR operations and duplicate-result retrievals do not count as Gemini API calls.

## 7. API Reference

### POST `/api/ocr`

Processes OCR text and verifies electricity bill information.

**Request Body**

```json
{
  "documentHash": "sha256-document-hash",
  "fileName": "electricity-bill.jpg",
  "fileSize": 412000,
  "rawText": "Consumer No: 1008459231...",
  "customerData": {
    "consumerNumber": "1008459231",
    "tariffCategory": "Residential",
    "sanctionedLoad": 5,
    "averageMonthlyUnits": 420,
    "monthlyBill": 3120
  }
}
```

**Successful Response**

```json
{
  "success": true,
  "cached": false,
  "verification": {
    "verificationStatus": "verified",
    "extractedData": {
      "consumerNumber": "1008459231",
      "tariffCategory": "Residential",
      "sanctionedLoad": 5,
      "monthlyUnits": 420,
      "billAmount": 3120
    },
    "comparison": {
      "consumerNumber": "match",
      "tariffCategory": "match",
      "sanctionedLoad": "match",
      "monthlyUnits": "match",
      "monthlyBill": "match"
    },
    "mismatches": [],
    "missingFields": [],
    "confidence": "high",
    "notes": "All required fields match."
  }
}
```

A duplicate request returns the previously stored verification result without making another Gemini API request.

---

## 8. Database Models

The verification system uses MongoDB with Mongoose.

### DocumentScan

Responsible for tracking individual document verification.

Important fields:

- `documentHash`
- `status`
- `verificationResult`
- `geminiCallCount`

### ApiUsage

Maintains persistent Gemini API usage information.

Important fields:

- `name`
- `count`
- `lastCalledAt`

### Application

Stores customer solar application information, including relevant electricity and verification details.

---

## 9. Environment Configuration

Create a `.env.local` file inside `customer-app`.

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Never expose the Gemini API key through client-side environment variables.

---

## 10. Installation and Execution

### Customer Application

```bash
cd customer-app
npm install
npm run dev
```

Customer Application:

`http://localhost:3000`

### Company Application

Open another terminal:

```bash
cd company-app
npm install
npm run dev -- --port 3001
```

Company Application:

`http://localhost:3001`

Both applications connect independently to the shared MongoDB database.

---

## 11. Error Handling

The verification system should handle the following scenarios:

| Scenario | Expected Behaviour |
|---|---|
| Unsupported file format | Reject upload |
| File exceeds size limit | Reject upload |
| Insufficient OCR text | Return unreadable result |
| Blurry electricity bill | Request a clearer document |
| Gemini API failure | Return a controlled error |
| Invalid AI response | Reject invalid response |
| Duplicate document | Return stored result |
| Duplicate request during processing | Reject concurrent request |
| Database failure | Return controlled server error |

---

## 12. Project Structure

```text
SolarFlow/
│
├── customer-app/
│   ├── app/
│   │   ├── api/
│   │   │   ├── applications/
│   │   │   └── ocr/
│   │   │
│   │   └── apply/
│   │
│   ├── lib/
│   │   ├── aiVerifier.js
│   │   ├── db.js
│   │   └── solarCalculations.js
│   │
│   ├── models/
│   │   ├── Application.js
│   │   ├── DocumentScan.js
│   │   ├── ApiUsage.js
│   │   └── User.js
│   │
│   ├── .env.local
│   └── package.json
│
├── company-app/
│   └── ...
│
└── README.md
```

---

## 13. Testing Checklist

Verify the following scenarios:

- Upload a valid English electricity bill.
- Upload a valid Hindi electricity bill.
- Verify matching customer-entered information.
- Verify mismatched electricity details.
- Test missing electricity bill fields.
- Test an unreadable document.
- Upload the same document again.
- Verify that duplicate uploads do not trigger another Gemini request.
- Verify API call counts in the server console.
- Restart the server and verify that scan history remains available.

---

## 14. Important Notes

- OCR output may contain recognition errors, especially with low-quality images.
- AI verification is an assistance mechanism, not an official electricity-provider verification.
- Missing information must never be guessed.
- A preliminary verification result does not replace company review.
- Final solar installation quotations and project approvals remain subject to company assessment and site survey.

---

**SolarFlow — Making Rooftop Solar Onboarding Smarter and Simpler.**