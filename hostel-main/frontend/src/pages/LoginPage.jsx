import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const initialRole = location.state?.role || searchParams.get('role') || 'STUDENT';
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState(location.state?.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.successMessage || '');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
    if (location.state?.role) {
      setRole(location.state.role);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your registered Email ID.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address (e.g. name@srishakthi.ac.in).');
      return;
    }

    setLoading(true);

    try {
      const user = await login(trimmedEmail, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'WARDEN') {
        navigate('/warden/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please make sure the backend is running on port 5000.');
      } else {
        setError(err.response?.data?.error || 'Invalid credentials. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black flex items-center justify-center text-xl mx-auto mb-3 shadow-lg shadow-teal-600/30">
            H
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">Welcome Back</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in with your registered Email ID</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setRole('STUDENT'); setError(''); }}
            className={`py-2 rounded-xl transition-all ${role === 'STUDENT' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => { setRole('WARDEN'); setError(''); }}
            className={`py-2 rounded-xl transition-all ${role === 'WARDEN' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Warden
          </button>
          <button
            type="button"
            onClick={() => { setRole('ADMIN'); setError(''); }}
            className={`py-2 rounded-xl transition-all ${role === 'ADMIN' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Admin
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {role === 'WARDEN' ? 'Official Warden Email' : role === 'ADMIN' ? 'Admin Email' : 'Student Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={role === 'WARDEN' ? 'dhineshd24am@srishakthi.ac.in' : role === 'ADMIN' ? 'dhinesh2006432@gmail.com' : 'name@srishakthi.ac.in'}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sign in using your registered <strong>Email ID</strong>.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-semibold text-teal-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : `Sign in to ${role} Portal`} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-teal-600 hover:underline">
              Register Student Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
