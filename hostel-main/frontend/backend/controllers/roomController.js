const { getMemoryStore, saveMemoryStore, query, isPostgresConnected } = require('../config/db');

// GET ALL ROOMS (With Search & Filters)
const getRooms = (req, res) => {
  const store = getMemoryStore();
  let rooms = [...store.rooms];

  const { block, status, roomType, gender, search } = req.query;

  if (block) rooms = rooms.filter(r => r.block && r.block.toLowerCase().includes(block.toLowerCase()));
  if (status) rooms = rooms.filter(r => r.status === status);
  if (roomType) rooms = rooms.filter(r => r.room_type === roomType);
  if (gender) rooms = rooms.filter(r => r.gender_restriction === gender);
  if (search) {
    const q = search.toLowerCase();
    rooms = rooms.filter(r => (r.room_number && r.room_number.toLowerCase().includes(q)) || (r.block && r.block.toLowerCase().includes(q)));
  }

  // Populate occupant student details
  rooms = rooms.map(room => {
    const activeAllocations = store.room_allocations.filter(a => String(a.room_id) === String(room.id) && a.status === 'ACTIVE');
    const occupants = activeAllocations.map(a => {
      const s = store.students.find(st => String(st.id) === String(a.student_id));
      return s ? { id: s.id, name: s.name, register_number: s.register_number, department: s.department } : null;
    }).filter(Boolean);

    return { ...room, occupants };
  });

  res.json(rooms);
};

// ADD NEW ROOM (Warden/Admin)
const createRoom = async (req, res) => {
  try {
    const { room_number, block, floor, room_type, bathroom_type, ac_type, capacity, gender_restriction } = req.body;

    if (!room_number || !block || !floor || !room_type) {
      return res.status(400).json({ error: 'Room number, block, floor, and room type are required.' });
    }

    const store = getMemoryStore();
    const existing = store.rooms.find(r => r.room_number.toUpperCase() === room_number.toUpperCase());
    if (existing) {
      return res.status(400).json({ error: 'Room number already exists.' });
    }

    let newRoom = null;

    if (isPostgresConnected()) {
      try {
        const rRes = await query(
          `INSERT INTO rooms (room_number, block, floor, room_type, bathroom_type, ac_type, capacity, current_occupancy, gender_restriction, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'AVAILABLE')
           RETURNING *`,
          [
            room_number.trim(),
            block.trim(),
            parseInt(floor, 10),
            room_type,
            bathroom_type || 'Attached',
            ac_type || 'Non-AC',
            parseInt(capacity || 2, 10),
            gender_restriction || 'BOYS'
          ]
        );
        newRoom = rRes.rows[0];
      } catch (dbErr) {
        console.error('[DB createRoom Error]', dbErr.message);
      }
    }

    if (!newRoom) {
      newRoom = {
        id: Date.now(),
        room_number: room_number.trim(),
        block: block.trim(),
        floor: parseInt(floor, 10),
        room_type,
        bathroom_type: bathroom_type || 'Attached',
        ac_type: ac_type || 'Non-AC',
        capacity: parseInt(capacity || 2, 10),
        current_occupancy: 0,
        gender_restriction: gender_restriction || 'BOYS',
        status: 'AVAILABLE'
      };
    }

    store.rooms.push(newRoom);
    saveMemoryStore();

    res.status(201).json({ message: 'Room created successfully!', room: newRoom });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room.' });
  }
};

// UPDATE ROOM DETAILS
const updateRoom = async (req, res) => {
  const { id } = req.params;
  const store = getMemoryStore();
  const room = store.rooms.find(r => String(r.id) === String(id));

  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const fields = ['block', 'floor', 'room_type', 'bathroom_type', 'ac_type', 'capacity', 'gender_restriction', 'status'];
  fields.forEach(field => {
    if (req.body[field] !== undefined) room[field] = req.body[field];
  });

  if (isPostgresConnected()) {
    try {
      await query(
        `UPDATE rooms SET block = $1, floor = $2, room_type = $3, bathroom_type = $4,
         ac_type = $5, capacity = $6, gender_restriction = $7, status = $8 WHERE id = $9`,
        [room.block, room.floor, room.room_type, room.bathroom_type, room.ac_type, room.capacity, room.gender_restriction, room.status, room.id]
      );
    } catch (dbErr) {
      console.error('[DB updateRoom Error]', dbErr.message);
    }
  }

  saveMemoryStore();
  res.json({ message: 'Room updated successfully!', room });
};

// DELETE ROOM
const deleteRoom = async (req, res) => {
  const { id } = req.params;
  const store = getMemoryStore();
  const roomIndex = store.rooms.findIndex(r => String(r.id) === String(id));

  if (roomIndex === -1) return res.status(404).json({ error: 'Room not found.' });

  const room = store.rooms[roomIndex];
  if (room.current_occupancy > 0) {
    return res.status(400).json({ error: 'Cannot delete room with active occupants. Vacate room first.' });
  }

  if (isPostgresConnected()) {
    try {
      await query('DELETE FROM rooms WHERE id = $1', [room.id]);
    } catch (dbErr) {
      console.error('[DB deleteRoom Error]', dbErr.message);
    }
  }

  store.rooms.splice(roomIndex, 1);
  saveMemoryStore();

  res.json({ message: 'Room deleted successfully.' });
};

module.exports = {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom
};
