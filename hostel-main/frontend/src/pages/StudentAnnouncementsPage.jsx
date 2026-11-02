import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Megaphone, Bell, Search, Image as ImageIcon, Eye, X, ExternalLink } from 'lucide-react';

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewImageModal, setViewImageModal] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(announcements.map(a => a.category).filter(Boolean))];

  const filtered = announcements.filter(ann => {
    const q = search.toLowerCase();
    const matchSearch = ann.title.toLowerCase().includes(q) || ann.description.toLowerCase().includes(q);
    const matchCategory = categoryFilter ? ann.category === categoryFilter : true;
    return matchSearch && matchCategory;
  });

  const priorityAnn = filtered.filter(a => a.priority_flag);
  const regularAnn = filtered.filter(a => !a.priority_flag);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">Hostel Announcements &amp; Notices</h2>
        <p className="text-xs text-slate-500">Stay updated with hostel notices, circulars, mess schedules, and important alerts</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center border border-slate-200">
          <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-xs text-slate-400">No announcements posted yet.</p>
        </div>
      ) : (
        <>
          {/* Priority Announcements */}
          {priorityAnn.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Important Notices
              </h3>
              {priorityAnn.map(ann => (
                <div key={ann.id} className="bg-rose-50 rounded-3xl p-5 border border-rose-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-rose-900">{ann.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                        {ann.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                        IMPORTANT
                      </span>
                      {ann.attachment_url && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-rose-700 border border-rose-200 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Circular Image
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-rose-400">{new Date(ann.created_at).toLocaleString()}</span>
                  </div>

                  <p className="text-xs text-rose-800 whitespace-pre-line">{ann.description}</p>

                  {/* Notice Image */}
                  {ann.attachment_url && (
                    <div className="pt-1">
                      <div className="relative inline-block group max-w-md">
                        <img
                          src={ann.attachment_url}
                          alt={ann.title}
                          onClick={() => setViewImageModal(ann.attachment_url)}
                          className="max-h-64 rounded-2xl border border-rose-200 object-cover cursor-pointer shadow-xs hover:opacity-95 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setViewImageModal(ann.attachment_url)}
                          className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                        >
                          <Eye className="w-3 h-3" /> View Full Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Regular Announcements */}
          {regularAnn.length > 0 && (
            <div className="space-y-3">
              {priorityAnn.length > 0 && (
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">General Notices</h3>
              )}
              {regularAnn.map(ann => (
                <div key={ann.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800">{ann.title}</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {ann.category}
                      </span>
                      {ann.attachment_url && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Circular Image
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(ann.created_at).toLocaleString()}</span>
                  </div>

                  <p className="text-xs text-slate-600 whitespace-pre-line">{ann.description}</p>

                  {/* Notice Image */}
                  {ann.attachment_url && (
                    <div className="pt-1">
                      <div className="relative inline-block group max-w-md">
                        <img
                          src={ann.attachment_url}
                          alt={ann.title}
                          onClick={() => setViewImageModal(ann.attachment_url)}
                          className="max-h-64 rounded-2xl border border-slate-200 object-cover cursor-pointer shadow-xs hover:opacity-95 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setViewImageModal(ann.attachment_url)}
                          className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                        >
                          <Eye className="w-3 h-3" /> View Full Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Full Image Viewer Modal */}
      {viewImageModal && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-3 py-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-teal-600" /> Announcement Circular Image
              </span>
              <button 
                onClick={() => setViewImageModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center">
              <img
                src={viewImageModal}
                alt="Enlarged notice"
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
            <div className="px-3 py-2 border-t border-slate-100 flex justify-end">
              <a
                href={viewImageModal}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Image in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
