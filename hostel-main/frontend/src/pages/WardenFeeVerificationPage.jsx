import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { CreditCard, CheckCircle2, XCircle, Download, Search } from 'lucide-react';

export default function WardenFeeVerificationPage() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      setPayments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const handleVerify = async (id, status) => {
    setLoading(true);
    try {
      await api.put(`/payments/${id}/verify`, { status });
      setMsg(`Receipt marked as ${status}`);
      fetchPayments();
    } catch (err) {
      alert('Failed to update payment status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (payId, receiptNo) => {
    setDownloadingId(payId);
    try {
      const res = await api.get(`/payments/${payId}/download-pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${receiptNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const token = localStorage.getItem('hostel_token');
      window.open(`/api/payments/${payId}/download-pdf?token=${token}`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    const studentName = p.student?.name?.toLowerCase() || '';
    const regNo = p.student?.register_number?.toLowerCase() || '';
    const receiptNo = p.receipt_number?.toLowerCase() || '';
    const matchSearch = studentName.includes(q) || regNo.includes(q) || receiptNo.includes(q);
    const matchStatus = statusFilter ? p.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Fee Receipt Verification</h2>
          <p className="text-xs text-slate-500">Review student-submitted hostel fee receipts and verify or reject them</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
            {pendingCount} Pending Review
          </span>
        )}
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student, reg no, receipt..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Receipt No</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    No fee receipts found.
                  </td>
                </tr>
              ) : (
                filtered.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{pay.receipt_number}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{pay.student?.name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400">{pay.student?.register_number}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{pay.payment_type}</td>
                    <td className="px-6 py-4 font-bold text-teal-700">₹{pay.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{pay.payment_date}</td>
                    <td className="px-6 py-4"><Badge status={pay.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {pay.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerify(pay.id, 'VERIFIED')}
                              disabled={loading}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 disabled:opacity-60"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Verify
                            </button>
                            <button
                              onClick={() => handleVerify(pay.id, 'REJECTED')}
                              disabled={loading}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 disabled:opacity-60"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDownloadPDF(pay.id, pay.receipt_number)}
                          disabled={downloadingId === pay.id}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> {downloadingId === pay.id ? 'PDF...' : 'PDF'}
                        </button>
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
  );
}
