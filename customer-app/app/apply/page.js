'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  User,
  Home,
  Zap,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Sparkles,
  Info,
  HelpCircle,
  Languages,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { calculatePreliminaryEstimate } from '@/lib/solarCalculations.js';

export default function SolarApplicationWizard() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);

  const [personalDetails, setPersonalDetails] = useState({
    fullName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
  });

  const [propertyDetails, setPropertyDetails] = useState({
    ownership: 'Owner',
    propertyType: 'Residential',
    roofType: 'RCC',
    availableRoofArea: 500,
  });

  const [electricityDetails, setElectricityDetails] = useState({
    consumerNumber: '',
    tariffCategory: 'Residential / Domestic',
    sanctionedLoad: 5,
    averageMonthlyUnits: 420,
    monthlyBill: 3120,
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [ocrStatus, setOcrStatus] = useState('IDLE'); // IDLE, OCR_PROCESSING, AI_VERIFYING, COMPLETED, ERROR
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrProgressMessage, setOcrProgressMessage] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [customCapacity, setCustomCapacity] = useState(null);
  const [estimate, setEstimate] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setPersonalDetails((prev) => ({
            ...prev,
            fullName: prev.fullName || data.user.name || '',
            email: prev.email || data.user.email || '',
            mobile: prev.mobile || data.user.mobile || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const calc = calculatePreliminaryEstimate({
      monthlyUnits: Number(electricityDetails.averageMonthlyUnits) || 300,
      monthlyBill: Number(electricityDetails.monthlyBill) || 2250,
      roofArea: Number(propertyDetails.availableRoofArea) || 500,
      customCapacity: customCapacity,
    });
    setEstimate(calc);
  }, [
    electricityDetails.averageMonthlyUnits,
    electricityDetails.monthlyBill,
    propertyDetails.availableRoofArea,
    customCapacity,
  ]);

  const validateStep1 = () => {
    const errors = {};
    if (!personalDetails.fullName.trim()) errors.fullName = 'Full name is required';
    if (!personalDetails.mobile || !/^[0-9]{10}$/.test(personalDetails.mobile.trim())) {
      errors.mobile = 'Valid 10-digit mobile number is required';
    }
    if (!personalDetails.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalDetails.email)) {
      errors.email = 'Valid email is required';
    }
    if (!personalDetails.address.trim()) errors.address = 'Address is required';
    if (!personalDetails.city.trim()) errors.city = 'City is required';
    if (!personalDetails.pincode || !/^[0-9]{6}$/.test(personalDetails.pincode.trim())) {
      errors.pincode = 'Valid 6-digit pincode is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!propertyDetails.availableRoofArea || Number(propertyDetails.availableRoofArea) < 50) {
      errors.availableRoofArea = 'Minimum available roof area is 50 sq ft';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!electricityDetails.consumerNumber.trim()) {
      errors.consumerNumber = 'Consumer number is required';
    }
    if (!electricityDetails.sanctionedLoad || Number(electricityDetails.sanctionedLoad) <= 0) {
      errors.sanctionedLoad = 'Sanctioned load must be > 0 kW';
    }
    if (!electricityDetails.averageMonthlyUnits || Number(electricityDetails.averageMonthlyUnits) <= 0) {
      errors.averageMonthlyUnits = 'Monthly units must be > 0';
    }
    if (!electricityDetails.monthlyBill || Number(electricityDetails.monthlyBill) <= 0) {
      errors.monthlyBill = 'Monthly bill must be > ₹0';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setFieldErrors({});
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Compute SHA-256 fingerprint of an ArrayBuffer
  const computeFileHash = async (arrayBuffer) => {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  };

  // Upload bill image/pdf file with strict client-side validation
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Invalid file format. Please upload a JPEG, PNG, WebP image or PDF.');
      return;
    }

    // Validate file size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10 MB limit.');
      return;
    }

    // Compute unique SHA-256 document identity
    const arrayBuffer = await file.arrayBuffer();
    const docHash = await computeFileHash(arrayBuffer);

    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      hash: docHash,
    });

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      setFilePreview(dataUrl);
      extractTextAndVerify(dataUrl, file.name, file.size, docHash);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setRawOcrText('');
    setAiResult(null);
    setIsCachedResult(false);
    setOcrStatus('IDLE');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Complete pipeline:
   * 1. Multi-language Tesseract.js (eng+hin) raw text extraction
   * 2. Send documentHash + raw OCR text + customer electricity data to Gemini API (/api/ocr)
   * 3. Handle 1-scan limit per document and display structured Gemini response
   */
  const extractTextAndVerify = async (imageSrc, fileName, fileSize, documentHash) => {
    setErrorMessage('');
    setIsCachedResult(false);

    try {
      let extractedText = '';

      // Step 1: Live OCR with Tesseract.js
      setOcrStatus('OCR_PROCESSING');
      setOcrProgress(10);
      setOcrProgressMessage('Initializing Tesseract OCR (English + Hindi)...');

      const Tesseract = (await import('tesseract.js')).default;

      try {
        const result = await Tesseract.recognize(imageSrc, 'eng+hin', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const pct = Math.round((m.progress || 0) * 80);
              setOcrProgress(15 + pct);
              setOcrProgressMessage(`Extracting text with Tesseract.js (${pct}%)...`);
            } else if (m.status) {
              setOcrProgressMessage(`Tesseract: ${m.status}...`);
            }
          },
        });
        extractedText = result?.data?.text || '';
      } catch (ocrErr) {
        console.warn('eng+hin OCR failed, retrying with English fallback:', ocrErr);
        const fallbackResult = await Tesseract.recognize(imageSrc, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const pct = Math.round((m.progress || 0) * 80);
              setOcrProgress(15 + pct);
              setOcrProgressMessage(`Extracting text (English: ${pct}%)...`);
            }
          },
        });
        extractedText = fallbackResult?.data?.text || '';
      }

      setRawOcrText(extractedText);

      // Validate OCR text before sending
      if (!extractedText || extractedText.trim().length < 20) {
        setOcrStatus('COMPLETED');
        setAiResult({
          verificationStatus: 'unreadable',
          extractedData: {
            consumerNumber: null,
            tariffCategory: null,
            sanctionedLoad: null,
            monthlyUnits: null,
            billAmount: null,
          },
          comparison: {
            consumerNumber: 'missing',
            tariffCategory: 'missing',
            sanctionedLoad: 'missing',
            monthlyUnits: 'missing',
            monthlyBill: 'missing',
          },
          mismatches: [],
          missingFields: ['consumerNumber', 'tariffCategory', 'sanctionedLoad', 'monthlyUnits', 'monthlyBill'],
          confidence: 'low',
          notes: 'OCR could not detect legible text from this bill image. Please upload a clearer copy.',
        });
        return;
      }

      // Step 2: Send raw text to Gemini AI via backend
      setOcrStatus('AI_VERIFYING');
      setOcrProgress(90);
      setOcrProgressMessage('Verifying bill details with Google Gemini AI...');

      const aiRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentHash: documentHash || '',
          fileName: fileName || 'uploaded_bill',
          fileSize: fileSize || 0,
          rawText: extractedText,
          customerData: electricityDetails,
        }),
      });

      const aiData = await aiRes.json();
      if (!aiRes.ok) {
        throw new Error(aiData.error || 'Gemini verification service failed');
      }

      setOcrProgress(100);
      setOcrProgressMessage('AI verification complete');
      setAiResult(aiData.verification);
      setIsCachedResult(Boolean(aiData.cached));
      setOcrStatus('COMPLETED');
    } catch (err) {
      console.error('OCR / Gemini verification error:', err);
      setOcrStatus('ERROR');
      setErrorMessage(err.message || 'Verification failed. Please retry or verify manually.');
    }
  };

  // 1-Click Accept Extracted Value for Mismatched Fields
  const acceptExtractedField = (fieldKey, extractedVal) => {
    if (extractedVal === null || extractedVal === undefined) return;

    let stateKey = fieldKey;
    if (fieldKey === 'monthlyUnits') stateKey = 'averageMonthlyUnits';
    if (fieldKey === 'billAmount') stateKey = 'monthlyBill';

    setElectricityDetails((prev) => ({
      ...prev,
      [stateKey]: extractedVal,
    }));

    setAiResult((prev) => {
      if (!prev) return prev;
      const updatedMismatches = (prev.mismatches || []).filter(
        (m) => m.field !== fieldKey && m.field !== stateKey
      );
      const updatedComparison = {
        ...(prev.comparison || {}),
        [fieldKey]: 'match',
        [stateKey]: 'match',
      };
      const newStatus = updatedMismatches.length === 0 ? 'verified' : 'mismatch';

      return {
        ...prev,
        verificationStatus: newStatus,
        comparison: updatedComparison,
        mismatches: updatedMismatches,
        notes:
          newStatus === 'verified'
            ? 'All fields now match bill extracted values.'
            : prev.notes,
      };
    });
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const extracted = aiResult?.extractedData || {};
      const status = aiResult?.verificationStatus || 'PENDING';

      const payload = {
        personalDetails,
        propertyDetails,
        electricityDetails,
        billUpload: {
          fileName: uploadedFile?.name || 'uploaded_bill.jpg',
          fileSize: uploadedFile?.size || 350000,
          fileType: uploadedFile?.type || 'image/jpeg',
          documentHash: uploadedFile?.hash || '',
        },
        ocrData: {
          rawText: rawOcrText || '',
          consumerNumber: extracted.consumerNumber || electricityDetails.consumerNumber,
          tariffCategory: extracted.tariffCategory || electricityDetails.tariffCategory,
          sanctionedLoad: extracted.sanctionedLoad || electricityDetails.sanctionedLoad,
          monthlyUnits: extracted.monthlyUnits || electricityDetails.averageMonthlyUnits,
          billAmount: extracted.billAmount || electricityDetails.monthlyBill,
          confidence: aiResult?.confidence === 'high' ? 95 : aiResult?.confidence === 'medium' ? 75 : 40,
          processedAt: new Date(),
        },
        verificationStatus: {
          status:
            status === 'verified'
              ? 'VERIFIED'
              : status === 'mismatch'
              ? 'MISMATCH_DETECTED'
              : 'MANUAL_OVERRIDE',
          isMatched: status === 'verified',
          mismatchedFields: (aiResult?.mismatches || []).map((m) => ({
            field: m.field,
            enteredValue: m.entered,
            extractedValue: m.extracted,
            status: 'mismatch',
          })),
          notes: aiResult?.notes || 'Application submitted with Gemini bill verification.',
        },
      };

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit solar application');
      }

      router.push(`/dashboard/applications/${data.applicationId}`);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Solar Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Apply for Rooftop Solar System
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl mx-auto">
            Provide your roof details, verify your electricity bill with OCR & Gemini AI, and receive your PM Surya Ghar subsidy estimate.
          </p>
        </div>

        {/* Stepper Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, label: 'Personal' },
              { num: 2, label: 'Property' },
              { num: 3, label: 'Electricity' },
              { num: 4, label: 'Bill OCR + AI' },
              { num: 5, label: 'Review & Submit' },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      currentStep === step.num
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100'
                        : currentStep > step.num
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-white text-slate-400 border border-slate-300'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium hidden sm:block ${
                      currentStep === step.num
                        ? 'text-emerald-700 font-bold'
                        : currentStep > step.num
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                      currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 mb-8">
          {submitError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 1: PERSONAL INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  <span>Section 1: Applicant Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your contact and residential address details
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={personalDetails.fullName}
                    onChange={(e) =>
                      setPersonalDetails({ ...personalDetails, fullName: e.target.value })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.fullName ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
                    }`}
                    placeholder="e.g. Rajesh Sharma"
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={personalDetails.mobile}
                    onChange={(e) =>
                      setPersonalDetails({ ...personalDetails, mobile: e.target.value })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.mobile ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
                    }`}
                    placeholder="10-digit mobile number"
                  />
                  {fieldErrors.mobile && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.mobile}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={personalDetails.email}
                    onChange={(e) =>
                      setPersonalDetails({ ...personalDetails, email: e.target.value })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.email ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
                    }`}
                    placeholder="e.g. rajesh@example.com"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Installation Address / House No. *
                  </label>
                  <input
                    type="text"
                    value={personalDetails.address}
                    onChange={(e) =>
                      setPersonalDetails({ ...personalDetails, address: e.target.value })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.address ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
                    }`}
                    placeholder="e.g. Flat 402, Green Park Avenue, Near City Centre"
                  />
                  {fieldErrors.address && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={personalDetails.city}
                    onChange={(e) =>
                      setPersonalDetails({ ...personalDetails, city: e.target.value })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.city ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
                    }`}
                    placeholder="e.g. Pune"
                  />
                  {fieldErrors.city && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <select
                    value={personalDetails.state}
                    onChange={(e) =>
                      setPersonalDetails({ ...personalDetails, state: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[
                      'Maharashtra',
                      'Delhi',
                      'Gujarat',
                      'Karnataka',
                      'Rajasthan',
                      'Uttar Pradesh',
                      'Haryana',
                      'Tamil Nadu',
                      'Madhya Pradesh',
                    ].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={personalDetails.pincode}
                    onChange={(e) =>
                      setPersonalDetails({ ...personalDetails, pincode: e.target.value })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.pincode ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300'
                    }`}
                    placeholder="e.g. 411001"
                  />
                  {fieldErrors.pincode && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.pincode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROPERTY INFORMATION */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Home className="h-5 w-5 text-emerald-600" />
                  <span>Section 2: Property Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Roof type and physical area determine solar capacity feasibility
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Property Ownership *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Owner', 'Tenant'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() =>
                          setPropertyDetails({ ...propertyDetails, ownership: opt })
                        }
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                          propertyDetails.ownership === opt
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Property Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Residential', 'Commercial'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() =>
                          setPropertyDetails({ ...propertyDetails, propertyType: opt })
                        }
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                          propertyDetails.propertyType === opt
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Roof Construction Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['RCC', 'Metal', 'Other'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() =>
                          setPropertyDetails({ ...propertyDetails, roofType: opt })
                        }
                        className={`py-3 px-3 rounded-xl border text-sm font-semibold transition-all ${
                          propertyDetails.roofType === opt
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Available Roof Area (sq. ft.) *
                  </label>
                  <div className="relative rounded-xl">
                    <input
                      type="number"
                      min={50}
                      step={50}
                      value={propertyDetails.availableRoofArea}
                      onChange={(e) =>
                        setPropertyDetails({
                          ...propertyDetails,
                          availableRoofArea: Number(e.target.value),
                        })
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.availableRoofArea
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-300'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 font-medium">
                      sq. ft.
                    </span>
                  </div>
                  {fieldErrors.availableRoofArea && (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors.availableRoofArea}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Rule of thumb: 1 kW solar requires approx. 80–100 sq. ft. of shadow-free roof area.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ELECTRICITY INFORMATION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-emerald-600" />
                  <span>Section 3: Electricity Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your connection details as shown on your power bill. In the next step, our Gemini AI will inspect your bill image and verify these fields.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Electricity Consumer / CA / Account Number *
                  </label>
                  <input
                    type="text"
                    value={electricityDetails.consumerNumber}
                    onChange={(e) =>
                      setElectricityDetails({
                        ...electricityDetails,
                        consumerNumber: e.target.value,
                      })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.consumerNumber
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                    placeholder="e.g. 1008459231"
                  />
                  {fieldErrors.consumerNumber && (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors.consumerNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tariff Category *
                  </label>
                  <select
                    value={electricityDetails.tariffCategory}
                    onChange={(e) =>
                      setElectricityDetails({
                        ...electricityDetails,
                        tariffCategory: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Residential / Domestic">Residential / Domestic (LT-1 / घरेलू)</option>
                    <option value="Commercial">Commercial (LT-2 / गैर-घरेलू)</option>
                    <option value="Industrial">Industrial (औद्योगिक)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Sanctioned Load (kW) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={0.5}
                    value={electricityDetails.sanctionedLoad}
                    onChange={(e) =>
                      setElectricityDetails({
                        ...electricityDetails,
                        sanctionedLoad: Number(e.target.value),
                      })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.sanctionedLoad
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.sanctionedLoad && (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors.sanctionedLoad}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Average Monthly Consumption (Units / kWh) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={electricityDetails.averageMonthlyUnits}
                    onChange={(e) =>
                      setElectricityDetails({
                        ...electricityDetails,
                        averageMonthlyUnits: Number(e.target.value),
                      })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      fieldErrors.averageMonthlyUnits
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-300'
                    }`}
                  />
                  {fieldErrors.averageMonthlyUnits && (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors.averageMonthlyUnits}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Average Monthly Electricity Bill (₹) *
                  </label>
                  <div className="relative rounded-xl">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm text-slate-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={electricityDetails.monthlyBill}
                      onChange={(e) =>
                        setElectricityDetails({
                          ...electricityDetails,
                          monthlyBill: Number(e.target.value),
                        })
                      }
                      className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.monthlyBill
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {fieldErrors.monthlyBill && (
                    <p className="mt-1 text-xs text-rose-600">
                      {fieldErrors.monthlyBill}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: BILL UPLOAD, TESSERACT OCR & GEMINI VERIFICATION */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <UploadCloud className="h-5 w-5 text-emerald-600" />
                    <span>Section 4: Bill Upload & AI Verification</span>
                  </h3>
                  <span className="inline-flex items-center space-x-1 text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
                    <Languages className="h-3.5 w-3.5 text-emerald-600" />
                    <span>English & Hindi Supported</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload your electricity bill. Tesseract extracts raw text, and Google Gemini AI verifies your connection details.
                </p>
              </div>

              {!uploadedFile ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50/70 transition-all text-center cursor-pointer group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="mx-auto h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform mb-3">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Click to upload electricity bill or drag & drop
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: JPEG, PNG, WebP, PDF (Max 10 MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* File Header Bar with SHA-256 fingerprint */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900">{uploadedFile.name}</h4>
                          {isCachedResult && (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Cached Scan (0 New API Calls)</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {(uploadedFile.size / 1024).toFixed(1)} KB • SHA-256: {uploadedFile.hash ? `${uploadedFile.hash.slice(0, 16)}...` : 'Computed'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove uploaded bill"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Processing Progress Bar */}
                  {(ocrStatus === 'OCR_PROCESSING' || ocrStatus === 'AI_VERIFYING') && (
                    <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-2">
                        <span className="flex items-center space-x-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                          <span>{ocrProgressMessage}</span>
                        </span>
                        <span>{ocrProgress}%</span>
                      </div>
                      <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CASE 5: AI API FAILURE / SYSTEM ERROR */}
                  {ocrStatus === 'ERROR' && (
                    <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                      <div className="flex items-start space-x-3 text-rose-900">
                        <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold">Verification Encountered an Issue</h4>
                          <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
                        </div>
                      </div>
                      <div className="pt-2 flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            removeFile();
                            setTimeout(() => fileInputRef.current?.click(), 100);
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Upload Another Bill
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(5)}
                          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Proceed with Manual Values
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI VERIFICATION RESULTS */}
                  {ocrStatus === 'COMPLETED' && aiResult && (
                    <div className="space-y-4">
                      {/* CASE 3: UNREADABLE / POOR QUALITY IMAGE */}
                      {aiResult.verificationStatus === 'unreadable' ? (
                        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
                          <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-bold">
                                Image Quality Too Poor / Text Unreadable
                              </h4>
                              <p className="text-xs text-rose-700 mt-1">
                                {aiResult.notes ||
                                  'The uploaded electricity bill could not be parsed clearly. Characters are blurred or damaged.'}
                              </p>
                              <p className="text-xs text-slate-600 mt-2 font-medium">
                                What to do next:
                              </p>
                              <ul className="text-xs text-slate-600 list-disc list-inside mt-0.5 space-y-0.5">
                                <li>Upload a higher-resolution, well-lit photo or digital e-bill PDF.</li>
                                <li>Ensure consumer number and units consumed are clearly visible.</li>
                                <li>Or continue with the manually entered electricity values.</li>
                              </ul>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                removeFile();
                                setTimeout(() => fileInputRef.current?.click(), 100);
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                              Upload Clearer Bill
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(5)}
                              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              Keep Manual Data & Continue
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* CASE 1: 100% MATCH / VERIFIED */}
                          {aiResult.verificationStatus === 'verified' && (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-bold">
                                    AI Bill Verification Successful (Verified)
                                  </h4>
                                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Confidence: {aiResult.confidence}
                                  </span>
                                </div>
                                <p className="text-xs text-emerald-800 mt-0.5">
                                  {aiResult.notes ||
                                    'All electricity bill parameters match your entered application details. You can proceed directly to the solar estimate.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* CASE 2: MISMATCH DETECTED */}
                          {aiResult.verificationStatus === 'mismatch' && (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-bold">
                                    Discrepancy Detected Between Bill & Entered Information
                                  </h4>
                                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Action Required
                                  </span>
                                </div>
                                <p className="text-xs text-amber-800 mt-0.5">
                                  Review the side-by-side comparison below. Click <strong>"Use Extracted"</strong> to automatically update your application with the bill value, or proceed keeping your manual correction.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* CASE 4: MISSING INFORMATION CALLOUT */}
                          {aiResult.missingFields && aiResult.missingFields.length > 0 && (
                            <div className="p-3.5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 flex items-start space-x-2.5 text-xs">
                              <HelpCircle className="h-4 w-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Missing Information on Bill: </span>
                                <span>
                                  Fields [{aiResult.missingFields.join(', ')}] were not found on this bill. AI does not guess missing data. Your manually entered values will be used.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* SIDE-BY-SIDE VERIFICATION TABLE */}
                          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-3">Bill Field</th>
                                  <th className="px-4 py-3">Customer Entered</th>
                                  <th className="px-4 py-3">Gemini AI Extracted</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {[
                                  {
                                    field: 'consumerNumber',
                                    label: 'Consumer / CA Number',
                                    entered: electricityDetails.consumerNumber,
                                    extracted: aiResult.extractedData?.consumerNumber,
                                  },
                                  {
                                    field: 'tariffCategory',
                                    label: 'Tariff Category',
                                    entered: electricityDetails.tariffCategory,
                                    extracted: aiResult.extractedData?.tariffCategory,
                                  },
                                  {
                                    field: 'sanctionedLoad',
                                    label: 'Sanctioned Load (kW)',
                                    entered: `${electricityDetails.sanctionedLoad} kW`,
                                    extracted:
                                      aiResult.extractedData?.sanctionedLoad !== null &&
                                      aiResult.extractedData?.sanctionedLoad !== undefined
                                        ? `${aiResult.extractedData.sanctionedLoad} kW`
                                        : null,
                                    rawVal: aiResult.extractedData?.sanctionedLoad,
                                  },
                                  {
                                    field: 'monthlyUnits',
                                    label: 'Monthly Units (kWh)',
                                    entered: `${electricityDetails.averageMonthlyUnits} Units`,
                                    extracted:
                                      aiResult.extractedData?.monthlyUnits !== null &&
                                      aiResult.extractedData?.monthlyUnits !== undefined
                                        ? `${aiResult.extractedData.monthlyUnits} Units`
                                        : null,
                                    rawVal: aiResult.extractedData?.monthlyUnits,
                                  },
                                  {
                                    field: 'billAmount',
                                    label: 'Bill Amount (₹)',
                                    entered: `₹${electricityDetails.monthlyBill}`,
                                    extracted:
                                      aiResult.extractedData?.billAmount !== null &&
                                      aiResult.extractedData?.billAmount !== undefined
                                        ? `₹${aiResult.extractedData.billAmount}`
                                        : null,
                                    rawVal: aiResult.extractedData?.billAmount,
                                  },
                                ].map((row) => {
                                  const compStatus =
                                    aiResult.comparison?.[row.field] ||
                                    aiResult.comparison?.[
                                      row.field === 'monthlyUnits'
                                        ? 'averageMonthlyUnits'
                                        : row.field === 'billAmount'
                                        ? 'monthlyBill'
                                        : row.field
                                    ] ||
                                    (row.extracted === null ? 'missing' : 'match');

                                  const isMismatch = compStatus === 'mismatch';

                                  return (
                                    <tr key={row.field} className="hover:bg-slate-50/70">
                                      <td className="px-4 py-3 font-semibold text-slate-900">
                                        {row.label}
                                      </td>
                                      <td className="px-4 py-3 font-mono text-slate-700">
                                        {row.entered || '—'}
                                      </td>
                                      <td className="px-4 py-3 font-mono font-medium">
                                        {row.extracted ? (
                                          <span className="text-slate-900">{row.extracted}</span>
                                        ) : (
                                          <span className="text-slate-400 italic">Not found on bill</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        {compStatus === 'match' ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                            Match
                                          </span>
                                        ) : isMismatch ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                                            Mismatch
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
                                            Missing
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {isMismatch && row.extracted && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              acceptExtractedField(
                                                row.field,
                                                row.rawVal !== undefined ? row.rawVal : row.extracted
                                              )
                                            }
                                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300 transition-colors"
                                          >
                                            Use Extracted
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Raw OCR Text Accordion */}
                          {rawOcrText && (
                            <details className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                              <summary className="font-semibold text-slate-600 cursor-pointer hover:text-slate-900">
                                View Complete Raw OCR Text ({rawOcrText.length} characters)
                              </summary>
                              <pre className="mt-2 p-3 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {rawOcrText}
                              </pre>
                            </details>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: PRELIMINARY ESTIMATE & FINAL REVIEW */}
          {currentStep === 5 && estimate && (
            <div className="space-y-8">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-2 text-xs">
                <Info className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Preliminary Estimate Notice:</strong> This calculation is computed deterministically based on your electricity consumption and available roof area. Final equipment specifications and exact pricing will be determined during the certified physical site survey.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Recommended Size
                  </span>
                  <h3 className="text-2xl font-black text-emerald-900 mt-1">
                    {estimate.recommendedCapacity} kW
                  </h3>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Covers ~100% of consumption
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Annual Generation
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {estimate.yearlyGeneration.toLocaleString('en-IN')} kWh
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    @ 1,400 units / kW / yr
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Govt. Subsidy
                  </span>
                  <h3 className="text-2xl font-black text-emerald-700 mt-1">
                    -₹{estimate.subsidyAmount.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                    PM Surya Ghar direct credit
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Payback Period
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {estimate.paybackPeriod} Years
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ₹{estimate.yearlySavings.toLocaleString('en-IN')}/yr saved
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-4">
                  Deterministic Financial Summary
                </h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Turnkey Installation Cost ({estimate.recommendedCapacity} kW)</span>
                    <span className="font-semibold text-slate-800">
                      ₹{estimate.installationCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Central Government Financial Subsidy (PM Surya Ghar)</span>
                    <span className="font-semibold">
                      -₹{estimate.subsidyAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                    <span>Estimated Net Investment</span>
                    <span className="text-emerald-700">
                      ₹{estimate.netInstallationCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Adjust Solar System Capacity (Explorer)
                  </label>
                  <span className="text-sm font-black text-emerald-700">
                    {customCapacity || estimate.recommendedCapacity} kW
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={customCapacity || estimate.recommendedCapacity}
                  onChange={(e) => setCustomCapacity(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>1 kW (Small Home)</span>
                  <span>3 kW (Standard 3BHK)</span>
                  <span>5 kW (High Usage)</span>
                  <span>10 kW (Bungalow)</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">
                  Application Summary for Submission
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-700 font-bold mb-1">
                      Applicant Contact
                    </strong>
                    <p className="text-slate-600">{personalDetails.fullName}</p>
                    <p className="text-slate-500">{personalDetails.mobile}</p>
                    <p className="text-slate-500 truncate">{personalDetails.email}</p>
                    <p className="text-slate-500 mt-1">
                      {personalDetails.city}, {personalDetails.state} - {personalDetails.pincode}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-700 font-bold mb-1">
                      Rooftop Property
                    </strong>
                    <p className="text-slate-600">
                      Ownership: <span className="font-semibold">{propertyDetails.ownership}</span>
                    </p>
                    <p className="text-slate-600">
                      Type: <span className="font-semibold">{propertyDetails.propertyType}</span>
                    </p>
                    <p className="text-slate-600">
                      Roof: <span className="font-semibold">{propertyDetails.roofType}</span>
                    </p>
                    <p className="text-slate-600">
                      Roof Area: <span className="font-semibold">{propertyDetails.availableRoofArea} sq. ft.</span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-700 font-bold mb-1">
                      Electricity & Bill Verification
                    </strong>
                    <p className="text-slate-600">
                      Consumer No: <span className="font-mono font-semibold">{electricityDetails.consumerNumber || '1008459231'}</span>
                    </p>
                    <p className="text-slate-600">
                      Tariff: <span className="font-semibold">{electricityDetails.tariffCategory}</span>
                    </p>
                    <p className="text-slate-600">
                      Load: <span className="font-semibold">{electricityDetails.sanctionedLoad} kW</span>
                    </p>
                    <p className="text-slate-600">
                      Monthly Bill: <span className="font-semibold">₹{electricityDetails.monthlyBill}</span>
                    </p>
                    <p className="text-emerald-700 font-semibold mt-1">
                      Status: {aiResult?.verificationStatus === 'verified' ? 'Gemini Verified (Match)' : aiResult?.verificationStatus === 'mismatch' ? 'Mismatch Recorded' : 'Manually Verified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Section</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitApplication}
                className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 disabled:opacity-60 transition-all transform hover:-translate-y-0.5"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Submitting Application to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Submit Application</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
