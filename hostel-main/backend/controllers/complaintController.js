const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');

// SUBMIT COMPLAINT (Student)
const createComplaint = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (!student && isPostgresConnected()) {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
      if (sRes.rows.length > 0) student = sRes.rows[0];
    }
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });

    const { category, title, description, priority, room_number } = req.body;
    if (!category || !title || !description) {
      return res.status(400).json({ error: 'Category, title, and description are required.' });
    }

    const pRoom = room_number || 'A-101';
    const pPriority = priority || 'MEDIUM';
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    let newComplaint = null;

    if (isPostgresConnected()) {
      try {
        const cInsert = await query(
          `INSERT INTO complaints (student_id, room_number, category, title, description, photo_url, priority, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
           RETURNING *`,
          [student.id, pRoom, category, title, description, photoUrl, pPriority]
        );
        newComplaint = cInsert.rows[0];
      } catch (dbErr) {
        console.error('[DB createComplaint Error]', dbErr.message);
      }
    }

    if (!newComplaint) {
      newComplaint = {
        id: Date.now(),
        student_id: student.id,
        room_number: pRoom,
        category,
        title,
        description,
        photo_url: photoUrl,
        priority: pPriority,
        status: 'PENDING',
        assigned_to_warden_id: null,
        warden_response: null,
        rectification_photo_url: null,
        rectified_at: null,
        created_at: new Date().toISOString()
      };
    }

    store.complaints.push(newComplaint);

    // Alert warden if EMERGENCY
    if (newComplaint.priority === 'EMERGENCY') {
      store.wardens.forEach(w => {
        if (isPostgresConnected()) {
          query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES ($1, '🚨 EMERGENCY COMPLAINT SUBMITTED', $2, 'EMERGENCY', false)`,
            [w.user_id, `Room ${newComplaint.room_number}: ${newComplaint.title}`]
          ).catch(() => {});
        }
        store.notifications.push({
          id: Date.now() + Math.random() * 100,
          user_id: w.user_id,
          title: '🚨 EMERGENCY COMPLAINT SUBMITTED',
          message: `Room ${newComplaint.room_number}: ${newComplaint.title}`,
          type: 'EMERGENCY',
          is_read: false,
          created_at: new Date().toISOString()
        });
      });
    }

    saveMemoryStore();
    res.status(201).json({ message: 'Complaint submitted successfully!', complaint: newComplaint });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit complaint.' });
  }
};

// GET COMPLAINTS (Student / Warden)
const getComplaints = (req, res) => {
  const store = getMemoryStore();
  let complaints = [...store.complaints];

  if (req.user.role === 'STUDENT') {
    const student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (student) complaints = complaints.filter(c => String(c.student_id) === String(student.id));
  }

  const { status, priority, category } = req.query;
  if (status) complaints = complaints.filter(c => c.status === status);
  if (priority) complaints = complaints.filter(c => c.priority === priority);
  if (category) complaints = complaints.filter(c => c.category === category);

  // Attach student details
  complaints = complaints.map(comp => {
    const student = store.students.find(s => String(s.id) === String(comp.student_id));
    return { ...comp, student };
  });

  // Sort EMERGENCY complaints first
  complaints.sort((a, b) => {
    const order = { EMERGENCY: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.priority] || 4) - (order[b.priority] || 4);
  });

  res.json(complaints);
};

// UPDATE COMPLAINT STATUS (Warden)
const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, warden_response } = req.body;
    const store = getMemoryStore();

    const complaint = store.complaints.find(c => String(c.id) === String(id));
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    if (status) complaint.status = status;
    if (warden_response) complaint.warden_response = warden_response;
    if (req.file) complaint.rectification_photo_url = `/uploads/${req.file.filename}`;

    let rectifiedAt = null;
    if (status === 'RECTIFIED') {
      rectifiedAt = new Date().toISOString();
      complaint.rectified_at = rectifiedAt;

      // Notify Student
      const student = store.students.find(s => String(s.id) === String(complaint.student_id));
      if (student) {
        if (isPostgresConnected()) {
          query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES ($1, 'Complaint Rectified', $2, 'SUCCESS', false)`,
            [student.user_id, `Your complaint "${complaint.title}" has been marked as RECTIFIED by warden.`]
          ).catch(() => {});
        }
        store.notifications.push({
          id: Date.now() + 20,
          user_id: student.user_id,
          title: 'Complaint Rectified',
          message: `Your complaint "${complaint.title}" has been marked as RECTIFIED by warden.`,
          type: 'SUCCESS',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    if (isPostgresConnected()) {
      try {
        await query(
          `UPDATE complaints
           SET status = COALESCE($1, status),
               warden_response = COALESCE($2, warden_response),
               rectification_photo_url = COALESCE($3, rectification_photo_url),
               rectified_at = COALESCE($4, rectified_at)
           WHERE id = $5`,
          [status, warden_response, complaint.rectification_photo_url, rectifiedAt, complaint.id]
        );
      } catch (dbErr) {
        console.error('[DB updateComplaint Error]', dbErr.message);
      }
    }

    saveMemoryStore();
    res.json({ message: 'Complaint updated successfully!', complaint });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update complaint.' });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaint
};
