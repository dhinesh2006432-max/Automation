import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { HelpCircle, Plus, CheckCircle2, Image as ImageIcon, MapPin, Calendar, Phone } from 'lucide-react';

export default function LostFoundPage() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState('LOST');
  const [photo, setPhoto] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/lost-found');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(contactInfo)) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);

    try {
      const data = new FormData();
      data.append('item_name', itemName);
      data.append('description', description);
      data.append('location', location);
      data.append('contact_info', contactInfo);
      data.append('status', status);
      if (photo) data.append('photo', photo);

      await api.post('/lost-found', data);
      setShowModal(false);
      setItemName('');
      setDescription('');
      setLocation('');
      setContactInfo('');
      setPhoto(null);
      setMsg('Lost & Found item posted successfully!');
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Campus Lost & Found Bulletin</h2>
          <p className="text-xs text-slate-500">Post lost items or report items found around hostel premises</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Post Item Notice
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid of Lost & Found Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-3xl text-center text-xs text-slate-400 border border-slate-200">
            No items posted in Lost & Found board.
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <h3 className="font-extrabold text-sm text-slate-800">{item.item_name}</h3>
                  <Badge status={item.status} />
                </div>

                <p className="text-xs text-slate-600 mb-3">{item.description}</p>

                <div className="space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{item.date_lost_found}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-600" /> {item.contact_info}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Post Lost / Found Item</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Post Type</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="LOST">I Lost an Item</option>
                  <option value="FOUND">I Found an Item</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="e.g. Stainless Steel Water Bottle"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Color, brand, distinguishing marks..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Lost/Found</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Block A Badminton Court"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Contact Phone Number</label>
                  <span className={`text-[10px] font-bold ${contactInfo.length === 10 ? 'text-teal-600' : 'text-slate-400'}`}>
                    {contactInfo.length}/10 digits
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                    +91
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={contactInfo}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setContactInfo(val);
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full pl-11 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl tracking-wider font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {contactInfo.length > 0 && contactInfo.length < 10 && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1">
                    Please enter full 10-digit phone number ({10 - contactInfo.length} digit{10 - contactInfo.length > 1 ? 's' : ''} remaining)
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
                >
                  {loading ? 'Posting...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
