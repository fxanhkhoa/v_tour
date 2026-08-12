import React, { useState, useRef, useEffect } from 'react';
import { GuideProfile } from '../../types';
import { Language, translations } from '../../lib/translations';

interface KYCSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideProfile: GuideProfile;
  onSubmitKYC: (payload: {
    cardNumber: string;
    issuingAuthority: string;
    expiryDate: string;
    cardImageUrl: string;
    cccdNumber: string;
    cccdFrontUrl: string;
    cccdBackUrl: string;
    facePhotoUrl: string;
    tourGuideCardUrl: string;
    agreedToTerms: boolean;
  }) => void;
  language?: Language;
}

export const KYCSubmissionModal: React.FC<KYCSubmissionModalProps> = ({
  isOpen,
  onClose,
  guideProfile,
  onSubmitKYC,
  language = 'en'
}) => {
  if (!isOpen) return null;

  const t = translations[language] || translations.en;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Step 1: CCCD
  const [cccdNumber, setCccdNumber] = useState<string>('079201008892');
  const [cccdFrontUrl, setCccdFrontUrl] = useState<string>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  );
  const [cccdBackUrl, setCccdBackUrl] = useState<string>(
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
  );

  // Step 2 & 1 Camera State
  const [facePhotoUrl, setFacePhotoUrl] = useState<string>(
    guideProfile.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  );

  // Active Camera Capture Target: 'front' | 'back' | 'face' | 'guideCard' | null
  const [activeCameraTarget, setActiveCameraTarget] = useState<'front' | 'back' | 'face' | 'guideCard' | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Toggle manual URL fallback per item
  const [showManualFrontUrl, setShowManualFrontUrl] = useState<boolean>(false);
  const [showManualBackUrl, setShowManualBackUrl] = useState<boolean>(false);
  const [showManualFaceUrl, setShowManualFaceUrl] = useState<boolean>(false);
  const [showManualGuideCardUrl, setShowManualGuideCardUrl] = useState<boolean>(false);
  const [showPendingView, setShowPendingView] = useState<boolean>(guideProfile.kycStatus === 'pending');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setActiveCameraTarget(null);
  };

  const startCamera = async (target: 'front' | 'back' | 'face' | 'guideCard', overrideFacingMode?: 'user' | 'environment') => {
    setCameraError(null);
    stopCameraStream();

    const facing = overrideFacingMode || (target === 'face' ? 'user' : cameraFacingMode);
    setCameraFacingMode(facing);
    setActiveCameraTarget(target);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facing
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err?.message || "Unable to access camera. Please check permissions or use the URL input fallback."
      );
      setIsCameraActive(false);
      setActiveCameraTarget(null);
    }
  };

  const toggleCameraFacingMode = () => {
    if (!activeCameraTarget) return;
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    startCamera(activeCameraTarget, nextMode);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !activeCameraTarget) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (cameraFacingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      if (activeCameraTarget === 'front') {
        setCccdFrontUrl(photoDataUrl);
      } else if (activeCameraTarget === 'back') {
        setCccdBackUrl(photoDataUrl);
      } else if (activeCameraTarget === 'face') {
        setFacePhotoUrl(photoDataUrl);
      } else if (activeCameraTarget === 'guideCard') {
        setTourGuideCardUrl(photoDataUrl);
      }

      stopCameraStream();
    }
  };

  useEffect(() => {
    stopCameraStream();
  }, [currentStep]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Step 3: Tour Guide Card
  const [cardNumber, setCardNumber] = useState<string>(guideProfile.kycCardNumber || '101180293');
  const [issuingAuthority, setIssuingAuthority] = useState<string>('Vietnam National Authority of Tourism (VNAT)');
  const [expiryDate, setExpiryDate] = useState<string>('2029-12-31');
  const [tourGuideCardUrl, setTourGuideCardUrl] = useState<string>(
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
  );

  // Step 4: Terms
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;

    setSubmitting(true);
    setTimeout(() => {
      onSubmitKYC({
        cardNumber,
        issuingAuthority,
        expiryDate,
        cardImageUrl: tourGuideCardUrl,
        cccdNumber,
        cccdFrontUrl,
        cccdBackUrl,
        facePhotoUrl,
        tourGuideCardUrl,
        agreedToTerms
      });
      setSubmitting(false);
      setShowPendingView(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative border border-slate-100 my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header & Steps Progress (Fixed at top) */}
        <div className="flex-none pr-8 border-b border-slate-100 pb-4 mb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          {/* Header Title */}
          <div className="flex items-center space-x-2 text-teal-600 text-xs font-extrabold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">verified_user</span>
            <span>{t.kycPipelineTitle}</span>
          </div>
          <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 mb-1">
            {t.licenseAndIdentityHeader}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            {t.licenseAndIdentityDesc}
          </p>

          {/* Step Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold text-slate-600 mb-2">
              <span className={currentStep === 1 ? 'text-teal-600' : ''}>{t.step1Cccd}</span>
              <span className={currentStep === 2 ? 'text-teal-600' : ''}>{t.step2Face}</span>
              <span className={currentStep === 3 ? 'text-teal-600' : ''}>{t.step3GuideCard}</span>
              <span className={currentStep === 4 ? 'text-teal-600' : ''}>{t.step4Terms}</span>
              <span className={currentStep === 5 ? 'text-teal-600' : ''}>{t.step5Submit}</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 bg-slate-100 p-1 rounded-full">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  onClick={() => setCurrentStep(s)}
                  className={`h-2 rounded-full cursor-pointer transition-all ${
                    currentStep >= s ? 'bg-teal-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="flex-1 overflow-y-auto pr-1.5 text-xs space-y-4">
          {showPendingView ? (
            <div className="space-y-5 py-2 animate-fadeIn">
              <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-3xl space-y-2 text-amber-950">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 animate-pulse">
                    <span className="material-symbols-outlined text-2xl">hourglass_top</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Application Currently Under Admin Review ⏳</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Your identity documents & Tour Guide License Card have been submitted successfully and are queued for back-office verification.</p>
                  </div>
                </div>
              </div>

              {/* Submitted Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Verification Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300 flex items-center space-x-1 animate-pulse">
                    <span className="material-symbols-outlined text-xs">hourglass_top</span>
                    <span>UNDER REVIEW</span>
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Tour Guide License Card Number:</span>
                  <span className="font-mono font-extrabold text-teal-700">{cardNumber || guideProfile.kycCardNumber || '101180293'}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">CCCD Identity Number:</span>
                  <span className="font-mono font-extrabold text-slate-900">{cccdNumber}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">Verification Authority:</span>
                  <span className="font-bold text-slate-800">{issuingAuthority}</span>
                </div>
              </div>

              {/* Submitted Photos Grid */}
              <div>
                <p className="font-extrabold text-slate-800 mb-2">Attached Verification Documents:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500">1. CCCD Front</p>
                    <img src={cccdFrontUrl} alt="CCCD Front" className="h-20 w-full object-cover rounded-xl border border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500">2. CCCD Back</p>
                    <img src={cccdBackUrl} alt="CCCD Back" className="h-20 w-full object-cover rounded-xl border border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500">3. Live Face Photo</p>
                    <img src={facePhotoUrl} alt="Face" className="h-20 w-full object-cover rounded-xl border border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500">4. Guide Card</p>
                    <img src={tourGuideCardUrl} alt="Guide Card" className="h-20 w-full object-cover rounded-xl border border-slate-200" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 flex items-center space-x-2">
                <span className="material-symbols-outlined text-teal-600 text-lg shrink-0">info</span>
                <span>Our Admin team cross-checks details with official records on <code>huongdanvien.vn</code>. Approval typically takes 15-30 minutes.</span>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPendingView(false)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  <span>Update / Re-submit Info</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs cursor-pointer shadow-md transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">

          {/* STEP 1: UPLOAD & CAMERA CAPTURE CCCD */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-2xl flex items-center justify-between text-teal-900 font-bold">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-teal-600 text-xl">badge</span>
                  <div>
                    <p className="font-extrabold text-xs">Step 1: Vietnamese Citizen Identity Card (CCCD)</p>
                    <p className="text-[10px] text-teal-700 font-normal">Live camera capture required for BOTH Front and Back sides</p>
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1">
                  <p className="font-bold flex items-center space-x-1">
                    <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                    <span>Camera Permission Notice:</span>
                  </p>
                  <p className="text-[11px]">{cameraError}</p>
                </div>
              )}

              {/* CCCD Number Input */}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">
                  CCCD / Passport ID Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cccdNumber}
                  onChange={(e) => setCccdNumber(e.target.value)}
                  placeholder="e.g. 079201008892"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-bold"
                />
              </div>

              {/* 1. CCCD FRONT SIDE CAMERA & PREVIEW */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                    <span>CCCD Front Side (Mặt Trước)</span>
                    <span className="text-rose-500">*</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowManualFrontUrl(!showManualFrontUrl)}
                    className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    {showManualFrontUrl ? '📸 Use Camera' : '🔗 Manual URL'}
                  </button>
                </div>

                {/* Camera View for Front Side */}
                {isCameraActive && activeCameraTarget === 'front' ? (
                  <div className="bg-slate-900 rounded-2xl border-2 border-teal-500 p-3 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                    <div className="relative w-full h-56 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                      />

                      {/* Card Rectangular Framing Guide */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-[260px] h-[160px] rounded-xl border-2 border-dashed border-teal-400 bg-teal-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] relative">
                          <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-teal-300 bg-slate-950/80 px-2 py-0.5 rounded border border-teal-700">
                            CCCD FRONT SIDE
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] text-teal-200 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-teal-800">
                          Align front of identity card inside box
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">photo_camera</span>
                        <span>Capture Front Side</span>
                      </button>

                      <button
                        type="button"
                        onClick={toggleCameraFacingMode}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs cursor-pointer flex items-center space-x-1"
                        title="Switch Camera"
                      >
                        <span className="material-symbols-outlined text-base">flip_camera_ios</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Photo Preview & Capture Trigger */
                  <div className="space-y-2">
                    {cccdFrontUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-300 h-36 bg-slate-900 group">
                        <img src={cccdFrontUrl} alt="CCCD Front" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-slate-950/85 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-slate-700 flex items-center space-x-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          <span>CCCD Front Side Captured</span>
                        </span>
                      </div>
                    )}

                    {showManualFrontUrl ? (
                      <input
                        type="url"
                        value={cccdFrontUrl}
                        onChange={(e) => setCccdFrontUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCamera('front')}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-sm cursor-pointer flex items-center justify-center space-x-2 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-base">photo_camera</span>
                        <span>{cccdFrontUrl ? 'Retake Front Side via Camera' : 'Snap Front Side with Camera'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 2. CCCD BACK SIDE CAMERA & PREVIEW */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                    <span>CCCD Back Side (Mặt Sau)</span>
                    <span className="text-rose-500">*</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowManualBackUrl(!showManualBackUrl)}
                    className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    {showManualBackUrl ? '📸 Use Camera' : '🔗 Manual URL'}
                  </button>
                </div>

                {/* Camera View for Back Side */}
                {isCameraActive && activeCameraTarget === 'back' ? (
                  <div className="bg-slate-900 rounded-2xl border-2 border-teal-500 p-3 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                    <div className="relative w-full h-56 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                      />

                      {/* Card Rectangular Framing Guide */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-[260px] h-[160px] rounded-xl border-2 border-dashed border-teal-400 bg-teal-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] relative">
                          <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-teal-300 bg-slate-950/80 px-2 py-0.5 rounded border border-teal-700">
                            CCCD BACK SIDE
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] text-teal-200 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-teal-800">
                          Align back of identity card inside box
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">photo_camera</span>
                        <span>Capture Back Side</span>
                      </button>

                      <button
                        type="button"
                        onClick={toggleCameraFacingMode}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs cursor-pointer flex items-center space-x-1"
                        title="Switch Camera"
                      >
                        <span className="material-symbols-outlined text-base">flip_camera_ios</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Photo Preview & Capture Trigger */
                  <div className="space-y-2">
                    {cccdBackUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-300 h-36 bg-slate-900 group">
                        <img src={cccdBackUrl} alt="CCCD Back" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-slate-950/85 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-slate-700 flex items-center space-x-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          <span>CCCD Back Side Captured</span>
                        </span>
                      </div>
                    )}

                    {showManualBackUrl ? (
                      <input
                        type="url"
                        value={cccdBackUrl}
                        onChange={(e) => setCccdBackUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCamera('back')}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-sm cursor-pointer flex items-center justify-center space-x-2 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-base">photo_camera</span>
                        <span>{cccdBackUrl ? 'Retake Back Side via Camera' : 'Snap Back Side with Camera'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!cccdNumber || !cccdFrontUrl || !cccdBackUrl}
                onClick={() => {
                  stopCameraStream();
                  setCurrentStep(2);
                }}
                className={`w-full py-3 rounded-2xl font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center space-x-2 transition-all ${
                  cccdNumber && cccdFrontUrl && cccdBackUrl
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Continue to Step 2: Live Face Photo</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          )}

          {/* STEP 2: CAMERA FACE CAPTURE */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-teal-50 border border-teal-200 p-3 rounded-2xl flex items-center justify-between text-teal-900 font-bold">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-teal-600 text-lg">photo_camera</span>
                  <span>Step 2: Live Camera Face Selfie Capture</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) stopCameraStream();
                    setShowManualFaceUrl(!showManualFaceUrl);
                  }}
                  className="text-[11px] font-extrabold text-teal-700 hover:text-teal-800 underline cursor-pointer"
                >
                  {showManualFaceUrl ? '📸 Use Camera' : '🔗 Manual URL'}
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Please capture a live front-facing selfie portrait. Back-office admins match this facial photo against your CCCD identity document for verification.
              </p>

              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1">
                  <p className="font-bold flex items-center space-x-1">
                    <span className="material-symbols-outlined text-sm text-amber-600">warning</span>
                    <span>Camera Permission Notice:</span>
                  </p>
                  <p className="text-[11px]">{cameraError}</p>
                </div>
              )}

              {/* LIVE CAMERA CAPTURE BOX FOR FACE */}
              {!showManualFaceUrl ? (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 relative overflow-hidden flex flex-col items-center justify-center space-y-3">
                  
                  {isCameraActive && activeCameraTarget === 'face' ? (
                    <div className="relative w-full max-w-sm h-64 rounded-2xl overflow-hidden bg-black border-2 border-teal-500 shadow-2xl">
                      {/* Video Stream Element */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                      />

                      {/* Oval Face Guide Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-36 h-48 rounded-[50%] border-2 border-dashed border-teal-400 bg-teal-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] animate-pulse" />
                        <span className="mt-2 text-[10px] font-extrabold text-teal-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-teal-800 shadow">
                          Align Face Inside Oval Frame
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Captured Photo Preview or Initial State */
                    <div className="relative flex flex-col items-center justify-center py-4">
                      {facePhotoUrl ? (
                        <div className="relative">
                          <img
                            src={facePhotoUrl}
                            alt="Captured Face"
                            className="w-36 h-36 rounded-full object-cover border-4 border-teal-500 shadow-2xl"
                          />
                          <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1 shadow">
                            <span className="material-symbols-outlined text-sm block">check</span>
                          </span>
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                          <span className="material-symbols-outlined text-4xl">no_photography</span>
                        </div>
                      )}

                      <div className="mt-3 text-center">
                        <span className="text-emerald-400 font-extrabold text-xs flex items-center justify-center space-x-1 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span>{facePhotoUrl ? 'Face Snapshot Ready' : 'No Photo Captured Yet'}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Camera Controls */}
                  <div className="flex items-center justify-center gap-2 w-full pt-1">
                    {isCameraActive && activeCameraTarget === 'face' ? (
                      <>
                        <button
                          type="button"
                          onClick={takeSnapshot}
                          className="px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-base">photo_camera</span>
                          <span>Snap Face Photo</span>
                        </button>

                        <button
                          type="button"
                          onClick={toggleCameraFacingMode}
                          className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs cursor-pointer flex items-center space-x-1"
                          title="Switch Camera"
                        >
                          <span className="material-symbols-outlined text-base">flip_camera_ios</span>
                        </button>

                        <button
                          type="button"
                          onClick={stopCameraStream}
                          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCamera('face')}
                        className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">videocam</span>
                        <span>{facePhotoUrl ? 'Retake Photo via Camera' : 'Open Camera'}</span>
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                /* Manual Image URL Input Fallback */
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Face Portrait Photo URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={facePhotoUrl}
                    onChange={(e) => setFacePhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3"
                  />
                  {facePhotoUrl && (
                    <div className="flex justify-center p-4 bg-slate-900 rounded-2xl">
                      <img src={facePhotoUrl} alt="Face" className="w-28 h-28 rounded-full object-cover border-2 border-teal-500" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setCurrentStep(1);
                  }}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!facePhotoUrl}
                  onClick={() => {
                    stopCameraStream();
                    setCurrentStep(3);
                  }}
                  className={`w-2/3 py-3 rounded-2xl font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center space-x-2 ${
                    facePhotoUrl
                      ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Continue to Step 3: Guide Card</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: UPLOAD TOUR GUIDE CARD */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-teal-50 border border-teal-200 p-3 rounded-2xl flex items-center space-x-2 text-teal-900 font-bold">
                <span className="material-symbols-outlined text-teal-600 text-lg">id_card</span>
                <span>Step 3: Official Tourist Guide License Card</span>
              </div>

              <p className="text-xs text-slate-600">
                Enter your card number as printed on your official Tourist Guide Card issued by Vietnam Tourism Authority (huongdanvien.vn).
              </p>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">
                  Card License Number (Sẻ Thẻ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="e.g. 101180293 or VN-TG-994821"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * Note: Admin will look up this card number on <strong>huongdanvien.vn/index.php/guide/cat/05</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    required
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Card Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tourist Guide Card Camera & Photo Preview Block */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                    <span>Tourist Guide Card Photo (Ảnh Thẻ Hướng Dẫn Viên)</span>
                    <span className="text-rose-500">*</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowManualGuideCardUrl(!showManualGuideCardUrl)}
                    className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    {showManualGuideCardUrl ? '📸 Use Camera' : '🔗 Manual URL'}
                  </button>
                </div>

                {/* Camera View for Guide Card */}
                {isCameraActive && activeCameraTarget === 'guideCard' ? (
                  <div className="bg-slate-900 rounded-2xl border-2 border-teal-500 p-3 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                    <div className="relative w-full h-56 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                      />

                      {/* Card Rectangular Framing Guide */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-[260px] h-[160px] rounded-xl border-2 border-dashed border-teal-400 bg-teal-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] relative">
                          <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-teal-300 bg-slate-950/80 px-2 py-0.5 rounded border border-teal-700">
                            TOURIST GUIDE LICENSE CARD
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] text-teal-200 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-teal-800">
                          Align Official Guide Card inside rectangular frame
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">photo_camera</span>
                        <span>Capture Guide Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={toggleCameraFacingMode}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs cursor-pointer flex items-center space-x-1"
                        title="Switch Camera"
                      >
                        <span className="material-symbols-outlined text-base">flip_camera_ios</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Photo Preview & Capture Trigger */
                  <div className="space-y-2">
                    {tourGuideCardUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-slate-300 h-36 bg-slate-900 group">
                        <img src={tourGuideCardUrl} alt="Tourist Guide Card" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-slate-950/85 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-slate-700 flex items-center space-x-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          <span>Tourist Guide Card Captured</span>
                        </span>
                      </div>
                    )}

                    {showManualGuideCardUrl ? (
                      <input
                        type="url"
                        value={tourGuideCardUrl}
                        onChange={(e) => setTourGuideCardUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCamera('guideCard')}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-sm cursor-pointer flex items-center justify-center space-x-2 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-base">photo_camera</span>
                        <span>{tourGuideCardUrl ? 'Retake Guide Card via Camera' : 'Snap Guide Card with Camera'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="w-2/3 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Continue to Step 4: Policy Agreement</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CHECKBOX AGREE TERMS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-teal-50 border border-teal-200 p-3 rounded-2xl flex items-center space-x-2 text-teal-900 font-bold">
                <span className="material-symbols-outlined text-teal-600 text-lg">gavel</span>
                <span>Step 4: Platform Terms & Code of Ethics Agreement</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-600 max-h-48 overflow-y-auto">
                <p className="font-extrabold text-slate-900">Tour Guide Hub - Terms of Conduct & Safety Policy:</p>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li><strong>Authenticity Guarantee:</strong> You confirm that all uploaded documents (CCCD, Face Portrait, and Tourist Guide License Card) are 100% authentic and belong solely to you.</li>
                  <li><strong>Zero Tolerance for Fraud:</strong> Providing fraudulent or borrowed card numbers will result in immediate lifetime account termination and reporting to the Vietnam National Authority of Tourism.</li>
                  <li><strong>Tourist Safety & Professional Conduct:</strong> You agree to adhere to national tourism regulations, maintain punctual communication, and ensure traveler safety during all guided excursions.</li>
                  <li><strong>Direct Verification Consent:</strong> You authorize platform Back-Office Admins to query public records on <code>huongdanvien.vn</code> to verify your license status.</li>
                </ol>
              </div>

              <label className="flex items-start space-x-3 p-3 rounded-2xl border-2 border-teal-500/30 bg-teal-50/50 hover:bg-teal-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 leading-snug">
                  I hereby declare that all uploaded identity documents (CCCD, Face, Tour Guide Card) are genuine, and I agree to the platform Terms, Safety Policy & Ethics Code. <span className="text-rose-500">*</span>
                </span>
              </label>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!agreedToTerms}
                  onClick={() => setCurrentStep(5)}
                  className={`w-2/3 py-3 rounded-2xl font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center space-x-2 transition-all ${
                    agreedToTerms
                      ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Review & Submit</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & CLICK SUBMIT */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center space-x-2 text-emerald-900 font-bold">
                <span className="material-symbols-outlined text-emerald-600 text-lg">assignment_turned_in</span>
                <span>Step 5: Final Review & Submit</span>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">CCCD Number:</span>
                  <span className="font-mono font-extrabold text-slate-900">{cccdNumber}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Tour Guide Card Number:</span>
                  <span className="font-mono font-extrabold text-teal-700">{cardNumber}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-600">Issuing Authority:</span>
                  <span className="font-bold text-slate-800">{issuingAuthority}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">Documents Attached:</span>
                  <span className="font-extrabold text-emerald-600 flex items-center space-x-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>CCCD + Face + Guide Card</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <img src={cccdFrontUrl} alt="CCCD Front" className="h-20 w-full object-cover rounded-xl border border-slate-200" />
                <img src={facePhotoUrl} alt="Face" className="h-20 w-full object-cover rounded-xl border border-slate-200" />
                <img src={tourGuideCardUrl} alt="Card" className="h-20 w-full object-cover rounded-xl border border-slate-200" />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span className="material-symbols-outlined text-lg">verified</span>
                  <span>{submitting ? 'Submitting Application...' : 'Submit KYC to Admin Back-Office'}</span>
                </button>
              </div>
            </div>
          )}

        </form>
          )}
        </div>

      </div>
    </div>
  );
};
