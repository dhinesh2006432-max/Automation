const { getMemoryStore } = require('../config/db');

// GET SYSTEM SUMMARY REPORTS (Warden / Admin Dashboard Metrics)
const getDashboardStats = (req, res) => {
  const store = getMemoryStore();

  const totalStudents = store.students.length;
  const totalRooms = store.rooms.length;
  const occupiedRooms = store.rooms.filter(r => r.current_occupancy > 0).length;
  const availableRooms = store.rooms.filter(r => r.status === 'AVAILABLE' || r.status === 'PARTIALLY_OCCUPIED').length;
  const pendingAllocations = store.room_requests.filter(r => r.status === 'PENDING').length;
  const pendingComplaints = store.complaints.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length;
  const emergencyComplaints = store.complaints.filter(c => c.priority === 'EMERGENCY' && c.status !== 'RECTIFIED').length;
  const pendingOutpasses = store.outpasses.filter(o => o.status === 'APPROVED' || o.status === 'OUTSIDE').length;
  const overdueOutpasses = store.outpasses.filter(o => o.status === 'OVERDUE').length;
  const pendingLetters = store.letters.filter(l => l.status === 'PENDING').length;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = store.attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length;

  const activeLeavesOrOutpasses = store.outpasses.filter(o => o.status === 'APPROVED' || o.status === 'OUTSIDE').length;
  const tomorrowFoodCount = todayAttendance.length > 0
    ? presentToday
    : Math.max(0, totalStudents - activeLeavesOrOutpasses);

  // Complaints by category chart data
  const categoryCounts = {};
  store.complaints.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  res.json({
    totalStudents,
    totalRooms,
    occupiedRooms,
    availableRooms,
    pendingAllocations,
    pendingComplaints,
    emergencyComplaints,
    pendingOutpasses,
    overdueOutpasses,
    pendingLetters,
    presentToday,
    tomorrowFoodCount,
    complaintsByCategory: categoryCounts
  });
};

// EXPORT REPORT AS CSV DATA
const exportReportCSV = (req, res) => {
  const { type } = req.params; // 'students' | 'rooms' | 'complaints' | 'outpasses'
  const store = getMemoryStore();

  let csvContent = '';

  if (type === 'students') {
    csvContent = 'RegisterNumber,Name,Department,Year,Gender,Phone,ParentPhone\n';
    store.students.forEach(s => {
      csvContent += `"${s.register_number}","${s.name}","${s.department}",${s.year},"${s.gender}","${s.phone}","${s.parent_phone}"\n`;
    });
  } else if (type === 'rooms') {
    csvContent = 'RoomNumber,Block,Floor,Type,Capacity,Occupancy,Status\n';
    store.rooms.forEach(r => {
      csvContent += `"${r.room_number}","${r.block}",${r.floor},"${r.room_type}",${r.capacity},${r.current_occupancy},"${r.status}"\n`;
    });
  } else if (type === 'complaints') {
    csvContent = 'ID,RoomNumber,Category,Title,Priority,Status,Date\n';
    store.complaints.forEach(c => {
      csvContent += `${c.id},"${c.room_number}","${c.category}","${c.title}","${c.priority}","${c.status}","${c.created_at}"\n`;
    });
  } else if (type === 'outpasses') {
    csvContent = 'OutpassCode,StudentID,Reason,OutDate,OutTime,ExpectedReturnDate,ExpectedReturnTime,Status\n';
    store.outpasses.forEach(o => {
      csvContent += `"${o.outpass_code}",${o.student_id},"${o.reason}","${o.out_date}","${o.out_time}","${o.expected_return_date}","${o.expected_return_time}","${o.status}"\n`;
    });
  } else {
    return res.status(400).json({ error: 'Invalid report type specified.' });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
  res.send(csvContent);
};

module.exports = {
  getDashboardStats,
  exportReportCSV
};
