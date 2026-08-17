import React, { useState } from 'react';
import { GuideContactPayload, saveContactToGooglePeopleApi, downloadGuideVCard, openGoogleContactsWeb } from '../lib/googleContacts';
import { Language } from '../lib/translations';

interface AddToGoogleContactsButtonProps {
  payload: GuideContactPayload;
  language?: Language;
  variant?: 'primary' | 'outline' | 'compact' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showVCardOption?: boolean;
  className?: string;
}

export const AddToGoogleContactsButton: React.FC<AddToGoogleContactsButtonProps> = ({
  payload,
  language = 'en',
  variant = 'primary',
  size = 'md',
  showVCardOption = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedContactUrl, setSavedContactUrl] = useState<string | null>(null);

  const cleanPhone = payload.phone || '+84 908 123 456';
  const cleanName = payload.name || 'Tour Guide';

  const handleOpenConfirm = () => {
    setStatus('idle');
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleConfirmSave = async () => {
    setStatus('saving');
    setErrorMessage(null);

    try {
      const result = await saveContactToGooglePeopleApi(payload);
      setStatus('success');
      setSavedContactUrl(result.contactUrl || 'https://contacts.google.com');
    } catch (err: any) {
      console.error('Error saving contact to Google Contacts:', err);
      setStatus('error');
      setErrorMessage(
        err.message ||
        (language === 'vi'
          ? 'Không thể lưu vào Google Contacts. Vui lòng kiểm tra quyền truy cập hoặc tải tệp danh bạ .vcf.'
          : 'Could not save to Google Contacts. Please check permissions or download the .vcf contact card.')
      );
    }
  };

  const handleDownloadVCard = () => {
    downloadGuideVCard(payload);
  };

  // Button sizing classes
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3 rounded-xl gap-1.5',
    md: 'text-xs font-bold py-2 px-3.5 rounded-2xl gap-2',
    lg: 'text-sm font-extrabold py-2.5 px-4 rounded-2xl gap-2'
  }[size];

  // Button styling variants
  const variantClasses = {
    primary: 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm hover:shadow active:scale-98',
    outline: 'bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 hover:border-teal-400 active:scale-98',
    compact: 'bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 active:scale-98',
    ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
  }[variant];

  return (
    <>
      <button
        type="button"
        onClick={handleOpenConfirm}
        className={`inline-flex items-center justify-center font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${sizeClasses} ${variantClasses} ${className}`}
        title={language === 'vi' ? 'Lưu số điện thoại HDV vào Google Contacts' : "Save guide's phone number to Google Contacts"}
      >
        {/* Google Contacts icon representation */}
        <span className="material-symbols-outlined text-base text-teal-500 shrink-0">
          contact_phone
        </span>
        <span className="truncate">
          {language === 'vi' ? 'Lưu Danh Bạ Google' : 'Save to Google Contacts'}
        </span>
      </button>

      {/* MANDATORY EXPLICIT USER CONFIRMATION MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative space-y-5 animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-contacts-modal-title"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-xl">contact_phone</span>
              </div>
              <div>
                <h3 id="google-contacts-modal-title" className="font-extrabold text-slate-900 text-base leading-tight">
                  {language === 'vi' ? 'Lưu Vào Google Contacts' : 'Add to Google Contacts'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'vi' ? 'Google Workspace People API' : 'Google Workspace People API Integration'}
                </p>
              </div>
            </div>

            {/* Main Body State Switch */}
            {status === 'idle' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-700 leading-relaxed">
                  {language === 'vi' ? (
                    <>
                      Bạn có muốn thêm hướng dẫn viên <strong className="text-slate-900">{cleanName}</strong> với số điện thoại <strong className="text-teal-700 font-mono">{cleanPhone}</strong> vào danh bạ <strong className="text-slate-900">Google Contacts</strong> của bạn không?
                    </>
                  ) : (
                    <>
                      Would you like to add licensed tour guide <strong className="text-slate-900">{cleanName}</strong> with phone number <strong className="text-teal-700 font-mono">{cleanPhone}</strong> to your <strong className="text-slate-900">Google Contacts</strong>?
                    </>
                  )}
                </p>

                {/* Contact Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {cleanName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-900 text-sm truncate">{cleanName} (Tour Guide)</p>
                      <p className="text-[11px] text-teal-700 font-bold font-mono truncate">{cleanPhone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium block">{language === 'vi' ? 'Tổ chức:' : 'Organization:'}</span>
                      <span className="font-bold text-slate-700">Vietnam Tour Guides</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">{language === 'vi' ? 'Khu vực:' : 'Location:'}</span>
                      <span className="font-bold text-slate-700">{payload.city || 'Vietnam'}</span>
                    </div>
                    {payload.email && (
                      <div className="col-span-2">
                        <span className="text-slate-400 font-medium block">{language === 'vi' ? 'Email:' : 'Email:'}</span>
                        <span className="font-bold text-slate-700 truncate block">{payload.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permission Notice */}
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 text-[11px] flex items-start space-x-2">
                  <span className="material-symbols-outlined text-sm text-teal-600 mt-0.5 shrink-0">security</span>
                  <p>
                    {language === 'vi'
                      ? 'Thao tác này chỉ thực hiện khi được bạn đồng ý, tạo một liên hệ mới trong tài khoản Google đã đăng nhập của bạn.'
                      : 'This action creates a new entry in your Google Contacts with your permission.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    {language === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 active:scale-98"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>{language === 'vi' ? 'Xác Nhận Lưu Vào Google Contacts' : 'Confirm & Save Contact'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* SAVING IN PROGRESS STATE */}
            {status === 'saving' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900 text-sm">
                    {language === 'vi' ? 'Đang lưu vào Google Contacts...' : 'Saving to Google Contacts...'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {language === 'vi' ? 'Đang gửi thông tin qua Google People API' : 'Connecting to Google People API'}
                  </p>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {status === 'success' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2 text-center">
                  <span className="material-symbols-outlined text-3xl text-emerald-600 block mx-auto">
                    check_circle
                  </span>
                  <p className="font-black text-sm">
                    {language === 'vi' ? 'Đã Lưu Vào Google Contacts Thành Công!' : 'Saved to Google Contacts!'}
                  </p>
                  <p className="text-xs text-emerald-800">
                    {language === 'vi'
                      ? `Số điện thoại của ${cleanName} (${cleanPhone}) đã được thêm vào danh bạ Google của bạn.`
                      : `${cleanName}'s phone number (${cleanPhone}) has been added to your Google Contacts.`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                  {showVCardOption && (
                    <button
                      type="button"
                      onClick={handleDownloadVCard}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>{language === 'vi' ? 'Tải tệp .vcf' : 'Download .vcf'}</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => openGoogleContactsWeb(savedContactUrl || undefined)}
                      className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold border border-teal-200 transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>{language === 'vi' ? 'Mở Google Contacts ↗' : 'Open in Contacts ↗'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
                    >
                      {language === 'vi' ? 'Đóng' : 'Done'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ERROR STATE */}
            {status === 'error' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
                  <div className="flex items-center space-x-2 font-black text-rose-900">
                    <span className="material-symbols-outlined text-lg text-rose-600">error</span>
                    <span>{language === 'vi' ? 'Không Thể Lưu Vào Google Contacts' : 'Google Contacts Error'}</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-800">
                    {language === 'vi' ? 'Tùy chọn thay thế:' : 'Alternative option:'}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    {language === 'vi'
                      ? 'Bạn có thể tải tệp danh bạ .vcf để tự động thêm vào danh bạ điện thoại iOS/Android của mình.'
                      : 'You can download the .vcf contact card to import into your iOS/Android/device address book.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadVCard}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>{language === 'vi' ? 'Tải Danh Bạ Tour Guide (.vcf)' : 'Download Tour Guide Card (.vcf)'}</span>
                  </button>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSave}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors cursor-pointer"
                  >
                    {language === 'vi' ? 'Thử Lại' : 'Try Again'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};
