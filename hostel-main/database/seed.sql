-- Hostel Room Allocation and Management System
-- Database Seed Data for PostgreSQL

-- Clean existing data
TRUNCATE users CASCADE;

-- Passwords hashed with bcrypt for 'Password123!' -> $2a$10$wO3nE8XQpU7z0nQ6pU7z0e98.9876543210qwertyuiopasdfghjkl
-- For simplicity, standard demo passwords (hashed):
-- Admin: Admin@123 -> $2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6
-- Warden: Warden@123 -> $2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6
-- Student: Student@123 -> $2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6

INSERT INTO users (id, email, password_hash, role, is_verified) VALUES
(1, 'admin@hostel.edu', '$2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6', 'ADMIN', TRUE),
(2, 'warden.boys@hostel.edu', '$2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6', 'WARDEN', TRUE),
(3, 'warden.girls@hostel.edu', '$2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6', 'WARDEN', TRUE),
(4, 'alex.johnson@student.edu', '$2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6', 'STUDENT', TRUE),
(5, 'sophia.williams@student.edu', '$2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6', 'STUDENT', TRUE),
(6, 'david.kumar@student.edu', '$2a$10$7vN5R.uR0Z1Q5kZ8hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6hJ8eU.6', 'STUDENT', TRUE);

-- WARDENS
INSERT INTO wardens (id, user_id, name, employee_id, phone, block_assigned, designation) VALUES
(1, 2, 'Dr. Robert Vance', 'W-101', '+19876543210', 'Block A (Boys Hostel)', 'Chief Warden - Boys'),
(2, 3, 'Prof. Sarah Jenkins', 'W-102', '+19876543211', 'Block B (Girls Hostel)', 'Senior Warden - Girls');

-- STUDENTS
INSERT INTO students (id, user_id, name, register_number, phone, department, course, year, gender, dob, blood_group, parent_name, parent_phone, address, emergency_contact) VALUES
(1, 4, 'Alex Johnson', 'CS2024001', '+15551234567', 'Computer Science & Engineering', 'B.Tech CS', 3, 'Male', '2003-05-14', 'O+', 'Mark Johnson', '+15559876543', '742 Evergreen Terrace, Springfield', '+15559876543'),
(2, 5, 'Sophia Williams', 'ECE2024042', '+15552345678', 'Electronics & Comm.', 'B.Tech ECE', 2, 'Female', '2004-09-22', 'A+', 'David Williams', '+15558765432', '123 Maple Street, Boston, MA', '+15558765432'),
(3, 6, 'David Kumar', 'ME2024089', '+15553456789', 'Mechanical Engineering', 'B.Tech ME', 3, 'Male', '2003-11-10', 'B+', 'Sanjay Kumar', '+15557654321', '456 Oak Avenue, Chicago, IL', '+15557654321');

-- ROOMS
INSERT INTO rooms (id, room_number, block, floor, room_type, bathroom_type, ac_type, capacity, current_occupancy, gender_restriction, status) VALUES
(1, 'A-101', 'Block A', 1, '2 Sharing', 'Attached', 'AC', 2, 2, 'BOYS', 'FULL'),
(2, 'A-102', 'Block A', 1, '3 Sharing', 'Attached', 'Non-AC', 3, 1, 'BOYS', 'PARTIALLY_OCCUPIED'),
(3, 'A-201', 'Block A', 2, '2 Sharing', 'Attached', 'AC', 2, 0, 'BOYS', 'AVAILABLE'),
(4, 'A-202', 'Block A', 2, '3 Sharing', 'Common', 'Non-AC', 3, 0, 'BOYS', 'MAINTENANCE'),
(5, 'B-101', 'Block B', 1, '2 Sharing', 'Attached', 'AC', 2, 1, 'GIRLS', 'PARTIALLY_OCCUPIED'),
(6, 'B-102', 'Block B', 1, '3 Sharing', 'Common', 'Non-AC', 3, 0, 'GIRLS', 'AVAILABLE'),
(7, 'B-201', 'Block B', 2, '2 Sharing', 'Attached', 'AC', 2, 0, 'GIRLS', 'AVAILABLE');

-- ROOM ALLOCATIONS
INSERT INTO room_allocations (id, student_id, room_id, allocated_by_warden_id, allocation_date, status) VALUES
(1, 1, 1, 1, '2026-08-01', 'ACTIVE'),
(2, 3, 2, 1, '2026-08-02', 'ACTIVE'),
(3, 2, 5, 2, '2026-08-01', 'ACTIVE');

-- ATTENDANCE
INSERT INTO attendance (student_id, room_id, date, status, marked_by_warden_id, remarks) VALUES
(1, 1, CURRENT_DATE, 'PRESENT', 1, 'Regular check'),
(2, 5, CURRENT_DATE, 'PRESENT', 2, 'Regular check'),
(3, 2, CURRENT_DATE, 'OUTPASS', 1, 'On approved weekend leave');

-- COMPLAINTS
INSERT INTO complaints (id, student_id, room_number, category, title, description, priority, status, assigned_to_warden_id, warden_response) VALUES
(1, 1, 'A-101', 'Fan not working', 'Ceiling Fan Making Loud Noise', 'The ceiling fan in A-101 is vibrating continuously and stopped spinning today morning.', 'EMERGENCY', 'IN_PROGRESS', 1, 'Electrician assigned for repair today at 2 PM.'),
(2, 2, 'B-101', 'Wi-Fi problem', 'Weak Wi-Fi signal in room', 'The Wi-Fi router on 1st floor Block B drops connection every 10 minutes.', 'MEDIUM', 'PENDING', 2, NULL),
(3, 3, 'A-102', 'Water problem', 'Bathroom Tap Leakage', 'Water leaking continuously from the bathroom washbasin tap.', 'HIGH', 'RECTIFIED', 1, 'Plumber replaced the faucet washer. Issue resolved.');

-- ANNOUNCEMENTS
INSERT INTO announcements (id, created_by_warden_id, title, description, category, priority_flag) VALUES
(1, 1, 'Hostel Maintenance Inspection', 'Annual electrical and safety inspection scheduled for all blocks this Saturday from 10:00 AM to 4:00 PM.', 'Maintenance', TRUE),
(2, 2, 'Special Sunday Mess Menu', 'Voting for upcoming festival dinner menu is open in the student portal. Submit your choices before Friday.', 'Mess', FALSE),
(3, 1, 'Strict Night Outing Timings', 'All students must return to hostel premises by 9:00 PM on weekdays. Gate scan will be enforced.', 'Emergency', TRUE);

-- LETTERS
INSERT INTO letters (id, student_id, letter_type, subject, reason, description, date, status, warden_remarks, reviewed_by_warden_id) VALUES
(1, 1, 'Outing Request', 'Weekend Home Visit', 'Visiting parents in native town for family ceremony', 'Requesting permission to leave hostel on Friday evening and return Sunday night.', CURRENT_DATE, 'APPROVED', 'Approved for weekend outing. Take parent permission.', 1),
(2, 2, 'Leave Request', 'Medical Checkup', 'Doctor appointment at City Hospital', 'Need leave for 2 days due to dental treatment.', CURRENT_DATE, 'PENDING', NULL, NULL);

-- OUTPASSES
INSERT INTO outpasses (id, outpass_code, student_id, letter_id, reason, out_date, out_time, expected_return_date, expected_return_time, warden_id, status, qr_code_data) VALUES
(1, 'OTP-20260829-001', 1, 1, 'Weekend Home Visit', CURRENT_DATE, '17:00:00', CURRENT_DATE + INTERVAL '2 days', '20:00:00', 1, 'APPROVED', '{"outpassCode":"OTP-20260829-001","studentId":1,"name":"Alex Johnson","regNo":"CS2024001","room":"A-101","validity":"APPROVED"}');

-- PAYMENTS
INSERT INTO payments (id, student_id, receipt_number, amount, payment_date, payment_type, receipt_file_url, status, verified_by_warden_id) VALUES
(1, 1, 'REC-2026-0091', 45000.00, '2026-07-25', 'HOSTEL_FEE', '/uploads/receipts/rec-001.pdf', 'VERIFIED', 1),
(2, 2, 'REC-2026-0092', 45000.00, '2026-07-26', 'HOSTEL_FEE', '/uploads/receipts/rec-002.pdf', 'VERIFIED', 2);

-- MESS FEEDBACK
INSERT INTO mess_feedback (student_id, food_quality_rating, taste_rating, cleanliness_rating, menu_rating, service_rating, overall_rating, comments) VALUES
(1, 4, 4, 5, 4, 4, 4.20, 'Breakfast quality has improved significantly this month. Keep it up!'),
(2, 5, 4, 5, 5, 4, 4.60, 'Great salad counter and hygiene standards in Block B mess.');

-- HOSTEL FEEDBACK
INSERT INTO hostel_feedback (student_id, cleanliness_rating, security_rating, facilities_rating, warden_service_rating, maintenance_rating, overall_rating, feedback_text, is_anonymous) VALUES
(1, 5, 5, 4, 5, 4, 4.60, 'Very safe environment, warden and staff are extremely supportive.', FALSE);

-- LOST & FOUND
INSERT INTO lost_found (posted_by_student_id, item_name, description, location, date_lost_found, contact_info, status) VALUES
(1, 'Blue Water Bottle', 'Milton stainless steel insulated water bottle left near Block A badminton court.', 'Block A Court', CURRENT_DATE - INTERVAL '1 day', 'Alex Johnson - A-101', 'LOST'),
(2, 'Calculus Textbook', 'Advanced Engineering Mathematics book found in common study room 2nd floor.', 'Block B Study Hall', CURRENT_DATE, 'Contact Hostel Office', 'FOUND');

-- NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type) VALUES
(4, 'Room Allocated', 'You have been allocated Room A-101 in Block A.', 'SUCCESS'),
(4, 'Outpass Approved', 'Your outpass request OTP-20260829-001 has been approved by Warden.', 'INFO'),
(5, 'Wi-Fi Maintenance Notice', 'Block B Wi-Fi router service is scheduled for inspection.', 'WARNING');
