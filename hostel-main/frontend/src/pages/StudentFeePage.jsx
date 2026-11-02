import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { CreditCard, Download, Upload, CheckCircle2, FileText, Plus } from 'lucide-react';

export default function StudentFeePage() {
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('45000');
  const [paymentType, setPaymentType] = useState('HOSTEL_FEE');
  const [receiptFile, setReceiptFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      setPayments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('amount', amount);
      data.append('payment_type', paymentType);
      if (receiptFile) data.append('receiptFile', receiptFile);

      await api.post('/payments', data);
      setShowModal(false);
      setMsg('Fee payment receipt submitted for warden verification.');
      fetchPayments();
    } catch (err) {
      alert('Failed to upload receipt.');
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Hostel Fee Receipts & Verification</h2>
          <p className="text-xs text-slate-500">Upload college payment receipts & download verified official receipts</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Upload Fee Receipt
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Receipts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Receipt No</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No payment receipts uploaded yet.</td>
                </tr>
              ) : (
                payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{pay.receipt_number}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{pay.payment_type}</td>
                    <td className="px-6 py-4 font-bold text-teal-700">₹{pay.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{pay.payment_date}</td>
                    <td className="px-6 py-4"><Badge status={pay.status} /></td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownloadPDF(pay.id, pay.receipt_number)}
                        disabled={downloadingId === pay.id}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingId === pay.id ? 'Downloading...' : 'Download PDF'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Upload Hostel Fee Receipt</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fee Category</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="HOSTEL_FEE">HOSTEL_FEE</option>
                  <option value="MESS_FEE">MESS_FEE</option>
                  <option value="CAUTION_DEPOSIT">CAUTION_DEPOSIT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paid Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Receipt Image / PDF</label>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  onChange={e => setReceiptFile(e.target.files[0])}
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
                  {loading ? 'Uploading...' : 'Submit Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
