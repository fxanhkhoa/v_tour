import React, { useState } from 'react';
import { GuideProfile, GuideBankAccount } from '../../types';
import { Language } from '../../lib/translations';

interface GuidePayoutAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideProfile: GuideProfile;
  onSaveBankAccount: (account: GuideBankAccount) => Promise<void>;
  language?: Language;
}

const POPULAR_VIETNAM_BANKS = [
  { code: 'TCB', name: 'Techcombank (Ngân hàng Kỹ Thương)', swift: 'VTCBVNVX' },
  { code: 'VCB', name: 'Vietcombank (Ngân hàng Ngoại Thương)', swift: 'BFTVVNVX' },
  { code: 'MB', name: 'MB Bank (Ngân hàng Quân Đội)', swift: 'MBBCVNVX' },
  { code: 'ACB', name: 'ACB (Ngân hàng Á Châu)', swift: 'ASCBVNVX' },
  { code: 'BIDV', name: 'BIDV (Ngân hàng Đầu tư và Phát triển)', swift: 'BIDVVNVX' },
  { code: 'VPB', name: 'VPBank (Ngân hàng Việt Nam Thịnh Vượng)', swift: 'VPBNVNVX' },
  { code: 'CTG', name: 'VietinBank (Ngân hàng Công Thương)', swift: 'ICBVVNVX' },
  { code: 'TPB', name: 'TPBank (Ngân hàng Tiên Phong)', swift: 'TPBVVNVX' },
  { code: 'STB', name: 'Sacombank (Ngân hàng Sài Gòn Thương Tín)', swift: 'SGSTVNVX' },
  { code: 'HSBC', name: 'HSBC Vietnam (Ngân hàng Quốc Tế)', swift: 'HSBCVNVX' }
];

export const GuidePayoutAccountModal: React.FC<GuidePayoutAccountModalProps> = ({
  isOpen,
  onClose,
  guideProfile,
  onSaveBankAccount,
  language = 'en'
}) => {
  if (!isOpen) return null;

  const current = guideProfile.bankAccount;

  const [bankName, setBankName] = useState<string>(current?.bankName || 'Techcombank (TCB)');
  const [accountNumber, setAccountNumber] = useState<string>(current?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState<string>(current?.accountHolder || guideProfile.fullName.toUpperCase());
  const [branchName, setBranchName] = useState<string>(current?.branchName || 'Saigon Main Branch');
  const [swiftCode, setSwiftCode] = useState<string>(current?.swiftCode || 'VTCBVNVX');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = POPULAR_VIETNAM_BANKS.find(b => b.name === e.target.value || b.code === e.target.value);
    if (selected) {
      setBankName(selected.name);
      setSwiftCode(selected.swift);
    } else {
      setBankName(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) return;

    setIsSubmitting(true);
    try {
      await onSaveBankAccount({
        bankName,
        accountNumber: accountNumber.replace(/\s+/g, ''),
        accountHolder: accountHolder.toUpperCase().trim(),
        branchName,
        swiftCode,
        isVerified: true,
        updatedAt: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save bank payout account:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-auto animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black tracking-wider uppercase mb-2 border border-emerald-200">
            <span className="material-symbols-outlined text-sm">account_balance</span>
            <span>{language === 'vi' ? 'Tài Khoản Nhận Tiền Payout' : 'Guide Payout Bank Account'}</span>
          </div>
          <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900">
            {language === 'vi' ? 'Thiết Lập Tài Khoản Ngân Hàng' : 'Direct Payout Bank Account'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'vi' 
              ? 'Khi tour hoàn thành và cả 2 bên xác nhận, tiền từ Escrow Vault sẽ được tự động giải ngân chuyển vào tài khoản này.' 
              : 'When dual completion is confirmed, platform escrow funds are automatically released and wired directly to this account.'}
          </p>
        </div>

        {/* Realistic Bank Card Visual Preview */}
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden border border-teal-800/40 mb-6">
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <span className="material-symbols-outlined text-7xl">account_balance</span>
          </div>

          <div className="relative z-10 flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-6 bg-amber-400/90 rounded-md border border-amber-300 shadow-xs" />
                <span className="text-[10px] font-mono tracking-widest text-teal-300">NAPAS 24/7 • PAYOUT</span>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {current ? '✓ VERIFIED' : 'ACTIVE'}
              </span>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                {bankName || 'SELECT BENEFICIARY BANK'}
              </p>
              <p className="text-lg font-mono font-bold tracking-wider text-slate-100 mt-0.5">
                {accountNumber ? accountNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-300 border-t border-teal-900/60 pt-1.5">
              <div>
                <p className="text-[8px] text-slate-400">BENEFICIARY</p>
                <p className="font-bold text-white">{accountHolder || 'GUIDE FULL NAME'}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-slate-400">SWIFT / CITAD</p>
                <p className="font-bold text-teal-300">{swiftCode || 'VTCBVNVX'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'vi' ? 'Ngân Hàng Thụ Hưởng' : 'Beneficiary Bank'} <span className="text-rose-500">*</span>
            </label>
            <select
              value={bankName}
              onChange={handleBankSelect}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-medium"
            >
              {POPULAR_VIETNAM_BANKS.map((b) => (
                <option key={b.code} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'vi' ? 'Số Tài Khoản Ngân Hàng' : 'Bank Account Number (STK)'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1903 8888 6666"
                className="w-full p-3 pl-10 font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm"
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-base">
                credit_card
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Tên Chủ Tài Khoản (Không dấu)' : 'Account Holder Name'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'vi' ? 'Chi Nhánh (Tùy chọn)' : 'Branch / Location'}
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Saigon Branch, Dist 1"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          {/* Escrow Release Notice */}
          <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl text-[11px] text-teal-900 flex items-start space-x-2">
            <span className="material-symbols-outlined text-teal-600 text-base shrink-0 mt-0.5">verified_user</span>
            <div>
              <p className="font-bold">
                {language === 'vi' ? 'Cơ Chế Giải Ngân Tự Động 100%' : 'Dual-Acceptance Automatic Payouts'}
              </p>
              <p className="text-teal-800 mt-0.5">
                {language === 'vi'
                  ? 'Số tiền tour ký quỹ trong Escrow sẽ được chuyển thẳng về tài khoản này ngay khi bạn và du khách bấm xác nhận hoàn tất tour.'
                  : 'Escrow funds are immediately routed to this bank account upon mutual completion confirmation.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
            >
              {language === 'vi' ? 'Đóng' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || saveSuccess}
              className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                saveSuccess
                  ? 'bg-emerald-600'
                  : 'bg-teal-600 hover:bg-teal-500 active:scale-95 shadow-teal-600/20'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {saveSuccess ? 'check' : isSubmitting ? 'sync' : 'save'}
              </span>
              <span>
                {saveSuccess
                  ? (language === 'vi' ? 'Đã Lưu Thành Công!' : 'Saved Successfully!')
                  : isSubmitting
                  ? (language === 'vi' ? 'Đang Lưu...' : 'Saving...')
                  : (language === 'vi' ? 'Lưu Tài Khoản Nhận Tiền' : 'Save Payout Account')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
