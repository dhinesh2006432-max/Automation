import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import { Home, CheckSquare, AlertCircle, Ticket, Megaphone, User, Download, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [allocation, setAllocation] = useState(null);
  const [room, setRoom] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({ percentage: 100, total: 0, present: 0 });
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [outpass, setOutpass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student room allocation directly
        try {
          const allocRes = await api.get('/allocations/my-allocation');
          if (allocRes.data?.room) {
            setRoom(allocRes.data.room);
            setRoommates(allocRes.data.roommates || []);
          } else {
            setRoom(null);
            setRoommates([]);
          }
        } catch (e) {
          // Fallback to rooms scan
          const roomsRes = await api.get('/rooms');
          const studentProfile = user?.profile;
          if (studentProfile) {
            const myRoom = roomsRes.data.find(
              r => r.occupants && r.occupants.some(occ => String(occ.id) === String(studentProfile.id))
            );
            if (myRoom) {
              setRoom(myRoom);
              setRoommates(myRoom.occupants.filter(occ => String(occ.id) !== String(studentProfile.id)));
            }
          }
        }

        // Fetch attendance
        const attRes = await api.get('/attendance');
        if (attRes.data.summary) {
          setAttendanceSummary(attRes.data.summary);
        }

        // Fetch complaints
        const compRes = await api.get('/complaints');
        setComplaints(compRes.data);

        // Fetch announcements
        const annRes = await api.get('/announcements');
        setAnnouncements(annRes.data.slice(0, 3));

        // Fetch outpass
        const opRes = await api.get('/outpasses');
        if (opRes.data.length > 0) {
          setOutpass(opRes.data[0]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading student dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">Student Overview</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Hello, {user?.profile?.name || 'Student'}!</h1>
          <p className="text-xs text-teal-100/80 mt-1">
            Register No: <span className="font-mono font-bold text-white">{user?.profile?.register_number || 'N/A'}</span> • {user?.profile?.department || 'Engineering'}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/student/room-request"
            className="px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" /> Room Details
          </Link>
          <Link
            to="/student/outpass"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5"
          >
            <Ticket className="w-4 h-4" /> Request Outpass
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Room"
          value={room ? room.room_number : 'Not Allocated'}
          subtext={room ? `${room.block} • ${room.room_type}` : 'Submit Allocation Request'}
          icon={Home}
          color="teal"
        />
        <StatCard
          title="Attendance Score"
          value={`${attendanceSummary.percentage}%`}
          subtext={attendanceSummary.percentage < 75 ? '⚠️ Warning: Below 75%' : 'Good Standing'}
          icon={CheckSquare}
          color={attendanceSummary.percentage < 75 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Pending Complaints"
          value={complaints.filter(c => c.status !== 'RECTIFIED').length}
          subtext={`${complaints.length} Total Complaints`}
          icon={AlertCircle}
          color="amber"
        />
        <StatCard
          title="Active Outpass"
          value={outpass ? outpass.status : 'None'}
          subtext={outpass ? outpass.outpass_code : 'No active pass'}
          icon={Ticket}
          color="blue"
        />
      </div>

      {/* Main Grid: Room details & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room & Roommates Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Home className="w-5 h-5 text-teal-600" /> Allocated Room Details
            </h3>
            {room && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.get('/allocations/download-pdf', { responseType: 'blob' });
                    const blob = new Blob([res.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Room-Allocation-${user?.profile?.register_number || 'Slip'}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    alert('Failed to download room allocation confirmation PDF.');
                  }
                }}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Confirmation PDF
              </button>
            )}
          </div>

          {room ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Room Number</span>
                  <span className="font-bold text-slate-800 text-sm">{room.room_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Block / Floor</span>
                  <span className="font-bold text-slate-800 text-sm">{room.block} (F-{room.floor})</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Specifications</span>
                  <span className="font-bold text-slate-800 text-sm">{room.ac_type} • {room.bathroom_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Capacity Status</span>
                  <Badge status={room.status} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Roommates</h4>
                {roommates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No other roommates allocated to this room yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roommates.map(mate => (
                      <div key={mate.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">
                          {mate.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{mate.name}</p>
                          <p className="text-[10px] text-slate-500">{mate.register_number} • {mate.department}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <p className="text-xs text-slate-500">You currently do not have an active room allocation.</p>
              <Link
                to="/student/room-request"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20"
              >
                Submit Room Request Form <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Recent Announcements Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" /> Recent Notices
              </h3>
              <Link to="/student/announcements" className="text-xs text-teal-600 font-bold hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400">No notices posted.</p>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 line-clamp-1">{ann.title}</span>
                      <div className="flex items-center gap-1">
                        {ann.attachment_url && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-0.5">
                            <ImageIcon className="w-2.5 h-2.5" /> Image
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{ann.category}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{ann.description}</p>
                    {ann.attachment_url && (
                      <Link to="/student/announcements" className="text-[10px] text-teal-600 font-bold hover:underline inline-flex items-center gap-1 pt-0.5">
                        <ImageIcon className="w-3 h-3" /> View Notice Poster &rarr;
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
