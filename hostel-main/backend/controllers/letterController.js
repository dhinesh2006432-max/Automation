const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');
const { sendParentOutpassEmail } = require('../utils/emailService');

// WRITE LETTER (Student)
const createLetter = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (!student && isPostgresConnected()) {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
      if (sRes.rows.length > 0) student = sRes.rows[0];
    }
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });

    const { letter_type, subject, reason, description, date } = req.body;
    if (!letter_type || !subject || !reason) {
      return res.status(400).json({ error: 'Letter type, subject, and reason are required.' });
    }

    const docUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const letterDate = date || new Date().toISOString().split('T')[0];

    let newLetter = null;

    if (isPostgresConnected()) {
      try {
        const lInsert = await query(
          `INSERT INTO letters (student_id, letter_type, subject, reason, description, date, supporting_doc_url, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
           RETURNING *`,
          [student.id, letter_type, subject, reason, description || '', letterDate, docUrl]
        );
        newLetter = lInsert.rows[0];
      } catch (dbErr) {
        console.error('[DB createLetter Error]', dbErr.message);
      }
    }

    if (!newLetter) {
      newLetter = {
        id: Date.now(),
        student_id: student.id,
        letter_type,
        subject,
        reason,
        description: description || '',
        date: letterDate,
        supporting_doc_url: docUrl,
        status: 'PENDING',
        warden_remarks: null,
        reviewed_by_warden_id: null,
        created_at: new Date().toISOString()
      };
    }

    store.letters.unshift(newLetter);
    saveMemoryStore();

    res.status(201).json({ message: 'Letter submitted to warden.', letter: newLetter });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit letter.' });
  }
};

// GET LETTERS (Student / Warden)
const getLetters = (req, res) => {
  const store = getMemoryStore();
  let letters = [...store.letters];

  if (req.user.role === 'STUDENT') {
    const student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (student) letters = letters.filter(l => String(l.student_id) === String(student.id));
  }

  letters = letters.map(letItem => {
    const student = store.students.find(s => String(s.id) === String(letItem.student_id));
    return { ...letItem, student };
  });

  res.json(letters);
};

// REVIEW LETTER (Warden Approve / Reject)
const reviewLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, warden_remarks, out_time, expected_return_date, expected_return_time } = req.body;

    const store = getMemoryStore();
    const letter = store.letters.find(l => String(l.id) === String(id));

    if (!letter) return res.status(404).json({ error: 'Letter not found.' });

    const wardenId = req.user ? req.user.profileId : 1;
    letter.status = status;
    letter.warden_remarks = warden_remarks || '';
    letter.reviewed_by_warden_id = wardenId;

    if (isPostgresConnected()) {
      try {
        await query(
          'UPDATE letters SET status = $1, warden_remarks = $2, reviewed_by_warden_id = $3 WHERE id = $4',
          [status, letter.warden_remarks, wardenId, letter.id]
        );
      } catch (dbErr) {
        console.error('[DB reviewLetter Error]', dbErr.message);
      }
    }

    const student = store.students.find(s => String(s.id) === String(letter.student_id));

    // Auto Generate Outpass if Approved Outing / Leave Letter
    let outpass = null;
    if (status === 'APPROVED' && ['Outing Request', 'Leave Request', 'Medical Leave', 'Family Emergency'].includes(letter.letter_type)) {
      const outpassCode = `OTP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      const outDate = letter.date;
      const oTime = out_time || '17:00:00';
      const retDate = expected_return_date || letter.date;
      const retTime = expected_return_time || '20:30:00';

      const qrPayload = JSON.stringify({
        outpassCode,
        studentId: student ? student.id : null,
        name: student ? student.name : '',
        regNo: student ? student.register_number : '',
        validUntil: `${retDate} ${retTime}`
      });

      if (isPostgresConnected() && student) {
        try {
          const otpInsert = await query(
            `INSERT INTO outpasses (outpass_code, student_id, letter_id, reason, out_date, out_time, expected_return_date, expected_return_time, warden_id, status, qr_code_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'APPROVED', $10)
             RETURNING *`,
            [outpassCode, student.id, letter.id, letter.reason, outDate, oTime, retDate, retTime, wardenId, qrPayload]
          );
          outpass = otpInsert.rows[0];
        } catch (e) {
          console.error('[DB outpassInsert Error]', e.message);
        }
      }

      if (!outpass) {
        outpass = {
          id: Date.now(),
          outpass_code: outpassCode,
          student_id: student ? student.id : null,
          letter_id: letter.id,
          reason: letter.reason,
          out_date: outDate,
          out_time: oTime,
          expected_return_date: retDate,
          expected_return_time: retTime,
          actual_return_time: null,
          warden_id: wardenId,
          status: 'APPROVED',
          qr_code_data: qrPayload,
          created_at: new Date().toISOString()
        };
      }

      store.outpasses.unshift(outpass);

      // Email Parent Outpass Notification
      if (student && student.parent_phone) {
        sendParentOutpassEmail({
          student,
          outpass,
          parentEmail: student.parent_phone.includes('@') ? student.parent_phone : 'parent@hostel.edu'
        });
      }
    }

    // Notify student
    if (student) {
      const user = store.users.find(u => String(u.id) === String(student.user_id));
      if (user) {
        const notifMsg = `Your letter regarding "${letter.subject}" was ${status} by the warden.`;
        if (isPostgresConnected()) {
          query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES ($1, 'Letter Status Updated', $2, $3, false)`,
            [user.id, notifMsg, status === 'APPROVED' ? 'SUCCESS' : 'WARNING']
          ).catch(() => {});
        }
        store.notifications.push({
          id: Date.now() + 15,
          user_id: user.id,
          title: 'Letter Status Updated',
          message: notifMsg,
          type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    saveMemoryStore();
    res.json({ message: `Letter marked as ${status}.`, letter, outpass });
  } catch (err) {
    console.error('Review letter error:', err);
    res.status(500).json({ error: 'Failed to review letter.' });
  }
};

module.exports = {
  createLetter,
  getLetters,
  reviewLetter
};
