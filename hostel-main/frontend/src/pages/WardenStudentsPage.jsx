import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Search, Users, Phone, Mail, BookOpen, Home, Filter } from 'lucide-react';
import Badge from '../components/Badge';

export default function WardenStudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [allocFilter, setAllocFilter] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      (s.name || '').toLowerCase().includes(q) ||
      (s.register_number || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.room_number || '').toLowerCase().includes(q);
    const matchDept = deptFilter ? s.department === deptFilter : true;
    const matchAlloc = allocFilter ? s.allocation_status === allocFilter : true;
    return matchSearch && matchDept && matchAlloc;
  });

  const allocatedCount = students.filter(s => s.allocation_status === 'ALLOCATED').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Student Directory & Room Mapping</h2>
          <p className="text-xs text-slate-500">Search student profiles, register numbers, parent contacts, & assigned hostel rooms</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
            {allocatedCount} / {students.length} Allocated
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student name, roll number, room..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={allocFilter}
          onChange={e => setAllocFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">All Statuses</option>
          <option value="ALLOCATED">Allocated Room</option>
          <option value="UNALLOCATED">Unallocated</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Register Number</th>
                <th className="px-5 py-3">Room / Block</th>
                <th className="px-5 py-3">Department & Year</th>
                <th className="px-5 py-3">Gender</th>
                <th className="px-5 py-3">Student Phone</th>
                <th className="px-5 py-3">Parent Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No students match the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-800">{st.name}</td>
                    <td className="px-5 py-4 font-mono font-bold text-teal-700">{st.register_number}</td>
                    <td className="px-5 py-4">
                      {st.allocation_status === 'ALLOCATED' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                          <Home className="w-3 h-3 text-teal-600" /> {st.room_number} ({st.block})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Allocated</span>
                      )}
                    </td>
                    <td className="px-5 py-4">{st.department} (Yr {st.year})</td>
                    <td className="px-5 py-4">{st.gender}</td>
                    <td className="px-5 py-4 text-slate-600">{st.phone || 'N/A'}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <p className="font-semibold text-slate-700">{st.parent_name || 'Parent'}</p>
                      <p className="text-[10px] text-slate-400">{st.parent_phone || 'N/A'}</p>
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
