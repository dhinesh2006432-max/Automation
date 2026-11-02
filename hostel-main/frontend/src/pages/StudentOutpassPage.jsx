import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Ticket, 
  FileText, 
  Download, 
  CheckCircle2, 
  QrCode, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Send, 
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  UploadCloud,
  FileCheck2
} from 'lucide-react';

export default function StudentOutpassPage() {
  const [outpasses, setOutpasses] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Outpass Application Form State
  const [outpassType, setOutpassType] = useState('DAY_OUTING');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [outDate, setOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [outTime, setOutTime] = useState('16:00');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnTime, setReturnTime] = useState('20:00');
  const [hodLetterFile, setHodLetterFile] = useState(null);
  const [hodSignConfirmed, setHodSignConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/outpasses');
      setOutpasses(res.data || []);
    } catch (err) {
      console.error('Failed to load outpasses:', err);
    }
  };

  // Submit Direct Outpass / Leave Request
  const handleApplyOutpass = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');

    if (!hodLetterFile) {
      setErrorMsg('HOD signed permission letter is mandatory for outpass. Please upload your formal letter endorsed with HOD signature & department seal.');
      return;
    }

    if (!hodSignConfirmed) {
      setErrorMsg('Please confirm that the attached permission letter bears your Department HOD signature and official seal.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('outpass_type', outpassType);
      formData.append('reason', reason);
      formData.append('destination', destination);
      formData.append('out_date', outDate);
      formData.append('out_time', outTime);
      formData.append('expected_return_date', returnDate);
      formData.append('expected_return_time', returnTime);
      formData.append('hodLetter', hodLetterFile);

      await api.post('/outpasses/request', formData);

      setShowApplyModal(false);
      setReason('');
      setDestination('');
      setHodLetterFile(null);
      setHodSignConfirmed(false);
      setMsg('Outpass request with HOD signed letter submitted to warden office! You can track its approval below.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit outpass request.');
    } finally {
      setLoading(false);
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
      console.error('PDF download error:', err);
      // Fallback: direct window open with query token
      const token = localStorage.getItem('hostel_token');
      window.open(`/api/outpasses/${outpassId}/download-pdf?token=${token}`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Leave & Gate Outpass System</h2>
          <p className="text-xs text-slate-500">Apply for day outing / weekend leave with mandatory HOD sign endorsement & generate official scannable QR passes</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Apply for Outpass
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Outpasses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outpasses.length === 0 ? (
            <div className="md:col-span-2 bg-white p-10 rounded-3xl text-center text-slate-400 border border-slate-200 space-y-3">
              <Ticket className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No outpasses requested yet</p>
              <p className="text-xs text-slate-400">Click &quot;Apply for Outpass&quot; above to request a day outing or weekend leave pass.</p>
            </div>
          ) : (
            outpasses.map(op => {
              const liveVerifyUrl = `${window.location.origin}/qr-verify?code=${op.outpass_code}`;
              const isApproved = op.status === 'APPROVED' || op.status === 'OUTSIDE' || op.status === 'OVERDUE' || op.status === 'RETURNED';

              return (
                <div key={op.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">GATE PASS ID</span>
                        <span className="font-mono font-extrabold text-sm text-teal-700">{op.outpass_code}</span>
                      </div>
                      <Badge status={op.status} />
                    </div>

                    {/* QR Code and Pass Details */}
                    <div className="flex items-start gap-4">
                      {isApproved ? (
                        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 shrink-0 text-center">
                          <QRCodeSVG
                            value={liveVerifyUrl}
                            size={105}
                            level="M"
                            includeMargin={false}
                          />
                          <span className="text-[9px] text-teal-600 font-bold block mt-1.5 flex items-center justify-center gap-0.5">
                            <QrCode className="w-2.5 h-2.5" /> Scan Gate QR
                          </span>
                        </div>
                      ) : (
                        <div className="w-[105px] h-[105px] bg-amber-50 rounded-2xl border border-amber-200 shrink-0 flex flex-col items-center justify-center text-center p-2">
                          <Clock className="w-6 h-6 text-amber-500 mb-1" />
                          <span className="text-[9px] font-bold text-amber-800 uppercase">Under Review</span>
                        </div>
                      )}

                      <div className="space-y-1.5 text-xs text-slate-600 min-w-0">
                        <p className="truncate"><strong className="text-slate-800">Reason:</strong> {op.reason}</p>
                        <p><strong className="text-slate-800">Out:</strong> {op.out_date} at {op.out_time}</p>
                        <p><strong className="text-slate-800">Return:</strong> {op.expected_return_date} at {op.expected_return_time}</p>
                        {op.student?.room_number && (
                          <p><strong className="text-slate-800">Room:</strong> {op.student.room_number}</p>
                        )}
                        {op.hod_letter_url ? (
                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            <a
                              href={op.hod_letter_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition"
                            >
                              <FileText className="w-3 h-3" /> View HOD Signed Letter <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> HOD Signed & Endorsed
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No HOD letter recorded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isApproved ? (
                      <button
                        onClick={() => handleDownloadPDF(op.id, op.outpass_code)}
                        disabled={downloadingId === op.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingId === op.id ? 'Generating PDF...' : 'Download Official PDF'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Awaiting warden approval</span>
                    )}

                    <a
                      href={`/qr-verify?code=${op.outpass_code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5 text-teal-600" /> Verify Pass
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

      {/* Modal: Direct Outpass Application */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-teal-600" /> Apply for Gate Outpass / Leave
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleApplyOutpass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Outpass / Leave Category</label>
                <select
                  value={outpassType}
                  onChange={e => setOutpassType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="DAY_OUTING">Day Outing (City / Project / Shopping)</option>
                  <option value="WEEKEND_LEAVE">Weekend Home Leave</option>
                  <option value="MEDICAL_LEAVE">Medical / Hospital Leave</option>
                  <option value="EMERGENCY_LEAVE">Family Emergency</option>
                  <option value="VACATION">Semester Vacation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leaving</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Buying project materials / Going home for weekend"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination Address / Place</label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="e.g. Gandhipuram, Coimbatore / Home town"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Out Date</label>
                  <input
                    type="date"
                    required
                    value={outDate}
                    onChange={e => setOutDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Out Time</label>
                  <input
                    type="time"
                    required
                    value={outTime}
                    onChange={e => setOutTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Return Date</label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Return Time</label>
                  <input
                    type="time"
                    required
                    value={returnTime}
                    onChange={e => setReturnTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Mandatory HOD Signed Permission Letter */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    Upload HOD Signed Permission Letter <span className="text-rose-500 font-extrabold">* (Mandatory)</span>
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-full border border-indigo-200">
                    HOD Sign
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Every outpass application strictly requires a formal permission letter endorsed with your <strong>Department Head (HOD) signature & department seal</strong> (PDF, PNG, JPG max 5MB).
                </p>
                
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setHodLetterFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer cursor-pointer border border-indigo-200 rounded-xl bg-white p-1"
                />

                {hodLetterFile && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Selected: {hodLetterFile.name} ({(hodLetterFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}

                <label className="flex items-start gap-2 pt-1 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hodSignConfirmed}
                    onChange={e => setHodSignConfirmed(e.target.checked)}
                    required
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    I confirm that this permission letter is authentic, bears the official physical/digital signature of my <strong>Department HOD</strong>, and has been approved prior to gate exit.
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
