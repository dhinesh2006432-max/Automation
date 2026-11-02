import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { 
  Shield, 
  Users, 
  Building, 
  BarChart2, 
  CheckCircle2, 
  FileText, 
  ExternalLink, 
  Lock, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Bell, 
  ShieldCheck 
} from 'lucide-react';

export default function AdminDashboard() {
  const [wardens, setWardens] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalRooms: 0, occupiedRooms: 0, availableRooms: 0 });
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, stRes, reqRes, notifRes] = await Promise.all([
        api.get('/wardens').catch(() => ({ data: [] })),
        api.get('/reports/stats').catch(() => ({ data: { totalStudents: 0, totalRooms: 0, occupiedRooms: 0, availableRooms: 0 } })),
        api.get('/allocations/requests').catch(() => ({ data: [] })),
        api.get('/notifications').catch(() => ({ data: { notifications: [] } }))
      ]);

      setWardens(wRes.data || []);
      setStats(stRes.data || { totalStudents: 0, totalRooms: 0, occupiedRooms: 0, availableRooms: 0 });
      setRequests(reqRes.data || []);
      setNotifications(notifRes.data?.notifications || []);
    } catch (err) {
      console.error('Fetch admin dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAutoAllocate = async (reqId, studentName) => {
    if (!window.confirm(`Authorize and auto-allocate a verified room for ${studentName}?`)) return;
    setActionLoading(true);
    setActionMsg('');
    setActionErr('');

    try {
      const res = await api.post(`/allocations/auto-allocate/${reqId}`);
      setActionMsg(res.data.message || 'Room allocated successfully!');
      await fetchData();
    } catch (err) {
      setActionErr(err.response?.data?.error || 'Failed to allocate room.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests
  const verifiedRequests = requests.filter(r => r.status === 'PENDING' && (r.fee_verified || r.fee_status === 'VERIFIED_BY_WARDEN'));
  const pendingWardenRequests = requests.filter(r => r.status === 'PENDING' && (!r.fee_verified && r.fee_status !== 'VERIFIED_BY_WARDEN'));
  const approvedRequests = requests.filter(r => r.status === 'APPROVED');

  // Filter notifications specifically from Warden regarding Fee Verification
  const wardenVerificationNotifs = notifications.filter(n => 
    (n.role_target === 'ADMIN' || n.title?.toLowerCase().includes('fee') || n.message?.toLowerCase().includes('warden'))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Super Administration</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Fee Verification & Allocation Workflow Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Hostel System Master Console</h1>
            <p className="text-xs text-slate-300 mt-1">
              Authorizes room allocations after Warden fee receipt verification & manages hostel master records
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur-xs border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2 shrink-0" />
            {actionMsg}
          </div>
          <button onClick={() => setActionMsg('')} className="text-xs text-emerald-600 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {actionErr && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center text-xs font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 mr-2 shrink-0" />
            {actionErr}
          </div>
          <button onClick={() => setActionErr('')} className="text-xs text-rose-600 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Residents" value={stats.totalStudents} icon={Users} color="indigo" />
        <StatCard title="Total Hostel Rooms" value={stats.totalRooms} icon={Building} color="teal" />
        <StatCard title="Ready for Allocation" value={verifiedRequests.length} icon={ShieldCheck} color="emerald" subtitle="Warden Fee Verified" />
        <StatCard title="Hostel Wardens" value={wardens.length} icon={Shield} color="emerald" />
      </div>

      {/* Section 1: Warden Verification Messages Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Messages & Verifications from Warden Module</h2>
              <p className="text-[11px] text-slate-500">Notifications transmitted when Warden reviews and approves student fee receipts</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
            {wardenVerificationNotifs.length} Dispatch(es)
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {wardenVerificationNotifs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No new verification messages from Warden at this moment.
            </div>
          ) : (
            wardenVerificationNotifs.map(n => (
              <div key={n.id} className="p-4 hover:bg-slate-50 transition flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{n.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 2: Authorized Room Requests (Verified by Warden - Ready to Allocate) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="font-bold text-sm text-slate-800">Warden-Verified Room Requests (Authorized for Allocation)</h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              These students have their fee receipts verified by the Warden. Room allocation is strictly unlocked for these records only.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
            {verifiedRequests.length} Ready for Room Assignment
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Register No / Dept</th>
                <th className="px-6 py-3">Preferences</th>
                <th className="px-6 py-3">Uploaded Fee Receipt</th>
                <th className="px-6 py-3">Warden Status</th>
                <th className="px-6 py-3 text-right">Allocation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {verifiedRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No verified requests awaiting room allocation. All eligible requests are processed or pending Warden verification.
                  </td>
                </tr>
              ) : (
                verifiedRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {r.student?.name || `Student #${r.student_id}`}
                      <div className="text-[10px] font-normal text-slate-500">{r.student?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-indigo-700">
                      {r.student?.register_number || 'REG-ID'}
                      <div className="text-[10px] font-normal text-slate-500">{r.student?.department || 'N/A'} - Year {r.student?.year_of_study || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{r.preferred_block}</span>
                      <div className="text-[10px] text-slate-500">{r.preferred_room_type} • {r.preferred_ac} • Floor {r.preferred_floor}</div>
                    </td>
                    <td className="px-6 py-4">
                      {r.fee_receipt_url ? (
                        <a
                          href={r.fee_receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          View Receipt
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No receipt file</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Verified by Warden
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleAdminAutoAllocate(r.id, r.student?.name || 'Student')}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs hover:shadow transition disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Auto-Allocate Room
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Pending Warden Verification (Allocation Locked) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">Requests Awaiting Warden Fee Verification (Allocation Locked)</h2>
              <p className="text-[11px] text-slate-500">Students who uploaded fee receipt; room allocation is restricted until Warden approves</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {pendingWardenRequests.length} Pending Verification
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Register No</th>
                <th className="px-6 py-3">Block Requested</th>
                <th className="px-6 py-3">Fee Receipt</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Allocation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingWardenRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-slate-400">
                    No requests currently waiting for Warden fee receipt verification.
                  </td>
                </tr>
              ) : (
                pendingWardenRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {r.student?.name || `Student #${r.student_id}`}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600">
                      {r.student?.register_number || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700">
                      {r.preferred_block} ({r.preferred_room_type})
                    </td>
                    <td className="px-6 py-3.5">
                      {r.fee_receipt_url ? (
                        <a
                          href={r.fee_receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          View Uploaded Receipt
                        </a>
                      ) : (
                        <span className="text-rose-500 font-medium">Receipt Missing</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ⏳ Pending Warden Verification
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <Lock className="w-3 h-3 mr-1 text-slate-400" />
                        Allocation Locked
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wardens List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-800 flex items-center justify-between">
          <span>Assigned Hostel Wardens Directory</span>
          <span className="text-xs text-slate-500 font-normal">{wardens.length} active wardens</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Warden Name</th>
                <th className="px-6 py-3">Employee ID</th>
                <th className="px-6 py-3">Block Assigned</th>
                <th className="px-6 py-3">Designation</th>
                <th className="px-6 py-3">Contact Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wardens.map(w => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-800">{w.name}</td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-700">{w.employee_id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{w.block_assigned}</td>
                  <td className="px-6 py-4">{w.designation}</td>
                  <td className="px-6 py-4">{w.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}