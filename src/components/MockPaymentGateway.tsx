import React, { useState, useEffect } from 'react';
import { Language } from '../lib/translations';

export type PaymentMethodType = 'credit_card' | 'vietqr' | 'momo' | 'apple_pay' | 'paypal';

export interface PaymentSuccessResult {
  paymentMethod: PaymentMethodType;
  cardBrand?: string;
  last4?: string;
  amountUSD: number;
  txId: string;
  paidAt: string;
}

interface MockPaymentGatewayProps {
  amountUSD: number;
  itemTitle: string;
  itemSubtitle?: string;
  onPaymentSuccess: (result: PaymentSuccessResult) => void;
  onCancel: () => void;
  language?: Language;
}

export const MockPaymentGateway: React.FC<MockPaymentGatewayProps> = ({
  amountUSD,
  itemTitle,
  itemSubtitle,
  onPaymentSuccess,
  onCancel,
  language = 'en'
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('credit_card');
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'jcb' | 'amex'>('visa');
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState<string>('SARAH JENKINS');
  const [expiryDate, setExpiryDate] = useState<string>('08/28');
  const [cvv, setCvv] = useState<string>('888');
  
  // Wallet / QR states
  const [momoPhone, setMomoPhone] = useState<string>('0908 123 456');
  const [qrCountdown, setQrCountdown] = useState<number>(900); // 15 mins
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [paymentDone, setPaymentDone] = useState<boolean>(false);
  const [generatedTxId, setGeneratedTxId] = useState<string>('');

  // Exchange rate estimation (approx 25,400 VND/USD)
  const amountVND = Math.round(amountUSD * 25400).toLocaleString('vi-VN');

  // Detect card brand automatically
  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    let formatted = '';
    for (let i = 0; i < clean.length; i += 4) {
      formatted += clean.substring(i, i + 4) + (i + 4 < clean.length ? ' ' : '');
    }
    setCardNumber(formatted || val);

    if (clean.startsWith('4')) setCardBrand('visa');
    else if (clean.startsWith('5')) setCardBrand('mastercard');
    else if (clean.startsWith('35')) setCardBrand('jcb');
    else if (clean.startsWith('34') || clean.startsWith('37')) setCardBrand('amex');
  };

  const handleAutofillCard = (brand: 'visa' | 'mastercard') => {
    if (brand === 'visa') {
      setCardBrand('visa');
      setCardNumber('4242 4242 4242 4242');
      setCardHolder('SARAH JENKINS');
      setExpiryDate('12/28');
      setCvv('389');
    } else {
      setCardBrand('mastercard');
      setCardNumber('5500 0000 0000 8899');
      setCardHolder('ALEX JOHNSON');
      setExpiryDate('10/29');
      setCvv('712');
    }
  };

  const handleTriggerPayment = () => {
    setIsProcessing(true);
    setProcessingStage(1);

    const tx = 'ESCROW_DEP_' + Math.floor(100000 + Math.random() * 900000);
    setGeneratedTxId(tx);

    setTimeout(() => {
      setProcessingStage(2);
      setTimeout(() => {
        setProcessingStage(3);
        setPaymentDone(true);
        setTimeout(() => {
          onPaymentSuccess({
            paymentMethod: selectedMethod,
            cardBrand: selectedMethod === 'credit_card' ? cardBrand : undefined,
            last4: selectedMethod === 'credit_card' ? (cardNumber.replace(/\s+/g, '').slice(-4) || '4242') : undefined,
            amountUSD,
            txId: tx,
            paidAt: new Date().toISOString()
          });
        }, 1200);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Escrow Guarantee Top Card */}
      <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-4 opacity-15">
          <span className="material-symbols-outlined text-8xl">verified_user</span>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black tracking-wider uppercase">
              <span className="material-symbols-outlined text-sm">shield_locked</span>
              <span>{language === 'vi' ? 'Ký Quỹ Escrow Vault An Toàn' : 'Platform Escrow Deposit Vault'}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg">
              🔒 100% {language === 'vi' ? 'Hoàn tiền nếu hủy' : 'Refundable Guarantee'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
            <div>
              <p className="text-xs text-teal-200 font-medium">{language === 'vi' ? 'Số tiền ký quỹ yêu cầu' : 'Required Escrow Deposit'}</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">${amountUSD} USD</span>
                <span className="text-xs text-teal-300/80 font-semibold">(≈ {amountVND} VND)</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-1 font-medium">
                🎯 {itemTitle} {itemSubtitle && `• ${itemSubtitle}`}
              </p>
            </div>

            <div className="text-left sm:text-right text-[11px] text-teal-100/90 max-w-xs bg-white/5 p-3 rounded-2xl border border-white/10">
              <p className="font-bold text-teal-300">🛡️ {language === 'vi' ? 'Tiền của bạn luôn được bảo vệ' : 'Your money is 100% safe'}</p>
              <p className="text-[10.5px] text-slate-300 mt-0.5 leading-relaxed">
                {language === 'vi' 
                  ? 'Khoản ký quỹ được giữ tại Escrow Vault và chỉ thanh toán cho HDV khi bạn đồng ý sau khi tour hoàn tất.' 
                  : 'Funds are locked in escrow and only paid to the guide after you confirm the tour was completed satisfactorily.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Overlay View */}
      {isProcessing ? (
        <div className="py-12 px-6 text-center space-y-6 bg-slate-50/80 rounded-3xl border border-slate-200">
          {!paymentDone ? (
            <div className="space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
                <span className="material-symbols-outlined absolute text-teal-700 text-2xl">
                  {processingStage === 1 ? 'credit_card' : 'lock_clock'}
                </span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  {processingStage === 1 
                    ? (language === 'vi' ? 'Đang kết nối cổng thanh toán an toàn...' : 'Connecting to Secure Gateway...') 
                    : (language === 'vi' ? 'Đang khóa tiền vào Escrow Vault...' : 'Authorizing & Locking in Escrow Vault...')}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {language === 'vi' 
                    ? 'Giao dịch được mã hóa 256-bit SSL. Vui lòng không đóng cửa sổ này.' 
                    : '256-bit SSL Encrypted transaction. Please wait while your deposit is confirmed.'}
                </p>
              </div>

              <div className="w-full max-w-xs mx-auto bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-full transition-all duration-700 rounded-full"
                  style={{ width: processingStage === 1 ? '50%' : '90%' }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-scale-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="material-symbols-outlined text-3xl font-black">check_circle</span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xl font-black text-emerald-950">
                  {language === 'vi' ? 'Ký Quỹ Thành Công!' : 'Escrow Deposit Successful!'}
                </h4>
                <p className="text-xs text-slate-600">
                  {language === 'vi' 
                    ? `Mã giao dịch ký quỹ: ` 
                    : `Escrow Transaction ID: `}
                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {generatedTxId}
                  </span>
                </p>
                <p className="text-xs text-emerald-700 font-bold mt-2">
                  🚀 {language === 'vi' ? 'Đang tạo yêu cầu du lịch của bạn lên hệ thống...' : 'Publishing your travel request now...'}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Normal Payment Method Selection View */
        <div className="space-y-5">
          {/* Method Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {language === 'vi' ? 'Chọn Phương Thức Thanh Toán Ký Quỹ' : 'Select Payment Method for Escrow Deposit'}
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Option 1: Credit/Debit Card */}
              <button
                type="button"
                onClick={() => setSelectedMethod('credit_card')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedMethod === 'credit_card'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20 text-teal-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-xl text-teal-700">credit_card</span>
                  <div className="flex space-x-1">
                    <span className="text-[10px] font-black text-blue-800 bg-blue-100 px-1 rounded">VISA</span>
                    <span className="text-[10px] font-black text-red-700 bg-red-100 px-1 rounded">MC</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-extrabold">{language === 'vi' ? 'Thẻ Visa / Debit' : 'Credit / Debit Card'}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Visa, MC, JCB, Amex</p>
                </div>
              </button>

              {/* Option 2: VietQR / VNPay */}
              <button
                type="button"
                onClick={() => setSelectedMethod('vietqr')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedMethod === 'vietqr'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20 text-teal-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-xl text-teal-700">qr_code_scanner</span>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">VNPay / VietQR</span>
                </div>
                <div>
                  <p className="text-xs font-extrabold">VietQR / VNPay</p>
                  <p className="text-[10px] text-slate-400 font-medium">{language === 'vi' ? 'Quét mã ngân hàng' : 'Scan QR Banking'}</p>
                </div>
              </button>

              {/* Option 3: MoMo / E-Wallets */}
              <button
                type="button"
                onClick={() => setSelectedMethod('momo')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedMethod === 'momo'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20 text-teal-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-xl text-pink-600">account_balance_wallet</span>
                  <span className="text-[10px] font-black text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">MoMo</span>
                </div>
                <div>
                  <p className="text-xs font-extrabold">MoMo / ZaloPay</p>
                  <p className="text-[10px] text-slate-400 font-medium">{language === 'vi' ? 'Ví điện tử' : 'E-Wallet 1-Tap'}</p>
                </div>
              </button>

              {/* Option 4: Apple Pay / PayPal */}
              <button
                type="button"
                onClick={() => setSelectedMethod('apple_pay')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedMethod === 'apple_pay'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20 text-teal-950 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-xl text-slate-800">smartphone</span>
                  <span className="text-[10px] font-black text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded"> Pay</span>
                </div>
                <div>
                  <p className="text-xs font-extrabold">Apple / Google Pay</p>
                  <p className="text-[10px] text-slate-400 font-medium">1-Click Express</p>
                </div>
              </button>
            </div>
          </div>

          {/* METHOD 1: Credit / Debit Card Interface */}
          {selectedMethod === 'credit_card' && (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="material-symbols-outlined text-base text-teal-600">lock</span>
                  <span>{language === 'vi' ? 'Thông Tin Thẻ Visa / MasterCard / Debit' : 'Credit / Debit Card Details'}</span>
                </span>
                
                {/* 1-Click Demo Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleAutofillCard('visa')}
                    className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer transition-colors"
                  >
                    ⚡ Demo Visa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofillCard('mastercard')}
                    className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer transition-colors"
                  >
                    ⚡ Demo Mastercard
                  </button>
                </div>
              </div>

              {/* Realistic Card Preview */}
              <div className="max-w-md mx-auto bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-5 rounded-2xl text-white shadow-md relative overflow-hidden border border-teal-800/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-6 bg-amber-400/80 rounded-md border border-amber-300" />
                    <span className="text-[10px] text-teal-200 font-mono">ESCROW SECURE</span>
                  </div>
                  <span className="text-sm font-black uppercase tracking-wider text-teal-300 font-mono">
                    {cardBrand.toUpperCase()}
                  </span>
                </div>

                <p className="font-mono text-base sm:text-lg tracking-widest text-center py-2 text-slate-100 font-bold">
                  {cardNumber || '•••• •••• •••• ••••'}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-300 pt-2">
                  <div>
                    <p className="text-[8px] text-slate-400">CARD HOLDER</p>
                    <p className="font-bold text-slate-100">{cardHolder || 'SARAH JENKINS'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400">EXPIRES</p>
                    <p className="font-bold text-slate-100">{expiryDate || 'MM/YY'}</p>
                  </div>
                </div>
              </div>

              {/* Interactive Form Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Số Thẻ' : 'Card Number'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full p-2.5 pl-10 font-mono text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">
                      credit_card
                    </span>
                    <span className="absolute right-3 top-2.5 text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {cardBrand}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'vi' ? 'Tên Chủ Thẻ' : 'Cardholder Name'}
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="SARAH JENKINS"
                      className="w-full p-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'vi' ? 'Hết Hạn (MM/YY)' : 'Expiry (MM/YY)'}
                    </label>
                    <input
                      type="text"
                      maxLength={5}
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="08/28"
                      className="w-full p-2.5 font-mono text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full p-2.5 font-mono text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* METHOD 2: VietQR & VNPay QR Interface */}
          {selectedMethod === 'vietqr' && (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-extrabold text-slate-900 text-sm">
                    {language === 'vi' ? 'Quét Mã VietQR / VNPay' : 'VietQR & Domestic Banking QR'}
                  </h5>
                  <p className="text-xs text-slate-500">
                    {language === 'vi' ? 'Hỗ trợ tất cả ngân hàng Việt Nam (VCB, Techcombank, MB, ACB, BIDV...)' : 'Instant transfer via VietQR / Napas247'}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                  ⏱️ 14:59
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="w-36 h-36 bg-slate-900 p-2.5 rounded-2xl shadow-inner flex flex-col items-center justify-center text-white text-center relative group">
                  {/* Mock Visual QR Matrix */}
                  <div className="w-full h-full bg-white rounded-xl p-1.5 flex flex-col items-center justify-center text-slate-900">
                    <span className="material-symbols-outlined text-6xl text-slate-800">qr_code_2</span>
                    <span className="text-[8px] font-black tracking-widest text-teal-800">VIETQR • NAPAS</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'vi' ? 'Ngân hàng thụ hưởng:' : 'Beneficiary Bank:'}</span>
                    <span className="font-bold text-slate-900">Techcombank (TCB)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'vi' ? 'Tên tài khoản ký quỹ:' : 'Escrow Vault Account:'}</span>
                    <span className="font-bold text-teal-700">TOUR GUIDE ESCROW VAULT</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'vi' ? 'Số tài khoản:' : 'Account Number:'}</span>
                    <span className="font-mono font-bold text-slate-900">1903 8888 6666</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{language === 'vi' ? 'Số tiền chuyển:' : 'Amount to Transfer:'}</span>
                    <span className="font-bold text-emerald-700 text-sm">{amountVND} VND (${amountUSD} USD)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-teal-900 font-medium">
                  💡 {language === 'vi' ? 'Mở app ngân hàng bất kỳ để quét mã hoặc dùng nút giả lập bên phải.' : 'Open any mobile banking app to scan, or test with quick simulation.'}
                </span>
                <button
                  type="button"
                  onClick={handleTriggerPayment}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white font-extrabold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  ⚡ {language === 'vi' ? 'Giả Lập Đã Quét QR' : 'Simulate QR Scan'}
                </button>
              </div>
            </div>
          )}

          {/* METHOD 3: MoMo & E-Wallets */}
          {selectedMethod === 'momo' && (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-pink-500/20">
                  MoMo
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-sm">
                    {language === 'vi' ? 'Thanh Toán Qua Ví MoMo / ZaloPay' : 'MoMo & ZaloPay E-Wallet'}
                  </h5>
                  <p className="text-xs text-slate-500">
                    {language === 'vi' ? 'Xác thực nhanh qua số điện thoại hoặc mã liên kết' : 'Instant 1-tap wallet authorization'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Số Điện Thoại Đăng Ký MoMo' : 'MoMo Registered Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>{language === 'vi' ? 'Số dư ví khả dụng:' : 'Available Balance:'}</span>
                  <span className="font-bold text-slate-900">5,000,000 VND</span>
                </div>
              </div>
            </div>
          )}

          {/* METHOD 4: Apple Pay / Express Checkout */}
          {selectedMethod === 'apple_pay' && (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 text-center">
              <div className="max-w-sm mx-auto space-y-3">
                <p className="text-xs text-slate-600">
                  {language === 'vi' 
                    ? 'Thanh toán siêu tốc không cần nhập số thẻ với Face ID / Touch ID.' 
                    : 'Instant biometric checkout with Apple Pay or Google Pay with zero form entry.'}
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleTriggerPayment}
                    className="w-full py-3.5 bg-black hover:bg-slate-900 text-white rounded-2xl font-black text-sm shadow-lg flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-98"
                  >
                    <span className="text-lg"></span>
                    <span>Pay with Apple Pay (${amountUSD})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerPayment}
                    className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-2xl font-black text-sm shadow-xs flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <span className="font-bold text-blue-600">G</span>
                    <span className="font-bold text-red-500">o</span>
                    <span className="font-bold text-amber-500">o</span>
                    <span className="font-bold text-blue-600">g</span>
                    <span className="font-bold text-green-600">l</span>
                    <span className="font-bold text-red-500">e</span>
                    <span>Pay</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              {language === 'vi' ? 'Quay Lại Chỉnh Sửa' : 'Back to Edit Post'}
            </button>

            <button
              type="button"
              onClick={handleTriggerPayment}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span className="material-symbols-outlined text-lg">lock</span>
              <span>
                {language === 'vi' 
                  ? `Xác Nhận & Ký Quỹ $${amountUSD} USD Vào Escrow` 
                  : `Authorize & Deposit $${amountUSD} USD in Escrow`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
