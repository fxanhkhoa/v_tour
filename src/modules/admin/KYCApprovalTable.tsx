import React, { useState } from 'react';
import { KYCApplication } from '../../types';
import { Language, translations } from '../../lib/translations';

interface KYCApprovalTableProps {
  kycList: KYCApplication[];
  onReviewKYC: (id: string, action: 'approve' | 'reject', reason?: string, instructions?: string) => void;
  language?: Language;
}

export const KYCApprovalTable: React.FC<KYCApprovalTableProps> = ({ kycList = [], onReviewKYC, language = 'en' }) => {
  const safeKycList = kycList || [];
  const t = translations[language] || translations.en;
  const [selectedKycDoc, setSelectedKycDoc] = useState<KYCApplication | null>(null);
  const [declineModalKyc, setDeclineModalKyc] = useState<KYCApplication | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('License card number could not be verified on the official portal.');
  const [declineInstructions, setDeclineInstructions] = useState<string>(
    'Please search your license card on huongdanvien.vn/index.php/guide/cat/05 to confirm your card number, then upload a clear photo of your front CCCD and official Tourist Guide Card.'
  );
  const [copiedCardNum, setCopiedCardNum] = useState<string | null>(null);

  const handleCopy = (cardNum: string) => {
    navigator.clipboard.writeText(cardNum);
    setCopiedCardNum(cardNum);
    setTimeout(() => setCopiedCardNum(null), 2000);
  };

  const handleConfirmDecline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalKyc) return;
    onReviewKYC(declineModalKyc.id, 'reject', declineReason, declineInstructions);
    setDeclineModalKyc(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Official Government Lookup Guide Box for Admin */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>{t.officialGovPortalGuide}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {t.vnatGuideLookup}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.vnatGuideLookupDesc}
            </p>

            {/* Steps for Admin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                <span className="text-teal-400 font-bold block mb-1">{t.step1CopyCardNum}</span>
                <span className="text-[11px] text-slate-300">{t.step1CopyCardNumDesc}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                <span className="text-teal-400 font-bold block mb-1">{t.step2OpenPortal}</span>
                <span className="text-[11px] text-slate-300">{t.step2OpenPortalDesc}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                <span className="text-teal-400 font-bold block mb-1">{t.step3VerifyDecision}</span>
                <span className="text-[11px] text-slate-300">{t.step3VerifyDecisionDesc}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
            <a
              href="https://huongdanvien.vn/index.php/guide/cat/05"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{t.openPortalBtn}</span>
              <span className="material-symbols-outlined text-base">open_in_new</span>
            </a>
            <span className="text-[10px] text-slate-400 text-center font-mono bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              Direct URL: huongdanvien.vn/index.php/guide/cat/05
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
              <span className="material-symbols-outlined text-amber-500">badge</span>
              <span>{language === 'vi' ? 'Hàng Đợi Xác Minh Thẻ Hướng Dẫn Viên (KYC)' : 'Tourist Guide Verification Queue (KYC)'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'vi'
                ? 'Đối soát 3 ảnh minh chứng (CCCD, Khuôn mặt, Thẻ HDV) với cơ sở dữ liệu quốc gia.'
                : 'Review 5-step pipeline artifacts (CCCD, Face, Guide License Card) against public records.'}
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
            {safeKycList.filter(k => k.status === 'pending').length} {language === 'vi' ? 'Chờ Phê Duyệt' : 'Pending Approval'}
          </span>
        </div>

        {safeKycList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">verified_user</span>
            <p className="text-sm font-bold text-slate-700">{language === 'vi' ? 'Không Có Hồ Sơ Nào Đang Chờ Duyệt' : 'No Applications Pending Review'}</p>
            <p className="text-xs text-slate-400 mt-1">{language === 'vi' ? 'Tất cả hồ sơ hướng dẫn viên đã được xử lý xong.' : 'All tourist guide applications have been processed.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">{t.guideInfo}</th>
                  <th className="p-4">{t.licenseCardDetails}</th>
                  <th className="p-4">{t.verificationArtifacts}</th>
                  <th className="p-4">{t.submittedDate}</th>
                  <th className="p-4">{t.statusLabel}</th>
                  <th className="p-4 text-right">{t.adminActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {kycList.map((kyc) => (
                  <tr key={kyc.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Guide Info */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={kyc.guideAvatar}
                          alt={kyc.guideName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                        <div>
                          <p className="font-extrabold text-slate-900">{kyc.guideName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">CCCD: {kyc.cccdNumber || '079201008892'}</p>
                        </div>
                      </div>
                    </td>

                    {/* License Card Details with Copy Button */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-extrabold text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {kyc.cardNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(kyc.cardNumber)}
                          className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold border border-teal-200 cursor-pointer transition-all flex items-center"
                          title={language === 'vi' ? 'Sao chép số thẻ để tra cứu trên huongdanvien.vn' : 'Copy Card Number for huongdanvien.vn Portal'}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copiedCardNum === kyc.cardNumber ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{kyc.issuingAuthority}</p>
                      <p className="text-[10px] text-slate-400">{language === 'vi' ? `Hết hạn: ${kyc.expiryDate}` : `Expires: ${kyc.expiryDate}`}</p>
                    </td>

                    {/* 3 Pipeline Artifacts View */}
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedKycDoc(kyc)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 font-extrabold text-[11px] flex items-center space-x-1.5 border border-slate-700 cursor-pointer transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm text-teal-400">visibility</span>
                        <span>{t.viewArtifacts}</span>
                      </button>
                    </td>

                    {/* Submitted Date */}
                    <td className="p-4 text-slate-500">
                      {new Date(kyc.submittedAt).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        kyc.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : kyc.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {kyc.status === 'verified'
                          ? (language === 'vi' ? 'ĐÃ XÁC THỰC' : 'VERIFIED')
                          : kyc.status === 'pending'
                          ? (language === 'vi' ? 'CHỜ DUYỆT' : 'PENDING')
                          : (language === 'vi' ? 'TỪ CHỐI' : 'REJECTED')}
                      </span>
                      {kyc.rejectionReason && (
                        <div className="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px]">
                          <p className="font-bold">{language === 'vi' ? 'Lý do:' : 'Reason:'} {kyc.rejectionReason}</p>
                          {kyc.declineInstructions && (
                            <p className="text-[9px] text-slate-600 mt-0.5">{language === 'vi' ? 'Hướng dẫn:' : 'Instructions:'} {kyc.declineInstructions}</p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Admin Actions: Approve or Decline */}
                    <td className="p-4 text-right">
                      {kyc.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onReviewKYC(kyc.id, 'approve')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span>{t.approve}</span>
                          </button>
                          
                          <button
                            onClick={() => setDeclineModalKyc(kyc)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            <span>{t.decline}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">
                          {language === 'vi' ? 'Đã Quyết Định Xong' : 'Decision Recorded'}
                        </span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Artifacts Full Inspection Modal */}
      {selectedKycDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedKycDoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center space-x-2 text-teal-700 font-extrabold text-xs uppercase mb-1">
              <span className="material-symbols-outlined text-base">file_present</span>
              <span>{language === 'vi' ? 'Kiểm Tra Hồ Sơ Xác Thực Hướng Dẫn Viên' : 'Guide Verification Document Inspection'}</span>
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg mb-4">
              {language === 'vi' ? `Hồ Sơ Minh Chứng KYC Của ${selectedKycDoc.guideName}` : `KYC Artifacts for ${selectedKycDoc.guideName}`}
            </h4>

            {/* Portal Link Reminder */}
            <div className="bg-slate-900 p-3 rounded-2xl text-white flex items-center justify-between mb-5 text-xs">
              <div>
                <span className="text-teal-400 font-bold block">{language === 'vi' ? 'Số Thẻ HDV:' : 'License Card #:'} {selectedKycDoc.cardNumber}</span>
                <span className="text-[11px] text-slate-300">
                  {language === 'vi' ? 'Tra cứu số thẻ này trên cổng thông tin Cục Du Lịch Quốc Gia.' : 'Verify this card number on the National Tourism Authority portal.'}
                </span>
              </div>
              <a
                href="https://huongdanvien.vn/index.php/guide/cat/05"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-all flex items-center space-x-1"
              >
                <span>{language === 'vi' ? 'Tra Cứu Cổng' : 'Check Portal'}</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* CCCD Front & Back */}
              <div className="space-y-2">
                <p className="font-extrabold text-slate-800">{language === 'vi' ? '1. Mặt Trước CCCD' : '1. CCCD Front Side'}</p>
                <img
                  src={selectedKycDoc.cccdFrontUrl || selectedKycDoc.cardImageUrl}
                  alt="CCCD Front"
                  className="w-full h-36 object-cover rounded-2xl border border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <p className="font-extrabold text-slate-800">{language === 'vi' ? '2. Mặt Sau CCCD' : '2. CCCD Back Side'}</p>
                <img
                  src={selectedKycDoc.cccdBackUrl || selectedKycDoc.cardImageUrl}
                  alt="CCCD Back"
                  className="w-full h-36 object-cover rounded-2xl border border-slate-200"
                />
              </div>

              {/* Face Photo */}
              <div className="space-y-2">
                <p className="font-extrabold text-slate-800">{language === 'vi' ? '3. Ảnh Chân Dung Trực Tiếp' : '3. Face Portrait Photo'}</p>
                <img
                  src={selectedKycDoc.facePhotoUrl || selectedKycDoc.guideAvatar}
                  alt="Face"
                  className="w-full h-36 object-cover rounded-2xl border border-slate-200"
                />
              </div>

              {/* Tourist Guide License Card */}
              <div className="space-y-2">
                <p className="font-extrabold text-slate-800">{language === 'vi' ? '4. Thẻ Hướng Dẫn Viên Du Lịch' : '4. Tourist Guide License Card'}</p>
                <img
                  src={selectedKycDoc.tourGuideCardUrl || selectedKycDoc.cardImageUrl}
                  alt="Guide Card"
                  className="w-full h-36 object-cover rounded-2xl border border-slate-200"
                />
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {language === 'vi' ? 'Đã Đồng Ý Điều Khoản:' : 'Terms Policy Agreed:'} <strong className="text-emerald-600">{language === 'vi' ? 'Đã Đồng Ý ✓' : 'Yes ✓'}</strong>
              </div>
              <button
                onClick={() => setSelectedKycDoc(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors"
              >
                {language === 'vi' ? 'Đóng Kiểm Tra' : 'Close Inspector'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal with Reason & Instructions */}
      {declineModalKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setDeclineModalKyc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center space-x-2 text-rose-600 font-extrabold text-xs uppercase">
              <span className="material-symbols-outlined text-base">cancel</span>
              <span>{language === 'vi' ? 'Từ Chối Hồ Sơ KYC Hướng Dẫn Viên' : 'Decline Guide KYC Application'}</span>
            </div>
            
            <h4 className="font-extrabold text-slate-900 text-lg">
              {language === 'vi' ? `Từ Chối Xác Thực Của ${declineModalKyc.guideName}` : `Decline ${declineModalKyc.guideName}'s Verification`}
            </h4>

            <form onSubmit={handleConfirmDecline} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Lý Do Từ Chối Chính' : 'Primary Decline Reason'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder={language === 'vi' ? 'Ví dụ: Không tìm thấy số thẻ trên cổng huongdanvien.vn' : 'e.g. License card number not found on huongdanvien.vn portal'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Hướng Dẫn Cho HDV (Cách Khắc Phục)' : 'Instructions for Tourist Guide (How to Fix)'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={declineInstructions}
                  onChange={(e) => setDeclineInstructions(e.target.value)}
                  placeholder={language === 'vi' ? 'Cung cấp hướng dẫn chi tiết về tài liệu cần tải lại...' : 'Provide detailed instructions on what documents need to be re-uploaded...'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 font-medium">
                💡 <strong>{language === 'vi' ? 'Gợi ý Admin:' : 'Admin Tip:'}</strong> {language === 'vi' ? 'Kiểm tra lại số thẻ trên ' : 'Re-verify card number on '}
                <a href="https://huongdanvien.vn/index.php/guide/cat/05" target="_blank" rel="noreferrer" className="underline font-bold text-teal-800">
                  huongdanvien.vn
                </a> {language === 'vi' ? 'trước khi xác nhận từ chối.' : 'before sending.'}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeclineModalKyc(null)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                >
                  {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-md cursor-pointer flex items-center justify-center space-x-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>{language === 'vi' ? 'Xác Nhận Từ Chối' : 'Confirm Decline'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
