/**
 * AI-Powered Electricity Bill Verification for SolarFlow
 * Exclusively uses Google Gemini API (gemini-2.5-flash)
 * No OpenAI, no regex fallback parsers, no mock presets.
 */

const SYSTEM_PROMPT = `You are an electricity bill verification assistant for Indian power distribution utilities (DISCOMs).
You understand bills in English, Hindi, and regional Indian terminology (UPPCL, MSEDCL, BSES, Tata Power, BESCOM, PSPCL, etc.).

Key Terminology Equivalents:
- Consumer Number: Consumer No, Account ID, CA Number, K Number, Service Connection No, उपभोक्ता संख्या, खाता संख्या, बिल संख्या, सर्विस क्रमांक
- Tariff Category: Domestic, Residential, LT-1, LT-A, DS-1, घरेलू, Commercial, Non-Domestic, LT-2, गैर-घरेलू
- Sanctioned Load: Sanctioned Load, Connected Load, Contract Demand, स्वीकृत भार, लोड, भार (convert to kW if in HP: 1 HP ≈ 0.746 kW)
- Monthly Units: Billed Units, Total Units, Consumption, Units Consumed, कुल खपत, यूनिट्स, kWh
- Bill Amount: Net Amount Payable, Total Amount Due, Amount Payable, कुल देय राशि, भुगतान योग्य राशि, देय राशि, ₹, Rs

Rules:
1. Examine the raw OCR text extracted from the electricity bill.
2. Extract the 5 parameters:
   - consumerNumber (string or null)
   - tariffCategory (string or null)
   - sanctionedLoad (number in kW or null)
   - monthlyUnits (number in kWh or null)
   - billAmount (number in INR or null)
3. Compare extracted bill details with the customer-entered details:
   - Match equivalent terminology (e.g., "Residential" matches "Domestic", "घरेलू", "LT-1").
   - Match numbers with standard tolerance (within ±5% or 2 units for minor fuel surcharges/adjustments).
   - If a field is not present on the bill, mark its comparison as "missing". DO NOT GUESS OR INVENT DATA.
   - If a field is present but conflicts with entered data, mark its comparison as "mismatch" and record in mismatches array.
   - If a field is present and matches, mark as "match".
4. Determine overall verificationStatus:
   - "unreadable": OCR text has no legible electricity bill data or is severely blurred/corrupted.
   - "mismatch": One or more fields clearly conflict with the bill.
   - "partial": Some fields are missing from the bill, but no conflicts exist.
   - "verified": All key fields are identified and match customer-entered data.
5. If any mismatch exists, verificationStatus MUST NEVER be "verified".
6. Return ONLY a single valid JSON object matching the schema below.

JSON Schema:
{
  "verificationStatus": "verified" | "mismatch" | "partial" | "unreadable",
  "extractedData": {
    "consumerNumber": string | null,
    "tariffCategory": string | null,
    "sanctionedLoad": number | null,
    "monthlyUnits": number | null,
    "billAmount": number | null
  },
  "comparison": {
    "consumerNumber": "match" | "mismatch" | "missing",
    "tariffCategory": "match" | "mismatch" | "missing",
    "sanctionedLoad": "match" | "mismatch" | "missing",
    "monthlyUnits": "match" | "mismatch" | "missing",
    "monthlyBill": "match" | "mismatch" | "missing"
  },
  "mismatches": [
    { "field": string, "label": string, "entered": string | number, "extracted": string | number }
  ],
  "missingFields": string[],
  "confidence": "high" | "medium" | "low",
  "notes": string
}`;

/**
 * Backend deterministic validation and sanitization of Gemini's JSON response
 */
export function validateAndSanitizeGeminiResponse(rawJson) {
  if (!rawJson || typeof rawJson !== 'object') {
    throw new Error('Invalid Gemini response: expected a JSON object');
  }

  const validStatuses = ['verified', 'mismatch', 'partial', 'unreadable'];
  let status = String(rawJson.verificationStatus || '').toLowerCase();
  if (!validStatuses.includes(status)) {
    status = 'partial';
  }

  const extracted = rawJson.extractedData || {};
  const sanitizedExtracted = {
    consumerNumber: extracted.consumerNumber ? String(extracted.consumerNumber).trim() : null,
    tariffCategory: extracted.tariffCategory ? String(extracted.tariffCategory).trim() : null,
    sanctionedLoad:
      typeof extracted.sanctionedLoad === 'number' && !isNaN(extracted.sanctionedLoad)
        ? extracted.sanctionedLoad
        : null,
    monthlyUnits:
      typeof extracted.monthlyUnits === 'number' && !isNaN(extracted.monthlyUnits)
        ? Math.round(extracted.monthlyUnits)
        : null,
    billAmount:
      typeof extracted.billAmount === 'number' && !isNaN(extracted.billAmount)
        ? Math.round(extracted.billAmount)
        : null,
  };

  const mismatches = Array.isArray(rawJson.mismatches)
    ? rawJson.mismatches.map((m) => ({
        field: String(m.field || ''),
        label: String(m.label || m.field || ''),
        entered: m.entered ?? '',
        extracted: m.extracted ?? '',
      }))
    : [];

  const missingFields = Array.isArray(rawJson.missingFields)
    ? rawJson.missingFields.map(String)
    : [];

  // Strict backend rule: If mismatches exist, verificationStatus CANNOT be 'verified'
  if (mismatches.length > 0 && status === 'verified') {
    status = 'mismatch';
  }

  return {
    verificationStatus: status,
    extractedData: sanitizedExtracted,
    comparison: rawJson.comparison || {},
    mismatches,
    missingFields,
    confidence: ['high', 'medium', 'low'].includes(String(rawJson.confidence).toLowerCase())
      ? String(rawJson.confidence).toLowerCase()
      : 'medium',
    notes: String(rawJson.notes || ''),
  };
}

/**
 * Send raw OCR text and clean customer electricity data to Gemini API
 * @param {string} rawText Raw text from Tesseract.js OCR
 * @param {object} customerData Only electricity-related customer inputs (no PII)
 * @returns {Promise<object>} Sanitized structured verification result
 */
export async function verifyBillWithGemini(rawText, customerData) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server');
  }

  const cleanText = (rawText || '').trim();
  if (cleanText.length < 20) {
    throw new Error('Electricity bill OCR text is empty or insufficient for analysis');
  }

  const prompt = `
${SYSTEM_PROMPT}

CUSTOMER ENTERED ELECTRICITY DETAILS:
- Consumer Number: ${customerData.consumerNumber || 'Not provided'}
- Tariff Category: ${customerData.tariffCategory || 'Not provided'}
- Sanctioned Load (kW): ${customerData.sanctionedLoad || 'Not provided'}
- Monthly Units (kWh): ${customerData.averageMonthlyUnits || customerData.monthlyUnits || 'Not provided'}
- Monthly Bill (₹): ${customerData.monthlyBill || 'Not provided'}

RAW OCR TEXT EXTRACTED FROM BILL:
"""
${cleanText}
"""
`;

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini API HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('Gemini returned an empty response candidate');
  }

  let parsed;
  try {
    parsed = JSON.parse(textOutput);
  } catch (err) {
    throw new Error('Failed to parse Gemini response as valid JSON');
  }

  return validateAndSanitizeGeminiResponse(parsed);
}
