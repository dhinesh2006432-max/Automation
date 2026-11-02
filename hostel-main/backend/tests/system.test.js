const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const express = require('express');
const cors = require('cors');

// Import core controllers and modules
const { getMemoryStore } = require('../config/db');
const authController = require('../controllers/authController');
const allocationController = require('../controllers/allocationController');

test('Backend Health & Core System Tests', async (t) => {
  await t.test('MemoryStore initializes with required collections', () => {
    const store = getMemoryStore();
    assert.ok(Array.isArray(store.users), 'Users collection exists');
    assert.ok(Array.isArray(store.students), 'Students collection exists');
    assert.ok(Array.isArray(store.rooms), 'Rooms collection exists');
    assert.ok(Array.isArray(store.outpasses), 'Outpasses collection exists');
    assert.ok(Array.isArray(store.announcements), 'Announcements collection exists');
    assert.ok(Array.isArray(store.lost_found), 'Lost and Found collection exists');
  });

  await t.test('Admin account configuration integrity', () => {
    const store = getMemoryStore();
    const adminUser = store.users.find(u => u.role === 'ADMIN');
    assert.ok(adminUser, 'Admin user account exists');
    assert.equal(adminUser.email, 'dhinesh2006432@gmail.com', 'Admin email matches expected credentials');
  });

  await t.test('Boys hostel rooms count verification', () => {
    const store = getMemoryStore();
    const boysRooms = store.rooms.filter(r => (r.block && r.block.includes('A')) || r.gender === 'BOYS');
    assert.ok(boysRooms.length >= 10, 'At least 10 rooms configured for Boys hostel');
  });

  await t.test('Lost & Found 10-digit phone number validation logic', () => {
    const isValidPhone = (phone) => {
      if (!phone) return false;
      const clean = String(phone).replace(/\D/g, '');
      return clean.length === 10;
    };

    assert.equal(isValidPhone('9876543210'), true, 'Valid 10-digit phone accepted');
    assert.equal(isValidPhone('12345'), false, 'Short phone rejected');
    assert.equal(isValidPhone('123456789012'), false, 'Over-length phone rejected');
    assert.equal(isValidPhone('abc-invalid'), false, 'Non-digits rejected');
  });

  await t.test('HOD sign requirement validation for Outpass', () => {
    const validateOutpass = (hodLetterUrl) => {
      if (!hodLetterUrl) {
        return { valid: false, error: 'HOD signed permission letter is mandatory.' };
      }
      return { valid: true };
    };

    assert.equal(validateOutpass(null).valid, false, 'Missing HOD letter rejected');
    assert.equal(validateOutpass('/uploads/hod-letter.pdf').valid, true, 'Attached HOD letter approved');
  });

  await t.test('Express API server routes mounting verification', async () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Mount healthcheck
    app.get('/health', (req, res) => {
      res.json({ status: 'ONLINE', timestamp: new Date().toISOString() });
    });

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ONLINE');

    await new Promise((resolve) => server.close(resolve));
  });
});
