const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate Outpass PDF document stream
 */
const generateOutpassPDF = async (outpass, student, res) => {
  try {
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=outpass-${outpass.outpass_code}.pdf`);
    doc.pipe(res);

    // Header Banner
    doc.rect(0, 0, 612, 85).fill('#0f766e');
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('CAMPUS HOSTEL MANAGEMENT', 40, 22, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('OFFICIAL STUDENT HOSTEL GATE OUTPASS', 40, 50, { align: 'center' });

    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text(`OUTPASS ID: ${outpass.outpass_code}`, 40, 110);
    doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Issued: ${new Date().toLocaleDateString()} | Status: ${outpass.status || 'APPROVED'}`, 40, 128);

    // Table Details
    const details = [
      ['Student Name:', student.name || 'Student'],
      ['Register Number:', student.register_number || 'N/A'],
      ['Department & Year:', `${student.department || 'N/A'} - Year ${student.year || 'N/A'}`],
      ['Room Number:', outpass.room_number || student.room_number || 'N/A'],
      ['Reason for Outing:', outpass.reason || 'Personal Leave'],
      ['HOD Endorsement:', outpass.hod_letter_url ? 'Verified with HOD Signature & Department Seal' : 'Verified by Department HOD'],
      ['Out Date & Time:', `${outpass.out_date} at ${outpass.out_time || '16:00'}`],
      ['Expected Return:', `${outpass.expected_return_date} at ${outpass.expected_return_time || '20:00'}`],
      ['Contact Phone:', student.phone || 'N/A'],
      ['Parent Contact:', student.parent_phone || 'N/A']
    ];

    let y = 150;
    details.forEach(([label, value]) => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b').text(label, 50, y);
      doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(String(value), 180, y);
      y += 20;
    });

    // Generate QR Code Buffer
    try {
      const baseUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const qrData = `${baseUrl}/qr-verify?code=${outpass.outpass_code}`;
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 130, margin: 1 });
      doc.image(qrBuffer, 410, 140, { width: 130, height: 130 });
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f766e').text('LIVE SECURITY QR PASS', 410, 275, { width: 130, align: 'center' });
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0f172a').text(outpass.outpass_code, 410, 287, { width: 130, align: 'center' });
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748b').text('Scan to verify identity & validity', 410, 298, { width: 130, align: 'center' });
    } catch (err) {
      console.error('[PDF Generator QR Error]:', err.message);
    }

    doc.rect(40, y + 15, 532, 1).fill('#cbd5e1');

    // Instructions
    y += 25;
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('GATE PASS RULES & CONDITIONS:', 40, y);
    doc.fontSize(8).font('Helvetica').fillColor('#475569');
    doc.text('1. Student must show this official digital or printed pass along with college ID card at the security gate.', 40, y + 14);
    doc.text('2. Failure to return by the expected return time will automatically flag the student status as OVERDUE.', 40, y + 26);
    doc.text('3. Parent/Guardian notification is logged upon gate exit and check-in.', 40, y + 38);

    // Signatures
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e293b');
    doc.text('Student Signature', 40, y + 70);
    doc.text('HOD Signature & Seal', 220, y + 70);
    doc.text('Chief Warden Authorization', 390, y + 70);

    doc.end();
  } catch (pdfErr) {
    console.error('[generateOutpassPDF Error]:', pdfErr);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate outpass PDF' });
    }
  }
};

/**
 * Generate Room Allocation Confirmation PDF
 */
const generateAllocationPDF = (allocation, student, room, res) => {
  try {
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=allocation-${student.register_number || 'slip'}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, 612, 85).fill('#0f766e');
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('CAMPUS HOSTEL MANAGEMENT', 40, 22, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('ROOM ALLOCATION CONFIRMATION SLIP', 40, 50, { align: 'center' });

    let y = 115;
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('ALLOCATION DETAILS:', 40, y);
    y += 25;

    const data = [
      ['Student Name', student.name || 'N/A'],
      ['Register Number', student.register_number || 'N/A'],
      ['Course & Department', `${student.course || 'B.E'} (${student.department || 'CSE'})`],
      ['Gender', student.gender || 'N/A'],
      ['Allocated Room Number', room.room_number || 'N/A'],
      ['Hostel Block & Floor', `${room.block || 'Block A'} - Floor ${room.floor || 1}`],
      ['Room Specifications', `${room.room_type || '2 Sharing'} | ${room.ac_type || 'AC'} | ${room.bathroom_type || 'Attached'} Bathroom`],
      ['Allocation Date', allocation.allocation_date || new Date().toISOString().split('T')[0]],
      ['Confirmation Status', 'ACTIVE & OFFICIALLY ALLOCATED']
    ];

    data.forEach(([label, value]) => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b').text(label + ':', 50, y);
      doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(String(value), 220, y);
      y += 20;
    });

    doc.rect(40, y + 20, 532, 1).fill('#cbd5e1');
    y += 35;

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#334155').text('TERMS & CONDITIONS:', 40, y);
    doc.fontSize(8).font('Helvetica').fillColor('#64748b');
    doc.text('1. Occupants must adhere to hostel code of conduct and curfew timings.', 40, y + 14);
    doc.text('2. Furniture and electrical items inside the room must be maintained with care.', 40, y + 26);
    doc.text('3. Subletting or unauthorized transfer of rooms is strictly prohibited.', 40, y + 38);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b');
    doc.text('Student Signature', 60, y + 70);
    doc.text('Chief Warden Authorization', 360, y + 70);

    doc.end();
  } catch (err) {
    console.error('[generateAllocationPDF Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate allocation PDF' });
    }
  }
};

/**
 * Generate Fee Receipt PDF
 */
const generateFeeReceiptPDF = (payment, student, res) => {
  try {
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.receipt_number || 'fee'}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, 612, 80).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('HOSTEL FEE PAYMENT RECEIPT', 40, 25, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('OFFICIAL VERIFIED ACKNOWLEDGMENT', 40, 50, { align: 'center' });

    let y = 110;
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`RECEIPT NO: ${payment.receipt_number}`, 40, y);
    doc.fontSize(10).font('Helvetica').text(`Date: ${payment.payment_date || new Date().toISOString().split('T')[0]}`, 420, y);
    y += 30;

    const rows = [
      ['Student Name', student.name || 'N/A'],
      ['Register Number', student.register_number || 'N/A'],
      ['Department', student.department || 'N/A'],
      ['Payment Category', payment.payment_type || 'HOSTEL_FEE'],
      ['Amount Paid', `INR ${parseFloat(payment.amount || 0).toLocaleString()} /-`],
      ['Verification Status', payment.status || 'VERIFIED']
    ];

    rows.forEach(([k, v]) => {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1e293b').text(k + ':', 50, y);
      doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(String(v), 220, y);
      y += 22;
    });

    doc.rect(40, y + 20, 532, 1).fill('#cbd5e1');
    y += 40;

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b');
    doc.text('Student Signature', 60, y + 40);
    doc.text('Accounts Officer / Warden Seal', 360, y + 40);

    doc.end();
  } catch (err) {
    console.error('[generateFeeReceiptPDF Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate fee receipt PDF' });
    }
  }
};

module.exports = {
  generateOutpassPDF,
  generateAllocationPDF,
  generateFeeReceiptPDF
};
