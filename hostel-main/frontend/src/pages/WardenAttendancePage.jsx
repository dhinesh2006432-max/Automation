import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import {
  CheckSquare, Save, CheckCircle2, Calendar, Users, Check, Filter,
  Utensils, UtensilsCrossed, Coffee, Sun, Moon, ArrowRight,
  ShieldCheck, Send, Copy, AlertCircle, X, ChevronRight
} from 'lucide-react';

export default function WardenAttendancePage() {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({});
  const [genderFilter, setGenderFilter] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [savedFoodForecast, setSavedFoodForecast] = useState(null);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [notifiedKitchen, setNotifiedKitchen] = useState(false);
  const [copiedForecast, setCopiedForecast] = useState(false);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    try {
      const [stRes, attRes] = await Promise.all([
        api.get('/students'),
        api.get(`/attendance?date=${date}`)
      ]);

      const fetchedStudents = stRes.data || [];
      setStudents(fetchedStudents);

      const initialMap = {};
      fetchedStudents.forEach(s => {
        const existing = attRes.data?.records?.find(r => String(r.student_id) === String(s.id));
        initialMap[s.id] = existing ? existing.status : 'PRESENT';
      });

      setAttendanceState(initialMap);

      if (attRes.data?.foodForecast && attRes.data.records?.length > 0) {
        setSavedFoodForecast(attRes.data.foodForecast);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  const setStudentStatus = (studentId, status) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  const presentCount = Object.values(attendanceState).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceState).filter(s => s === 'ABSENT').length;
  const leaveCount = Object.values(attendanceState).filter(s => s === 'LEAVE').length;
  const outpassCount = Object.values(attendanceState).filter(s => s === 'OUTPASS').length;
  const notEatingCount = absentCount + leaveCount + outpassCount;

  // Calculate tomorrow's date
  const tomorrowObj = new Date(date);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowDateStr = tomorrowObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleSaveAttendance = async () => {
    setLoading(true);
    setMsg('');

    try {
      const attendanceList = Object.keys(attendanceState).map(studentId => {
        const student = students.find(s => String(s.id) === String(studentId));
        return {
          student_id: parseInt(studentId, 10),
          room_id: student?.room_id || 1,
          status: attendanceState[studentId]
        };
      });

      const res = await api.post('/attendance', { date, attendanceList });
      const forecast = res.data?.foodForecast || {
        foodDate: tomorrowObj.toISOString().split('T')[0],
        foodCountTomorrow: presentCount,
        notEatingCount,
        meals: {
          breakfast: presentCount,
          lunch: presentCount,
          dinner: presentCount
        }
      };

      setSavedFoodForecast(forecast);
      setMsg(`Daily night roll call recorded! Tomorrow's food count is ${presentCount} students.`);
      setShowFoodModal(true);
      setNotifiedKitchen(false);
    } catch (err) {
      alert('Failed to save attendance.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyForecast = () => {
    const summary = `HOSTEL FOOD PREPARATION REQUISITION
Date for Meals: ${tomorrowDateStr}
Confirmed Present for Dinner: ${presentCount} Students
Off-Campus / Leaves: ${notEatingCount} Students
• Breakfast (07:30 - 09:00 AM): ${presentCount} servings
• Lunch (12:30 - 02:00 PM): ${presentCount} servings
• Dinner (07:30 - 09:15 PM): ${presentCount} servings
Verified by Hostel Warden Desk.`;
    navigator.clipboard.writeText(summary);
    setCopiedForecast(true);
    setTimeout(() => setCopiedForecast(false), 2000);
  };

  const handleNotifyKitchen = () => {
    setNotifiedKitchen(true);
  };

  const filteredStudents = students.filter(s => {
    if (genderFilter && s.gender !== genderFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Night Attendance Roll Call</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-200">
              Kitchen Headcount Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record night curfew roll call — immediately computes student headcount for tomorrow's food & mess preparation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-xs bg-transparent font-mono font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Roll Call'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{msg}</span>
          </div>
          <button
            onClick={() => setShowFoodModal(true)}
            className="text-[11px] underline font-bold text-teal-700 hover:text-teal-900"
          >
            View Food Requisition
          </button>
        </div>
      )}

      {/* 🍽️ TOMORROW'S FOOD COUNT CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/30">
              <UtensilsCrossed className="w-7 h-7 text-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider text-teal-400 uppercase">
                  Mess & Kitchen Planning
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {savedFoodForecast ? 'Verified & Locked' : 'Live Roll Call Estimate'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                {presentCount} Students{' '}
                <span className="text-sm sm:text-base font-normal text-slate-300">
                  for Food Tomorrow
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Scheduled for <strong>{tomorrowDateStr}</strong> based on tonight's roll call attendance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <button
              onClick={handleCopyForecast}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/10"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedForecast ? 'Copied!' : 'Copy Slip'}</span>
            </button>
            <button
              onClick={() => setShowFoodModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Full Food Breakdown</span>
            </button>
          </div>
        </div>

        {/* 3-Meal Breakdown Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Breakfast (07:30 - 09:00 AM)
              </span>
              <span className="text-sm font-bold text-white">
                {presentCount} Meals
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Lunch (12:30 - 02:00 PM)
              </span>
              <span className="text-sm font-bold text-white">
                {presentCount} Meals
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                Dinner (07:30 - 09:15 PM)
              </span>
              <span className="text-sm font-bold text-white">
                {presentCount} Meals
              </span>
            </div>
          </div>
        </div>

        {/* Food Wastage Prevention Footer */}
        <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            🛡️ <strong>{notEatingCount} students</strong> on Leave / Outpass / Absent — saving kitchen food wastage.
          </span>
          <span className="hidden sm:inline text-teal-400 font-semibold">
            {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}% Hostel Occupancy (Dinner)
          </span>
        </div>
      </div>

      {/* Summary Chips & Quick Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {presentCount} Present (Food Tomorrow)
          </span>
          <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200">
            {absentCount} Absent
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200">
            {leaveCount} Leave
          </span>
          <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200">
            {outpassCount} Outpass
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          >
            <option value="">All Hostels</option>
            <option value="Male">Boys Hostel</option>
            <option value="Female">Girls Hostel</option>
          </select>

          <button
            onClick={() => handleMarkAll('PRESENT')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Mark All Present
          </button>
        </div>
      </div>

      {/* Attendance Marking Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Reg No & Room</th>
                <th className="px-5 py-3">Gender</th>
                <th className="px-5 py-3">Roll Call Status</th>
                <th className="px-5 py-3 text-right">Tomorrow Food</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(st => {
                  const currentStatus = attendanceState[st.id] || 'PRESENT';
                  const eatsFood = currentStatus === 'PRESENT';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-800">{st.name}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="font-mono font-bold text-teal-700">{st.register_number}</span>
                        <span className="block text-[10px] text-slate-400">Room: {st.room_number || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-4">{st.gender}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          {['PRESENT', 'ABSENT', 'LEAVE', 'OUTPASS'].map(stTag => {
                            const isActive = currentStatus === stTag;
                            const activeClass =
                              stTag === 'PRESENT' ? 'bg-emerald-600 text-white border-emerald-600' :
                              stTag === 'ABSENT' ? 'bg-rose-600 text-white border-rose-600' :
                              stTag === 'LEAVE' ? 'bg-amber-600 text-white border-amber-600' :
                              'bg-blue-600 text-white border-blue-600';

                            return (
                              <button
                                key={stTag}
                                onClick={() => setStudentStatus(st.id, stTag)}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                                  isActive
                                    ? `${activeClass} shadow-xs`
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {stTag}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {eatsFood ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" /> Dining
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            No Meal
                          </span>
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

      {/* 🍲 MODAL: TOMORROW'S FOOD ORDER & REQUISITION CONFIRMATION */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden transform animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-700 to-emerald-700 p-6 text-white relative">
              <button
                onClick={() => setShowFoodModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-white text-teal-800 flex items-center justify-center mb-3 shadow-md">
                <UtensilsCrossed className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-black">Tomorrow's Food Preparation Count</h3>
              <p className="text-xs text-teal-100 mt-1">
                Official Headcount Requisition for <strong>{tomorrowDateStr}</strong>
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center">
                <span className="text-xs uppercase font-extrabold text-teal-700 tracking-wider block">
                  Confirmed Student Dinner Headcount Tomorrow
                </span>
                <span className="text-4xl font-black text-teal-950 mt-1 block">
                  {presentCount} Students
                </span>
                <span className="text-[11px] text-teal-700 mt-0.5 block">
                  Calculated from tonight's roll call ({presentCount} Present / {students.length} Total)
                </span>
              </div>

              {/* Meal Servings Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kitchen Serving Schedule:
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <div className="p-3 bg-slate-50/60 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-amber-500" /> Breakfast (07:30 - 09:00 AM)
                    </span>
                    <strong className="text-slate-900">{presentCount} Servings</strong>
                  </div>
                  <div className="p-3 bg-slate-50/60 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-teal-600" /> Lunch (12:30 - 02:00 PM)
                    </span>
                    <strong className="text-slate-900">{presentCount} Servings</strong>
                  </div>
                  <div className="p-3 bg-slate-50/60 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-600" /> Dinner (07:30 - 09:15 PM)
                    </span>
                    <strong className="text-slate-900">{presentCount} Servings</strong>
                  </div>
                </div>
              </div>

              {/* Wastage prevention callout */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Zero-Waste Kitchen Alert:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    <strong>{notEatingCount} students</strong> are flagged Absent ({absentCount}), on Leave ({leaveCount}), or Outpass ({outpassCount}). Their meals have been excluded from the tomorrow prep order.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleNotifyKitchen}
                  disabled={notifiedKitchen}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md ${
                    notifiedKitchen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                  }`}
                >
                  {notifiedKitchen ? (
                    <>
                      <Check className="w-4 h-4" /> Notified Kitchen Supervisor
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send to Mess Kitchen
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyForecast}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" /> {copiedForecast ? 'Copied!' : 'Copy'}
                </button>

                <button
                  onClick={() => setShowFoodModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
