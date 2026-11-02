import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { Users, Home, AlertCircle, Ticket, CheckSquare, Sparkles, ChevronRight, BarChart2, ShieldAlert, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function WardenDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    pendingAllocations: 0,
    pendingComplaints: 0,
    emergencyComplaints: 0,
    pendingOutpasses: 0,
    overdueOutpasses: 0,
    presentToday: 0,
    tomorrowFoodCount: 0,
    complaintsByCategory: {}
  });

  const [emergencyQueue, setEmergencyQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/reports/stats');
      setStats(res.data);

      const compRes = await api.get('/complaints?priority=EMERGENCY');
      setEmergencyQueue(compRes.data.filter(c => c.status !== 'RECTIFIED'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = Object.keys(stats.complaintsByCategory || {}).map(cat => ({
    category: cat,
    count: stats.complaintsByCategory[cat]
  }));

  const COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Hostel Administration Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Warden Control Center</h1>
          <p className="text-xs text-slate-300 mt-1">Real-time room occupancy, pending allocations, emergency alerts, & attendance roll call</p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/warden/allocations"
            className="px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Trigger Smart Allocation
          </Link>
          <Link
            to="/warden/attendance"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5"
          >
            <CheckSquare className="w-4 h-4" /> Night Roll Call
          </Link>
        </div>
      </div>

      {/* EMERGENCY ALERT BAR */}
      {emergencyQueue.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500 text-white shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm">🚨 {emergencyQueue.length} EMERGENCY COMPLAINT(S) ATTENTION REQUIRED</h3>
              <p className="text-xs text-rose-100">{emergencyQueue[0].title} - Room {emergencyQueue[0].room_number}</p>
            </div>
          </div>
          <Link to="/warden/complaints" className="px-4 py-2 rounded-xl bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 transition-all">
            Inspect Queue
          </Link>
        </div>
      )}

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} subtext="Registered Hostel Residents" icon={Users} color="teal" />
        <StatCard title="Tomorrow's Food Count" value={`${stats.tomorrowFoodCount ?? stats.presentToday ?? 0} Dinner Meals`} subtext="Confirmed Kitchen Headcount" icon={UtensilsCrossed} color="teal" />
        <StatCard title="Occupied Rooms" value={`${stats.occupiedRooms} / ${stats.totalRooms}`} subtext={`${stats.availableRooms} Rooms Available`} icon={Home} color="blue" />
        <StatCard title="Pending Allocations" value={stats.pendingAllocations} subtext="Requests Awaiting Review" icon={Sparkles} color="amber" />
        <StatCard title="Pending Complaints" value={stats.pendingComplaints} subtext={`${stats.emergencyComplaints} Emergency`} icon={AlertCircle} color="rose" />
      </div>

      {/* 🍽️ Tomorrow's Food Requisition Alert Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-teal-800/40 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
            <UtensilsCrossed className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Tomorrow's Mess Preparation Headcount</h3>
              <span className="text-[10px] bg-teal-500/30 text-teal-200 px-2 py-0.5 rounded-full font-bold">
                {stats.presentToday > 0 ? 'Verified from Night Roll Call' : 'Auto Estimated'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              <strong>{stats.tomorrowFoodCount ?? stats.presentToday ?? 0} students</strong> confirmed for Breakfast, Lunch & Dinner tomorrow based on attendance.
            </p>
          </div>
        </div>
        <Link
          to="/warden/attendance"
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto shadow-md shadow-teal-500/20"
        >
          <span>Take Roll Call / View Food Requisition</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Grid: Maintenance Analytics & Outpass Overdue Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maintenance Complaints Category Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-teal-600" /> Complaints by Maintenance Category
            </h3>
            <Link to="/warden/complaints" className="text-xs font-bold text-teal-600 hover:underline">
              Manage Queue
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Action & Overdue Tracker */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-500" /> Outpass & Overdue Metrics
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-800 font-bold block">Active Outside Students</span>
                  <span className="text-2xl font-extrabold text-amber-900">{stats.pendingOutpasses}</span>
                </div>
                <Ticket className="w-8 h-8 text-amber-500 opacity-80" />
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-800 font-bold block">Overdue Returns</span>
                  <span className="text-2xl font-extrabold text-rose-900">{stats.overdueOutpasses}</span>
                </div>
                <ShieldAlert className="w-8 h-8 text-rose-500 opacity-80" />
              </div>
            </div>
          </div>

          <Link
            to="/warden/outpasses"
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center block transition-all"
          >
            Open Outpass Tracker
          </Link>
        </div>
      </div>
    </div>
  );
}
