const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');

// SUBMIT MESS FEEDBACK
const submitMessFeedback = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (!student && isPostgresConnected()) {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
      if (sRes.rows.length > 0) student = sRes.rows[0];
    }
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });

    const { food_quality_rating, taste_rating, cleanliness_rating, menu_rating, service_rating, comments } = req.body;

    const q = parseInt(food_quality_rating || 4, 10);
    const t = parseInt(taste_rating || 4, 10);
    const c = parseInt(cleanliness_rating || 4, 10);
    const m = parseInt(menu_rating || 4, 10);
    const s = parseInt(service_rating || 4, 10);
    const overall = parseFloat(((q + t + c + m + s) / 5).toFixed(2));
    const fDate = new Date().toISOString().split('T')[0];

    let newFeedback = null;

    if (isPostgresConnected()) {
      try {
        const fbInsert = await query(
          `INSERT INTO mess_feedback (student_id, food_quality_rating, taste_rating, cleanliness_rating, menu_rating, service_rating, overall_rating, comments, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [student.id, q, t, c, m, s, overall, comments || '', fDate]
        );
        newFeedback = fbInsert.rows[0];
      } catch (dbErr) {
        console.error('[DB submitMessFeedback Error]', dbErr.message);
      }
    }

    if (!newFeedback) {
      newFeedback = {
        id: Date.now(),
        student_id: student.id,
        food_quality_rating: q,
        taste_rating: t,
        cleanliness_rating: c,
        menu_rating: m,
        service_rating: s,
        overall_rating: overall,
        comments: comments || '',
        date: fDate
      };
    }

    store.mess_feedback.unshift(newFeedback);
    saveMemoryStore();

    res.status(201).json({ message: 'Mess feedback submitted!', feedback: newFeedback });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit mess feedback.' });
  }
};

// GET MESS FEEDBACK
const getMessFeedback = (req, res) => {
  const store = getMemoryStore();
  res.json(store.mess_feedback);
};

// SUBMIT HOSTEL FEEDBACK
const submitHostelFeedback = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (!student && isPostgresConnected()) {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
      if (sRes.rows.length > 0) student = sRes.rows[0];
    }

    const { cleanliness_rating, security_rating, facilities_rating, warden_service_rating, maintenance_rating, feedback_text, is_anonymous } = req.body;

    const cl = parseInt(cleanliness_rating || 4, 10);
    const sec = parseInt(security_rating || 4, 10);
    const fac = parseInt(facilities_rating || 4, 10);
    const ws = parseInt(warden_service_rating || 4, 10);
    const main = parseInt(maintenance_rating || 4, 10);
    const overall = parseFloat(((cl + sec + fac + ws + main) / 5).toFixed(2));
    const isAnon = is_anonymous === 'true' || is_anonymous === true;
    const studentId = isAnon ? null : (student ? student.id : null);

    let newFb = null;

    if (isPostgresConnected()) {
      try {
        const fbInsert = await query(
          `INSERT INTO hostel_feedback (student_id, cleanliness_rating, security_rating, facilities_rating, warden_service_rating, maintenance_rating, overall_rating, feedback_text, is_anonymous)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [studentId, cl, sec, fac, ws, main, overall, feedback_text || '', isAnon]
        );
        newFb = fbInsert.rows[0];
      } catch (dbErr) {
        console.error('[DB submitHostelFeedback Error]', dbErr.message);
      }
    }

    if (!newFb) {
      newFb = {
        id: Date.now(),
        student_id: studentId,
        cleanliness_rating: cl,
        security_rating: sec,
        facilities_rating: fac,
        warden_service_rating: ws,
        maintenance_rating: main,
        overall_rating: overall,
        feedback_text: feedback_text || '',
        is_anonymous: isAnon,
        created_at: new Date().toISOString()
      };
    }

    store.hostel_feedback.unshift(newFb);
    saveMemoryStore();

    res.status(201).json({ message: 'Hostel feedback recorded!', feedback: newFb });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit hostel feedback.' });
  }
};

// GET HOSTEL FEEDBACK
const getHostelFeedback = (req, res) => {
  const store = getMemoryStore();
  res.json(store.hostel_feedback);
};

// LOST AND FOUND - POST ITEM
const postLostFound = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (!student && isPostgresConnected()) {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
      if (sRes.rows.length > 0) student = sRes.rows[0];
    }

    const { item_name, description, location, contact_info, status } = req.body;
    const sId = student ? student.id : null;
    const pDate = new Date().toISOString().split('T')[0];
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const cInfo = contact_info || (student ? student.name : 'Hostel Office');
    const pStatus = status || 'LOST';

    let item = null;

    if (isPostgresConnected() && sId) {
      try {
        const lfInsert = await query(
          `INSERT INTO lost_found (posted_by_student_id, item_name, description, location, date_lost_found, photo_url, contact_info, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [sId, item_name, description, location, pDate, photoUrl, cInfo, pStatus]
        );
        item = lfInsert.rows[0];
      } catch (dbErr) {
        console.error('[DB postLostFound Error]', dbErr.message);
      }
    }

    if (!item) {
      item = {
        id: Date.now(),
        posted_by_student_id: sId,
        item_name,
        description,
        location,
        date_lost_found: pDate,
        photo_url: photoUrl,
        contact_info: cInfo,
        status: pStatus,
        created_at: new Date().toISOString()
      };
    }

    store.lost_found.unshift(item);
    saveMemoryStore();

    res.status(201).json({ message: 'Lost & Found item posted!', item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post lost item.' });
  }
};

// GET LOST & FOUND ITEMS
const getLostFound = (req, res) => {
  const store = getMemoryStore();
  res.json(store.lost_found);
};

// UPDATE LOST & FOUND STATUS
const updateLostFound = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const store = getMemoryStore();

  const item = store.lost_found.find(i => String(i.id) === String(id));
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  item.status = status;

  if (isPostgresConnected()) {
    try {
      await query('UPDATE lost_found SET status = $1 WHERE id = $2', [status, item.id]);
    } catch (e) {
      console.error('[DB updateLostFound Error]', e.message);
    }
  }

  saveMemoryStore();
  res.json({ message: `Item marked as ${status}.`, item });
};

module.exports = {
  submitMessFeedback,
  getMessFeedback,
  submitHostelFeedback,
  getHostelFeedback,
  postLostFound,
  getLostFound,
  updateLostFound
};
