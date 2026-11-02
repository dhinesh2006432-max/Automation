import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import { Home, Download, CheckCircle2, Clock, AlertCircle, FileText, Send, Sparkles, UserCheck, RefreshCw } from 'lucide-react';

export default function RoomRequestPage() {
  const { user } = useAuth();
  const student = user?.profile || {};

  const [preferredBlock, setPreferredBlock] = useState('Block A');
  const [preferredFloor, setPreferredFloor] = useState('1');
  const [preferredRoomType, setPreferredRoomType] = useState('2 Sharing');
  const [preferredAc, setPreferredAc] = useState('AC');
  const [preferredBathroom, setPreferredBathroom] = useState('Attached');
  const [specialReqs, setSpecialReqs] = useState('');
  const [feeReceipt, setFeeReceipt] = useState(null);

  const [activeRequest, setActiveRequest] = useState(null);
  const [allocatedRoom, setAllocatedRoom] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (student.gender) {
      setPreferredBlock(student.gender.toUpperCase().includes('FEMALE') ? 'Block B' : 'Block A');
    }
    fetchAllocationStatus();
  }, [user]);

  const fetchAllocationStatus = async () => {
    try {
      const res = await api.get('/allocations/my-allocation');
      if (res.data?.room) {
        setAllocatedRoom(res.data.room);
        setRoommates(res.data.roommates || []);
      } else {
        setAllocatedRoom(null);
      }

      if (res.data?.request) {
        setActiveRequest(res.data.request);
        const req = res.data.request;
        if (req.preferred_block) setPreferredBlock(req.preferred_block);
        if (req.preferred_floor) setPreferredFloor(String(req.preferred_floor));
        if (req.preferred_room_type) setPreferredRoomType(req.preferred_room_type);
        if (req.preferred_ac) setPreferredAc(req.preferred_ac);
        if (req.preferred_bathroom) setPreferredBathroom(req.preferred_bathroom);
        if (req.special_requirements) setSpecialReqs(req.special_requirements);
      }
    } catch (err) {
      console.error('Fetch allocation error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    // Enforce mandatory fee receipt upload
    if (!feeReceipt && (!activeRequest || !activeRequest.fee_receipt_url)) {
      setError('Fee receipt upload is mandatory. Please attach your payment receipt before submitting a room allocation request.');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('preferred_block', preferredBlock);
      data.append('preferred_floor', preferredFloor);
      data.append('preferred_room_type', preferredRoomType);
      data.append('preferred_ac', preferredAc);
      data.append('preferred_bathroom', preferredBathroom);
      data.append('special_requirements', specialReqs);
      if (feeReceipt) data.append('feeReceipt', feeReceipt);

      const res = await api.post('/allocations/request', data);
      setMsg(res.data?.message || 'Room allocation request and fee receipt submitted successfully! Routed to Warden for verification.');
      setActiveRequest(res.data?.request);
      setShowEditForm(false);
      fetchAllocationStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit room request.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await api.get('/allocations/download-pdf', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Room-Allocation-${student.register_number || 'Letter'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Could not generate PDF. Please verify your allocation status.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Hostel Room Allocation</h2>
            <p className="text-xs text-slate-500">Live room assignment status & preference submissions</p>
          </div>
          {allocatedRoom ? (
            <Badge status="ALLOCATED" />
          ) : activeRequest ? (
            <Badge status={activeRequest.status} />
          ) : (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Not Requested Yet
            </span>
          )}
        </div>

        {msg && (
          <div className="mb-6 p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. ACTIVE ALLOCATION VIEW */}
        {allocatedRoom ? (
          <div className="p-6 rounded-3xl bg-teal-50/70 border border-teal-200 space-y-6">
            <div className="flex items-center gap-3 text-teal-900 font-extrabold text-sm">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span>Room Assigned & Confirmed</span>
                <p className="text-xs font-normal text-teal-700">You are officially registered into this hostel room.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-teal-100 text-xs shadow-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Room Number</span>
                <span className="font-extrabold text-teal-950 text-xl font-mono">{allocatedRoom.room_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Block / Floor</span>
                <span className="font-bold text-slate-800">{allocatedRoom.block} (Floor {allocatedRoom.floor})</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Specifications</span>
                <span className="font-bold text-slate-800">{allocatedRoom.room_type} • {allocatedRoom.ac_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Bathroom Style</span>
                <span className="font-bold text-slate-800">{allocatedRoom.bathroom_type} Bathroom</span>
              </div>
            </div>

            {/* Roommates in this room */}
            {roommates.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-teal-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Your Roommates:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {roommates.map(mate => (
                    <div key={mate.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{mate.name}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{mate.register_number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Preparing PDF...' : 'Download Official Allocation Slip (PDF)'}
            </button>
          </div>
        ) : activeRequest && activeRequest.status === 'PENDING' && !showEditForm ? (
          /* 2. PENDING REQUEST CARD */
          <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-amber-900 font-extrabold text-sm">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span>Allocation Request Under Review</span>
                  <p className="text-xs font-normal text-amber-700">Warden is processing hostel room assignments.</p>
                </div>
              </div>
              <Badge status="PENDING" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-amber-100 text-xs shadow-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Preferred Block</span>
                <span className="font-bold text-slate-800">{activeRequest.preferred_block}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Preferred Floor</span>
                <span className="font-bold text-slate-800">Floor {activeRequest.preferred_floor}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Room Type</span>
                <span className="font-bold text-slate-800">{activeRequest.preferred_room_type} ({activeRequest.preferred_ac})</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Bathroom</span>
                <span className="font-bold text-slate-800">{activeRequest.preferred_bathroom}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Submission Date</span>
                <span className="font-bold text-slate-800">{activeRequest.created_at ? new Date(activeRequest.created_at).toLocaleDateString() : 'Today'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[10px] font-bold">Fee Receipt Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {activeRequest.fee_verified || activeRequest.fee_status === 'VERIFIED_BY_WARDEN' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified by Warden
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending Warden Verification
                    </span>
                  )}
                  {activeRequest.fee_receipt_url && (
                    <a
                      href={activeRequest.fee_receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-teal-600 underline font-semibold hover:text-teal-800 ml-1"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Pipeline Message */}
            <div className={`p-4 rounded-2xl text-xs border ${
              activeRequest.fee_verified || activeRequest.fee_status === 'VERIFIED_BY_WARDEN'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-100/60 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-start gap-2.5">
                {activeRequest.fee_verified || activeRequest.fee_status === 'VERIFIED_BY_WARDEN' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-xs">
                    {activeRequest.fee_verified || activeRequest.fee_status === 'VERIFIED_BY_WARDEN'
                      ? 'Fee Verified by Warden — Room Allocation Authorized'
                      : 'Fee Receipt Submitted — Awaiting Warden Verification'}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                    {activeRequest.fee_verified || activeRequest.fee_status === 'VERIFIED_BY_WARDEN'
                      ? 'The Warden has verified your fee receipt and dispatched authorization to the Admin module. Your room allocation will be assigned shortly.'
                      : 'Your fee payment receipt is currently under review by your Block Warden. Once verified, the Admin and Warden will assign your room.'}
                  </p>
                </div>
              </div>
            </div>

            {activeRequest.special_requirements && (
              <div className="bg-white p-3.5 rounded-2xl border border-amber-100 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Special Notes / Medical Preferences:</span>
                <p className="text-slate-700">{activeRequest.special_requirements}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowEditForm(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Modify My Preferences
              </button>
              <button
                type="button"
                onClick={fetchAllocationStatus}
                className="px-4 py-2.5 rounded-xl bg-white border border-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-50 flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
              </button>
            </div>
          </div>
        ) : (
          /* 3. REQUEST FORM (FIRST TIME OR EDITING) */
          <div>
            {showEditForm && (
              <div className="mb-4 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Updating Your Existing Allocation Request</span>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Block</label>
                  <select
                    value={preferredBlock}
                    onChange={e => setPreferredBlock(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Block A">Block A (Boys Hostel)</option>
                    <option value="Block B">Block B (Girls Hostel)</option>
                    <option value="Block C">Block C (International / PG Block)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Floor</label>
                  <select
                    value={preferredFloor}
                    onChange={e => setPreferredFloor(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room Occupancy Type</label>
                  <select
                    value={preferredRoomType}
                    onChange={e => setPreferredRoomType(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="2 Sharing">2 Sharing (Double Room)</option>
                    <option value="3 Sharing">3 Sharing (Triple Room)</option>
                    <option value="4 Sharing">4 Sharing (Quad Room)</option>
                    <option value="Common Room">Common Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Air Conditioning</label>
                  <select
                    value={preferredAc}
                    onChange={e => setPreferredAc(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="AC">AC (Air Conditioned)</option>
                    <option value="Non-AC">Non-AC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bathroom Style</label>
                  <select
                    value={preferredBathroom}
                    onChange={e => setPreferredBathroom(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Attached">Attached Bathroom</option>
                    <option value="Common">Common Bathroom</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Upload Hostel Fee Receipt <span className="text-rose-500 font-extrabold">* (Mandatory)</span>
                    </label>
                    <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                      Required
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required={!activeRequest?.fee_receipt_url}
                    onChange={e => setFeeReceipt(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Upload official payment challan or bank receipt. The receipt will be submitted to the <strong>Warden for verification</strong> before your room can be allocated.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Requirements / Medical Requests</label>
                <textarea
                  rows={3}
                  value={specialReqs}
                  onChange={e => setSpecialReqs(e.target.value)}
                  placeholder="e.g., Lower floor request due to knee injury, quiet room preference..."
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Submitting...' : showEditForm ? 'Update My Preferences' : 'Submit Room Preference Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
