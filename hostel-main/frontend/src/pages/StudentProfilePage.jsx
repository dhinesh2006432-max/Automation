import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Phone, Upload, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function StudentProfilePage() {
  const { user, setUser } = useAuth();
  const profile = user?.profile || {};

  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    department: profile.department || '',
    course: profile.course || '',
    year: profile.year || 3,
    gender: profile.gender || 'Male',
    dob: profile.dob || '2003-01-01',
    blood_group: profile.blood_group || 'O+',
    parent_name: profile.parent_name || '',
    parent_phone: profile.parent_phone || '',
    address: profile.address || '',
    emergency_contact: profile.emergency_contact || ''
  });

  const [studentIdCard, setStudentIdCard] = useState(null);
  const [passportPhoto, setPassportPhoto] = useState(null);

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' || name === 'parent_phone') {
      const onlyDigits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: onlyDigits }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (formData.phone && formData.phone.length !== 10) {
      setError('Personal phone number must be exactly 10 digits (numbers only).');
      return;
    }
    if (formData.parent_phone && formData.parent_phone.length !== 10) {
      setError('Parent phone number must be exactly 10 digits (numbers only).');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (studentIdCard) data.append('studentIdCard', studentIdCard);
      if (passportPhoto) data.append('passportPhoto', passportPhoto);

      const res = await api.put('/auth/profile', data);
      setMsg('Profile details updated successfully!');

      // Update auth context profile state
      if (user) {
        setUser({ ...user, profile: res.data.student });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xl">
            {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'ST'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Student Profile & Records</h2>
            <p className="text-xs text-slate-500">Manage your personal, academic, and document verification details</p>
          </div>
        </div>

        {msg && (
          <div className="mb-6 p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{msg}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Register / Roll Number</label>
            <input
              type="text"
              disabled
              value={profile.register_number || ''}
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono font-bold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Personal Phone Number</label>
              <span className={`text-[10px] font-mono font-bold ${formData.phone?.length === 10 ? 'text-teal-600' : 'text-slate-400'}`}>
                {formData.phone?.length || 0}/10 digits
              </span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-mono tracking-wider"
            />
            <p className="text-[10px] text-slate-400 mt-1">Must be exactly 10 digits (numbers only).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course & Year</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="B.Tech"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-24 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gender & Blood Group</label>
            <div className="flex gap-2">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                placeholder="O+"
                className="w-24 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Parent / Guardian Name</label>
            <input
              type="text"
              name="parent_name"
              value={formData.parent_name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Parent Phone Number</label>
              <span className={`text-[10px] font-mono font-bold ${formData.parent_phone?.length === 10 ? 'text-teal-600' : 'text-slate-400'}`}>
                {formData.parent_phone?.length || 0}/10 digits
              </span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              name="parent_phone"
              value={formData.parent_phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-mono tracking-wider"
            />
            <p className="text-[10px] text-slate-400 mt-1">Must be exactly 10 digits (numbers only).</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Address</label>
            <textarea
              rows={2}
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* File Uploads */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload Student ID Card</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={e => setStudentIdCard(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload Passport Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setPassportPhoto(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
