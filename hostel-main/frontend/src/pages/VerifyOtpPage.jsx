import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ShieldCheck, AlertCircle, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';

export default function VerifyOtpPage() {
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();

  // Redirect to register if no email passed
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Handle countdown for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      setSuccess(res.data?.message || 'Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setError('');
    setResending(true);

    try {
      const res = await api.post('/auth/resend-otp', { email });
      setSuccess(res.data?.message || 'A fresh OTP code has been sent to your email.');
      setResendCooldown(60);
      setOtp('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const [otpHint, setOtpHint] = useState('');
  const [loadingHint, setLoadingHint] = useState(false);

  const handleFetchHint = async () => {
    setLoadingHint(true);
    setError('');
    try {
      const res = await api.post('/auth/get-otp-hint', { email });
      if (res.data?.otp) {
        setOtpHint(res.data.otp);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not retrieve OTP. Please try Resend OTP.');
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-center border border-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-sm">
          <Mail className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-black text-slate-800">Verify Your Email</h2>
        <p className="text-xs text-slate-500 mt-1.5 mb-4 leading-relaxed">
          We sent a 6-digit OTP verification code to:<br />
          <strong className="text-slate-800 text-sm font-semibold break-all">{email}</strong>
        </p>

        {/* Spam / Junk Notice for Sri Shakthi College mail */}
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left leading-relaxed">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-950">Check Spam / Junk Folder:</strong>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Sri Shakthi college mail servers often direct automated notifications into your <strong>Spam / Junk</strong> folder.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2.5 text-left animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {otpHint && (
          <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs text-left animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-700">Your Active OTP Code:</span>
              <span className="font-mono text-base font-bold text-indigo-900 tracking-widest bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm">{otpHint}</span>
            </div>
            <p className="text-[11px] text-indigo-600 mt-1.5">
              Please enter the 6 digits manually in the input box below.
            </p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full text-center text-3xl font-mono tracking-[0.6em] py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-inner placeholder:tracking-[0.4em] placeholder:text-slate-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Activate Account</span>
              </>
            )}
          </button>
        </form>

        {/* Helpers: Resend & Show OTP */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Didn't receive email?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="font-bold text-teal-600 hover:text-teal-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP Email'}
            </button>
          </div>

          {!otpHint && (
            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
              <span className="text-slate-400">College inbox delayed?</span>
              <button
                type="button"
                onClick={handleFetchHint}
                disabled={loadingHint}
                className="font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors underline underline-offset-2"
              >
                {loadingHint ? 'Checking...' : 'Reveal My OTP'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <Link
            to="/register"
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Register
          </Link>
        </div>
      </div>
    </div>
  );
}
