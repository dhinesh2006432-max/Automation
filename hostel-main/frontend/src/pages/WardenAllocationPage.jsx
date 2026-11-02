import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { 
  Sparkles, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  Search, 
  Building, 
  Users, 
  Clock, 
  FileText, 
  DoorOpen, 
  ExternalLink, 
  Lock, 
  ShieldCheck,
  X,
  Bot,
  Download,
  Layers,
  Check,
  ChevronRight,
  ShieldAlert,
  Bed
} from 'lucide-react';

export default function WardenAllocationPage() {
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  const [allocationFilter, setAllocationFilter] = useState('');
  const [requestFilter, setRequestFilter] = useState('PENDING');
  const [searchAlloc, setSearchAlloc] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Agentic AI Allocation Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiReq, setAiReq] = useState(null);
  const [aiCurrentStep, setAiCurrentStep] = useState(1);
  const [step1State, setStep1State] = useState({ status: 'IDLE', details: '' });
  const [step2State, setStep2State] = useState({ status: 'IDLE', details: '', sharingType: '', matchedRoom: null });
  const [step3State, setStep3State] = useState({ status: 'IDLE', room: null, message: '' });
  const [aiLogs, setAiLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, roomRes, stRes, allocRes] = await Promise.all([
        api.get('/allocations/requests'),
        api.get('/rooms'),
        api.get('/students'),
        api.get('/allocations')
      ]);

      setRequests(reqRes.data || []);
      setRooms(roomRes.data || []);
      setStudents(stRes.data || []);
      setAllocations(allocRes.data || []);
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Failed to fetch allocation records.');
    } finally {
      setLoading(false);
    }
  };

  const addAiLog = (text) => {
    setAiLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  // 3-STEP AGENTIC AI AUTO-ALLOCATION RUNNER
  const startAgenticAllocation = (targetReq) => {
    setAiReq(targetReq);
    setAiModalOpen(true);
    setAiCurrentStep(1);
    setStep1State({ status: 'EVALUATING', details: 'Agent verifying hostel fee receipt & Warden approval signature...' });
    setStep2State({ status: 'IDLE', details: '', sharingType: targetReq.preferred_room_type || '2 Sharing', matchedRoom: null });
    setStep3State({ status: 'IDLE', room: null, message: '' });
    setAiLogs([
      `[AGENTIC AI] Initialized SmartHostel Allocation Agent for ${targetReq.student?.name || 'Student'}.`,
      `[STUDENT SPECS] Reg No: ${targetReq.student?.register_number || 'N/A'} • Gender: ${targetReq.student?.gender || 'N/A'}`,
      `[PREFERENCES] Block: ${targetReq.preferred_block} • Sharing: ${targetReq.preferred_room_type || '2 Sharing'} • AC: ${targetReq.preferred_ac || 'AC'}`,
      `[STEP 1: FEE AUDIT] Querying financial records for Warden verification approval...`
    ]);

    const isVerified = targetReq.fee_verified || targetReq.fee_status === 'VERIFIED_BY_WARDEN';

    // Step 1: Fee Verification Audit (800ms thought cycle)
    setTimeout(() => {
      if (!isVerified) {
        // Step 1 FAILED -> REJECT
        setStep1State({
          status: 'REJECTED',
          details: `Fee receipt for ${targetReq.student?.name || 'Student'} is in status '${targetReq.fee_status || 'PENDING'}'. The fee receipt has NOT been verified by the Warden yet. Under institutional room allocation policy, room allocation is strictly locked and cannot proceed without Warden fee verification.`
        });
        addAiLog(`[STEP 1 FAILED] Fee receipt status is '${targetReq.fee_status || 'PENDING'}'. Warden verification not detected.`);
        addAiLog(`[POLICY REJECTION] Room allocation policy strictly prohibits assignment without Warden fee receipt verification.`);
        addAiLog(`[AGENT VERDICT] Allocation request REJECTED at Step 1.`);
      } else {
        // Step 1 PASSED
        setStep1State({
          status: 'VERIFIED',
          details: `Hostel fee receipt verified by Warden. Financial clearance approved. Room allocation authorized.`
        });
        addAiLog(`[STEP 1 PASSED] Fee receipt verified by Warden. Financial clearance approved.`);
        addAiLog(`[AGENT ADVANCE] Cleared to Step 2: Room Sharing & Available Inventory Discovery.`);

        // Step 2: Check Room Sharing (2 Sharing, 3 Sharing, 4 Sharing) & Available Inventory
        setTimeout(async () => {
          setAiCurrentStep(2);
          const prefSharing = targetReq.preferred_room_type || '2 Sharing';
          setStep2State({
            status: 'EVALUATING',
            details: `Checking room sharing preference (${prefSharing}). Scanning live inventory for available ${prefSharing} rooms with open capacity...`,
            sharingType: prefSharing,
            matchedRoom: null
          });
          addAiLog(`[STEP 2: SHARING ENGINE] Checking room sharing option: '${prefSharing}' (2 Sharing / 3 Sharing / 4 Sharing)...`);
          addAiLog(`[STEP 2: INVENTORY] Searching available rooms with open capacity matching gender and sharing type...`);

          try {
            const res = await api.post(`/allocations/auto-allocate/${targetReq.id}`);
            const matchedRoom = res.data?.room;

            setStep2State({
              status: 'MATCHED',
              details: `Found available room ${matchedRoom?.room_number} (${matchedRoom?.block}, Floor ${matchedRoom?.floor}) with ${matchedRoom?.room_type} capacity. Open beds confirmed: ${matchedRoom?.current_occupancy}/${matchedRoom?.capacity}.`,
              sharingType: prefSharing,
              matchedRoom: matchedRoom
            });
            addAiLog(`[STEP 2 MATCH] Selected Room ${matchedRoom?.room_number} (${matchedRoom?.block}, Floor ${matchedRoom?.floor}, ${matchedRoom?.room_type}).`);
            addAiLog(`[STEP 2 CAPACITY] Open capacity confirmed: ${matchedRoom?.current_occupancy}/${matchedRoom?.capacity} beds occupied.`);
            addAiLog(`[AGENT ADVANCE] Cleared to Step 3: Allocation Ledger Finalization.`);

            // Step 3: Room Allocated Successfully
            setTimeout(() => {
              setAiCurrentStep(3);
              setStep3State({
                status: 'SUCCESS',
                room: matchedRoom,
                message: res.data?.message || `Student ${targetReq.student?.name} successfully allocated to Room ${matchedRoom?.room_number}!`
              });
              addAiLog(`[STEP 3: SUCCESS] Room allocation officially confirmed. Allocated Room: ${matchedRoom?.room_number}.`);
              addAiLog(`[LEDGER] Active room assignment logged. Notification dispatched to student.`);
              fetchData();
            }, 1000);

          } catch (err) {
            setStep2State({
              status: 'FAILED',
              details: err.response?.data?.error || 'No matching available room found for this sharing configuration.',
              sharingType: prefSharing,
              matchedRoom: null
            });
            addAiLog(`[STEP 2 ERROR] ${err.response?.data?.error || 'Room allocation failed.'}`);
          }
        }, 900);
      }
    }, 800);
  };

  const handleVerifyInsideModal = async () => {
    if (!aiReq) return;
    try {
      addAiLog(`[WARDEN OVERRIDE] Warden verifying fee receipt in real-time...`);
      await api.put(`/allocations/requests/${aiReq.id}/verify-fee`, { status: 'VERIFIED' });
      addAiLog(`[WARDEN OVERRIDE] Verification recorded successfully. Re-running Agentic AI Allocation Engine...`);
      const updatedReq = { ...aiReq, fee_verified: true, fee_status: 'VERIFIED_BY_WARDEN' };
      setAiReq(updatedReq);
      fetchData();
      startAgenticAllocation(updatedReq);
    } catch (err) {
      addAiLog(`[ERROR] Failed to verify fee receipt: ${err.message}`);
    }
  };

  const handleVerifyFee = async (requestId, status) => {
    setActionLoading(true);
    setMsg('');
    setError('');

    try {
      const res = await api.put(`/allocations/requests/${requestId}/verify-fee`, { status });
      setMsg(res.data?.message || `Fee receipt marked as ${status}! Admin has been notified.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify fee receipt.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualAllocate = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedRoom) {
      setError('Please select both a student and a destination room.');
      return;
    }

    // Check fee verification for manual allocation
    const studentReq = requests.find(r => String(r.student_id) === String(selectedStudent) && r.status === 'PENDING');
    if (studentReq && !studentReq.fee_verified && studentReq.fee_status !== 'VERIFIED_BY_WARDEN') {
      setError("Cannot allocate room: This student's fee receipt has not been verified by the Warden yet. Verification is mandatory.");
      return;
    }

    setActionLoading(true);
    setMsg('');
    setError('');

    try {
      const res = await api.post('/allocations/manual-allocate', {
        student_id: selectedStudent,
        room_id: selectedRoom
      });
      setMsg(res.data?.message || 'Manual room allocation successful!');
      setSelectedStudent('');
      setSelectedRoom('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Manual allocation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVacateRoom = async (allocationId, studentName, roomNumber) => {
    if (!window.confirm(`Are you sure you want to vacate ${studentName || 'this student'} from Room ${roomNumber}? This will mark the bed as available.`)) {
      return;
    }

    setActionLoading(true);
    setMsg('');
    setError('');

    try {
      const res = await api.put(`/allocations/vacate/${allocationId}`);
      setMsg(res.data?.message || `Room ${roomNumber} vacated successfully.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to vacate room.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async (studentId) => {
    try {
      const token = localStorage.getItem('hostel_token');
      const response = await fetch(`/api/allocations/download-pdf?studentId=${studentId || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Room_Allocation_Pass_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Could not download allocation PDF slip: ' + err.message);
    }
  };

  // Derived metrics
  const totalBeds = rooms.reduce((acc, r) => acc + (parseInt(r.capacity || 0, 10)), 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + (parseInt(r.current_occupancy || 0, 10)), 0);
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;
  const activeAllocationsCount = allocations.filter(a => a.status === 'ACTIVE').length;

  // Filtered requests
  const filteredRequests = requests.filter(r => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
  });

  // Filtered active allocations
  const filteredAllocations = allocations.filter(a => {
    const q = searchAlloc.toLowerCase();
    const stName = a.student?.name?.toLowerCase() || '';
    const stReg = a.student?.register_number?.toLowerCase() || '';
    const rmNum = a.room?.room_number?.toLowerCase() || '';
    const matchSearch = stName.includes(q) || stReg.includes(q) || rmNum.includes(q);
    const matchStatus = allocationFilter ? a.status === allocationFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Title & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-800">Hostel Room Allocation Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
              <Bot className="w-3 h-3 text-teal-600" /> Agentic AI Powered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Automated 3-step policy matching, manual assignments, & occupancy tracking</p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading || actionLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{pendingRequestsCount}</span>
            <span className="text-xs text-slate-400">waiting</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Occupants</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-teal-600">{activeAllocationsCount}</span>
            <span className="text-xs text-slate-400">allocated</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Available Beds</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{availableBeds}</span>
            <span className="text-xs text-slate-400">of {totalBeds} total</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hostel Rooms</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-600">{rooms.length}</span>
            <span className="text-xs text-slate-400">total rooms</span>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: MANUAL ALLOCATION CONTROL */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h3 className="font-bold text-sm text-teal-400 flex items-center gap-2">
            <UserCheck className="w-4 h-4" /> Manual Room Allocation Override
          </h3>
          <span className="text-[11px] text-slate-400">Assign any student directly to an available room</span>
        </div>

        <form onSubmit={handleManualAllocate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Select Student</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-teal-400 focus:outline-none"
            >
              <option value="">Choose Student...</option>
              {students.map(st => {
                const reqItem = requests.find(r => String(r.student_id) === String(st.id) && r.status === 'PENDING');
                const isVerified = reqItem && (reqItem.fee_verified || reqItem.fee_status === 'VERIFIED_BY_WARDEN');
                const feeTag = reqItem ? (isVerified ? ' [✅ Fee Verified]' : ' [⏳ Fee Pending Verification]') : '';

                return (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.register_number}) - {st.department}{feeTag}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Select Destination Room</label>
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-teal-400 focus:outline-none"
            >
              <option value="">Choose Available Room...</option>
              {rooms
                .filter(r => r.status !== 'FULL' && r.status !== 'MAINTENANCE')
                .map(r => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} ({r.block}, Floor {r.floor}) - {r.room_type} [{r.current_occupancy || 0}/{r.capacity} beds occupied] - {r.gender_restriction}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={actionLoading || !selectedStudent || !selectedRoom}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm Assignment
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: PENDING & HISTORICAL ALLOCATION REQUESTS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Student Room Preference Requests</span>
            <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
              {pendingRequestsCount} Pending
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter:</span>
            <select
              value={requestFilter}
              onChange={e => setRequestFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved / Allocated</option>
              <option value="ALL">All Requests</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Student Details</th>
                <th className="px-5 py-3">Department & Year</th>
                <th className="px-5 py-3">Preferred Room Specs</th>
                <th className="px-5 py-3">Fee Receipt & Verification</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Agentic AI Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No requests matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(reqItem => {
                  const isFeeVerified = reqItem.fee_verified || reqItem.fee_status === 'VERIFIED_BY_WARDEN';

                  return (
                    <tr key={reqItem.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{reqItem.student?.name || 'Student'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {reqItem.student?.register_number || 'REG-N/A'} • <span className="font-semibold text-teal-700">{reqItem.student?.gender || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-slate-800 font-medium">{reqItem.student?.department || 'Engineering'}</span>
                        <div className="text-[11px] text-slate-400">Year {reqItem.student?.year || 1}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{reqItem.preferred_block} (Floor {reqItem.preferred_floor})</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          <span className="inline-block bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded mr-1">
                            {reqItem.preferred_room_type || '2 Sharing'}
                          </span>
                          • {reqItem.preferred_ac} • {reqItem.preferred_bathroom} Bath
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {reqItem.fee_receipt_url ? (
                          <div className="space-y-1.5">
                            <a
                              href={reqItem.fee_receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[10px] border border-teal-200 transition-colors"
                            >
                              <FileText className="w-3 h-3" /> View Fee Receipt <ExternalLink className="w-2.5 h-2.5" />
                            </a>

                            {isFeeVerified ? (
                              <div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Fee Verified by Warden
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" /> Pending Verification
                                </span>
                                <div>
                                  <button
                                    onClick={() => handleVerifyFee(reqItem.id, 'VERIFIED')}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] shadow-2xs flex items-center gap-1 transition-all"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Verify as Warden
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            No Receipt
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={reqItem.status} />
                        {reqItem.allocated_room && (
                          <span className="block text-[11px] text-teal-700 font-bold mt-1 font-mono">
                            Room {reqItem.allocated_room.room_number}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {reqItem.status === 'PENDING' ? (
                          <button
                            onClick={() => startAgenticAllocation(reqItem)}
                            className={`px-3.5 py-2 rounded-xl text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition-all ${
                              isFeeVerified
                                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-500/20'
                                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Auto-Allocate
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">Allocated</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: CURRENTLY ALLOCATED STUDENTS WITH VACATE BUTTON */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Active Hostel Occupants ({activeAllocationsCount})</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchAlloc}
                onChange={e => setSearchAlloc(e.target.value)}
                placeholder="Search student or room..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <select
              value={allocationFilter}
              onChange={e => setAllocationFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE Only</option>
              <option value="VACATED">VACATED</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Register Number</th>
                <th className="px-6 py-3">Room Assigned</th>
                <th className="px-6 py-3">Block & Floor</th>
                <th className="px-6 py-3">Allocation Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No active student allocations found matching your search.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map(alloc => (
                  <tr key={alloc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {alloc.student?.name || 'Student'}
                      <div className="text-[10px] text-slate-400 font-normal">{alloc.student?.department || ''}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-teal-700">
                      {alloc.student?.register_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono font-extrabold text-base text-slate-800">
                      {alloc.room?.room_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{alloc.room?.block || 'Block'}</span>
                      <div className="text-[11px] text-slate-400">Floor {alloc.room?.floor || 1} • {alloc.room?.room_type || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {alloc.allocation_date || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={alloc.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {alloc.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleVacateRoom(alloc.id, alloc.student?.name, alloc.room?.room_number)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Vacate Bed
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🤖 AGENTIC AI ROOM ALLOCATION 3-STEP PIPELINE MODAL */}
      {/* ======================================================== */}
      {aiModalOpen && aiReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-white flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                    Agentic AI Room Allocation Engine
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">v2.5</span>
                </div>
                <h3 className="text-xl font-black mt-2 text-white">Autonomous Allocation Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-step autonomous policy validation, sharing inventory discovery, & ledger assignment
                </p>
              </div>

              <button
                onClick={() => setAiModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Summary Card */}
            <div className="px-6 py-3 bg-slate-800/60 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400">Target Student: </span>
                <span className="font-bold text-white">{aiReq.student?.name || 'Student'}</span>
                <span className="text-slate-400 font-mono ml-1.5">({aiReq.student?.register_number})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[11px]">
                  {aiReq.preferred_block}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[11px] border border-indigo-500/30">
                  {aiReq.preferred_room_type || '2 Sharing'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[11px]">
                  {aiReq.preferred_ac || 'AC'}
                </span>
              </div>
            </div>

            {/* The 3 Sequential Steps */}
            <div className="p-6 space-y-4 flex-1">

              {/* ---------------- STEP 1: FEE VERIFICATION AUDIT ---------------- */}
              <div className={`p-4 rounded-2xl border transition-all ${
                step1State.status === 'EVALUATING'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : step1State.status === 'REJECTED'
                  ? 'bg-rose-950/40 border-rose-600/50'
                  : 'bg-emerald-950/30 border-emerald-500/40'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm ${
                      step1State.status === 'EVALUATING'
                        ? 'bg-amber-500/20 text-amber-300 animate-spin'
                        : step1State.status === 'REJECTED'
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-500 text-slate-950'
                    }`}>
                      {step1State.status === 'EVALUATING' ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : step1State.status === 'REJECTED' ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Step 1</span>
                        <h4 className="text-sm font-bold text-white">Fee Receipt Verification Audit</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{step1State.details}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                    step1State.status === 'EVALUATING'
                      ? 'bg-amber-500/20 text-amber-300'
                      : step1State.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {step1State.status === 'EVALUATING' && 'Auditing...'}
                    {step1State.status === 'REJECTED' && '❌ Verification Rejected'}
                    {step1State.status === 'VERIFIED' && '✅ Verified by Warden'}
                  </span>
                </div>

                {/* If Step 1 Failed: Show Action to Verify */}
                {step1State.status === 'REJECTED' && (
                  <div className="mt-3 pt-3 border-t border-rose-800/40 flex flex-wrap items-center justify-between gap-2">
                    {aiReq.fee_receipt_url && (
                      <a
                        href={aiReq.fee_receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-white font-medium underline"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Uploaded Receipt
                      </a>
                    )}
                    <button
                      onClick={handleVerifyInsideModal}
                      className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verify Fee Receipt as Warden & Resume
                    </button>
                  </div>
                )}
              </div>

              {/* ---------------- STEP 2: ROOM SHARING & AVAILABLE INVENTORY DISCOVERY ---------------- */}
              <div className={`p-4 rounded-2xl border transition-all ${
                aiCurrentStep < 2
                  ? 'bg-slate-800/30 border-slate-800 opacity-60'
                  : step2State.status === 'EVALUATING'
                  ? 'bg-teal-500/10 border-teal-500/40'
                  : step2State.status === 'FAILED'
                  ? 'bg-rose-950/40 border-rose-600/50'
                  : 'bg-emerald-950/30 border-emerald-500/40'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm ${
                      aiCurrentStep < 2
                        ? 'bg-slate-800 text-slate-500'
                        : step2State.status === 'EVALUATING'
                        ? 'bg-teal-500/20 text-teal-300 animate-spin'
                        : step2State.status === 'FAILED'
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-500 text-slate-950'
                    }`}>
                      {aiCurrentStep < 2 ? (
                        <Lock className="w-4 h-4" />
                      ) : step2State.status === 'EVALUATING' ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : step2State.status === 'FAILED' ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Step 2</span>
                        <h4 className="text-sm font-bold text-white">Room Sharing & Available Inventory Discovery</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {aiCurrentStep < 2
                          ? 'Waiting for Step 1 Fee Verification clearance before scanning available room sharing options.'
                          : step2State.details}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                    aiCurrentStep < 2
                      ? 'bg-slate-800 text-slate-500'
                      : step2State.status === 'EVALUATING'
                      ? 'bg-teal-500/20 text-teal-300'
                      : step2State.status === 'FAILED'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {aiCurrentStep < 2 && '🔒 Locked'}
                    {aiCurrentStep >= 2 && step2State.status === 'EVALUATING' && 'Scanning Rooms...'}
                    {aiCurrentStep >= 2 && step2State.status === 'MATCHED' && '✅ Room Matched'}
                    {aiCurrentStep >= 2 && step2State.status === 'FAILED' && 'No Room Available'}
                  </span>
                </div>

                {/* Sharing Options Visualizer */}
                {aiCurrentStep >= 2 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Sharing Option Evaluated:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {['2 Sharing', '3 Sharing', '4 Sharing'].map(sharing => {
                        const isChosen = (step2State.sharingType || '').toLowerCase().includes(sharing.toLowerCase().slice(0, 3));
                        return (
                          <span
                            key={sharing}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              isChosen
                                ? 'bg-teal-500 text-slate-950 shadow-md ring-2 ring-teal-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Bed className="w-3.5 h-3.5" />
                            {sharing} {isChosen && '★ (Requested Option)'}
                          </span>
                        );
                      })}
                    </div>

                    {step2State.matchedRoom && (
                      <div className="mt-2 p-3 bg-slate-800/80 rounded-xl border border-teal-500/30 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-teal-400 uppercase font-bold block">Allocated Room Candidate:</span>
                          <span className="text-base font-black text-white font-mono">{step2State.matchedRoom.room_number}</span>
                          <span className="text-slate-400 ml-2">({step2State.matchedRoom.block}, Floor {step2State.matchedRoom.floor})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity Status</span>
                          <span className="text-teal-300 font-bold font-mono">
                            {step2State.matchedRoom.current_occupancy}/{step2State.matchedRoom.capacity} Beds Active
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ---------------- STEP 3: ROOM ALLOCATED SUCCESSFULLY ---------------- */}
              <div className={`p-4 rounded-2xl border transition-all ${
                aiCurrentStep < 3
                  ? 'bg-slate-800/30 border-slate-800 opacity-60'
                  : 'bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border-emerald-500/50 shadow-lg'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm ${
                      aiCurrentStep < 3
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    }`}>
                      {aiCurrentStep < 3 ? <Lock className="w-4 h-4" /> : <Sparkles className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Step 3</span>
                        <h4 className="text-sm font-bold text-white">
                          {aiCurrentStep < 3 ? 'Room Allocation Finalization' : 'Room Allocated Successfully!'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {aiCurrentStep < 3
                          ? 'Awaiting Step 2 inventory confirmation before finalizing room allocation in hostel master records.'
                          : step3State.message}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                    aiCurrentStep < 3
                      ? 'bg-slate-800 text-slate-500'
                      : 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  }`}>
                    {aiCurrentStep < 3 ? '🔒 Locked' : '🎉 Room Allocated Successfully'}
                  </span>
                </div>

                {/* Final Confirmation Card */}
                {aiCurrentStep === 3 && step3State.room && (
                  <div className="mt-4 p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Room Number</span>
                        <span className="text-xl font-black text-white font-mono">{step3State.room.room_number}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Block & Floor</span>
                        <span className="font-bold text-white">{step3State.room.block} (Floor {step3State.room.floor})</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Room Sharing</span>
                        <span className="font-bold text-white">{step3State.room.room_type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Amenities</span>
                        <span className="font-bold text-white">{step3State.room.ac_type} • {step3State.room.bathroom_type}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-800/50 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => handleDownloadPDF(aiReq.student_id)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Allocation Slip (PDF)
                      </button>

                      <button
                        onClick={() => setAiModalOpen(false)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition"
                      >
                        Done & Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agent Live Thought Log (Collapsible) */}
            <div className="border-t border-slate-800 bg-slate-950/70 px-6 py-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-[11px] font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold"
                >
                  <Bot className="w-3.5 h-3.5" />
                  {showLogs ? 'Hide Agent Reasoning Logs' : 'View Agent Reasoning Logs (' + aiLogs.length + ' entries)'}
                </button>
                <span className="text-[10px] text-slate-500 font-mono">
                  Autonomous Policy Evaluation
                </span>
              </div>

              {showLogs && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-36 overflow-y-auto space-y-1">
                  {aiLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                SmartHostel Autonomous Room Allocation Workflow Active
              </span>
              <button
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}