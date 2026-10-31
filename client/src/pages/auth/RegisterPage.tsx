import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  Repeat,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  // Step state: 'details' or 'otp'
  const [step, setStep] = useState<'details' | 'otp'>('details');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR'>('INR');
  const [taxId, setTaxId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // OTP Fields
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const { login } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Password strength calculation
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();

  // Handle Step 1: Submit Details & Trigger OTP Dispatch
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/register', {
        name,
        email,
        password,
        companyName,
        currency,
        taxId,
        phoneNumber,
      });

      if (res.requiresOtp) {
        setDevOtp(res.devOtp || null);
        setStep('otp');
        setResendCooldown(60);
        showToast(`Verification code sent to ${email}`, 'info');
        // Auto focus first OTP input
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 100);
      } else {
        login(res.token, res.user, res.customer);
        showToast('Account created successfully! Welcome to SubFlow.', 'success');
        navigate('/portal');
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    // Handle paste of whole 6 digits
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (newDigits.every((d) => d !== '')) {
        verifyOtpCode(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-advance focus to next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are populated
    if (value && index === 5 && newDigits.every((d) => d !== '')) {
      verifyOtpCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Fast-fill demo OTP
  const handleQuickFill = () => {
    if (devOtp && devOtp.length === 6) {
      const digits = devOtp.split('');
      setOtpDigits(digits);
      verifyOtpCode(devOtp);
    }
  };

  // Verify OTP API Call
  const verifyOtpCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      showToast('Please enter all 6 digits of the OTP.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: code,
      });

      login(res.token, res.user, res.customer);
      showToast('Email verified successfully! Welcome to SubFlow 2.0.', 'success');
      navigate('/portal');
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed. Please check the code.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP API Call
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      const res: any = await api.post('/auth/resend-otp', { email: email.trim() });
      setDevOtp(res.devOtp || null);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      showToast('New verification code dispatched to your email!', 'success');
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend code.', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <Repeat className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-black text-2xl tracking-tight text-zinc-900 dark:text-white">
            Sub<span className="text-orange-500">Flow</span> 2.0
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {step === 'details' ? 'Create your Customer Account' : 'Verify Your Email'}
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {step === 'details' ? (
            <>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">
                Sign in here
              </Link>
            </>
          ) : (
            <>We sent a 6-digit confirmation code to <span className="font-semibold text-zinc-800 dark:text-zinc-200">{email}</span></>
          )}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900/90 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800">
          {step === 'details' ? (
            /* STEP 1: Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Rachel Adams"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Software Solutions"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="rachel@apexsoftware.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tax GST / VAT ID
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="GSTIN29AA..."
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      <div
                        className={`flex-1 rounded-full ${
                          strength >= 1 ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full ${
                          strength >= 2 ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full ${
                          strength >= 3 ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full ${
                          strength >= 4 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      {strength <= 2 ? 'Weak password' : strength === 3 ? 'Good password' : 'Strong password!'}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending verification code...
                  </>
                ) : (
                  <>
                    <span>Continue to Email Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP Verification Screen */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Please enter the 6-digit verification code sent to your email address to activate your account.
                </p>
              </div>

              {/* Developer / Demo Quick-Fill Helper */}
              {devOtp && (
                <div
                  onClick={handleQuickFill}
                  className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                    <span className="text-[11px] text-orange-800 dark:text-orange-300 font-medium">
                      Demo Helper: Your OTP is <strong className="font-mono text-sm tracking-wider text-orange-600 dark:text-orange-400">{devOtp}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider bg-orange-200/60 dark:bg-orange-900/80 px-2 py-0.5 rounded-full">
                    1-Click Fill
                  </span>
                </div>
              )}

              {/* 6 Digit OTP Inputs */}
              <div>
                <label className="block text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputsRef.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-13 text-center text-lg font-bold font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => verifyOtpCode()}
                disabled={isLoading || otpDigits.some((d) => d === '')}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Verifying code & activating...
                  </>
                ) : (
                  <>
                    <span>Verify & Launch Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend & Back controls */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
