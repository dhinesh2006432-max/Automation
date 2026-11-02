import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { CheckSquare, AlertTriangle, Calendar, ShieldCheck } from 'lucide-react';

export default function StudentAttendancePage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, leave: 0, percentage: 100 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance');
      setRecords(res.data.records || []);
      setSummary(res.data.summary || { total: 0, present: 0, absent: 0, leave: 0, percentage: 100 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Attendance Summary Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">My Attendance Log</h2>
            <p className="text-xs text-slate-500">Daily hostel night roll call history & mandatory threshold meter</p>
          </div>
          <span className="text-2xl font-black text-teal-600">{summary.percentage}%</span>
        </div>

        {summary.percentage < 75 && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>WARNING: Your attendance is currently {summary.percentage}%, which is below the required 75% threshold. Please meet your hostel warden.</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 text-xs block">Total Roll Calls</span>
            <span className="text-xl font-bold text-slate-800">{summary.total}</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-emerald-600 text-xs block font-bold">Present</span>
            <span className="text-xl font-bold text-emerald-700">{summary.present}</span>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
            <span className="text-rose-600 text-xs block font-bold">Absent</span>
            <span className="text-xl font-bold text-rose-700">{summary.absent}</span>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <span className="text-blue-600 text-xs block font-bold">Approved Leave</span>
            <span className="text-xl font-bold text-blue-700">{summary.leave}</span>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-800">
          Attendance Records History
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Warden Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">No attendance marked yet.</td>
                </tr>
              ) : (
                records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{rec.date}</td>
                    <td className="px-6 py-4"><Badge status={rec.status} /></td>
                    <td className="px-6 py-4 text-slate-500">{rec.remarks || 'Regular roll call check'}</td>
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
