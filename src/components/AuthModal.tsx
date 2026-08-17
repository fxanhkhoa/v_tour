import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Language, translations } from '../lib/translations';
import { signInWithGoogleViaFirebase, isFirebaseClientConfigured } from '../lib/firebaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: User, token: string) => void;
  language?: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  language = 'en'
}) => {
  if (!isOpen) return null;

  const t = translations[language] || translations.en;
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
  const [googleRoleSelect, setGoogleRoleSelect] = useState<UserRole>('traveler');

  // Form states
  const [loginEmail, setLoginEmail] = useState<string>('sarah.j@example.com');
  const [loginPassword, setLoginPassword] = useState<string>('password123');

  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupRole, setSignupRole] = useState<UserRole>('traveler');

  const isConfigured = isFirebaseClientConfigured();

  // Pre-configured Quick Demo Accounts
  const sampleDemoAccounts = [
    {
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      role: 'traveler' as UserRole,
      badge: language === 'vi' ? 'Du Khách (Sarah)' : 'Traveler (Sarah Jenkins)'
    },
    {
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: 'traveler' as UserRole,
      badge: language === 'vi' ? 'Du Khách (Alex)' : 'Traveler (Alex Johnson)'
    },
    {
      name: 'Minh Nguyen',
      email: 'minh.guide@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      role: 'guide' as UserRole,
      badge: language === 'vi' ? 'HDV Đã Duyệt (Minh)' : 'Verified Guide (Minh Nguyen)'
    },
    {
      name: 'Linh Tran',
      email: 'linh.saigon@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      role: 'guide' as UserRole,
      badge: language === 'vi' ? 'HDV Đã Duyệt (Linh)' : 'Verified Guide (Linh Tran)'
    },
    {
      name: 'Hoang Nam',
      email: 'hoangnam@example.com',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      role: 'guide' as UserRole,
      badge: language === 'vi' ? 'HDV Đang Duyệt ⏳' : 'Guide (Under Review ⏳)'
    },
    {
      name: 'Alexander Wright',
      email: 'admin@tourguidehub.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      role: 'admin' as UserRole,
      badge: language === 'vi' ? 'Quản Trị Viên' : 'Platform Admin'
    }
  ];

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    setVerificationSuccess(null);

    try {
      if (isConfigured) {
        // Real Firebase Google Auth Popup
        const result = await signInWithGoogleViaFirebase(googleRoleSelect);
        setVerificationSuccess(
          language === 'vi'
            ? `Đăng nhập Google thành công! Xin chào ${result.user.name}`
            : `Signed in with Google! Welcome, ${result.user.name}`
        );

        setTimeout(() => {
          setIsGoogleLoading(false);
          onAuthenticated(result.user, result.token);
          onClose();
        }, 500);
      } else {
        // If keys are not yet provided in .env, seamlessly call backend verify endpoint with demo Google user
        const mockGoogleEmail = googleRoleSelect === 'guide' ? 'google.guide@example.com' : 'google.traveler@gmail.com';
        const mockName = googleRoleSelect === 'guide' ? 'Alex Rivera (Google Guide)' : 'Emma Watson (Google Traveler)';
        const mockAvatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`;

        const res = await fetch('/api/auth/google-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: 'mock_firebase_google_id_token.' + btoa(JSON.stringify({ email: mockGoogleEmail, name: mockName, picture: mockAvatar })) + '.sig',
            email: mockGoogleEmail,
            name: mockName,
            picture: mockAvatar,
            role: googleRoleSelect,
            firebaseUid: 'fb_google_' + Date.now()
          })
        });

        const data = await res.json();
        if (!res.ok || !data.user) {
          throw new Error(data.error || 'Google login failed');
        }

        setVerificationSuccess(
          language === 'vi'
            ? `Đăng nhập Google thành công! Xin chào ${data.user.name}`
            : `Google Sign-In successful! Welcome, ${data.user.name}`
        );

        setTimeout(() => {
          setIsGoogleLoading(false);
          onAuthenticated(data.user, data.token || 'google_jwt_token');
          onClose();
        }, 500);
      }
    } catch (err: any) {
      console.error('Google Sign-in Error:', err);
      setAuthError(err.message || (language === 'vi' ? 'Lỗi xác thực Google' : 'Google authentication error.'));
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent, overrideEmail?: string) => {
    if (e) e.preventDefault();
    const emailToUse = overrideEmail || loginEmail;
    if (!emailToUse) {
      setAuthError(language === 'vi' ? 'Vui lòng nhập email' : 'Please enter an email address');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);
    setVerificationSuccess(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, password: loginPassword })
      });

      const data = await res.json();

      if (!res.ok || !data.user) {
        throw new Error(data.error || (language === 'vi' ? 'Đăng nhập thất bại' : 'Login failed'));
      }

      setVerificationSuccess(
        language === 'vi'
          ? `Đăng nhập thành công! Xin chào ${data.user.name}`
          : `Signed in successfully! Welcome back, ${data.user.name}`
      );

      setTimeout(() => {
        setIsAuthenticating(false);
        onAuthenticated(data.user, data.token || 'jwt_simulated_token');
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Login Error:', err);
      setAuthError(err.message || (language === 'vi' ? 'Đăng nhập thất bại' : 'Authentication failed'));
      setIsAuthenticating(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      setAuthError(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill in all fields');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);
    setVerificationSuccess(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: signupRole
        })
      });

      const data = await res.json();

      if (!res.ok || !data.user) {
        throw new Error(data.error || (language === 'vi' ? 'Đăng ký thất bại' : 'Signup failed'));
      }

      setVerificationSuccess(
        language === 'vi'
          ? `Tạo tài khoản thành công! Xin chào ${data.user.name}`
          : `Account created successfully! Welcome, ${data.user.name}`
      );

      setTimeout(() => {
        setIsAuthenticating(false);
        onAuthenticated(data.user, data.token || 'jwt_simulated_token');
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Signup Error:', err);
      setAuthError(err.message || (language === 'vi' ? 'Đăng ký thất bại' : 'Signup failed'));
      setIsAuthenticating(false);
    }
  };

  const handleQuickDemoClick = (acc: typeof sampleDemoAccounts[0]) => {
    setLoginEmail(acc.email);
    handleLoginSubmit(undefined, acc.email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative border border-slate-100 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto my-auto">
        
        <button
          onClick={onClose}
          className="sticky top-0 float-right text-slate-400 hover:text-slate-600 cursor-pointer z-20 p-1.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-slate-100 transition-all shadow-sm border border-slate-100 -mr-1 -mt-1"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-xl block">close</span>
        </button>

        {/* Header Logo & Title */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          </div>
          <h3 className="font-black text-xl text-slate-900">
            {mode === 'login' ? t.authTitleLogin : t.authTitleRegister}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.tokenPayloadValidated}
          </p>
        </div>

        {/* Status Alerts */}
        {authError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
            <span className="material-symbols-outlined text-base text-rose-600 shrink-0">error</span>
            <span>{authError}</span>
          </div>
        )}

        {verificationSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-pulse">
            <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">verified</span>
            <span>{verificationSuccess}</span>
          </div>
        )}

        {/* Active Firebase Google Sign-In */}
        <div className="mb-4 space-y-2.5">
          {/* Role selector for Google sign-in */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold text-slate-600">
              {language === 'vi' ? 'Đăng nhập Google với tư cách:' : 'Sign in with Google as:'}
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setGoogleRoleSelect('traveler')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  googleRoleSelect === 'traveler' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'vi' ? 'Du Khách' : 'Traveler'}
              </button>
              <button
                type="button"
                onClick={() => setGoogleRoleSelect('guide')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  googleRoleSelect === 'guide' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {language === 'vi' ? 'Hướng Dẫn Viên' : 'Tour Guide'}
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={isGoogleLoading || isAuthenticating}
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:border-teal-500 bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center transition-all cursor-pointer group shadow-sm hover:shadow-md active:scale-98 disabled:opacity-50"
          >
            <div className="flex items-center space-x-2.5">
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="font-extrabold text-xs text-slate-800 group-hover:text-teal-800">
                {isGoogleLoading
                  ? (language === 'vi' ? 'Đang xác thực Google...' : 'Authenticating with Google...')
                  : (language === 'vi' ? `Tiếp tục với Google (${googleRoleSelect === 'guide' ? 'HDV' : 'Du Khách'})` : `Continue with Google (${googleRoleSelect === 'guide' ? 'Guide' : 'Traveler'})`)
                }
              </span>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-3 font-bold text-slate-400 tracking-wider">
              {language === 'vi' ? 'Đăng nhập bằng Email & Mật Khẩu' : 'Email & Password Auth'}
            </span>
          </div>
        </div>

        {/* Login / Signup Tab Selector */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setAuthError(null);
            }}
            className={`py-2 text-xs font-black rounded-xl cursor-pointer transition-all ${
              mode === 'login' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.loginBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setAuthError(null);
            }}
            className={`py-2 text-xs font-black rounded-xl cursor-pointer transition-all ${
              mode === 'signup' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.signupBtn}
          </button>
        </div>

        {isAuthenticating ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-extrabold text-slate-800">{t.contactingBackend}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mode === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.emailAddress}</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. sarah@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.password}</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-lg cursor-pointer flex items-center justify-center space-x-2 transition-all"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>{t.loginBtn}</span>
                </button>

                {/* Quick 1-Click Demo Section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    {t.quickDemoLogin}
                  </p>
                  <div className="space-y-1.5">
                    {sampleDemoAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickDemoClick(acc)}
                        className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/50 flex items-center justify-between transition-all cursor-pointer text-left group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs group-hover:text-teal-700">
                              {acc.name}
                            </p>
                            <p className="text-[10px] text-slate-500">{acc.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                          {acc.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              /* SIGNUP FORM */
              <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.fullName}</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.emailAddress}</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.password}</label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.selectRole}</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="traveler">{t.roleTravelerDesc}</option>
                    <option value="guide">{t.roleGuideDesc}</option>
                    <option value="admin">{t.roleAdminDesc}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-lg cursor-pointer flex items-center justify-center space-x-2 transition-all mt-2"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>{t.signupBtn}</span>
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[10px] text-teal-800 font-extrabold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                {t.backendTokenActive}
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
