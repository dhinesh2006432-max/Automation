import React, { useState } from 'react';
import api from '../services/api';
import { Download, FileSpreadsheet, Users, Home, AlertCircle, Ticket, CheckSquare } from 'lucide-react';

export default function WardenReportsPage() {
  const [downloadingType, setDownloadingType] = useState(null);

  const reports = [
    {
      title: 'Registered Students Master List',
      type: 'students',
      desc: 'Full student profile directory, register numbers, department, year, gender, & parent contacts.',
      icon: Users
    },
    {
      title: 'Hostel Rooms & Occupancy Report',
      type: 'rooms',
      desc: 'Current block-wise room capacities, occupied statuses, vacancy metrics, & specifications.',
      icon: Home
    },
    {
      title: 'Complaints & Maintenance Log',
      type: 'complaints',
      desc: 'Maintenance complaint history, resolution status, emergency priorities, & warden notes.',
      icon: AlertCircle
    },
    {
      title: 'Outpasses & Overdue Log',
      type: 'outpasses',
      desc: 'Gate outpass records, out/return timestamps, student details, & overdue gate violations.',
      icon: Ticket
    }
  ];

  const handleExport = async (type) => {
    setDownloadingType(type);
    try {
      const res = await api.get(`/reports/export/${type}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      const token = localStorage.getItem('hostel_token');
      window.open(`/api/reports/export/${type}?token=${token}`, '_blank');
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">Hostel Reports & Analytics Exports</h2>
        <p className="text-xs text-slate-500">Download formatted CSV spreadsheets for administrative records, audits, & analytics</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((r, i) => {
          const Icon = r.icon;
          const isExporting = downloadingType === r.type;

          return (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                </div>
              </div>

              <button
                onClick={() => handleExport(r.type)}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
