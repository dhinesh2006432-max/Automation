const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Controllers
const authController = require('../controllers/authController');
const roomController = require('../controllers/roomController');
const allocationController = require('../controllers/allocationController');
const attendanceController = require('../controllers/attendanceController');
const complaintController = require('../controllers/complaintController');
const announcementController = require('../controllers/announcementController');
const letterController = require('../controllers/letterController');
const outpassController = require('../controllers/outpassController');
const paymentController = require('../controllers/paymentController');
const feedbackController = require('../controllers/feedbackController');
const reportController = require('../controllers/reportController');
const notificationController = require('../controllers/notificationController');
const aiAssistantController = require('../controllers/aiAssistantController');
const { getMemoryStore } = require('../config/db');

// --- 1. AUTH ROUTES ---
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/verify-otp', authController.verifyOtp);
router.post('/auth/resend-otp', authController.resendOtp);
router.post('/auth/get-otp-hint', authController.getOtpHint);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', authenticateToken, authController.getProfile);
router.put('/auth/profile', authenticateToken, upload.fields([
  { name: 'studentIdCard', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 }
]), authController.updateStudentProfile);

// --- 2. ROOM MANAGEMENT ROUTES ---
router.get('/rooms', authenticateToken, roomController.getRooms);
router.post('/rooms', authenticateToken, authorize('WARDEN', 'ADMIN'), roomController.createRoom);
router.put('/rooms/:id', authenticateToken, authorize('WARDEN', 'ADMIN'), roomController.updateRoom);
router.delete('/rooms/:id', authenticateToken, authorize('WARDEN', 'ADMIN'), roomController.deleteRoom);

// --- 3. ROOM ALLOCATION ROUTES ---
router.get('/allocations/my-allocation', authenticateToken, authorize('STUDENT'), allocationController.getMyAllocation);
router.post('/allocations/request', authenticateToken, authorize('STUDENT'), upload.single('feeReceipt'), allocationController.submitRequest);
router.get('/allocations', authenticateToken, authorize('WARDEN', 'ADMIN'), allocationController.getAllocations);
router.get('/allocations/requests', authenticateToken, authorize('WARDEN', 'ADMIN'), allocationController.getRequests);
router.post('/allocations/auto-allocate/:requestId', authenticateToken, authorize('WARDEN', 'ADMIN'), allocationController.autoAllocate);
router.post('/allocations/manual-allocate', authenticateToken, authorize('WARDEN', 'ADMIN'), allocationController.manualAllocate);
router.put('/allocations/requests/:id/verify-fee', authenticateToken, authorize('WARDEN', 'ADMIN'), allocationController.verifyRequestFee);
router.put('/allocations/vacate/:allocationId', authenticateToken, authorize('WARDEN', 'ADMIN'), allocationController.vacateRoom);
router.get('/allocations/download-pdf', authenticateToken, allocationController.downloadAllocationPDF);

// --- 4. ATTENDANCE ROUTES ---
router.post('/attendance', authenticateToken, authorize('WARDEN', 'ADMIN'), attendanceController.markAttendance);
router.get('/attendance', authenticateToken, attendanceController.getAttendance);

// --- 5. COMPLAINTS ROUTES ---
router.post('/complaints', authenticateToken, authorize('STUDENT'), upload.single('photo'), complaintController.createComplaint);
router.get('/complaints', authenticateToken, complaintController.getComplaints);
router.put('/complaints/:id', authenticateToken, authorize('WARDEN', 'ADMIN'), upload.single('rectificationPhoto'), complaintController.updateComplaint);

// --- 6. ANNOUNCEMENTS ROUTES ---
router.post('/announcements', authenticateToken, authorize('WARDEN', 'ADMIN'), upload.fields([{ name: 'attachment', maxCount: 1 }, { name: 'image', maxCount: 1 }]), announcementController.createAnnouncement);
router.get('/announcements', authenticateToken, announcementController.getAnnouncements);
router.delete('/announcements/:id', authenticateToken, authorize('WARDEN', 'ADMIN'), announcementController.deleteAnnouncement);

// --- 7. LETTERS TO WARDEN ROUTES ---
router.post('/letters', authenticateToken, authorize('STUDENT'), upload.single('supportingDoc'), letterController.createLetter);
router.get('/letters', authenticateToken, letterController.getLetters);
router.put('/letters/:id/review', authenticateToken, authorize('WARDEN', 'ADMIN'), letterController.reviewLetter);

// --- 8. OUTPASS MANAGEMENT ROUTES ---
router.get('/outpasses', authenticateToken, outpassController.getOutpasses);
router.post('/outpasses/request', authenticateToken, authorize('STUDENT'), upload.single('hodLetter'), outpassController.requestOutpass);
router.put('/outpasses/:id/review', authenticateToken, authorize('WARDEN', 'ADMIN'), outpassController.reviewOutpass);
router.get('/outpasses/verify/:code(*)', outpassController.verifyQRCode);
router.get('/outpasses/verify', outpassController.verifyQRCode);
router.post('/outpasses/gate-action', outpassController.gateStatusAction);
router.put('/outpasses/:id/status', authenticateToken, authorize('WARDEN', 'ADMIN'), outpassController.updateOutpassStatus);
router.get('/outpasses/:id/download-pdf', authenticateToken, outpassController.downloadOutpassPDF);

// --- 9. PAYMENTS & FEE RECEIPT ROUTES ---
router.post('/payments', authenticateToken, authorize('STUDENT'), upload.single('receiptFile'), paymentController.uploadPayment);
router.get('/payments', authenticateToken, paymentController.getPayments);
router.put('/payments/:id/verify', authenticateToken, authorize('WARDEN', 'ADMIN'), paymentController.verifyPayment);
router.get('/payments/:id/download-pdf', authenticateToken, paymentController.downloadFeePDF);

// --- 10. FEEDBACK & LOST & FOUND ROUTES ---
router.post('/feedback/mess', authenticateToken, authorize('STUDENT'), feedbackController.submitMessFeedback);
router.get('/feedback/mess', authenticateToken, feedbackController.getMessFeedback);
router.post('/feedback/hostel', authenticateToken, feedbackController.submitHostelFeedback);
router.get('/feedback/hostel', authenticateToken, feedbackController.getHostelFeedback);

router.post('/lost-found', authenticateToken, upload.single('photo'), feedbackController.postLostFound);
router.get('/lost-found', authenticateToken, feedbackController.getLostFound);
router.put('/lost-found/:id', authenticateToken, feedbackController.updateLostFound);

// --- 11. REPORTS & STATS ROUTES ---
router.get('/reports/stats', authenticateToken, reportController.getDashboardStats);
router.get('/reports/export/:type', authenticateToken, authorize('WARDEN', 'ADMIN'), reportController.exportReportCSV);

// --- 12. NOTIFICATION ROUTES ---
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, notificationController.markAsRead);

// --- 13. ADMIN STUDENT / WARDEN MANAGEMENT ---
router.get('/students', authenticateToken, authorize('WARDEN', 'ADMIN'), (req, res) => {
  const store = getMemoryStore();
  const studentsWithRoom = store.students.map(st => {
    const alloc = store.room_allocations.find(a => String(a.student_id) === String(st.id) && a.status === 'ACTIVE');
    let room = null;
    if (alloc) {
      room = store.rooms.find(r => String(r.id) === String(alloc.room_id));
    }
    return {
      ...st,
      room_number: room ? room.room_number : 'Not Allocated',
      block: room ? room.block : 'N/A',
      floor: room ? room.floor : 'N/A',
      allocation_status: alloc ? 'ALLOCATED' : 'UNALLOCATED'
    };
  });
  res.json(studentsWithRoom);
});

router.get('/wardens', authenticateToken, authorize('ADMIN'), (req, res) => {
  const store = getMemoryStore();
  res.json(store.wardens);
});

// --- 14. SMARTHOSTEL AI ASSISTANT ROUTES ---
router.post('/ai/chat', authenticateToken, aiAssistantController.chat);
router.get('/ai/suggestions', authenticateToken, aiAssistantController.getSuggestions);
router.get('/ai/helplines', aiAssistantController.getHelplines);

module.exports = router;
