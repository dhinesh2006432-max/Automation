const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');
const { generateOutpassPDF } = require('../utils/pdfGenerator');
const { sendParentOutpassEmail } = require('../utils/emailService');

// 1. GET ALL OUTPASSES (Student / Warden)
const getOutpasses = (req, res) => {
  const store = getMemoryStore();
  let outpasses = [...store.outpasses];

  if (req.user && req.user.role === 'STUDENT') {
    const student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (student) {
      outpasses = outpasses.filter(o => String(o.student_id) === String(student.id));
    }
  }

  const now = new Date();

  // Populate student details and check overdue status
  outpasses = outpasses.map(op => {
    const student = store.students.find(s => String(s.id) === String(op.student_id));
    
    // Find student's active room
    let roomNumber = 'N/A';
    if (student) {
      const alloc = store.room_allocations.find(a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE');
      if (alloc) {
        const r = store.rooms.find(rm => String(rm.id) === String(alloc.room_id));
        if (r) roomNumber = r.room_number;
      }
    }

    // Auto-check overdue
    if (op.status === 'OUTSIDE' && op.expected_return_date) {
      const returnDateTime = new Date(`${op.expected_return_date}T${op.expected_return_time || '20:00:00'}`);
      if (now > returnDateTime) {
        op.status = 'OVERDUE';
        if (isPostgresConnected()) {
          query('UPDATE outpasses SET status = $1 WHERE id = $2', ['OVERDUE', op.id]).catch(() => {});
        }
      }
    }

    return {
      ...op,
      student: student ? {
        id: student.id,
        name: student.name,
        register_number: student.register_number,
        department: student.department,
        year: student.year,
        phone: student.phone,
        parent_phone: student.parent_phone,
        room_number: roomNumber
      } : null
    };
  });

  saveMemoryStore();
  res.json(outpasses);
};

// 2. STUDENT REQUEST DIRECT OUTPASS / LEAVE
const requestOutpass = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (!student && isPostgresConnected()) {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
      if (sRes.rows.length > 0) student = sRes.rows[0];
    }

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const {
      reason,
      out_date,
      out_time,
      expected_return_date,
      expected_return_time,
      destination,
      outpass_type,
      hod_name
    } = req.body;

    const hodLetterUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.hod_letter_url || null);

    // ENFORCE MANDATORY HOD SIGNED PERMISSION LETTER
    if (!hodLetterUrl) {
      return res.status(400).json({
        error: 'HOD signed permission letter is mandatory for outpass. Please upload your formal permission letter endorsed with your Head of Department (HOD) signature & department seal.'
      });
    }

    if (!reason || !out_date || !expected_return_date) {
      return res.status(400).json({ error: 'Reason, out date, and expected return date are required.' });
    }

    const dateSlug = out_date.replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const outpassCode = `OTP-${dateSlug}-${randomSuffix}`;
    const oTime = out_time || '16:00:00';
    const rTime = expected_return_time || '20:00:00';

    const qrData = `${outpassCode}`;

    let newOutpass = null;

    if (isPostgresConnected()) {
      try {
        const insertRes = await query(
          `INSERT INTO outpasses (outpass_code, student_id, reason, out_date, out_time, expected_return_date, expected_return_time, status, qr_code_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
           RETURNING *`,
          [outpassCode, student.id, destination ? `${reason} (Dest: ${destination})` : reason, out_date, oTime, expected_return_date, rTime, qrData]
        );
        newOutpass = insertRes.rows[0];
      } catch (dbErr) {
        console.error('[DB requestOutpass Error]', dbErr.message);
      }
    }

    if (!newOutpass) {
      newOutpass = {
        id: Date.now(),
        outpass_code: outpassCode,
        student_id: student.id,
        letter_id: null,
        reason: destination ? `${reason} (Dest: ${destination})` : reason,
        out_date,
        out_time: oTime,
        expected_return_date,
        expected_return_time: rTime,
        actual_return_time: null,
        warden_id: null,
        status: 'PENDING',
        qr_code_data: qrData,
        outpass_type: outpass_type || 'DAY_OUTING',
        hod_letter_url: hodLetterUrl,
        hod_name: hod_name || `${student.department || 'Department'} HOD`,
        hod_signature_verified: true,
        created_at: new Date().toISOString()
      };
    } else {
      newOutpass.hod_letter_url = hodLetterUrl;
      newOutpass.hod_name = hod_name || `${student.department || 'Department'} HOD`;
      newOutpass.hod_signature_verified = true;
    }

    // Add notification to Warden that student submitted outpass with HOD letter
    store.notifications.push({
      id: Date.now() + 20,
      user_id: 2,
      role_target: 'WARDEN',
      title: 'New Outpass Request (HOD Letter Attached)',
      message: `Student ${student.name} (${student.register_number}) applied for outpass on ${out_date} with mandatory HOD signed permission letter.`,
      type: 'INFO',
      is_read: false,
      created_at: new Date().toISOString()
    });

    store.outpasses.unshift(newOutpass);
    saveMemoryStore();

    res.status(201).json({
      message: 'Outpass request with HOD signed permission letter submitted to warden for review.',
      outpass: newOutpass
    });
  } catch (err) {
    console.error('[requestOutpass Error]', err);
    res.status(500).json({ error: 'Failed to submit outpass request.' });
  }
};

// 3. WARDEN REVIEW OUTPASS (Approve / Reject)
const reviewOutpass = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // 'APPROVED' or 'REJECTED'
    const store = getMemoryStore();

    const outpass = store.outpasses.find(o => String(o.id) === String(id));
    if (!outpass) return res.status(404).json({ error: 'Outpass record not found.' });

    const wardenId = req.user ? req.user.profileId : 1;
    outpass.status = status;
    outpass.warden_id = wardenId;
    if (remarks) outpass.warden_remarks = remarks;

    if (isPostgresConnected()) {
      try {
        await query(
          'UPDATE outpasses SET status = $1, warden_id = $2 WHERE id = $3',
          [status, wardenId, outpass.id]
        );
      } catch (dbErr) {
        console.error('[DB reviewOutpass Error]', dbErr.message);
      }
    }

    const student = store.students.find(s => String(s.id) === String(outpass.student_id));

    // Send Parent Email if Approved
    if (status === 'APPROVED' && student) {
      if (student.parent_phone && student.parent_phone.includes('@')) {
        sendParentOutpassEmail({
          student,
          outpass,
          parentEmail: student.parent_phone
        });
      }
    }

    // Push notification to student
    if (student) {
      const notifMsg = `Your outpass request (${outpass.outpass_code}) has been ${status} by the warden.`;
      store.notifications.push({
        id: Date.now() + Math.floor(Math.random() * 100),
        user_id: student.user_id,
        title: `Outpass ${status}`,
        message: notifMsg,
        type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    saveMemoryStore();
    res.json({ message: `Outpass marked as ${status}.`, outpass });
  } catch (err) {
    console.error('[reviewOutpass Error]', err);
    res.status(500).json({ error: 'Failed to review outpass.' });
  }
};

// Helper to extract clean outpass code from full URLs, query strings, or raw strings
const extractOutpassCode = (input) => {
  if (!input) return '';
  try {
    const decoded = decodeURIComponent(String(input).trim());
    const match = decoded.match(/OTP-[A-Za-z0-9_-]+/i);
    if (match) return match[0].toUpperCase();
    const url = new URL(decoded, 'http://localhost');
    const param = url.searchParams.get('code');
    if (param) return param.trim().toUpperCase();
    return decoded.toUpperCase();
  } catch (e) {
    const match = String(input).match(/OTP-[A-Za-z0-9_-]+/i);
    return match ? match[0].toUpperCase() : String(input).trim().toUpperCase();
  }
};

// 4. PUBLIC QR CODE GATE VERIFICATION
const verifyQRCode = async (req, res) => {
  const rawCode = req.params.code || req.query.code;
  const code = extractOutpassCode(rawCode);

  if (!code) {
    return res.status(400).json({ valid: false, message: 'No outpass code provided in QR scan.' });
  }

  const store = getMemoryStore();

  let outpass = store.outpasses.find(o => o.outpass_code && o.outpass_code.toUpperCase() === code);
  if (!outpass && isPostgresConnected()) {
    try {
      const oRes = await query('SELECT * FROM outpasses WHERE UPPER(outpass_code) = UPPER($1)', [code]);
      if (oRes.rows.length > 0) outpass = oRes.rows[0];
    } catch (e) {}
  }

  if (!outpass) {
    return res.status(404).json({ valid: false, message: `Invalid or unregistered Outpass Code (${code}).` });
  }

  let student = store.students.find(s => String(s.id) === String(outpass.student_id));
  if (!student && isPostgresConnected()) {
    try {
      const sRes = await query('SELECT * FROM students WHERE id = $1', [outpass.student_id]);
      if (sRes.rows.length > 0) student = sRes.rows[0];
    } catch (e) {}
  }

  let roomNumber = 'N/A';
  if (student) {
    const alloc = store.room_allocations.find(a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE');
    if (alloc) {
      const r = store.rooms.find(rm => String(rm.id) === String(alloc.room_id));
      if (r) roomNumber = r.room_number;
    }
  }

  // Check Overdue
  const returnDateTime = new Date(`${outpass.expected_return_date}T${outpass.expected_return_time || '20:00:00'}`);
  const isOverdue = new Date() > returnDateTime && outpass.status !== 'RETURNED';

  if (isOverdue && outpass.status === 'OUTSIDE') {
    outpass.status = 'OVERDUE';
    if (isPostgresConnected()) {
      try {
        await query('UPDATE outpasses SET status = $1 WHERE outpass_code = $2', ['OVERDUE', code]);
      } catch (e) {}
    }
    saveMemoryStore();
  }

  res.json({
    id: outpass.id,
    valid: outpass.status === 'APPROVED' || outpass.status === 'OUTSIDE',
    isOverdue,
    outpassCode: outpass.outpass_code,
    status: outpass.status,
    studentName: student ? student.name : 'Unknown',
    registerNumber: student ? student.register_number : 'N/A',
    department: student ? student.department : 'N/A',
    year: student ? student.year : 'N/A',
    roomNumber,
    phone: student ? student.phone : 'N/A',
    parentPhone: student ? student.parent_phone : 'N/A',
    outDate: outpass.out_date,
    outTime: outpass.out_time,
    returnDate: outpass.expected_return_date,
    expectedReturnTime: outpass.expected_return_time,
    reason: outpass.reason,
    outpassType: outpass.outpass_type || 'DAY_OUTING'
  });
};

// 4b. PUBLIC GATE SECURITY ACTION (Record Gate Exit / Entry directly via QR verification)
const gateStatusAction = async (req, res) => {
  try {
    const rawCode = req.params.code || req.body.code || req.query.code;
    const cleanCode = extractOutpassCode(rawCode);
    const { action } = req.body; // 'EXIT' (mark OUTSIDE) or 'ENTRY' (mark RETURNED)
    const store = getMemoryStore();

    let outpass = store.outpasses.find(o => o.outpass_code && o.outpass_code.toUpperCase() === cleanCode);
    if (!outpass && isPostgresConnected()) {
      try {
        const oRes = await query('SELECT * FROM outpasses WHERE UPPER(outpass_code) = UPPER($1)', [cleanCode]);
        if (oRes.rows.length > 0) outpass = oRes.rows[0];
      } catch (e) {}
    }

    if (!outpass) {
      return res.status(404).json({ error: 'Outpass not found.' });
    }

    let newStatus = outpass.status;
    let actualReturnTime = outpass.actual_return_time;

    if (action === 'EXIT') {
      if (outpass.status !== 'APPROVED') {
        return res.status(400).json({ error: `Cannot record exit. Current pass status is ${outpass.status}. Pass must be APPROVED.` });
      }
      newStatus = 'OUTSIDE';
    } else if (action === 'ENTRY') {
      if (outpass.status !== 'OUTSIDE' && outpass.status !== 'OVERDUE') {
        return res.status(400).json({ error: `Cannot record entry. Current pass status is ${outpass.status}. Pass must be OUTSIDE or OVERDUE.` });
      }
      newStatus = 'RETURNED';
      actualReturnTime = new Date().toISOString();
      outpass.actual_return_time = actualReturnTime;
    } else {
      return res.status(400).json({ error: 'Invalid gate action. Must be EXIT or ENTRY.' });
    }

    outpass.status = newStatus;

    if (isPostgresConnected()) {
      try {
        await query(
          'UPDATE outpasses SET status = $1, actual_return_time = COALESCE($2, actual_return_time) WHERE UPPER(outpass_code) = UPPER($3)',
          [newStatus, actualReturnTime, cleanCode]
        );
      } catch (dbErr) {
        console.error('[DB gateStatusAction Error]', dbErr.message);
      }
    }

    saveMemoryStore();
    res.json({
      success: true,
      message: action === 'EXIT' ? 'Gate Exit recorded! Status marked as OUTSIDE.' : 'Gate Entry recorded! Status marked as RETURNED.',
      status: newStatus,
      outpassCode: outpass.outpass_code
    });
  } catch (err) {
    console.error('[gateStatusAction Error]', err);
    res.status(500).json({ error: 'Failed to record gate action.' });
  }
};

// 5. UPDATE OUTPASS GATE STATUS (Warden / Security: Mark OUTSIDE -> RETURNED)
const updateOutpassStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const store = getMemoryStore();

  const outpass = store.outpasses.find(o => String(o.id) === String(id));
  if (!outpass) return res.status(404).json({ error: 'Outpass record not found.' });

  outpass.status = status;
  let returnTime = null;
  if (status === 'RETURNED') {
    returnTime = new Date().toISOString();
    outpass.actual_return_time = returnTime;
  }

  if (isPostgresConnected()) {
    try {
      await query(
        'UPDATE outpasses SET status = $1, actual_return_time = COALESCE($2, actual_return_time) WHERE id = $3',
        [status, returnTime, outpass.id]
      );
    } catch (dbErr) {
      console.error('[DB updateOutpassStatus Error]', dbErr.message);
    }
  }

  saveMemoryStore();
  res.json({ message: `Outpass status updated to ${status}.`, outpass });
};

// 6. DOWNLOAD OUTPASS CONFIRMATION PDF
const downloadOutpassPDF = async (req, res) => {
  const { id } = req.params;
  const store = getMemoryStore();

  const outpass = store.outpasses.find(o => String(o.id) === String(id));
  if (!outpass) return res.status(404).json({ error: 'Outpass record not found.' });

  const student = store.students.find(s => String(s.id) === String(outpass.student_id));
  
  // Find room number
  let roomNumber = 'N/A';
  if (student) {
    const alloc = store.room_allocations.find(a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE');
    if (alloc) {
      const r = store.rooms.find(rm => String(rm.id) === String(alloc.room_id));
      if (r) roomNumber = r.room_number;
    }
  }

  await generateOutpassPDF({ ...outpass, room_number: roomNumber }, student || {}, res);
};

module.exports = {
  getOutpasses,
  requestOutpass,
  reviewOutpass,
  verifyQRCode,
  gateStatusAction,
  updateOutpassStatus,
  downloadOutpassPDF
};
