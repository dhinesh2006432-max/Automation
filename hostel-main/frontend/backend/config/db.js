const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

// High-Performance PostgreSQL / Supabase Pool configuration
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'postgres',
  ssl: (process.env.PG_SSL === 'true' || (process.env.PG_HOST && process.env.PG_HOST.includes('supabase')))
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

let isPostgresConnected = false;

// Fallback In-Memory / File-Persisted Database Store
const fallbackStorePath = process.env.VERCEL
  ? path.join('/tmp', 'data_store.json')
  : path.join(__dirname, '../data_store.json');

let memoryStore = {
  users: [
    { id: 1, email: 'admin@hostel.edu', password_hash: '$2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6', role: 'ADMIN', is_verified: true }
  ],
  students: [],
  wardens: [],
  rooms: [
    { id: 1, room_number: 'A-101', block: 'Block A', floor: 1, room_type: '2 Sharing', bathroom_type: 'Attached', ac_type: 'AC', capacity: 2, current_occupancy: 0, gender_restriction: 'BOYS', status: 'AVAILABLE' },
    { id: 2, room_number: 'A-102', block: 'Block A', floor: 1, room_type: '3 Sharing', bathroom_type: 'Attached', ac_type: 'Non-AC', capacity: 3, current_occupancy: 0, gender_restriction: 'BOYS', status: 'AVAILABLE' },
    { id: 3, room_number: 'A-201', block: 'Block A', floor: 2, room_type: '2 Sharing', bathroom_type: 'Attached', ac_type: 'AC', capacity: 2, current_occupancy: 0, gender_restriction: 'BOYS', status: 'AVAILABLE' },
    { id: 4, room_number: 'A-202', block: 'Block A', floor: 2, room_type: '3 Sharing', bathroom_type: 'Common', ac_type: 'Non-AC', capacity: 3, current_occupancy: 0, gender_restriction: 'BOYS', status: 'MAINTENANCE' },
    { id: 5, room_number: 'B-101', block: 'Block B', floor: 1, room_type: '2 Sharing', bathroom_type: 'Attached', ac_type: 'AC', capacity: 2, current_occupancy: 0, gender_restriction: 'GIRLS', status: 'AVAILABLE' },
    { id: 6, room_number: 'B-102', block: 'Block B', floor: 1, room_type: '3 Sharing', bathroom_type: 'Common', ac_type: 'Non-AC', capacity: 3, current_occupancy: 0, gender_restriction: 'GIRLS', status: 'AVAILABLE' },
    { id: 7, room_number: 'B-201', block: 'Block B', floor: 2, room_type: '2 Sharing', bathroom_type: 'Attached', ac_type: 'AC', capacity: 2, current_occupancy: 0, gender_restriction: 'GIRLS', status: 'AVAILABLE' }
  ],
  room_requests: [],
  room_allocations: [],
  attendance: [],
  complaints: [],
  announcements: [],
  letters: [],
  outpasses: [],
  notifications: [],
  payments: [],
  leave_requests: [],
  room_change_requests: [],
  mess_feedback: [],
  hostel_feedback: [],
  lost_found: []
};

// Load saved local data if available
if (fs.existsSync(fallbackStorePath)) {
  try {
    const rawData = fs.readFileSync(fallbackStorePath, 'utf8');
    const parsed = JSON.parse(rawData);
    const demoEmails = ['alex.johnson@student.edu', 'sophia.williams@student.edu', 'david.kumar@student.edu', 'warden.boys@hostel.edu', 'warden.girls@hostel.edu'];
    if (parsed.users) {
      parsed.users = parsed.users.filter(u => !demoEmails.includes(u.email));
    }
    if (parsed.students) {
      parsed.students = parsed.students.filter(s => !['Alex Johnson', 'Sophia Williams', 'David Kumar'].includes(s.name));
    }
    if (parsed.wardens) {
      parsed.wardens = parsed.wardens.filter(w => !['Dr. Robert Vance', 'Prof. Sarah Jenkins'].includes(w.name));
    }
    memoryStore = { ...memoryStore, ...parsed };
  } catch (err) {
    console.log('[Store] Initialized clean default state.');
  }
}

const saveStore = () => {
  try {
    fs.writeFileSync(fallbackStorePath, JSON.stringify(memoryStore, null, 2));
  } catch (err) {
    console.error('[Store Error] Failed saving memory state:', err);
  }
};

// Ultra-fast Single-Roundtrip Full Database Sync
const syncFromDatabase = async () => {
  if (!isPostgresConnected) return;
  try {
    const singleQuery = `
      SELECT json_build_object(
        'users', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM users ORDER BY id) t),
        'students', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM students ORDER BY id) t),
        'wardens', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM wardens ORDER BY id) t),
        'rooms', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM rooms ORDER BY id) t),
        'room_requests', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM room_requests ORDER BY id) t),
        'room_allocations', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM room_allocations ORDER BY id) t),
        'attendance', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM attendance ORDER BY id) t),
        'complaints', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM complaints ORDER BY id) t),
        'announcements', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM announcements ORDER BY id) t),
        'letters', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM letters ORDER BY id) t),
        'outpasses', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM outpasses ORDER BY id) t),
        'notifications', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM notifications ORDER BY id) t),
        'payments', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM payments ORDER BY id) t),
        'leave_requests', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM leave_requests ORDER BY id) t),
        'room_change_requests', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM room_change_requests ORDER BY id) t),
        'mess_feedback', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM mess_feedback ORDER BY id) t),
        'hostel_feedback', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM hostel_feedback ORDER BY id) t),
        'lost_found', (SELECT coalesce(json_agg(t), '[]') FROM (SELECT * FROM lost_found ORDER BY id) t)
      ) AS full_data;
    `;
    const res = await pool.query(singleQuery);
    if (res.rows && res.rows[0] && res.rows[0].full_data) {
      const full = res.rows[0].full_data;
      Object.keys(full).forEach(key => {
        if (Array.isArray(full[key])) {
          memoryStore[key] = full[key];
        }
      });
      saveStore();
      console.log(`[Database] Ultra-fast live sync completed (${memoryStore.users.length} users, ${memoryStore.students.length} students, ${memoryStore.rooms.length} rooms).`);
    }
  } catch (err) {
    console.error('[Database] Failed to sync data from Supabase:', err.message);
  }
};

// Test PG Connection asynchronously if configured
if (process.env.PG_HOST) {
  pool.connect((err, client, release) => {
    if (err) {
      console.log('[Database] PostgreSQL connection notice:', err.message);
      isPostgresConnected = false;
    } else {
      console.log('[Database] High-speed connection active to:', process.env.PG_HOST);
      isPostgresConnected = true;
      release();
      syncFromDatabase();
    }
  });
}

// Resilient Query Handler
const query = async (text, params = []) => {
  if (process.env.PG_HOST) {
    try {
      const res = await pool.query(text, params);
      isPostgresConnected = true;
      return res;
    } catch (err) {
      console.error('[PG Query Error]', err.message, 'Query:', text);
      throw err;
    }
  }
  return { rows: [] };
};

module.exports = {
  pool,
  query,
  syncFromDatabase,
  isPostgresConnected: () => isPostgresConnected || !!process.env.PG_HOST,
  getMemoryStore: () => memoryStore,
  saveMemoryStore: saveStore
};
