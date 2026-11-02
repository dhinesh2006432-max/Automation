import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { AlertCircle, Plus, Upload, CheckCircle2, Image as ImageIcon, Send } from 'lucide-react';

export default function StudentComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('Fan not working');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [roomNumber, setRoomNumber] = useState('A-101');
  const [photo, setPhoto] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('category', category);
      data.append('title', title);
      data.append('description', description);
      data.append('priority', priority);
      data.append('room_number', roomNumber);
      if (photo) data.append('photo', photo);

      await api.post('/complaints', data);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPhoto(null);
      setMsg('Complaint submitted to warden office.');
      fetchComplaints();
    } catch (err) {
      alert('Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Hostel Complaints Portal</h2>
          <p className="text-xs text-slate-500">Report room maintenance, electrical, plumbing, or facility issues</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Submit New Complaint
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Complaints List Cards */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center text-xs text-slate-400 border border-slate-200">
            No complaints submitted yet.
          </div>
        ) : (
          complaints.map(comp => (
            <div key={comp.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-800">Room {comp.room_number}: {comp.title}</span>
                  <Badge status={comp.priority} />
                </div>
                <Badge status={comp.status} />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{comp.description}</p>

              {comp.photo_url && (
                <div className="flex items-center gap-2">
                  <a href={comp.photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline">
                    <ImageIcon className="w-3.5 h-3.5" /> View Uploaded Issue Photo
                  </a>
                </div>
              )}

              {comp.warden_response && (
                <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-100 text-xs space-y-1">
                  <span className="font-bold text-teal-800 block">Warden Response:</span>
                  <p className="text-slate-700">{comp.warden_response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal for Complaint Submit */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Submit Hostel Complaint</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Complaint Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Fan not working">Fan not working</option>
                  <option value="Light not working">Light not working</option>
                  <option value="Water problem">Water problem</option>
                  <option value="Bathroom problem">Bathroom problem</option>
                  <option value="Electricity problem">Electricity problem</option>
                  <option value="Furniture damage">Furniture damage</option>
                  <option value="AC problem">AC problem</option>
                  <option value="Wi-Fi problem">Wi-Fi problem</option>
                  <option value="Cleaning problem">Cleaning problem</option>
                  <option value="Food problem">Food problem</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Priority Level</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="EMERGENCY">🚨 EMERGENCY (Immediate Action Required)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Complaint Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Ceiling Fan vibrating excessively"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe when the problem started..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Photo Proof (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setPhoto(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
                >
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
