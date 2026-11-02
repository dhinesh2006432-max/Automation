import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Badge from '../components/Badge';
import { Building, Plus, Search, Trash2, Edit3, UserCheck, XCircle, CheckCircle2 } from 'lucide-react';

export default function WardenRoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [blockFilter, setBlockFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [block, setBlock] = useState('Block A');
  const [floor, setFloor] = useState('1');
  const [roomType, setRoomType] = useState('2 Sharing');
  const [bathroomType, setBathroomType] = useState('Attached');
  const [acType, setAcType] = useState('AC');
  const [capacity, setCapacity] = useState('2');
  const [genderRestriction, setGenderRestriction] = useState('BOYS');

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [blockFilter, statusFilter, search]);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms', {
        params: { block: blockFilter, status: statusFilter, search }
      });
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/rooms', {
        room_number: roomNumber,
        block,
        floor: parseInt(floor, 10),
        room_type: roomType,
        bathroom_type: bathroomType,
        ac_type: acType,
        capacity: parseInt(capacity, 10),
        gender_restriction: genderRestriction
      });

      setShowAddModal(false);
      setRoomNumber('');
      setMsg('New room created successfully!');
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      setMsg('Room deleted successfully.');
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete room.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Hostel Rooms & Inventory Management</h2>
          <p className="text-xs text-slate-500">Add, configure capacity, view occupants, & manage room availability statuses</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New Room
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search room number..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        <select
          value={blockFilter}
          onChange={e => setBlockFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">All Blocks</option>
          <option value="Block A">Block A (Boys)</option>
          <option value="Block B">Block B (Girls)</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="PARTIALLY_OCCUPIED">PARTIALLY_OCCUPIED</option>
          <option value="FULL">FULL</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
      </div>

      {/* Rooms Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">{room.room_number}</h3>
                  <span className="text-[10px] text-slate-400">{room.block} • Floor {room.floor}</span>
                </div>
                <Badge status={room.status} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                <p><strong className="text-slate-800">Capacity:</strong> {room.current_occupancy} / {room.capacity} Occupied</p>
                <p><strong className="text-slate-800">Specs:</strong> {room.room_type} | {room.ac_type} | {room.bathroom_type}</p>
                <p><strong className="text-slate-800">Gender:</strong> {room.gender_restriction}</p>
              </div>

              {room.occupants && room.occupants.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Occupant Students:</span>
                  {room.occupants.map(occ => (
                    <div key={occ.id} className="text-xs font-semibold text-slate-800 flex justify-between">
                      <span>• {occ.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{occ.register_number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleDeleteRoom(room.id)}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                title="Delete Room"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Add New Hostel Room</h3>

            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  placeholder="e.g. A-301"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Block</label>
                  <select
                    value={block}
                    onChange={e => setBlock(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Block A">Block A (Boys)</option>
                    <option value="Block B">Block B (Girls)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Floor</label>
                  <input
                    type="number"
                    value={floor}
                    onChange={e => setFloor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={e => setRoomType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="2 Sharing">2 Sharing</option>
                    <option value="3 Sharing">3 Sharing</option>
                    <option value="Common Room">Common Room</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Air Conditioning</label>
                  <select
                    value={acType}
                    onChange={e => setAcType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bathroom Style</label>
                  <select
                    value={bathroomType}
                    onChange={e => setBathroomType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Attached">Attached</option>
                    <option value="Common">Common</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
