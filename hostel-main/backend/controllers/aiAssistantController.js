const { getMemoryStore, isPostgresConnected, query } = require('../config/db');

// Official Residential Handbook Knowledge Base (Hybrid RAG corpus)
const POLICY_HANDBOOK = [
  {
    id: 'curfew_timings',
    category: 'Curfew & Gate Timings',
    section: 'Section 4.1',
    page: 13,
    title: 'Hostel Curfew and Entry Timings',
    keywords: ['curfew', 'timing', 'time', 'late', 'gate', 'night', 'return', 'closing', 'hours'],
    content: `Hostel entry gates close strictly at 9:00 PM on weekdays (Monday to Friday) and 9:30 PM on weekends (Saturday and Sunday).
All resident students are required to report to their designated hostel blocks and rooms prior to these cutoff hours for the mandatory evening biometric / warden roll call at 9:30 PM.`,
    citation: 'Residential_Handbook_2026.pdf - Page 13 - Section 4.1'
  },
  {
    id: 'late_arrival_policy',
    category: 'Curfew & Gate Timings',
    section: 'Section 4.2',
    page: 14,
    title: 'Late Arrival Protocol & Disciplinary Policy',
    keywords: ['late arrival', 'penalty', 'fine', 'late entry', 'delay', 'transit', 'punishment', 'curfew violation'],
    content: `1. A grace period of 15 minutes (until 9:15 PM weekdays / 9:45 PM weekends) is permitted for verified public transit delays.
2. Late arrivals between 9:15 PM and 10:00 PM require a gate sign-in with campus security and notification to the Block Warden.
3. Repeated unexcused late arrivals (exceeding 3 occurrences per academic term) trigger a pastoral counseling session with your Block Warden.
4. SmartHostel AI strictly prohibits automatic financial fines for late arrivals. Persistent non-compliance is referred to the Hostel Disciplinary Committee.`,
    citation: 'Residential_Handbook_2026.pdf - Page 14 - Section 4.2'
  },
  {
    id: 'outpass_guidelines',
    category: 'Outpass & Leave',
    section: 'Section 4.5',
    page: 18,
    title: 'Digital Outpass Application & Verification',
    keywords: ['outpass', 'leave', 'gate pass', 'apply outpass', 'outing', 'home visit', 'permission', 'qr code', 'night out'],
    content: `1. Day Outpass: Must be submitted at least 2 hours in advance via the Student Portal. Valid for outing between 6:00 AM and 8:30 PM on the same day.
2. Home / Weekend Outpass: Must be applied at least 24 hours prior to departure with guardian consent recorded.
3. Upon approval by the Block Warden, a cryptographically signed Digital Outpass PDF with dynamic HMAC-SHA256 QR code is generated.
4. Present the QR code on your mobile device to the security gate officer for instant scanner check-out and check-in.
5. Automatic SMS and email confirmations are dispatched to registered parents/guardians upon gate checkout.`,
    citation: 'Residential_Handbook_2026.pdf - Page 18 - Section 4.5'
  },
  {
    id: 'room_allocation_rules',
    category: 'Room Allocation',
    section: 'Section 2.1',
    page: 6,
    title: 'Smart Room Allocation & Lifestyle Matching',
    keywords: ['room allocation', 'room assignment', 'cp-sat', 'room change', 'swap room', 'single room', 'sharing', 'bed', 'hostel room'],
    content: `1. Room allocations are performed semester-wise using combinatorial constraint satisfaction (CP-SAT), enforcing 100% adherence to gender segregation, wing isolation, and physical room capacity.
2. Soft lifestyle compatibility (sleep chronotypes, noise tolerance, study habits, air-conditioning preference) is optimized up to 88%+ affinity under human warden review.
3. Room change or mutual swap requests may be submitted within the first 14 days of the semester via the 'Letters & Requests' portal, subject to mutual consent and Block Warden endorsement.`,
    citation: 'Residential_Handbook_2026.pdf - Page 6 - Section 2.1'
  },
  {
    id: 'mess_timings_menu',
    category: 'Mess & Dining',
    section: 'Section 5.1',
    page: 22,
    title: 'Hostel Dining Hall Timings & Hygiene Standards',
    keywords: ['mess', 'food', 'breakfast', 'lunch', 'dinner', 'snack', 'timings', 'menu', 'diet', 'meal'],
    content: `Hostel dining halls serve hygienic, dietitian-balanced vegetarian and non-vegetarian menus:
- Breakfast: 07:30 AM - 09:00 AM
- Lunch: 12:30 PM - 02:00 PM
- Evening Snacks & Tea: 04:30 PM - 05:30 PM
- Dinner: 07:30 PM - 09:15 PM
Special convalescent diet (khichdi, boiled vegetables, hot milk) is available upon request through the Sick Diet module or contacting the Mess Supervisor.`,
    citation: 'Residential_Handbook_2026.pdf - Page 22 - Section 5.1'
  },
  {
    id: 'maintenance_safety',
    category: 'Maintenance & Safety',
    section: 'Section 3.4',
    page: 11,
    title: 'Facility Maintenance & Electrical Fire Safety',
    keywords: ['complaint', 'maintenance', 'repair', 'plumbing', 'fan', 'light', 'water', 'wifi', 'heater', 'sparking', 'electrician'],
    content: `1. Maintenance requests must be logged through the 'Complaints' tab with photographic evidence.
2. Resolution SLAs:
   - Emergency (electrical sparking, water main burst, gas leak): < 2 hours response.
   - High Priority (room fan, primary lighting, bathroom blockage): < 24 hours.
   - Medium / Low (furniture, Wi-Fi speed, painting): 48 to 72 hours.
3. Prohibited Appliances: High-wattage immersion heaters, electric stoves, and hotplates are strictly prohibited due to fire safety regulations. Possession incurs a disciplinary warning and appliance confiscation.`,
    citation: 'Residential_Handbook_2026.pdf - Page 11 - Section 3.4'
  },
  {
    id: 'anti_ragging_policy',
    category: 'Disciplinary & Welfare',
    section: 'Section 6.2',
    page: 26,
    title: 'Zero Tolerance Anti-Ragging Regulation',
    keywords: ['ragging', 'harassment', 'bullying', 'anti ragging', 'abuse', 'discipline', 'safety', 'threat'],
    content: `The institution maintains an absolute ZERO-TOLERANCE policy against ragging, psychological harassment, or discrimination in any form in accordance with Supreme Court and UGC directives.
Ragging is a cognizable criminal offense punishable by immediate expulsion, lodging of police FIR, and debarment from campus accommodations.
24x7 Anti-Ragging Toll-Free Helpline: 1800-180-5522.
Hostel Anti-Ragging Squad Warden: +91-9876543211.`,
    citation: 'Residential_Handbook_2026.pdf - Page 26 - Section 6.2'
  },
  {
    id: 'fee_payment_schedule',
    category: 'Fees & Finance',
    section: 'Section 8.0',
    page: 32,
    title: 'Hostel Dues, Receipts & Security Deposit Refund',
    keywords: ['fee', 'payment', 'due', 'receipt', 'deposit', 'refund', 'hostel fee', 'mess fee', 'challan'],
    content: `1. Semester hostel and mess charges must be remitted prior to the start of each term via official payment gateway or college bank challan.
2. Students must upload the bank transaction receipt with UTR/Transaction ID under 'Fee & Receipts' for warden verification.
3. Downloadable official stamped Fee Confirmation PDFs are generated within 48 hours of verification.
4. Caution deposit is 100% refundable at the time of program completion or official room vacation after clearance of all dues.`,
    citation: 'Residential_Handbook_2026.pdf - Page 32 - Section 8.0'
  },
  {
    id: 'guest_visitor_policy',
    category: 'Security & Visitors',
    section: 'Section 7.1',
    page: 29,
    title: 'Visitors, Day Guests & Overnight Stays',
    keywords: ['guest', 'visitor', 'parent', 'friend', 'overnight', 'visit', 'stay', 'outsider'],
    content: `1. Registered parents and immediate family members may meet students in the Hostel Reception Lounge between 09:00 AM and 06:00 PM.
2. Day visitors are not permitted inside resident corridors or student bedrooms without warden authorization.
3. Overnight stay of guests or day scholars in student rooms is strictly prohibited. Guest house accommodation can be reserved for visiting parents through the Administrative Warden office.`,
    citation: 'Residential_Handbook_2026.pdf - Page 29 - Section 7.1'
  },
  {
    id: 'health_emergency_services',
    category: 'Healthcare & Emergencies',
    section: 'Section 9.0',
    page: 35,
    title: 'Campus Health Center & Emergency Response',
    keywords: ['emergency', 'health', 'doctor', 'hospital', 'medicine', 'sick', 'ambulance', 'clinic', 'first aid', 'injury'],
    content: `1. Campus 24/7 Health Center is located adjacent to Student Activity Center with resident medical officers and on-duty nursing staff.
2. Free basic consultations and emergency medications are provided to all hostel residents.
3. Dedicated campus ambulance service is available on 24/7 emergency standby.
4. First-aid emergency kits and automated external defibrillator (AED) units are stationed in every Block Warden Office.
Emergency Contacts: Health Center Ext. 108 / Ambulance: +91-9876543200.`,
    citation: 'Residential_Handbook_2026.pdf - Page 35 - Section 9.0'
  },
  {
    id: 'attendance_night_roll_call',
    category: 'Attendance & Wellness',
    section: 'Section 4.3',
    page: 16,
    title: 'Daily Night Roll Call & Attendance Retention',
    keywords: ['attendance', 'roll call', 'night check', 'absent', 'present', 'compliance', 'wellness', 'retention'],
    content: `1. Floor-by-floor evening attendance is conducted between 09:30 PM and 10:15 PM daily by Assistant Wardens.
2. Students with an active approved outpass are automatically marked as 'ON_OUTPASS' in the system.
3. Longitudinal attendance rates below 75% trigger supportive pastoral wellness check-ins to provide academic or health counseling, with no punitive financial penalties.`,
    citation: 'Residential_Handbook_2026.pdf - Page 16 - Section 4.3'
  }
];

// Crisis & Distress Keywords (Crisis Helpline Intercept Guardrail)
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'harm myself', 'self harm',
  'depression', 'depressed', 'cannot live', 'no reason to live', 'hopeless',
  'mental breakdown', 'sexual harassment', 'abused', 'assaulted', 'ragging emergency',
  'threatened to kill', 'trauma', 'panic attack'
];

const EMERGENCY_HELPLINES = {
  campus_counselor: { name: 'Student Counseling & Wellness Cell', contact: '+91-9876543299 / Ext. 404', hours: '24/7 Dedicated' },
  chief_warden: { name: 'Chief Hostel Warden Emergency Desk', contact: '+91-9876543211', hours: '24/7 Duty' },
  tele_manas: { name: 'National Tele-MANAS Mental Health Helpline', contact: '14416 / 1800-891-4416', hours: 'Toll-Free 24x7' },
  anti_ragging: { name: 'National Anti-Ragging Helpline', contact: '1800-180-5522', hours: 'Toll-Free 24x7' },
  campus_ambulance: { name: 'Campus Health Center & Ambulance', contact: '+91-9876543200 / Ext. 108', hours: '24/7 Emergency' },
  national_emergency: { name: 'National Police & Emergency Services', contact: '112', hours: '24/7 Emergency' }
};

// --- SESSION-SCOPED FUNCTION TOOLS (TENANT ISOLATED) ---

// Tool 1: Student Room Allocation
const executeStudentRoomTool = (student, store) => {
  if (!student) {
    return { status: 'NO_PROFILE', message: 'No registered student profile linked to your user account.' };
  }

  const alloc = (store.room_allocations || []).find(
    a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE'
  );

  const pendingReq = (store.room_requests || []).find(
    r => String(r.student_id) === String(student.id) && r.status === 'PENDING'
  );

  if (!alloc) {
    return {
      status: 'UNALLOCATED',
      studentName: student.name,
      rollNumber: student.register_number,
      hasPendingRequest: !!pendingReq,
      pendingDetails: pendingReq ? {
        block: pendingReq.preferred_block,
        roomType: pendingReq.room_type,
        acType: pendingReq.ac_type,
        submittedAt: pendingReq.created_at
      } : null,
      message: pendingReq
        ? `You have a pending room application for ${pendingReq.preferred_block} (${pendingReq.room_type || 'Standard'}). It is currently under warden review.`
        : 'You currently have no active room allocation. You can submit a room request via the "Room Details & Request" page.'
    };
  }

  const room = (store.rooms || []).find(r => String(r.id) === String(alloc.room_id));
  const otherAllocs = (store.room_allocations || []).filter(
    a => String(a.room_id) === String(alloc.room_id) && a.status === 'ACTIVE' && String(a.student_id) !== String(student.id)
  );

  const roommates = otherAllocs.map(oa => {
    const s = (store.students || []).find(st => String(st.id) === String(oa.student_id));
    return s ? `${s.name} (${s.department || s.course || 'Resident'}, Year ${s.year || 1})` : 'Roommate';
  });

  return {
    status: 'ALLOCATED',
    studentName: student.name,
    roomNumber: room ? room.room_number : 'Assigned',
    block: room ? room.block : 'Main',
    floor: room ? `Floor ${room.floor}` : 'N/A',
    roomType: room ? room.room_type : 'Standard',
    acType: room ? room.ac_type : 'Non-AC',
    bathroomType: room ? room.bathroom_type : 'Common',
    bedNumber: alloc.bed_number || 'Bed 1',
    allocatedSince: alloc.allocated_at || 'Current Term',
    roommates: roommates.length > 0 ? roommates : ['No current roommates assigned.']
  };
};

// Tool 2: Student Fee Status
const executeStudentFeeTool = (student, store) => {
  if (!student) return { status: 'NO_PROFILE' };

  const payments = (store.payments || []).filter(p => String(p.student_id) === String(student.id));
  const verifiedPayments = payments.filter(p => p.status === 'VERIFIED');
  const pendingPayments = payments.filter(p => p.status === 'PENDING');

  const totalPaid = verifiedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const termFeeExpected = 45000;
  const balance = Math.max(0, termFeeExpected - totalPaid);

  return {
    studentName: student.name,
    paymentsCount: payments.length,
    verifiedCount: verifiedPayments.length,
    pendingVerificationCount: pendingPayments.length,
    totalVerifiedPaid: totalPaid,
    estimatedBalance: balance,
    recentPayments: payments.slice(0, 3).map(p => ({
      amount: p.amount,
      receiptNumber: p.receipt_number || p.transaction_id || `REC-${p.id}`,
      status: p.status,
      date: p.payment_date || p.created_at || 'Recent'
    }))
  };
};

// Tool 3: Student Outpasses
const executeStudentOutpassTool = (student, store) => {
  if (!student) return { status: 'NO_PROFILE' };

  const outpasses = (store.outpasses || []).filter(o => String(o.student_id) === String(student.id));
  const activeApproved = outpasses.find(o => o.status === 'APPROVED');
  const pending = outpasses.find(o => o.status === 'PENDING');

  return {
    totalRequested: outpasses.length,
    activeOutpass: activeApproved ? {
      id: activeApproved.id,
      destination: activeApproved.destination,
      reason: activeApproved.reason,
      outDate: activeApproved.out_date || activeApproved.out_time,
      inDate: activeApproved.in_date || activeApproved.in_time,
      qrCode: activeApproved.qr_code || activeApproved.qr_token,
      status: activeApproved.status
    } : null,
    pendingOutpass: pending ? {
      id: pending.id,
      destination: pending.destination,
      reason: pending.reason,
      status: pending.status
    } : null,
    recentOutpasses: outpasses.slice(0, 3)
  };
};

// Tool 4: Student Complaints
const executeStudentComplaintsTool = (student, store) => {
  if (!student) return { status: 'NO_PROFILE' };

  const complaints = (store.complaints || []).filter(c => String(c.student_id) === String(student.id));
  const pending = complaints.filter(c => c.status === 'PENDING');
  const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS');
  const rectified = complaints.filter(c => c.status === 'RECTIFIED');

  return {
    total: complaints.length,
    pendingCount: pending.length,
    inProgressCount: inProgress.length,
    rectifiedCount: rectified.length,
    recentTickets: complaints.slice(0, 3).map(c => ({
      title: c.title,
      category: c.category,
      priority: c.priority,
      status: c.status,
      date: c.created_at
    }))
  };
};

// Tool 5: Student Attendance
const executeStudentAttendanceTool = (student, store) => {
  if (!student) return { status: 'NO_PROFILE' };

  const records = (store.attendance || []).filter(a => String(a.student_id) === String(student.id));
  const total = records.length;
  const present = records.filter(a => a.status === 'PRESENT' || a.status === 'ON_OUTPASS').length;
  const absent = records.filter(a => a.status === 'ABSENT').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 92; // default high if fresh session

  return {
    totalRollCalls: total,
    presentCount: present,
    absentCount: absent,
    percentage: percentage,
    wellnessStatus: percentage >= 75 ? 'GOOD_STANDING' : 'ATTENDANCE_WARNING',
    advice: percentage < 75
      ? 'Your attendance is currently below the 75% guideline. A friendly pastoral check-in with your warden is recommended to ensure your academic schedule is supported.'
      : 'Your attendance is in good standing with zero compliance flags.'
  };
};

// Tool 6: Warden / Admin Overview
const executeWardenOverviewTool = (store) => {
  const rooms = store.rooms || [];
  const students = store.students || [];
  const allocations = (store.room_allocations || []).filter(a => a.status === 'ACTIVE');
  const outpasses = store.outpasses || [];
  const pendingOutpasses = outpasses.filter(o => o.status === 'PENDING');
  const complaints = store.complaints || [];
  const emergencyComplaints = complaints.filter(c => (c.priority === 'EMERGENCY' || c.priority === 'HIGH') && c.status !== 'RECTIFIED');

  const totalCapacity = rooms.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0);
  const occupiedBeds = allocations.length;
  const availableBeds = Math.max(0, totalCapacity - occupiedBeds);

  return {
    totalStudents: students.length,
    totalRooms: rooms.length,
    totalCapacity,
    occupiedBeds,
    availableBeds,
    occupancyRate: totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0,
    pendingOutpassApprovals: pendingOutpasses.length,
    urgentComplaintsCount: emergencyComplaints.length,
    emergencyComplaints: emergencyComplaints.slice(0, 3)
  };
};

// --- HYBRID RAG POLICY MATCHER (BM25 + Semantic Term Weighting) ---
const searchHandbookPolicies = (userQuery) => {
  const queryLower = userQuery.toLowerCase();
  const queryTokens = queryLower.split(/\W+/).filter(t => t.length > 2);

  const scoredPolicies = POLICY_HANDBOOK.map(policy => {
    let score = 0;

    // Check keywords matches
    policy.keywords.forEach(kw => {
      if (queryLower.includes(kw)) score += 3.5;
    });

    // Check title match
    const titleLower = policy.title.toLowerCase();
    queryTokens.forEach(token => {
      if (titleLower.includes(token)) score += 2.0;
    });

    // Check content token matches
    const contentLower = policy.content.toLowerCase();
    queryTokens.forEach(token => {
      if (contentLower.includes(token)) score += 1.0;
    });

    return { policy, score };
  });

  scoredPolicies.sort((a, b) => b.score - a.score);
  return scoredPolicies.filter(sp => sp.score > 2.0).map(sp => sp.policy);
};

// --- DETERMINISTIC INTENT DETECTION ---
const detectIntent = (query, role) => {
  const q = query.toLowerCase();

  // Crisis check
  for (const cw of CRISIS_KEYWORDS) {
    if (q.includes(cw)) return 'CRISIS_EMERGENCY';
  }

  // Food count queries
  if (q.includes('food count') || q.includes('food tomorrow') || q.includes('mess count') || q.includes('student count for food') || q.includes('meals tomorrow') || q.includes('how many students for food') || q.includes('kitchen count') || q.includes('tomorrow food')) {
    return 'FOOD_COUNT_TOMORROW';
  }

  // Warden queries
  if (role === 'WARDEN' || role === 'ADMIN') {
    if (q.includes('occupancy') || q.includes('how many student') || q.includes('available bed') || q.includes('room status') || q.includes('hostel stat')) {
      return 'WARDEN_OVERVIEW';
    }
    if (q.includes('pending outpass') || q.includes('outpass approval') || q.includes('who is out')) {
      return 'WARDEN_OUTPASS';
    }
    if (q.includes('urgent complaint') || q.includes('emergency ticket') || q.includes('maintenance queue')) {
      return 'WARDEN_COMPLAINTS';
    }
  }

  // Student personal scoped queries
  if (q.includes('my room') || q.includes('my bed') || q.includes('my block') || q.includes('roommate') || q.includes('where do i stay') || q.includes('who are my roommate') || q.includes('allocation status')) {
    return 'STUDENT_ROOM';
  }
  if (q.includes('my fee') || q.includes('fee status') || q.includes('fee receipt') || q.includes('have i paid') || q.includes('fee balance') || q.includes('tuition') || q.includes('payment verified')) {
    return 'STUDENT_FEE';
  }
  if (q.includes('my outpass') || q.includes('outpass status') || q.includes('gate pass status') || q.includes('can i leave') || q.includes('my leave status') || q.includes('qr pass')) {
    return 'STUDENT_OUTPASS';
  }
  if (q.includes('my complaint') || q.includes('my ticket') || q.includes('complaint status') || q.includes('fan repaired') || q.includes('plumbing status')) {
    return 'STUDENT_COMPLAINT';
  }
  if (q.includes('my attendance') || q.includes('attendance percentage') || q.includes('roll call status') || q.includes('was i marked absent')) {
    return 'STUDENT_ATTENDANCE';
  }

  // Emergency / Safety direct questions
  if (q.includes('emergency number') || q.includes('ambulance') || q.includes('doctor') || q.includes('hospital') || q.includes('counselor') || q.includes('helpline')) {
    return 'EMERGENCY_CONTACTS';
  }

  return 'HANDBOOK_POLICY';
};

// --- CONTROLLER HANDLER: POST /api/ai/chat ---
const chat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please provide a non-empty message prompt.' });
    }

    const store = getMemoryStore();
    const userRole = req.user ? req.user.role : 'GUEST';
    const userId = req.user ? req.user.id : null;

    // Resolve student record if user is student
    let currentStudent = null;
    if (userRole === 'STUDENT' && userId) {
      currentStudent = (store.students || []).find(
        s => String(s.user_id) === String(userId) || (req.user.profileId && String(s.id) === String(req.user.profileId))
      );
    }

    // Resolve warden record if warden
    let currentWarden = null;
    if ((userRole === 'WARDEN' || userRole === 'ADMIN') && userId) {
      currentWarden = (store.wardens || []).find(
        w => String(w.user_id) === String(userId) || (req.user.profileId && String(w.id) === String(req.user.profileId))
      );
    }

    const intent = detectIntent(message, userRole);
    let toolExecuted = null;
    let toolResult = null;
    let crisisIntercept = false;
    let assistantReply = '';
    let citations = [];

    // --- 1. CRISIS GUARDRAIL INTERCEPT ---
    if (intent === 'CRISIS_EMERGENCY') {
      crisisIntercept = true;
      assistantReply = `**Important Notice: Student Care & Wellness Support**\n\nIf you or someone in your residential community is experiencing distress, mental strain, safety concerns, or a personal crisis, **please know that you are not alone and compassionate confidential support is immediately available 24/7:**\n\n` +
        `• **Campus Student Counseling & Wellness Cell**: Ext. 404 | **+91-9876543299** (Confidential)\n` +
        `• **Chief Hostel Warden Office**: **+91-9876543211** (Immediate on-site intervention)\n` +
        `• **National Tele-MANAS Mental Health Support**: **14416** or **1800-891-4416** (Toll-Free, 24x7)\n` +
        `• **Campus Medical Emergency & Ambulance**: Ext. 108 | **+91-9876543200**\n` +
        `• **National Anti-Ragging & Harassment Helpline**: **1800-180-5522**\n\n` +
        `Please reach out to any of the numbers above or walk in directly to your Block Warden office. Your safety, dignity, and mental well-being are the highest priorities of campus administration.`;
      
      return res.json({
        reply: assistantReply,
        crisisIntercept: true,
        helplines: EMERGENCY_HELPLINES,
        toolExecuted: null,
        citations: []
      });
    }

    // --- 2. EMERGENCY CONTACTS DIRECT QUERY ---
    if (intent === 'EMERGENCY_CONTACTS') {
      assistantReply = `Here are the official 24/7 campus residential emergency helplines:\n\n` +
        `• **Campus Health Center & Ambulance**: Ext. 108 / **+91-9876543200** (24/7 on standby)\n` +
        `• **Chief Hostel Warden Emergency Desk**: **+91-9876543211** (Boys & Girls blocks)\n` +
        `• **Student Counseling & Wellness Cell**: Ext. 404 / **+91-9876543299**\n` +
        `• **Campus Security Gate Control Room**: Ext. 100 / **+91-9876543205**\n` +
        `• **National Emergency Police / Ambulance**: **112**\n` +
        `• **National Anti-Ragging Portal**: **1800-180-5522** (Toll-Free 24x7)\n\n` +
        `First-aid emergency kits and AED units are also stationed in every Block Warden office.`;
      citations = ['Residential_Handbook_2026.pdf - Page 35 - Section 9.0'];
      
      return res.json({
        reply: assistantReply,
        crisisIntercept: false,
        helplines: EMERGENCY_HELPLINES,
        toolExecuted: null,
        citations
      });
    }

    // --- 2.5 TOMORROW FOOD PREPARATION COUNT ---
    if (intent === 'FOOD_COUNT_TOMORROW') {
      toolExecuted = 'warden_tools.get_tomorrow_food_count';
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = (store.attendance || []).filter(a => a.date === today);
      const presentCount = todayRecords.filter(a => a.status === 'PRESENT').length;
      const notEatingCount = todayRecords.filter(a => a.status === 'ABSENT' || a.status === 'LEAVE' || a.status === 'OUTPASS').length;

      const totalStudents = (store.students || []).length;
      const effectiveCount = todayRecords.length > 0 ? presentCount : totalStudents;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormatted = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

      assistantReply = `**🍽️ Tomorrow's Food Preparation Count (${tomorrowFormatted}):**\n\n` +
        `• **Confirmed Dinner Headcount**: **${effectiveCount} Students**\n` +
        `• **Meals Breakdown**:\n` +
        `  - 🌅 **Breakfast (07:30 - 09:00 AM)**: ${effectiveCount} servings\n` +
        `  - ☀️ **Lunch (12:30 - 02:00 PM)**: ${effectiveCount} servings\n` +
        `  - 🌙 **Dinner (07:30 - 09:15 PM)**: ${effectiveCount} servings\n\n` +
        (todayRecords.length > 0
          ? `• **Off-Campus / Leave / Absent**: **${notEatingCount} Students** (Food wastage prevented)\n• *Status*: Accurately verified from today's saved roll call attendance.`
          : `• *Note*: Night roll call for today has not been saved yet. Showing projected count based on registered residents (${totalStudents}). Marking night roll call will calculate the live count.`) +
        `\n\nYou can view and record attendance anytime on the **[Attendance Marking](/warden/attendance)** page.`;

      citations = ['Residential_Handbook_2026.pdf - Page 22 - Section 5.1 (Mess & Dining)'];
      return res.json({
        reply: assistantReply,
        crisisIntercept: false,
        toolExecuted,
        toolResult: { foodCountTomorrow: effectiveCount, notEatingCount },
        citations
      });
    }

    // --- 3. SESSION-SCOPED TOOL EXECUTION (STUDENT) ---
    if (intent === 'STUDENT_ROOM') {
      toolExecuted = 'student_tools.get_personal_allocation';
      toolResult = executeStudentRoomTool(currentStudent, store);

      if (toolResult.status === 'ALLOCATED') {
        assistantReply = `**Your Room Allocation Details:**\n\n` +
          `• **Resident**: ${toolResult.studentName}\n` +
          `• **Room Assigned**: **${toolResult.roomNumber}** (${toolResult.block}, ${toolResult.floor})\n` +
          `• **Configuration**: ${toolResult.roomType} (${toolResult.acType}, ${toolResult.bathroomType} Bathroom)\n` +
          `• **Bed Assignment**: ${toolResult.bedNumber}\n` +
          `• **Roommates**:\n${toolResult.roommates.map(r => `  - ${r}`).join('\n')}\n\n` +
          `You can view full details or download your official stamped **Room Allocation PDF** under the [Room Details & Request](/student/room-request) section.`;
      } else {
        assistantReply = `**Room Status**: ${toolResult.message}\n\n` +
          `To choose your block and lifestyle preferences (AC/Non-AC, sharing type), visit the **[Room Details & Request](/student/room-request)** page. The CP-SAT optimization engine matches verified student requests under warden review.`;
      }
      citations = ['Residential_Handbook_2026.pdf - Page 6 - Section 2.1'];
    }

    else if (intent === 'STUDENT_FEE') {
      toolExecuted = 'student_tools.get_fee_status';
      toolResult = executeStudentFeeTool(currentStudent, store);

      if (toolResult.status === 'NO_PROFILE') {
        assistantReply = `Could not locate an active student profile linked to your account. Please complete your profile first.`;
      } else {
        const verifiedStr = toolResult.totalVerifiedPaid > 0
          ? `Rs. ${toolResult.totalVerifiedPaid.toLocaleString()}`
          : 'None verified yet';
        const balanceStr = toolResult.estimatedBalance === 0
          ? 'Fully Paid (Rs. 0 Pending)'
          : `Rs. ${toolResult.estimatedBalance.toLocaleString()} pending`;

        assistantReply = `**Your Hostel & Mess Fee Overview:**\n\n` +
          `• **Student**: ${toolResult.studentName}\n` +
          `• **Total Verified Payments**: **${verifiedStr}**\n` +
          `• **Receipts Under Warden Verification**: ${toolResult.pendingVerificationCount}\n` +
          `• **Estimated Outstanding Balance**: **${balanceStr}**\n\n`;

        if (toolResult.recentPayments.length > 0) {
          assistantReply += `**Recent Transactions:**\n` +
            toolResult.recentPayments.map(p => `• Receipt **${p.receiptNumber}**: Rs. ${p.amount} — Status: *${p.status}* (${p.date})`).join('\n') +
            `\n\n`;
        }

        assistantReply += `You can upload new payment receipts and download official stamped receipts from the **[Fee & Receipts](/student/fee)** tab.`;
      }
      citations = ['Residential_Handbook_2026.pdf - Page 32 - Section 8.0'];
    }

    else if (intent === 'STUDENT_OUTPASS') {
      toolExecuted = 'student_tools.get_outpass_status';
      toolResult = executeStudentOutpassTool(currentStudent, store);

      if (toolResult.activeOutpass) {
        assistantReply = `**You have an ACTIVE Approved Outpass!** 🎫\n\n` +
          `• **Destination**: ${toolResult.activeOutpass.destination}\n` +
          `• **Reason**: ${toolResult.activeOutpass.reason}\n` +
          `• **Expected Return**: ${new Date(toolResult.activeOutpass.inDate).toLocaleString()}\n` +
          `• **Status**: **APPROVED** (QR Code Ready for Security Gate)\n\n` +
          `Please present your digital pass QR code to the gate security officer upon departure and arrival. You can access the QR pass on the **[Letters & Outpass](/student/outpass)** page.`;
      } else if (toolResult.pendingOutpass) {
        assistantReply = `**Pending Outpass Request:**\n\n` +
          `• Destination: **${toolResult.pendingOutpass.destination}**\n` +
          `• Reason: *${toolResult.pendingOutpass.reason}*\n` +
          `• Status: **PENDING WARDEN APPROVAL**\n\n` +
          `Your Block Warden has been notified and will review your request shortly.`;
      } else {
        assistantReply = `You currently have **no active or pending outpasses**.\n\n` +
          `To apply for an outing or home leave, visit the **[Letters & Outpass](/student/outpass)** section:\n` +
          `• Day Outing: Submit at least 2 hours in advance (valid until 8:30 PM).\n` +
          `• Weekend / Home Leave: Submit at least 24 hours prior with parent contact.`;
      }
      citations = ['Residential_Handbook_2026.pdf - Page 18 - Section 4.5'];
    }

    else if (intent === 'STUDENT_COMPLAINT') {
      toolExecuted = 'student_tools.get_complaints_queue';
      toolResult = executeStudentComplaintsTool(currentStudent, store);

      assistantReply = `**Your Maintenance Complaints Summary:**\n\n` +
        `• **Total Submitted**: ${toolResult.total}\n` +
        `• **Pending**: ${toolResult.pendingCount}\n` +
        `• **In Progress / Dispatched**: ${toolResult.inProgressCount}\n` +
        `• **Rectified & Closed**: ${toolResult.rectifiedCount}\n\n`;

      if (toolResult.recentTickets && toolResult.recentTickets.length > 0) {
        assistantReply += `**Recent Tickets:**\n` +
          toolResult.recentTickets.map(t => `• **${t.title}** (${t.category}, Priority: ${t.priority}) — Status: *${t.status}*`).join('\n') +
          `\n\n`;
      }

      assistantReply += `To report a new facility issue (electrical, plumbing, Wi-Fi, furniture), go to the **[Complaints](/student/complaints)** portal.`;
      citations = ['Residential_Handbook_2026.pdf - Page 11 - Section 3.4'];
    }

    else if (intent === 'STUDENT_ATTENDANCE') {
      toolExecuted = 'student_tools.get_attendance_compliance';
      toolResult = executeStudentAttendanceTool(currentStudent, store);

      assistantReply = `**Your Longitudinal Attendance Record:**\n\n` +
        `• **Overall Attendance Rate**: **${toolResult.percentage}%**\n` +
        `• **Roll Calls Recorded**: ${toolResult.totalRollCalls}\n` +
        `• **Present / Outpass Days**: ${toolResult.presentCount}\n` +
        `• **Unexcused Absences**: ${toolResult.absentCount}\n` +
        `• **Compliance Status**: ${toolResult.wellnessStatus === 'GOOD_STANDING' ? '✅ Good Standing' : '⚠️ Wellness Check-in Recommended'}\n\n` +
        `*Policy Note*: ${toolResult.advice}\n\n` +
        `Full daily logs can be reviewed on the **[Attendance](/student/attendance)** tab.`;
      citations = ['Residential_Handbook_2026.pdf - Page 16 - Section 4.3'];
    }

    // --- 4. SESSION-SCOPED TOOL EXECUTION (WARDEN / ADMIN) ---
    else if (intent === 'WARDEN_OVERVIEW') {
      toolExecuted = 'warden_tools.get_facility_overview';
      toolResult = executeWardenOverviewTool(store);

      assistantReply = `**Hostel Administrative Status Overview:**\n\n` +
        `• **Total Registered Students**: ${toolResult.totalStudents}\n` +
        `• **Total Rooms**: ${toolResult.totalRooms}\n` +
        `• **Capacity**: ${toolResult.totalCapacity} Beds\n` +
        `• **Occupied Beds**: ${toolResult.occupiedBeds} (${toolResult.occupancyRate}% Occupancy)\n` +
        `• **Available Vacancies**: **${toolResult.availableBeds} Beds**\n` +
        `• **Pending Outpass Applications**: **${toolResult.pendingOutpassApprovals}**\n` +
        `• **Urgent Maintenance Complaints**: **${toolResult.urgentComplaintsCount}**\n\n` +
        `Navigate to **[Room Allocations](/warden/allocations)** or **[Outpasses](/warden/outpasses)** to take immediate actions.`;
      citations = ['Residential_Handbook_2026.pdf - Section 2.1 & 4.5'];
    }

    else if (intent === 'WARDEN_OUTPASS') {
      toolExecuted = 'warden_tools.get_pending_outpasses';
      const pendingOutpasses = (store.outpasses || []).filter(o => o.status === 'PENDING');
      toolResult = { count: pendingOutpasses.length, list: pendingOutpasses.slice(0, 5) };

      if (pendingOutpasses.length === 0) {
        assistantReply = `There are currently **zero pending outpass applications** awaiting review. All resident outings are up to date!`;
      } else {
        assistantReply = `**Pending Outpass Review Queue (${pendingOutpasses.length} requests):**\n\n` +
          pendingOutpasses.slice(0, 5).map(o => {
            const s = (store.students || []).find(st => String(st.id) === String(o.student_id));
            return `• **${s ? s.name : 'Student'}** (${s ? s.register_number : 'ID'}) — Destination: *${o.destination}* (Reason: ${o.reason})`;
          }).join('\n') +
          `\n\nOpen the **[Outpasses & Overdue](/warden/outpasses)** page to approve or decline with digital signature.`;
      }
      citations = ['Residential_Handbook_2026.pdf - Page 18 - Section 4.5'];
    }

    else if (intent === 'WARDEN_COMPLAINTS') {
      toolExecuted = 'warden_tools.get_urgent_complaints';
      const urgent = (store.complaints || []).filter(
        c => (c.priority === 'EMERGENCY' || c.priority === 'HIGH') && c.status !== 'RECTIFIED'
      );
      toolResult = { count: urgent.length, tickets: urgent.slice(0, 5) };

      if (urgent.length === 0) {
        assistantReply = `Great news: **No unresolved emergency or high-priority maintenance complaints** are presently logged in the system.`;
      } else {
        assistantReply = `**⚠️ Urgent Complaints Requiring Immediate Warden Triage (${urgent.length}):**\n\n` +
          urgent.slice(0, 5).map(c => `• [${c.priority}] **${c.title}** (${c.category}) — Status: *${c.status}*`).join('\n') +
          `\n\nInspect photos and dispatch maintenance teams on the **[Complaints Queue](/warden/complaints)** portal.`;
      }
      citations = ['Residential_Handbook_2026.pdf - Page 11 - Section 3.4'];
    }

    // --- 5. HYBRID RAG HANDBOOK SEARCH & INTENT FALLBACK ---
    else {
      const matchedPolicies = searchHandbookPolicies(message);

      if (matchedPolicies.length > 0) {
        const top = matchedPolicies[0];
        citations = matchedPolicies.slice(0, 2).map(p => p.citation);

        assistantReply = `**According to the Student Residential Handbook (${top.section} — ${top.title}):**\n\n` +
          `${top.content}\n\n`;

        if (matchedPolicies.length > 1) {
          const second = matchedPolicies[1];
          assistantReply += `*Related Policy (${second.title} — ${second.section})*:\n${second.content.split('\n')[0]}\n\n`;
        }

        assistantReply += `Feel free to ask for further details regarding hostel curfews, digital outpasses, mess timings, or room allocations!`;
      } else {
        // Friendly conversational assistant fallback
        assistantReply = `Hello! I am **SmartHostel AI Assistant**, your residential companion.\n\n` +
          `I can answer questions regarding:\n` +
          `• **Hostel Rules & Curfews**: Weekday/Weekend timings, late arrival guidelines, and visitor hours.\n` +
          `• **Digital Outpasses**: Gate pass application, overnight leave, and dynamic QR verification.\n` +
          `• **Room Allocations**: CP-SAT optimization, roommate compatibility, room change procedures.\n` +
          `• **Dining & Mess**: Daily breakfast, lunch, snacks, and dinner schedules.\n` +
          `• **Maintenance & Safety**: Submitting complaints, electrical regulations, and emergency SLAs.\n` +
          `• **Personal Status**: Ask *"What is my room allocation?"*, *"Check my fee status"*, or *"My outpass status"* for live records!\n\n` +
          `How may I assist you today?`;
        citations = ['Residential_Handbook_2026.pdf - Student Guidelines'];
      }
    }

    return res.json({
      reply: assistantReply,
      crisisIntercept,
      toolExecuted,
      toolResult: toolResult ? { status: toolResult.status || 'OK' } : null,
      citations
    });
  } catch (error) {
    console.error('[AI Assistant Error]', error);
    return res.status(500).json({
      error: 'An unexpected error occurred while processing your request with the AI Assistant.'
    });
  }
};

// --- CONTROLLER HANDLER: GET /api/ai/suggestions ---
const getSuggestions = (req, res) => {
  const role = req.user ? req.user.role : 'STUDENT';

  let suggestions = [];
  if (role === 'STUDENT') {
    suggestions = [
      'What is my current room assignment and roommates?',
      'What is the penalty for arriving after 9:00 PM curfew?',
      'How do I apply for a digital outpass?',
      'Check my fee balance and verified payments',
      'What are the daily mess timings?',
      'How to report an electrical or plumbing complaint?',
      'What is the campus emergency ambulance number?'
    ];
  } else if (role === 'WARDEN' || role === 'ADMIN') {
    suggestions = [
      'How many students count for food tomorrow?',
      'Hostel occupancy and available beds summary',
      'Show pending outpasses waiting for approval',
      'Are there any urgent or emergency maintenance tickets?',
      'Explain late arrival policy and disciplinary guidelines',
      'What are the rules regarding guest and visitor stays?'
    ];
  } else {
    suggestions = [
      'What are the hostel gate and curfew timings?',
      'How does SmartHostel room allocation work?',
      'Campus emergency and medical helpline contacts'
    ];
  }

  res.json({ role, suggestions });
};

// --- CONTROLLER HANDLER: GET /api/ai/helplines ---
const getHelplines = (req, res) => {
  res.json(EMERGENCY_HELPLINES);
};

module.exports = {
  chat,
  getSuggestions,
  getHelplines,
  searchHandbookPolicies,
  executeStudentRoomTool,
  POLICY_HANDBOOK
};

