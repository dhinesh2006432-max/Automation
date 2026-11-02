import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, User, Home, CheckSquare, AlertCircle, Megaphone,
  FileText, Ticket, CreditCard, UtensilsCrossed, HelpCircle, PhoneCall,
  Users, Building, BarChart2, MessageSquare, ShieldAlert, RefreshCw, Bot, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ open, setOpen }) {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const studentNav = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/student/profile', icon: User },
    { name: 'Room Details & Request', path: '/student/room-request', icon: Home },
    { name: 'Attendance', path: '/student/attendance', icon: CheckSquare },
    { name: 'Complaints', path: '/student/complaints', icon: AlertCircle },
    { name: 'Announcements', path: '/student/announcements', icon: Megaphone },
    { name: 'Gate Outpass', path: '/student/outpass', icon: Ticket },
    { name: 'Fee & Receipts', path: '/student/fee', icon: CreditCard },
    { name: 'Mess & Feedback', path: '/student/feedback', icon: UtensilsCrossed },
    { name: 'Lost & Found', path: '/student/lost-found', icon: HelpCircle },
    { name: 'Emergency Contacts', path: '/student/emergency', icon: PhoneCall },
  ];

  const wardenNav = [
    { name: 'Dashboard', path: '/warden/dashboard', icon: LayoutDashboard },
    { name: 'Students Management', path: '/warden/students', icon: Users },
    { name: 'Room Management', path: '/warden/rooms', icon: Building },
    { name: 'Room Allocations', path: '/warden/allocations', icon: Home },
    { name: 'Attendance Marking', path: '/warden/attendance', icon: CheckSquare },
    { name: 'Complaints Queue', path: '/warden/complaints', icon: AlertCircle },
    { name: 'Outpasses & Overdue', path: '/warden/outpasses', icon: Ticket },
    { name: 'Announcements', path: '/warden/announcements', icon: Megaphone },
    { name: 'Fee Verification', path: '/warden/fee-verification', icon: CreditCard },
    { name: 'Maintenance & Reports', path: '/warden/reports', icon: BarChart2 },
  ];

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'All Students', path: '/warden/students', icon: Users },
    { name: 'Room Management', path: '/warden/rooms', icon: Building },
    { name: 'Reports & Analytics', path: '/warden/reports', icon: BarChart2 },
  ];

  const navItems = role === 'ADMIN' ? adminNav : (role === 'WARDEN' ? wardenNav : studentNav);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-slate-300 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col shadow-2xl`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-white font-bold flex items-center justify-center">
              HMS
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-wide block">HOSTEL PORTAL</span>
              <span className="text-[10px] text-teal-400 font-semibold">{role} PANELS</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Campus Hostel Management v2.0
        </div>
      </aside>
    </>
  );
}
