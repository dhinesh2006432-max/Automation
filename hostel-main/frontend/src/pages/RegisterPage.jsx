import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, ShieldCheck, AlertCircle, Building } from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'STUDENT';
  const [role, setRole] = useState(initialRole);

  // Student Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registerNumber: '',
    phone: '',
    department: 'Computer Science & Engineering',
    course: 'B.Tech CS',
    year: '3',
    gender: 'Male',
    parentName: '',
    parentPhone: '',
    address: '',

    // Warden specific fields
    employeeId: '',
    blockAssigned: 'Block A (Boys Hostel)',
    designation: 'Hostel Warden'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' || name === 'parentPhone') {
      // Allow only numbers and restrict strictly to max 10 digits
      const onlyDigits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: onlyDigits }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits (numbers only).');
      return;
    }

    if (role === 'STUDENT' && formData.parentPhone.length !== 10) {
      setError('Parent contact phone must be exactly 10 digits (numbers only).');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    if (role === 'STUDENT' && !cleanEmail.endsWith('@srishakthi.ac.in')) {
      setError('Student registration is restricted to official college email IDs ending with @srishakthi.ac.in');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        role
      };

      await register(payload);
      navigate('/login', {
        state: {
          registeredEmail: formData.email,
          registeredPhone: formData.phone,
          role: role,
          successMessage: 'Account registered and activated successfully! Please sign in with your password.'
        }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black flex items-center justify-center text-xl mx-auto mb-3 shadow-lg shadow-teal-600/30">
            H
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">
            {role === 'WARDEN' ? 'Warden Official Registration' : 'Student Account Registration'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'WARDEN' ? 'Register warden staff credentials & assigned hostel block' : 'Enter student academic & guardian details'}
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setRole('STUDENT'); setError(''); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              role === 'STUDENT' ? 'bg-white text-teal-700 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Student Registration
          </button>
          <button
            type="button"
            onClick={() => { setRole('WARDEN'); setError(''); }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              role === 'WARDEN' ? 'bg-white text-teal-700 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Warden Registration
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Common Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={role === 'WARDEN' ? 'Dr. Robert Vance' : 'Alex Johnson'}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                {role === 'WARDEN' ? 'Official Warden Email' : 'Student College Email'}
              </label>
              {role === 'STUDENT' && (
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  @srishakthi.ac.in only
                </span>
              )}
            </div>
            <input
              type="email"
              required
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={role === 'WARDEN' ? 'warden@hostel.edu' : 'student24cs@srishakthi.ac.in'}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {role === 'STUDENT' && (
              <p className="text-[11px] text-slate-400 mt-1">
                Only official college email addresses ending with <strong>@srishakthi.ac.in</strong> are permitted.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Phone Number</label>
              <span className={`text-[10px] font-mono font-bold ${formData.phone.length === 10 ? 'text-teal-600' : 'text-slate-400'}`}>
                {formData.phone.length}/10 digits
              </span>
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tracking-wider"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Must be exactly 10 digits (numbers only).</p>
          </div>

          {/* Warden Specific Registration Fields */}
          {role === 'WARDEN' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee / Staff ID</label>
                <input
                  type="text"
                  required
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="W-103"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Hostel Block</label>
                <select
                  name="blockAssigned"
                  value={formData.blockAssigned}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Block A (Boys Hostel)">Block A (Boys Hostel)</option>
                  <option value="Block B (Girls Hostel)">Block B (Girls Hostel)</option>
                  <option value="Block C (PG & International)">Block C (PG & International)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation Title</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Chief Warden / Senior Warden / Assistant Warden"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </>
          ) : (
            /* Student Specific Fields */
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Register / Roll Number</label>
                <input
                  type="text"
                  required
                  name="registerNumber"
                  value={formData.registerNumber}
                  onChange={handleChange}
                  placeholder="CS2024001"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  required
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  placeholder="Parent Name"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Parent Contact Phone</label>
                  <span className={`text-[10px] font-mono font-bold ${formData.parentPhone.length === 10 ? 'text-teal-600' : 'text-slate-400'}`}>
                    {formData.parentPhone.length}/10 digits
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Must be exactly 10 digits (numbers only).</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Residential Address</label>
                <textarea
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Full address details..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Registering Account...' : `Register ${role === 'WARDEN' ? 'Warden' : 'Student'} Profile`}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>Already registered?</span>
          <Link to={`/login?role=${role}`} className="font-bold text-teal-600 hover:underline">
            Go to {role === 'WARDEN' ? 'Warden' : 'Student'} Login
          </Link>
        </div>
      </div>
    </div>
  );
}
