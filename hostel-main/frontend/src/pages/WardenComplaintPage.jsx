import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { AlertCircle, CheckCircle2, ShieldAlert, Image as ImageIcon, Send } from 'lucide-react';

export default function WardenComplaintPage() {
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [selectedComp, setSelectedComp] = useState(null);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [wardenResponse, setWardenResponse] = useState('');
  const [rectificationPhoto, setRectificationPhoto] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter]);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints', {
        params: { status: statusFilter, priority: priorityFilter }
      });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComp) return;
    setLoading(true);

    try {
      const data = new FormData();
      data.append('status', status);
      data.append('warden_response', wardenResponse);
      if (rectificationPhoto) data.append('rectificationPhoto', rectificationPhoto);

      await api.put(`/complaints/${selectedComp.id}`, data);
      setSelectedComp(null);
      setWardenResponse('');
      setRectificationPhoto(null);
      setMsg('Complaint status updated and student notified!');
      fetchComplaints();
    } catch (err) {
      alert('Failed to update complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Warden Maintenance & Complaint Queue</h2>
          <p className="text-xs text-slate-500">Filter priority complaints, assign repair personnel, & upload rectification proofs</p>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">All Priorities</option>
          <option value="EMERGENCY">🚨 EMERGENCY Only</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RECTIFIED">RECTIFIED</option>
        </select>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center text-xs text-slate-400 border border-slate-200">
            No complaints matching filter options.
          </div>
        ) : (
          complaints.map(comp => (
            <div key={comp.id} className={`bg-white rounded-3xl p-6 border shadow-xs space-y-4 ${comp.priority === 'EMERGENCY' ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-800">Room {comp.room_number}: {comp.title}</span>
                  <Badge status={comp.priority} />
                  <span className="text-xs text-slate-400">({comp.category})</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={comp.status} />
                  <button
                    onClick={() => { setSelectedComp(comp); setStatus(comp.status); setWardenResponse(comp.warden_response || ''); }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    Action
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600">{comp.description}</p>
              <div className="text-[11px] text-slate-400 font-semibold">
                Submitted by: {comp.student?.name || 'Student'} ({comp.student?.register_number}) • {new Date(comp.created_at).toLocaleDateString()}
              </div>

              {comp.photo_url && (
                <a href={comp.photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:underline">
                  <ImageIcon className="w-3.5 h-3.5" /> View Uploaded Photo Proof
                </a>
              )}

              {comp.warden_response && (
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100 text-xs">
                  <strong className="text-teal-800 block">Warden Action Note:</strong>
                  <span className="text-slate-700">{comp.warden_response}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {selectedComp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Update Complaint Status</h3>

            <form onSubmit={handleUpdateComplaint} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RECTIFIED">RECTIFIED (Resolved)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warden Response / Electrician Note</label>
                <textarea
                  rows={3}
                  required
                  value={wardenResponse}
                  onChange={e => setWardenResponse(e.target.value)}
                  placeholder="Electrician / Plumber assigned, work in progress..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Rectification Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setRectificationPhoto(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedComp(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                >
                  {loading ? 'Updating...' : 'Save & Notify Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
