import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import DocumentScan from '@/models/DocumentScan';
import { incrementGeminiCallCount, getGeminiCallCount } from '@/models/ApiUsage';
import { verifyBillWithGemini } from '@/lib/aiVerifier';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { documentHash: clientHash, fileName, fileSize, rawText, customerData } = body;

    // 1. Validate raw OCR text
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bill OCR text is empty or too short for electricity analysis.',
        },
        { status: 400 }
      );
    }

    // 2. Validate customer electricity data
    if (!customerData || typeof customerData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Customer electricity details are required.' },
        { status: 400 }
      );
    }

    // 3. Establish document unique identity (SHA-256 hash)
    const documentHash =
      typeof clientHash === 'string' && clientHash.length === 64
        ? clientHash.toLowerCase()
        : crypto.createHash('sha256').update(rawText.trim()).digest('hex');

    // 4. Connect to persistent MongoDB database
    await connectToDatabase();

    // 5. Check if document has already been scanned
    const existingScan = await DocumentScan.findOne({ documentHash });

    if (existingScan) {
      if (existingScan.status === 'COMPLETED' && existingScan.verificationResult) {
        const totalCalls = await getGeminiCallCount();

        // Exact console output required
        console.log(`[Bill Verification] Document already scanned.`);
        console.log(`[Bill Verification] Returning existing result.`);
        console.log(`[Gemini API] No new API call made.`);
        console.log(`[Gemini API] Total API Calls: ${totalCalls}`);

        return NextResponse.json({
          success: true,
          cached: true,
          documentHash,
          verification: existingScan.verificationResult,
        });
      }

      if (existingScan.status === 'PROCESSING') {
        return NextResponse.json(
          {
            success: false,
            error: 'A verification scan for this document is already in progress.',
            documentHash,
          },
          { status: 409 }
        );
      }

      if (existingScan.status === 'FAILED') {
        const totalCalls = await getGeminiCallCount();
        console.log(`[Bill Verification] Document previously failed.`);
        console.log(`[Gemini API] No new API call made.`);
        console.log(`[Gemini API] Total API Calls: ${totalCalls}`);

        return NextResponse.json(
          {
            success: false,
            error: 'This document failed verification previously. Upload a clearer document.',
            documentHash,
          },
          { status: 400 }
        );
      }
    }

    // 6. Atomically reserve in-flight scan state to prevent concurrent duplicate scans
    let scanRecord;
    try {
      scanRecord = await DocumentScan.create({
        documentHash,
        fileName: fileName || 'uploaded_bill',
        fileSize: Number(fileSize) || 0,
        status: 'PROCESSING',
        rawText: rawText.slice(0, 8000),
      });
    } catch (err) {
      if (err.code === 11000) {
        // Concurrent insert collision
        return NextResponse.json(
          {
            success: false,
            error: 'Simultaneous scan detected for this document. Please wait.',
            documentHash,
          },
          { status: 409 }
        );
      }
      throw err;
    }

    // 7. Sanitize input: Never expose customer personal info (PII) to Gemini
    const cleanCustomerData = {
      consumerNumber: customerData.consumerNumber || '',
      tariffCategory: customerData.tariffCategory || '',
      sanctionedLoad: customerData.sanctionedLoad || '',
      averageMonthlyUnits:
        customerData.averageMonthlyUnits || customerData.monthlyUnits || '',
      monthlyBill: customerData.monthlyBill || '',
    };

    // 8. Invoke Gemini API (Strictly ONE scan per document)
    let verificationResult;
    try {
      verificationResult = await verifyBillWithGemini(
        rawText.trim(),
        cleanCustomerData
      );

      // 9. Increment persistent Gemini call counter
      const totalCalls = await incrementGeminiCallCount();

      // 10. Update persistent scan record
      scanRecord.status = 'COMPLETED';
      scanRecord.verificationResult = verificationResult;
      scanRecord.geminiCallCount = 1;
      await scanRecord.save();

      // Console logging as specified
      console.log(`[Gemini API] Document: ${documentHash.slice(0, 12)}`);
      console.log(`[Gemini API] Request #1`);
      console.log(`[Gemini API] Status: Success`);
      console.log(`[Gemini API] Total API Calls: ${totalCalls}`);

      return NextResponse.json({
        success: true,
        cached: false,
        documentHash,
        verification: verificationResult,
      });
    } catch (geminiError) {
      // Mark scan as FAILED so it does not retry and violate one-scan rule
      scanRecord.status = 'FAILED';
      scanRecord.error = geminiError.message;
      await scanRecord.save().catch(() => {});

      const totalCalls = await getGeminiCallCount();
      console.log(`[Gemini API] Document: ${documentHash.slice(0, 12)}`);
      console.log(`[Gemini API] Request #1`);
      console.log(`[Gemini API] Status: Failed - ${geminiError.message}`);
      console.log(`[Gemini API] Total API Calls: ${totalCalls}`);

      return NextResponse.json(
        {
          success: false,
          error: 'Gemini bill verification failed: ' + geminiError.message,
          documentHash,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('OCR Route Handler Error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while processing bill verification.',
      },
      { status: 500 }
    );
  }
}
