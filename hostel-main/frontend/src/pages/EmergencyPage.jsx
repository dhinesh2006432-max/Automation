import React from 'react';
import { Phone, ShieldAlert, Ambulance, HeartPulse, Flame, Building2, User } from 'lucide-react';

export default function EmergencyPage() {
  const contacts = [
    { title: 'Chief Boys Warden', name: 'Dr. Robert Vance', number: '+1 (987) 654-3210', icon: User, color: 'bg-teal-50 text-teal-600 border-teal-200' },
    { title: 'Senior Girls Warden', name: 'Prof. Sarah Jenkins', number: '+1 (987) 654-3211', icon: User, color: 'bg-teal-50 text-teal-600 border-teal-200' },
    { title: 'Campus Security Desk', name: '24/7 Gate Patrol Office', number: '+1 (800) 555-0199', icon: ShieldAlert, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { title: 'Campus Ambulance', name: 'Emergency Medical Service', number: '+1 (800) 911-0000', icon: Ambulance, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { title: 'Nearest Hospital', name: 'City Care Hospital ER', number: '+1 (555) 019-2831', icon: HeartPulse, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { title: 'Local Police Station', name: 'Springfield North Precinct', number: '+1 911', icon: ShieldAlert, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { title: 'Fire & Rescue Service', name: 'Municipal Fire Department', number: '+1 911', icon: Flame, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { title: 'Hostel Maintenance Office', name: 'Electrical & Plumbing Desk', number: '+1 (800) 555-HELP', icon: Building2, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Emergency Protocol</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Hostel Emergency Contacts</h1>
        <p className="text-xs text-rose-100/80 mt-1">Direct clickable phone numbers for campus security, warden office, and medical services</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contacts.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">{c.title}</h3>
                  <p className="text-xs text-slate-500">{c.name}</p>
                </div>
              </div>

              <a
                href={`tel:${c.number}`}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-teal-400" /> {c.number}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
