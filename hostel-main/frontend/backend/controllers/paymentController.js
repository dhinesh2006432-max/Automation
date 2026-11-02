const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');
const { generateFeeReceiptPDF } = require('../utils/pdfGenerator');

// UPLOAD FEE RECEIPT (Student)
const uploadPayment = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (!student && isPostgresConnected()) {
      const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
      if (sRes.rows.length > 0) student = sRes.rows[0];
    }
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });

    const { amount, payment_type, payment_date } = req.body;
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const pAmt = parseFloat(amount || 45000);
    const pDate = payment_date || new Date().toISOString().split('T')[0];
    const pType = payment_type || 'HOSTEL_FEE';
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/receipt-sample.pdf';

    let newPayment = null;

    if (isPostgresConnected()) {
      try {
        const pInsert = await query(
          `INSERT INTO payments (student_id, receipt_number, amount, payment_date, payment_type, receipt_file_url, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
           RETURNING *`,
          [student.id, receiptNo, pAmt, pDate, pType, fileUrl]
        );
        newPayment = pInsert.rows[0];
      } catch (dbErr) {
        console.error('[DB uploadPayment Error]', dbErr.message);
      }
    }

    if (!newPayment) {
      newPayment = {
        id: Date.now(),
        student_id: student.id,
        receipt_number: receiptNo,
        amount: pAmt,
        payment_date: pDate,
        payment_type: pType,
        receipt_file_url: fileUrl,
        status: 'PENDING',
        verified_by_warden_id: null,
        created_at: new Date().toISOString()
      };
    }

    store.payments.unshift(newPayment);
    saveMemoryStore();

    res.status(201).json({ message: 'Fee receipt submitted for warden verification.', payment: newPayment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload fee receipt.' });
  }
};

// GET PAYMENTS (Student / Warden)
const getPayments = (req, res) => {
  const store = getMemoryStore();
  let payments = [...store.payments];

  if (req.user.role === 'STUDENT') {
    const student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (student) payments = payments.filter(p => String(p.student_id) === String(student.id));
  }

  payments = payments.map(p => {
    const student = store.students.find(s => String(s.id) === String(p.student_id));
    return { ...p, student };
  });

  res.json(payments);
};

// VERIFY PAYMENT (Warden)
const verifyPayment = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const store = getMemoryStore();

  const payment = store.payments.find(p => String(p.id) === String(id));
  if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

  const wardenId = req.user ? req.user.profileId : 1;
  payment.status = status;
  payment.verified_by_warden_id = wardenId;

  if (isPostgresConnected()) {
    try {
      await query('UPDATE payments SET status = $1, verified_by_warden_id = $2 WHERE id = $3', [status, wardenId, payment.id]);
    } catch (dbErr) {
      console.error('[DB verifyPayment Error]', dbErr.message);
    }
  }

  saveMemoryStore();
  res.json({ message: `Payment receipt marked as ${status}.`, payment });
};

// DOWNLOAD FEE RECEIPT PDF
const downloadFeePDF = (req, res) => {
  const { id } = req.params;
  const store = getMemoryStore();

  const payment = store.payments.find(p => String(p.id) === String(id));
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });

  const student = store.students.find(s => String(s.id) === String(payment.student_id));
  generateFeeReceiptPDF(payment, student || {}, res);
};

module.exports = {
  uploadPayment,
  getPayments,
  verifyPayment,
  downloadFeePDF
};
