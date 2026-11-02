const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');

// MARK DAILY ATTENDANCE (Warden)
const markAttendance = async (req, res) => {
  try {
    const { date, attendanceList } = req.body; // array of { student_id, room_id, status, remarks }
    if (!attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({ error: 'Invalid attendance list provided.' });
    }

    const store = getMemoryStore();
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    const wardenId = req.user ? req.user.profileId : null;

    for (const item of attendanceList) {
      const sId = parseInt(item.student_id, 10);
      const rId = parseInt(item.room_id, 10);
      const status = item.status || 'PRESENT';
      const remarks = item.remarks || '';

      if (isPostgresConnected()) {
        try {
          await query(
            `INSERT INTO attendance (student_id, room_id, date, status, marked_by_warden_id, remarks)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (student_id, date)
             DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, marked_by_warden_id = EXCLUDED.marked_by_warden_id`,
            [sId, rId, attendanceDate, status, wardenId, remarks]
          );
        } catch (dbErr) {
          console.error('[DB markAttendance Error]', dbErr.message);
        }
      }

      const existingIdx = store.attendance.findIndex(a => String(a.student_id) === String(sId) && a.date === attendanceDate);
      const record = {
        id: existingIdx !== -1 ? store.attendance[existingIdx].id : Date.now() + Math.floor(Math.random() * 1000),
        student_id: sId,
        room_id: rId,
        date: attendanceDate,
        status,
        marked_by_warden_id: wardenId || 1,
        remarks
      };

      if (existingIdx !== -1) {
        store.attendance[existingIdx] = record;
      } else {
        store.attendance.push(record);
      }

      // Check attendance threshold warning (< 75%)
      const studentHistory = store.attendance.filter(a => String(a.student_id) === String(sId));
      const presentCount = studentHistory.filter(a => a.status === 'PRESENT' || a.status === 'OUTPASS').length;
      const percentage = (presentCount / studentHistory.length) * 100;

      if (percentage < 75 && studentHistory.length >= 3) {
        const student = store.students.find(s => String(s.id) === String(sId));
        if (student) {
          const alertMsg = `Your current attendance is ${percentage.toFixed(1)}%, which is below the mandatory 75% threshold.`;
          if (isPostgresConnected()) {
            query(
              `INSERT INTO notifications (user_id, title, message, type, is_read)
               VALUES ($1, 'Attendance Alert Warning', $2, 'WARNING', false)`,
              [student.user_id, alertMsg]
            ).catch(() => {});
          }
          store.notifications.push({
            id: Date.now() + 10,
            user_id: student.user_id,
            title: 'Attendance Alert Warning',
            message: alertMsg,
            type: 'WARNING',
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Calculate tomorrow's food preparation forecast
    const totalMarked = attendanceList.length;
    const presentCount = attendanceList.filter(a => a.status === 'PRESENT').length;
    const absentCount = attendanceList.filter(a => a.status === 'ABSENT').length;
    const leaveCount = attendanceList.filter(a => a.status === 'LEAVE').length;
    const outpassCount = attendanceList.filter(a => a.status === 'OUTPASS').length;

    const tomorrow = new Date(attendanceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Record notification for kitchen / mess supervisor
    const messAlert = `Tomorrow (${tomorrowStr}) Food Count: ${presentCount} students confirmed for meals (${absentCount + leaveCount + outpassCount} off-campus/absent).`;
    store.notifications.push({
      id: Date.now() + 20,
      user_id: 1, // Admin / Mess Manager
      title: "Tomorrow's Mess Food Count",
      message: messAlert,
      type: 'INFO',
      is_read: false,
      created_at: new Date().toISOString()
    });

    saveMemoryStore();

    res.json({
      message: 'Attendance recorded successfully!',
      foodForecast: {
        attendanceDate,
        foodDate: tomorrowStr,
        totalStudents: totalMarked,
        foodCountTomorrow: presentCount,
        notEatingCount: absentCount + leaveCount + outpassCount,
        breakdown: {
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          outpass: outpassCount
        },
        meals: {
          breakfast: presentCount,
          lunch: presentCount,
          dinner: presentCount
        },
        message: `${presentCount} students confirmed for food preparation tomorrow (${tomorrowStr}).`
      }
    });
  } catch (err) {
    console.error('Attendance error:', err);
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
};

// GET STUDENT ATTENDANCE HISTORY (Student / Warden)
const getAttendance = (req, res) => {
  const store = getMemoryStore();
  const { studentId, date } = req.query;

  let records = [...store.attendance];

  if (studentId) {
    records = records.filter(a => String(a.student_id) === String(studentId));
  } else if (req.user && req.user.role === 'STUDENT') {
    const student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (student) records = records.filter(a => String(a.student_id) === String(student.id));
  }

  if (date) {
    records = records.filter(a => a.date === date);
  }

  const total = records.length;
  const present = records.filter(r => r.status === 'PRESENT').length;
  const outpass = records.filter(r => r.status === 'OUTPASS').length;
  const absent = records.filter(r => r.status === 'ABSENT').length;
  const leave = records.filter(r => r.status === 'LEAVE').length;
  const percentage = total > 0 ? (((present + outpass) / total) * 100).toFixed(1) : 100;

  const targetDate = date || new Date().toISOString().split('T')[0];
  const tomorrow = new Date(targetDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  res.json({
    records,
    summary: {
      total,
      present,
      outpass,
      absent,
      leave,
      percentage: parseFloat(percentage)
    },
    foodForecast: {
      attendanceDate: targetDate,
      foodDate: tomorrowStr,
      foodCountTomorrow: present,
      notEatingCount: absent + leave + outpass,
      breakfastCount: present,
      lunchCount: present,
      dinnerCount: present
    }
  });
};

module.exports = {
  markAttendance,
  getAttendance
};
