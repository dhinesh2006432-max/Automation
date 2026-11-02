const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');
const { generateAllocationPDF } = require('../utils/pdfGenerator');

// GET CURRENT STUDENT ALLOCATION & REQUEST STATUS
const getMyAllocation = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    
    if (!student && isPostgresConnected()) {
      try {
        const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
        if (sRes.rows.length > 0) student = sRes.rows[0];
      } catch (e) {}
    }

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    // Active allocation
    const allocation = store.room_allocations.find(
      a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE'
    );

    let room = null;
    let roommates = [];

    if (allocation) {
      room = store.rooms.find(r => String(r.id) === String(allocation.room_id));
      if (room) {
        // Find other occupants
        const activeAllocs = store.room_allocations.filter(
          a => String(a.room_id) === String(room.id) && a.status === 'ACTIVE'
        );
        const occupantStudentIds = activeAllocs.map(a => String(a.student_id));
        const allOccupants = store.students
          .filter(s => occupantStudentIds.includes(String(s.id)))
          .map(s => ({
            id: s.id,
            name: s.name,
            register_number: s.register_number,
            department: s.department,
            course: s.course,
            year: s.year
          }));
        
        roommates = allOccupants.filter(s => String(s.id) !== String(student.id));
        room = { ...room, occupants: allOccupants };
      }
    }

    // Latest room request
    const studentRequests = store.room_requests
      .filter(r => String(r.student_id) === String(student.id))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const latestRequest = studentRequests.length > 0 ? studentRequests[0] : null;

    res.json({
      hasAllocation: !!allocation,
      allocation: allocation || null,
      room: room || null,
      roommates,
      hasPendingRequest: latestRequest ? latestRequest.status === 'PENDING' : false,
      request: latestRequest
    });
  } catch (err) {
    console.error('getMyAllocation error:', err);
    res.status(500).json({ error: 'Failed to fetch student room allocation details.' });
  }
};

// SUBMIT ROOM REQUEST (Student)
const submitRequest = async (req, res) => {
  try {
    const store = getMemoryStore();
    let student = store.students.find(s => String(s.user_id) === String(req.user.id));
    if (!student && isPostgresConnected()) {
      try {
        const sRes = await query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
        if (sRes.rows.length > 0) student = sRes.rows[0];
      } catch (e) {}
    }
    if (!student) return res.status(404).json({ error: 'Student profile not found.' });

    const existingAllocation = store.room_allocations.find(a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE');
    if (existingAllocation) {
      const room = store.rooms.find(r => String(r.id) === String(existingAllocation.room_id));
      return res.status(400).json({ 
        error: `You already have an active room allocation (${room ? room.room_number : 'Room Assigned'}). Please contact your warden to vacate or request a transfer.` 
      });
    }

    const { preferred_block, preferred_floor, preferred_room_type, preferred_ac, preferred_bathroom, special_requirements } = req.body;
    const isFemale = student.gender && student.gender.toUpperCase().includes('FEMALE');
    const pBlock = preferred_block || (isFemale ? 'Block B' : 'Block A');
    const pFloor = parseInt(preferred_floor || 1, 10);
    const pRoomType = preferred_room_type || '2 Sharing';
    const pAc = preferred_ac || 'AC';
    const pBath = preferred_bathroom || 'Attached';
    const pSpec = special_requirements || '';
    const feeReceipt = req.file ? `/uploads/${req.file.filename}` : null;

    // Check if there is already a PENDING request
    let existingPending = store.room_requests.find(r => String(r.student_id) === String(student.id) && r.status === 'PENDING');

    // ENFORCE MANDATORY FEE RECEIPT UPLOAD
    if (!feeReceipt && (!existingPending || !existingPending.fee_receipt_url)) {
      return res.status(400).json({
        error: 'Hostel fee receipt upload is mandatory. Please attach your payment receipt before submitting a room allocation request.'
      });
    }

    if (existingPending) {
      existingPending.preferred_block = pBlock;
      existingPending.preferred_floor = pFloor;
      existingPending.preferred_room_type = pRoomType;
      existingPending.preferred_ac = pAc;
      existingPending.preferred_bathroom = pBath;
      existingPending.special_requirements = pSpec;
      if (feeReceipt) {
        existingPending.fee_receipt_url = feeReceipt;
        existingPending.fee_verified = false;
        existingPending.fee_status = 'PENDING_WARDEN';
      }
      existingPending.updated_at = new Date().toISOString();

      if (feeReceipt) {
        store.payments.unshift({
          id: Date.now() + 5,
          student_id: student.id,
          receipt_number: `REC-${Date.now().toString().slice(-6)}`,
          amount: 45000,
          payment_date: new Date().toISOString().split('T')[0],
          payment_type: 'HOSTEL_ROOM_FEE',
          receipt_file_url: feeReceipt,
          status: 'PENDING',
          verified_by_warden_id: null,
          created_at: new Date().toISOString()
        });
      }

      if (isPostgresConnected()) {
        try {
          await query(
            `UPDATE room_requests SET preferred_block = $1, preferred_floor = $2, preferred_room_type = $3,
             preferred_ac = $4, preferred_bathroom = $5, special_requirements = $6,
             fee_receipt_url = COALESCE($7, fee_receipt_url), updated_at = CURRENT_TIMESTAMP
             WHERE id = $8`,
            [pBlock, pFloor, pRoomType, pAc, pBath, pSpec, feeReceipt, existingPending.id]
          );
        } catch (dbErr) {
          console.error('[DB updateRequest Error]', dbErr.message);
        }
      }

      saveMemoryStore();
      return res.json({ 
        message: 'Your room allocation request and fee receipt have been updated and forwarded to Warden for verification.', 
        request: existingPending 
      });
    }

    let newRequest = null;

    if (isPostgresConnected()) {
      try {
        const reqInsert = await query(
          `INSERT INTO room_requests (
            student_id, preferred_block, preferred_floor, preferred_room_type,
            preferred_ac, preferred_bathroom, special_requirements, fee_receipt_url, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
          RETURNING *`,
          [student.id, pBlock, pFloor, pRoomType, pAc, pBath, pSpec, feeReceipt]
        );
        newRequest = reqInsert.rows[0];
      } catch (dbErr) {
        console.error('[DB submitRequest Error]', dbErr.message);
      }
    }

    if (!newRequest) {
      newRequest = {
        id: Date.now(),
        student_id: student.id,
        preferred_block: pBlock,
        preferred_floor: pFloor,
        preferred_room_type: pRoomType,
        preferred_ac: pAc,
        preferred_bathroom: pBath,
        special_requirements: pSpec,
        fee_receipt_url: feeReceipt,
        fee_verified: false,
        fee_status: 'PENDING_WARDEN',
        status: 'PENDING',
        allocated_room_id: null,
        created_at: new Date().toISOString()
      };
    } else {
      newRequest.fee_verified = false;
      newRequest.fee_status = 'PENDING_WARDEN';
    }

    // Register corresponding payment entry for Warden
    if (feeReceipt) {
      store.payments.unshift({
        id: Date.now() + 5,
        student_id: student.id,
        receipt_number: `REC-${Date.now().toString().slice(-6)}`,
        amount: 45000,
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'HOSTEL_ROOM_FEE',
        receipt_file_url: feeReceipt,
        status: 'PENDING',
        verified_by_warden_id: null,
        created_at: new Date().toISOString()
      });
    }

    // Notify Warden to verify fee receipt
    store.notifications.push({
      id: Date.now() + 10,
      user_id: 2, // Warden
      role_target: 'WARDEN',
      title: 'Fee Receipt Verification Required',
      message: `Student ${student.name} (${student.register_number}) submitted a room request with fee receipt. Please verify receipt for allocation approval.`,
      type: 'INFO',
      is_read: false,
      created_at: new Date().toISOString()
    });

    store.room_requests.push(newRequest);
    saveMemoryStore();

    res.status(201).json({
      message: 'Room request & mandatory fee receipt submitted successfully! Routed to Warden for verification.',
      request: newRequest
    });
  } catch (err) {
    console.error('Submit request error:', err);
    res.status(500).json({ error: 'Failed to submit room request.' });
  }
};

// GET ALL ROOM ALLOCATION REQUESTS (Warden/Admin)
const getRequests = (req, res) => {
  const store = getMemoryStore();
  const requests = store.room_requests.map(reqItem => {
    const student = store.students.find(s => String(s.id) === String(reqItem.student_id));
    const allocated_room = reqItem.allocated_room_id
      ? store.rooms.find(r => String(r.id) === String(reqItem.allocated_room_id))
      : null;
    return { ...reqItem, student, allocated_room };
  });

  // Sort: Pending first, then by date descending
  requests.sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  res.json(requests);
};

// GET ALL ACTIVE ALLOCATIONS (Warden/Admin)
const getAllocations = (req, res) => {
  const store = getMemoryStore();
  const allocations = store.room_allocations.map(alloc => {
    const student = store.students.find(s => String(s.id) === String(alloc.student_id));
    const room = store.rooms.find(r => String(r.id) === String(alloc.room_id));
    return { ...alloc, student, room };
  });

  // Active first, then by date descending
  allocations.sort((a, b) => {
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
    if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
    return new Date(b.allocation_date || 0) - new Date(a.allocation_date || 0);
  });

  res.json(allocations);
};

// SMART AUTOMATIC ALLOCATION ALGORITHM (Warden/Admin)
const autoAllocate = async (req, res) => {
  try {
    const { requestId } = req.params;
    const store = getMemoryStore();
    const reqItem = store.room_requests.find(r => String(r.id) === String(requestId));

    if (!reqItem) return res.status(404).json({ error: 'Room request not found.' });
    if (reqItem.status === 'APPROVED') return res.status(400).json({ error: 'Request is already approved and allocated.' });

    const student = store.students.find(s => String(s.id) === String(reqItem.student_id));
    if (!student) return res.status(404).json({ error: 'Student record not found.' });

    // Enforce Warden Fee Verification before Room Allocation (Agentic AI Step 1)
    const isFeeVerified = reqItem.fee_verified || reqItem.fee_status === 'VERIFIED_BY_WARDEN';
    if (!isFeeVerified) {
      return res.status(400).json({
        error: "Cannot allocate room: The student's fee receipt has not been verified by the Warden yet. Verification by Warden is mandatory before room allocation.",
        step: 1,
        step_status: 'REJECTED',
        ai_steps: [
          {
            step: 1,
            title: 'Fee Receipt Verification Audit',
            status: 'REJECTED',
            details: `Fee receipt for student ${student.name} is currently in '${reqItem.fee_status || 'PENDING'}' status. Warden verification is mandatory before room assignment.`,
            agent_verdict: 'REJECTED: Verification by Warden required before allocation.'
          }
        ]
      });
    }

    const isFemale = student.gender && student.gender.toUpperCase().includes('FEMALE');
    const genderRestriction = isFemale ? 'GIRLS' : 'BOYS';

    // Smart Room Finder Logic: matching gender, with capacity, not under maintenance
    let availableRooms = store.rooms.filter(room => {
      const roomGender = (room.gender_restriction || '').toUpperCase();
      const hasCap = (parseInt(room.current_occupancy || 0, 10)) < parseInt(room.capacity || 1, 10);
      return (
        room.status !== 'FULL' &&
        room.status !== 'MAINTENANCE' &&
        hasCap &&
        (roomGender === genderRestriction || roomGender === 'ANY')
      );
    });

    if (availableRooms.length === 0) {
      return res.status(400).json({ 
        error: `No available rooms found for ${genderRestriction} hostel with open capacity. Please add or vacate a room first.` 
      });
    }

    // Best match scoring
    const targetBlock = (reqItem.preferred_block || '').toLowerCase();
    const targetType = (reqItem.preferred_room_type || '').toLowerCase();
    const targetAc = (reqItem.preferred_ac || '').toLowerCase();

    let bestRoom = 
      availableRooms.find(r => 
        r.block.toLowerCase().includes(targetBlock) && 
        r.room_type.toLowerCase() === targetType &&
        r.ac_type.toLowerCase() === targetAc
      ) ||
      availableRooms.find(r => 
        r.block.toLowerCase().includes(targetBlock) && 
        r.room_type.toLowerCase() === targetType
      ) ||
      availableRooms.find(r => 
        r.block.toLowerCase().includes(targetBlock)
      ) ||
      availableRooms[0];

    // Vacate any previous active allocation for this student if one exists
    const priorAllocs = store.room_allocations.filter(
      a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE'
    );
    for (const prior of priorAllocs) {
      prior.status = 'VACATED';
      prior.vacating_date = new Date().toISOString().split('T')[0];
      const oldRoom = store.rooms.find(r => String(r.id) === String(prior.room_id));
      if (oldRoom) {
        oldRoom.current_occupancy = Math.max(0, (oldRoom.current_occupancy || 1) - 1);
        oldRoom.status = oldRoom.current_occupancy === 0 ? 'AVAILABLE' : 'PARTIALLY_OCCUPIED';
        if (isPostgresConnected()) {
          try {
            await query('UPDATE rooms SET current_occupancy = $1, status = $2 WHERE id = $3', [oldRoom.current_occupancy, oldRoom.status, oldRoom.id]);
            await query('UPDATE room_allocations SET status = $1, vacating_date = $2 WHERE id = $3', ['VACATED', prior.vacating_date, prior.id]);
          } catch (e) {}
        }
      }
    }

    // Allocate to Best Room
    bestRoom.current_occupancy = (parseInt(bestRoom.current_occupancy || 0, 10)) + 1;
    bestRoom.status = bestRoom.current_occupancy >= bestRoom.capacity ? 'FULL' : 'PARTIALLY_OCCUPIED';

    let allocation = null;
    const allocDate = new Date().toISOString().split('T')[0];
    const wardenId = req.user && req.user.profileId ? req.user.profileId : null;

    if (isPostgresConnected()) {
      try {
        const alcInsert = await query(
          `INSERT INTO room_allocations (student_id, room_id, allocated_by_warden_id, allocation_date, status)
           VALUES ($1, $2, $3, $4, 'ACTIVE') RETURNING *`,
          [student.id, bestRoom.id, wardenId, allocDate]
        );
        allocation = alcInsert.rows[0];

        await query('UPDATE rooms SET current_occupancy = $1, status = $2 WHERE id = $3', [bestRoom.current_occupancy, bestRoom.status, bestRoom.id]);
        await query('UPDATE room_requests SET status = $1, allocated_room_id = $2 WHERE id = $3', ['APPROVED', bestRoom.id, reqItem.id]);
      } catch (dbErr) {
        console.error('[DB autoAllocate Error]', dbErr.message);
      }
    }

    if (!allocation) {
      allocation = {
        id: Date.now(),
        student_id: student.id,
        room_id: bestRoom.id,
        allocated_by_warden_id: wardenId,
        allocation_date: allocDate,
        status: 'ACTIVE'
      };
    }

    reqItem.status = 'APPROVED';
    reqItem.allocated_room_id = bestRoom.id;
    store.room_allocations.push(allocation);

    // Notify Student
    const user = store.users.find(u => String(u.id) === String(student.user_id));
    if (user) {
      const notifMsg = `Congratulations! You have been allocated Room ${bestRoom.room_number} in ${bestRoom.block}.`;
      if (isPostgresConnected()) {
        try {
          await query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES ($1, 'Room Allocated!', $2, 'SUCCESS', false)`,
            [user.id, notifMsg]
          );
        } catch (e) {}
      }
      store.notifications.push({
        id: Date.now() + 5,
        user_id: user.id,
        title: 'Room Allocated!',
        message: notifMsg,
        type: 'SUCCESS',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    saveMemoryStore();

    const warden = req.user && req.user.profileId ? store.wardens.find(w => String(w.id) === String(req.user.profileId)) : null;
    const wardenName = warden ? warden.name : 'Hostel Warden';

    const ai_steps = [
      {
        step: 1,
        title: 'Fee Receipt Verification Audit',
        status: 'VERIFIED',
        details: `Hostel fee receipt verified by Warden (${wardenName}). Financial clearance confirmed.`,
        agent_verdict: 'PASSED: Fee receipt verified by Warden.'
      },
      {
        step: 2,
        title: `Room Sharing & Capacity Discovery (${reqItem.preferred_room_type || '2 Sharing'})`,
        status: 'COMPLETED',
        details: `Checked sharing preference: ${reqItem.preferred_room_type || '2 Sharing'}. Scanned ${availableRooms.length} available rooms in ${genderRestriction} Hostel. Identified Room ${bestRoom.room_number} (${bestRoom.block}, Floor ${bestRoom.floor}) with open bed capacity (${bestRoom.current_occupancy}/${bestRoom.capacity}).`,
        matched_room: bestRoom,
        sharing_type: reqItem.preferred_room_type || bestRoom.room_type,
        agent_verdict: `PASSED: Allocated to optimal ${bestRoom.room_type} room.`
      },
      {
        step: 3,
        title: 'Room Allocated Successfully',
        status: 'SUCCESS',
        details: `Student ${student.name} (${student.register_number}) officially allocated to Room ${bestRoom.room_number} (${bestRoom.block}, Floor ${bestRoom.floor}).`,
        room: bestRoom,
        agent_verdict: 'COMPLETED: Room allocated successfully.'
      }
    ];

    res.json({
      message: `Student ${student.name} successfully allocated to Room ${bestRoom.room_number} (${bestRoom.block})!`,
      allocation,
      room: bestRoom,
      ai_steps
    });
  } catch (err) {
    console.error('Auto allocation error:', err);
    res.status(500).json({ error: 'Auto allocation failed.' });
  }
};

// MANUAL ALLOCATION OVERRIDE (Warden/Admin)
const manualAllocate = async (req, res) => {
  try {
    const { student_id, room_id } = req.body;
    const store = getMemoryStore();

    const student = store.students.find(s => String(s.id) === String(student_id));
    const room = store.rooms.find(r => String(r.id) === String(room_id));

    if (!student || !room) {
      return res.status(404).json({ error: 'Student or Room not found.' });
    }

    // Enforce Warden Fee Verification before Manual Room Allocation
    const pendingReq = store.room_requests.find(
      r => String(r.student_id) === String(student.id) && r.status === 'PENDING'
    );
    if (pendingReq && !pendingReq.fee_verified && pendingReq.fee_status !== 'VERIFIED_BY_WARDEN') {
      return res.status(400).json({
        error: "Cannot allocate room: Student's fee receipt has not been verified by the Warden yet. Warden verification is mandatory before room allocation."
      });
    }

    if (parseInt(room.current_occupancy || 0, 10) >= parseInt(room.capacity, 10)) {
      return res.status(400).json({ error: `Selected Room ${room.room_number} is already full (Capacity: ${room.capacity})!` });
    }

    // Vacate any previous active allocation for this student
    const priorAllocs = store.room_allocations.filter(
      a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE'
    );
    for (const prior of priorAllocs) {
      prior.status = 'VACATED';
      prior.vacating_date = new Date().toISOString().split('T')[0];
      const oldRoom = store.rooms.find(r => String(r.id) === String(prior.room_id));
      if (oldRoom) {
        oldRoom.current_occupancy = Math.max(0, (oldRoom.current_occupancy || 1) - 1);
        oldRoom.status = oldRoom.current_occupancy === 0 ? 'AVAILABLE' : 'PARTIALLY_OCCUPIED';
        if (isPostgresConnected()) {
          try {
            await query('UPDATE rooms SET current_occupancy = $1, status = $2 WHERE id = $3', [oldRoom.current_occupancy, oldRoom.status, oldRoom.id]);
            await query('UPDATE room_allocations SET status = $1, vacating_date = $2 WHERE id = $3', ['VACATED', prior.vacating_date, prior.id]);
          } catch (e) {}
        }
      }
    }

    // Update target room occupancy
    room.current_occupancy = (parseInt(room.current_occupancy || 0, 10)) + 1;
    room.status = room.current_occupancy >= room.capacity ? 'FULL' : 'PARTIALLY_OCCUPIED';

    let allocation = null;
    const allocDate = new Date().toISOString().split('T')[0];
    const wardenId = req.user && req.user.profileId ? req.user.profileId : null;

    if (isPostgresConnected()) {
      try {
        const alcInsert = await query(
          `INSERT INTO room_allocations (student_id, room_id, allocated_by_warden_id, allocation_date, status)
           VALUES ($1, $2, $3, $4, 'ACTIVE') RETURNING *`,
          [student.id, room.id, wardenId, allocDate]
        );
        allocation = alcInsert.rows[0];

        await query('UPDATE rooms SET current_occupancy = $1, status = $2 WHERE id = $3', [room.current_occupancy, room.status, room.id]);
        
        // If student has a pending request, mark it approved
        await query(
          'UPDATE room_requests SET status = $1, allocated_room_id = $2 WHERE student_id = $3 AND status = $4',
          ['APPROVED', room.id, student.id, 'PENDING']
        );
      } catch (dbErr) {
        console.error('[DB manualAllocate Error]', dbErr.message);
      }
    }

    if (!allocation) {
      allocation = {
        id: Date.now(),
        student_id: student.id,
        room_id: room.id,
        allocated_by_warden_id: wardenId,
        allocation_date: allocDate,
        status: 'ACTIVE'
      };
    }

    store.room_allocations.push(allocation);

    // Update any pending request in memory store
    const studentPending = store.room_requests.find(
      r => String(r.student_id) === String(student.id) && r.status === 'PENDING'
    );
    if (studentPending) {
      studentPending.status = 'APPROVED';
      studentPending.allocated_room_id = room.id;
    }

    // Send notification
    const user = store.users.find(u => String(u.id) === String(student.user_id));
    if (user) {
      const notifMsg = `You have been allocated Room ${room.room_number} in ${room.block}.`;
      if (isPostgresConnected()) {
        try {
          await query(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES ($1, 'Room Allocated', $2, 'SUCCESS', false)`,
            [user.id, notifMsg]
          );
        } catch (e) {}
      }
      store.notifications.push({
        id: Date.now() + 6,
        user_id: user.id,
        title: 'Room Allocated',
        message: notifMsg,
        type: 'SUCCESS',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    saveMemoryStore();

    res.json({
      message: `Student ${student.name} successfully assigned to Room ${room.room_number}!`,
      allocation,
      room
    });
  } catch (err) {
    console.error('Manual allocate error:', err);
    res.status(500).json({ error: 'Manual allocation failed.' });
  }
};

// VACATE ROOM (Warden/Admin)
const vacateRoom = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const store = getMemoryStore();

    const allocation = store.room_allocations.find(a => String(a.id) === String(allocationId));
    if (!allocation || allocation.status === 'VACATED') {
      return res.status(400).json({ error: 'Invalid or already vacated room allocation.' });
    }

    allocation.status = 'VACATED';
    allocation.vacating_date = new Date().toISOString().split('T')[0];

    const room = store.rooms.find(r => String(r.id) === String(allocation.room_id));
    if (room) {
      room.current_occupancy = Math.max(0, (parseInt(room.current_occupancy || 1, 10)) - 1);
      room.status = room.current_occupancy === 0 ? 'AVAILABLE' : 'PARTIALLY_OCCUPIED';

      if (isPostgresConnected()) {
        try {
          await query('UPDATE room_allocations SET status = $1, vacating_date = $2 WHERE id = $3', ['VACATED', allocation.vacating_date, allocation.id]);
          await query('UPDATE rooms SET current_occupancy = $1, status = $2 WHERE id = $3', [room.current_occupancy, room.status, room.id]);
        } catch (dbErr) {
          console.error('[DB vacateRoom Error]', dbErr.message);
        }
      }
    }

    // Send notification to student
    const student = store.students.find(s => String(s.id) === String(allocation.student_id));
    if (student) {
      const user = store.users.find(u => String(u.id) === String(student.user_id));
      if (user) {
        const notifMsg = `Your room allocation for Room ${room ? room.room_number : ''} has been vacated.`;
        if (isPostgresConnected()) {
          try {
            await query(
              `INSERT INTO notifications (user_id, title, message, type, is_read)
               VALUES ($1, 'Room Vacated', $2, 'INFO', false)`,
              [user.id, notifMsg]
            );
          } catch (e) {}
        }
        store.notifications.push({
          id: Date.now() + 7,
          user_id: user.id,
          title: 'Room Vacated',
          message: notifMsg,
          type: 'INFO',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    saveMemoryStore();
    res.json({ message: `Room ${room ? room.room_number : ''} vacated successfully!`, room });
  } catch (err) {
    console.error('Vacate room error:', err);
    res.status(500).json({ error: 'Failed to vacate room.' });
  }
};

// DOWNLOAD ALLOCATION CONFIRMATION PDF
const downloadAllocationPDF = (req, res) => {
  try {
    const store = getMemoryStore();
    const student = store.students.find(
      s => String(s.user_id) === String(req.user.id) || String(s.id) === String(req.query.studentId || 0)
    );

    if (!student) return res.status(404).json({ error: 'Student record not found.' });

    const allocation = store.room_allocations.find(
      a => String(a.student_id) === String(student.id) && a.status === 'ACTIVE'
    );
    if (!allocation) return res.status(404).json({ error: 'No active room allocation found for this student.' });

    const room = store.rooms.find(r => String(r.id) === String(allocation.room_id));
    if (!room) return res.status(404).json({ error: 'Room details not found.' });

    generateAllocationPDF(allocation, student, room, res);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'Failed to generate allocation PDF.' });
  }
};

// VERIFY ROOM REQUEST FEE RECEIPT (Warden)
const verifyRequestFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action, remarks } = req.body;
    const store = getMemoryStore();

    const reqItem = store.room_requests.find(r => String(r.id) === String(id));
    if (!reqItem) return res.status(404).json({ error: 'Room request not found.' });

    const student = store.students.find(s => String(s.id) === String(reqItem.student_id));
    const warden = req.user && req.user.profileId ? store.wardens.find(w => String(w.id) === String(req.user.profileId)) : null;
    const wardenName = warden ? warden.name : 'Hostel Warden';

    const checkStatus = status || action || 'VERIFIED';
    const isVerified = String(checkStatus).toUpperCase().includes('VERIF');
    reqItem.fee_verified = isVerified;
    reqItem.fee_status = isVerified ? 'VERIFIED_BY_WARDEN' : 'REJECTED_BY_WARDEN';
    reqItem.fee_verified_by_warden_id = req.user ? req.user.profileId : 1;
    reqItem.fee_verified_at = new Date().toISOString();
    reqItem.fee_remarks = remarks || (isVerified ? 'Fee receipt verified by warden.' : 'Fee receipt rejected.');

    // Also update any matching payment in store.payments
    const payment = store.payments.find(p => String(p.student_id) === String(reqItem.student_id) && p.status === 'PENDING');
    if (payment) {
      payment.status = isVerified ? 'VERIFIED' : 'REJECTED';
      payment.verified_by_warden_id = req.user ? req.user.profileId : 1;
    }

    if (isPostgresConnected()) {
      try {
        await query(
          'UPDATE room_requests SET fee_receipt_url = COALESCE(fee_receipt_url, $1) WHERE id = $2',
          [reqItem.fee_receipt_url, reqItem.id]
        );
      } catch (e) {}
    }

    // 🔔 DISPATCH MESSAGE TO ADMIN MODULE ("message will be given to the admin module as that it verified by the warden then only the room should be allocated")
    if (isVerified) {
      const adminNotice = `Fee Receipt Verified by Warden (${wardenName}): Student ${student ? student.name : 'Student'} (${student ? student.register_number : 'ID'}) fee payment is verified. Room allocation is now authorized for ${reqItem.preferred_block}.`;
      
      store.notifications.push({
        id: Date.now() + 1,
        user_id: 1, // Admin User ID
        role_target: 'ADMIN',
        title: 'Room Allocation Authorized: Fee Verified by Warden',
        message: adminNotice,
        type: 'SUCCESS',
        student_id: reqItem.student_id,
        room_request_id: reqItem.id,
        is_read: false,
        created_at: new Date().toISOString()
      });

      // Also notify student
      if (student && student.user_id) {
        store.notifications.push({
          id: Date.now() + 2,
          user_id: student.user_id,
          title: 'Fee Receipt Verified by Warden',
          message: 'Your hostel fee receipt has been verified by the Warden! Your room allocation is now authorized and ready for assignment.',
          type: 'SUCCESS',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } else {
      if (student && student.user_id) {
        store.notifications.push({
          id: Date.now() + 3,
          user_id: student.user_id,
          title: 'Fee Receipt Rejected',
          message: `Your hostel fee receipt was rejected by the Warden. Remarks: ${remarks || 'Please re-upload a clear transaction receipt.'}`,
          type: 'WARNING',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    saveMemoryStore();

    res.json({
      message: isVerified
        ? 'Fee receipt verified successfully! Admin has been notified that room allocation is now authorized.'
        : 'Fee receipt has been rejected.',
      request: reqItem
    });
  } catch (err) {
    console.error('Verify request fee error:', err);
    res.status(500).json({ error: 'Failed to verify fee receipt.' });
  }
};

module.exports = {
  getMyAllocation,
  submitRequest,
  getRequests,
  getAllocations,
  autoAllocate,
  manualAllocate,
  vacateRoom,
  downloadAllocationPDF,
  verifyRequestFee
};
