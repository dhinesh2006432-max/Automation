import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  User, 
  Phone, 
  Home, 
  ArrowRightCircle, 
  LogIn, 
  LogOut, 
  Calendar, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

// Robust helper to extract pure Outpass Code (e.g. OTP-20261024-297)
// from raw text, full Vercel/localhost URLs, query parameters, or scanner guns
const extractOutpassCode = (raw) => {
  if (!raw) return '';
  try {
    const decoded = decodeURIComponent(String(raw).trim());
    const match = decoded.match(/OTP-[A-Za-z0-9_-]+/i);
    if (match) return match[0].toUpperCase();
    const url = new URL(decoded, window.location.origin);
    const param = url.searchParams.get('code');
    if (param) return param.trim().toUpperCase();
    return decoded.toUpperCase();
  } catch (e) {
    const match = String(raw).match(/OTP-[A-Za-z0-9_-]+/i);
    return match ? match[0].toUpperCase() : String(raw).trim().toUpperCase();
  }
};

export default function QRVerificationPage() {
  const { code: routeCode } = useParams();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code');
  const activeCode = extractOutpassCode(routeCode || queryCode || '');

  const [inputCode, setInputCode] = useState(activeCode);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const handleVerify = async (codeToVerify) => {
    const cleanCode = extractOutpassCode(codeToVerify);
    if (!cleanCode) {
      setError('Please enter or scan a valid Outpass Code (e.g. OTP-20261024-297).');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setMsg('');
    setInputCode(cleanCode);

    try {
      const res = await api.get(`/outpasses/verify/${encodeURIComponent(cleanCode)}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || `Outpass code "${cleanCode}" not found or invalid.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGateAction = async (action) => {
    if (!result?.outpassCode) return;
    setActionLoading(true);
    setError('');
    setMsg('');

    try {
      const res = await api.post('/outpasses/gate-action', {
        code: result.outpassCode,
        action
      });
      setMsg(res.data.message || `Action ${action} recorded successfully!`);
      // Refresh verification status
      await handleVerify(result.outpassCode);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to record gate action: ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (activeCode) {
      setInputCode(activeCode);
      handleVerify(activeCode);
    }
  }, [routeCode, queryCode]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-lg bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-800/60">
            Security Gate Portal
          </span>
        </div>

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-3 border border-teal-500/20 shadow-lg shadow-teal-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Live Outpass QR Verification</h1>
          <p className="text-xs text-slate-400 mt-1">Campus Security Gate Scanner & Pass Authorization</p>
        </div>

        {/* Search / Scan Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleVerify(inputCode); }} className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Scan QR or paste Code / URL..."
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Pass'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 px-1">
            Accepts pass IDs (e.g. <span className="font-mono text-slate-400">OTP-20261024-297</span>), handheld barcode scanner inputs, or scanned QR URLs.
          </p>
        </form>

        {/* Status / Success Messages */}
        {msg && (
          <div className="p-3.5 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Clock className="w-6 h-6 text-teal-400 animate-spin" />
            <span>Verifying pass with campus database...</span>
          </div>
        )}

        {error && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center flex flex-col items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
            <span className="font-bold text-sm tracking-wide">VERIFICATION FAILED</span>
            <span>{error}</span>
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div className={`p-6 rounded-2xl border transition-all ${
            result.status === 'APPROVED' ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30' :
            result.status === 'OUTSIDE' ? 'bg-amber-950/20 border-amber-500/40' :
            result.status === 'OVERDUE' ? 'bg-rose-950/30 border-rose-500/50' :
            'bg-slate-900/60 border-slate-800'
          } space-y-5`}>
            
            {/* Pass Status Banner */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : result.status === 'OVERDUE' ? (
                  <AlertTriangle className="w-8 h-8 text-rose-400 animate-pulse shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <h3 className={`font-black text-sm tracking-wide ${
                    result.status === 'APPROVED' ? 'text-emerald-400' :
                    result.status === 'OUTSIDE' ? 'text-amber-400' :
                    result.status === 'OVERDUE' ? 'text-rose-400' :
                    result.valid ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {result.status === 'APPROVED' ? '✅ VALID OFFICIAL GATE PASS' :
                     result.status === 'OUTSIDE' ? '🚶 STUDENT IS CURRENTLY OUTSIDE' :
                     result.status === 'OVERDUE' ? '🚨 OVERDUE RETURN - TIME EXCEEDED' :
                     result.status === 'RETURNED' ? '🏫 PASS COMPLETED - RETURNED' :
                     'INVALID / EXPIRED PASS'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono font-bold block mt-0.5">
                    ID: {result.outpassCode}
                  </span>
                </div>
              </div>

              <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${
                result.status === 'APPROVED' ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700' :
                result.status === 'OUTSIDE' ? 'bg-amber-900/80 text-amber-200 border-amber-700' :
                result.status === 'OVERDUE' ? 'bg-rose-900/90 text-rose-200 border-rose-700 animate-pulse' :
                result.status === 'RETURNED' ? 'bg-slate-800 text-slate-300 border-slate-700' :
                'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                {result.status}
              </span>
            </div>

            {/* Student & Outpass Information */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-400" /> Student Name:
                </span>
                <span className="font-bold text-white text-sm">{result.studentName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Register Number:</span>
                <span className="font-mono font-bold text-teal-300">{result.registerNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Department & Year:</span>
                <span className="text-slate-200">{result.department} (Year {result.year})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-teal-400" /> Allocated Room:
                </span>
                <span className="text-white font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {result.roomNumber || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Out Date & Time:</span>
                <span className="text-slate-200 font-semibold">{result.outDate} at {result.outTime || '16:00'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Expected Return:</span>
                <span className={`font-bold ${result.isOverdue ? 'text-rose-400 font-black' : 'text-amber-300'}`}>
                  {result.returnDate} at {result.expectedReturnTime} {result.isOverdue && '(EXPIRED)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Outing Reason:</span>
                <span className="text-slate-200 font-medium italic">{result.reason}</span>
              </div>

              {/* Direct Call links for security gate */}
              {(result.phone || result.parentPhone) && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {result.phone && result.phone !== 'N/A' && (
                    <a
                      href={`tel:${result.phone}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-800 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-teal-400" /> Call Student: {result.phone}
                    </a>
                  )}
                  {result.parentPhone && result.parentPhone !== 'N/A' && !result.parentPhone.includes('@') && (
                    <a
                      href={`tel:${result.parentPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-800 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-amber-400" /> Call Parent: {result.parentPhone}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Security Gate Action Buttons */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Security Gate Actions
              </span>
              
              {result.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleGateAction('EXIT')}
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {actionLoading ? 'Recording Gate Exit...' : 'Record Gate Exit (Mark Outside)'}
                </button>
              )}

              {(result.status === 'OUTSIDE' || result.status === 'OVERDUE') && (
                <button
                  type="button"
                  onClick={() => handleGateAction('ENTRY')}
                  disabled={actionLoading}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {actionLoading ? 'Recording Gate Entry...' : 'Record Gate Entry (Mark Returned)'}
                </button>
              )}

              {result.status === 'RETURNED' && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-center text-xs">
                  ✅ Student has already returned and checked in at the gate.
                </div>
              )}

              {result.status === 'PENDING' && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center text-xs">
                  ⏳ This outpass is still awaiting warden approval. Cannot permit gate exit.
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
