import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { 
  Ticket, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  ArrowRightLeft, 
  Download, 
  QrCode, 
  Search, 
  Filter,
  FileText,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function WardenOutpassPage() {
  const [outpasses, setOutpasses] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | TRACKER
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected Outpass for Review
  const [selectedOutpass, setSelectedOutpass] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const opRes = await api.get('/outpasses');
      setOutpasses(opRes.data || []);
    } catch (err) {
      console.error('Failed to fetch outpass data:', err);
    }
  };

  // Review Direct Outpass
  const handleReviewOutpass = async (e) => {
    e.preventDefault();
    if (!selectedOutpass) return;
    setLoading(true);

    try {
      await api.put(`/outpasses/${selectedOutpass.id}/review`, {
        status: reviewDecision,
        remarks: reviewRemarks
      });

      setSelectedOutpass(null);
      setReviewRemarks('');
      setMsg(`Outpass ${selectedOutpass.outpass_code} marked as ${reviewDecision}!`);
      fetchData();
    } catch (err) {
      alert('Failed to review outpass.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Gate Status Toggle (OUTSIDE / RETURNED)
  const handleMarkStatus = async (outpassId, newStatus) => {
    try {
      await api.put(`/outpasses/${outpassId}/status`, { status: newStatus });
      setMsg(`Outpass marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      alert('Failed to update outpass status.');
    }
  };

  // Authenticated PDF Download
  const handleDownloadPDF = async (outpassId, outpassCode) => {
    setDownloadingId(outpassId);
    try {
      const res = await api.get(`/outpasses/${outpassId}/download-pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `outpass-${outpassCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const token = localStorage.getItem('hostel_token');
      window.open(`/api/outpasses/${outpassId}/download-pdf?token=${token}`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const pendingOutpasses = outpasses.filter(o => o.status === 'PENDING');
  const overdueCount = outpasses.filter(o => o.status === 'OVERDUE').length;

  // Filter Outpasses in Tracker
  const filteredOutpasses = outpasses.filter(op => {
    const q = search.toLowerCase();
    const matchSearch =
      (op.student?.name || '').toLowerCase().includes(q) ||
      (op.student?.register_number || '').toLowerCase().includes(q) ||
      (op.outpass_code || '').toLowerCase().includes(q);
    const matchStatus = statusFilter ? op.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Outpasses & Overdue Tracker</h2>
          <p className="text-xs text-slate-500">Review student outing requests, approve official gate passes, & track outside/overdue returns</p>
        </div>

        {overdueCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{overdueCount} Overdue Return(s) Alert</span>
          </div>
        )}
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 transition-all flex items-center gap-2 ${
            activeTab === 'PENDING' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending Approvals ({pendingOutpasses.length})
        </button>
        <button
          onClick={() => setActiveTab('TRACKER')}
          className={`pb-3 transition-all flex items-center gap-2 ${
            activeTab === 'TRACKER' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Live Outpass Tracker ({outpasses.length})
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === 'PENDING' && (
        <div className="space-y-6">
          {/* Pending Outpasses */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-teal-600" /> Pending Outpass Requests ({pendingOutpasses.length})
            </h3>

            {pendingOutpasses.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl text-center text-xs text-slate-400 border border-slate-200">
                No direct outpass requests awaiting approval.
              </div>
            ) : (
              pendingOutpasses.map(op => (
                <div key={op.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">{op.student?.name}</span>
                      <span className="font-mono text-xs font-bold text-teal-700">({op.student?.register_number})</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Room {op.student?.room_number || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-slate-600"><strong>Reason:</strong> {op.reason}</p>
                    <p className="text-xs text-slate-500">
                      <strong>Out:</strong> {op.out_date} at {op.out_time} • <strong>Return:</strong> {op.expected_return_date} at {op.expected_return_time}
                    </p>
                    {op.hod_letter_url ? (
                      <div className="pt-1.5 flex items-center gap-2">
                        <a
                          href={op.hod_letter_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition"
                        >
                          <FileText className="w-3 h-3" /> View HOD Signed Letter <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> HOD Signed
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-bold block pt-1">
                        ⚠️ No HOD signed letter attached
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedOutpass(op);
                        setReviewDecision('APPROVED');
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
                    >
                      Review & Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Outpass Tracker */}
      {activeTab === 'TRACKER' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search student, roll no, outpass code..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">APPROVED</option>
              <option value="OUTSIDE">OUTSIDE (Exited Gate)</option>
              <option value="OVERDUE">🚨 OVERDUE</option>
              <option value="RETURNED">RETURNED</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Pass Code</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Room</th>
                    <th className="px-5 py-3">Out Date & Return</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Gate Actions</th>
                    <th className="px-5 py-3">Pass & PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOutpasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        No outpasses found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOutpasses.map(op => (
                      <tr key={op.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-mono font-bold text-teal-700">{op.outpass_code}</td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">{op.student?.name || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400">{op.student?.register_number}</p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">{op.student?.room_number || 'N/A'}</td>
                        <td className="px-5 py-4 text-slate-600">
                          <p>Out: {op.out_date} ({op.out_time})</p>
                          <p className="text-[10px] text-slate-400">Due: {op.expected_return_date} ({op.expected_return_time})</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={op.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {op.status === 'APPROVED' && (
                              <button
                                onClick={() => handleMarkStatus(op.id, 'OUTSIDE')}
                                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px]"
                              >
                                Mark Outside
                              </button>
                            )}
                            {(op.status === 'OUTSIDE' || op.status === 'OVERDUE') && (
                              <button
                                onClick={() => handleMarkStatus(op.id, 'RETURNED')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                              >
                                Mark Returned
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadPDF(op.id, op.outpass_code)}
                              disabled={downloadingId === op.id}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1"
                              title="Download Official Outpass PDF"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </button>
                            <a
                              href={`/qr-verify?code=${op.outpass_code}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-teal-600"
                              title="Live QR Gate Verification"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Outpass Modal */}
      {selectedOutpass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Review Outpass Request</h3>

            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1">
              <p><strong>Student:</strong> {selectedOutpass.student?.name} ({selectedOutpass.student?.register_number})</p>
              <p><strong>Department:</strong> {selectedOutpass.student?.department || 'N/A'}</p>
              <p><strong>Reason:</strong> {selectedOutpass.reason}</p>
              <p><strong>Out Date:</strong> {selectedOutpass.out_date} at {selectedOutpass.out_time}</p>
              <p><strong>Expected Return:</strong> {selectedOutpass.expected_return_date} at {selectedOutpass.expected_return_time}</p>
            </div>

            {selectedOutpass.hod_letter_url ? (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-indigo-950 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" /> HOD Signed Permission Letter
                  </span>
                  <span className="text-[10px] text-indigo-700">Duly signed with Department Head signature & seal</span>
                </div>
                <a
                  href={selectedOutpass.hod_letter_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition"
                >
                  View Letter <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                ⚠️ No HOD signed letter attached. Review with caution.
              </div>
            )}

            <form onSubmit={handleReviewOutpass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision</label>
                <select
                  value={reviewDecision}
                  onChange={e => setReviewDecision(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="APPROVED">APPROVE & Issue Gate Pass</option>
                  <option value="REJECTED">REJECT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warden Remarks (Optional)</label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder="e.g. Approved with parental confirmation"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedOutpass(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md"
                >
                  {loading ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
