import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Megaphone, Plus, Trash2, CheckCircle2, Image as ImageIcon, X, ExternalLink, Eye } from 'lucide-react';

export default function WardenAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priorityFlag, setPriorityFlag] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [viewImageModal, setViewImageModal] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title) {
      alert('Please enter a notice title.');
      return;
    }
    if (!description && !imageFile) {
      alert('Please provide either an announcement description or attach a notice image.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('priority_flag', priorityFlag);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await api.post('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowModal(false);
      setTitle('');
      setDescription('');
      handleRemoveImage();
      setMsg('Announcement notice published successfully to all student portals!');
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish announcement.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete announcement notice?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Hostel Announcements & Bulletin</h2>
          <p className="text-xs text-slate-500">Publish notices, circular images, mess menu changes, and emergency notifications</p>
        </div>

        <button
          onClick={() => {
            handleRemoveImage();
            setShowModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Announcement
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl text-center text-xs text-slate-400 border border-slate-200">
            No announcements published yet.
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-800">{ann.title}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">{ann.category}</span>
                  {ann.priority_flag && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">IMPORTANT</span>
                  )}
                  {ann.attachment_url && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Image Notice
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 whitespace-pre-line">{ann.description}</p>

                {/* Notice Image Display */}
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

                <span className="text-[10px] text-slate-400 block pt-1">{new Date(ann.created_at).toLocaleString()}</span>
              </div>

              <button
                onClick={() => handleDelete(ann.id)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                title="Delete Announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-600" /> Publish Announcement Notice
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  <option value="General">General</option>
                  <option value="Mess">Mess</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Important">Important</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Annual Hostel Sports Meet Notice"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Announcement Details {imageFile ? '(Optional with image)' : '*'}
                </label>
                <textarea
                  rows={3}
                  required={!imageFile}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Announcement description details or summary of circular..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Notice Image / Circular Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                    Notice Image / Circular <span className="text-[10px] text-slate-400 font-normal">(Post notice in image format)</span>
                  </label>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 space-y-2">
                    <img
                      src={imagePreview}
                      alt="Notice preview"
                      className="max-h-48 w-full object-contain rounded-xl bg-white"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span className="truncate max-w-[220px] font-medium">{imageFile?.name}</span>
                      <span className="font-mono text-[10px]">{(imageFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-teal-50/30 transition-colors group">
                    <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-teal-600 transition-colors mb-1" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-teal-700">
                      Click to upload Notice Image / Poster
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, JPEG, WEBP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prio"
                  checked={priorityFlag}
                  onChange={e => setPriorityFlag(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="prio" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Mark as Important (Sends immediate notifications to students)
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveImage();
                    setShowModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
                >
                  {loading ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                <ImageIcon className="w-3.5 h-3.5 text-teal-600" /> Announcement Notice Image
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
