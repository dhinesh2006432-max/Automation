-- Hostel Room Allocation and Management System
-- Database Schema for PostgreSQL

-- Drop tables if exists (in reverse dependency order)
DROP TABLE IF EXISTS lost_found CASCADE;
DROP TABLE IF EXISTS hostel_feedback CASCADE;
DROP TABLE IF EXISTS mess_feedback CASCADE;
DROP TABLE IF EXISTS room_change_requests CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS outpasses CASCADE;
DROP TABLE IF EXISTS letters CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS room_allocations CASCADE;
DROP TABLE IF EXISTS room_requests CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS wardens CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'WARDEN', 'ADMIN')),
    is_verified BOOLEAN DEFAULT FALSE,
    otp VARCHAR(10),
    otp_expires_at TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENTS TABLE
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    register_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    department VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    year INT NOT NULL CHECK (year BETWEEN 1 AND 5),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    dob DATE NOT NULL,
    blood_group VARCHAR(10),
    parent_name VARCHAR(150) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    emergency_contact VARCHAR(20) NOT NULL,
    student_id_card_url TEXT,
    passport_photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. WARDENS TABLE
CREATE TABLE wardens (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    block_assigned VARCHAR(50) NOT NULL,
    designation VARCHAR(100) DEFAULT 'Hostel Warden',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ROOMS TABLE
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    block VARCHAR(50) NOT NULL,
    floor INT NOT NULL,
    room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('2 Sharing', '3 Sharing', 'Common Room')),
    bathroom_type VARCHAR(50) NOT NULL CHECK (bathroom_type IN ('Attached', 'Common')),
    ac_type VARCHAR(50) NOT NULL CHECK (ac_type IN ('AC', 'Non-AC')),
    capacity INT NOT NULL DEFAULT 2,
    current_occupancy INT NOT NULL DEFAULT 0,
    gender_restriction VARCHAR(10) NOT NULL CHECK (gender_restriction IN ('BOYS', 'GIRLS', 'ANY')),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULL', 'MAINTENANCE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ROOM REQUESTS TABLE
CREATE TABLE room_requests (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    preferred_block VARCHAR(50) NOT NULL,
    preferred_floor INT,
    preferred_room_type VARCHAR(50) NOT NULL,
    preferred_ac VARCHAR(50) NOT NULL,
    preferred_bathroom VARCHAR(50) NOT NULL,
    special_requirements TEXT,
    fee_receipt_url TEXT,
    admission_receipt_url TEXT,
    college_id_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    allocated_room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
    warden_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ROOM ALLOCATIONS TABLE
CREATE TABLE room_allocations (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    allocated_by_warden_id INT REFERENCES wardens(id) ON DELETE SET NULL,
    allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vacating_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VACATED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. ATTENDANCE TABLE
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LEAVE', 'OUTPASS')),
    marked_by_warden_id INT REFERENCES wardens(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- 8. COMPLAINTS TABLE
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RECTIFIED', 'REJECTED')),
    assigned_to_warden_id INT REFERENCES wardens(id) ON DELETE SET NULL,
    warden_response TEXT,
    rectification_photo_url TEXT,
    rectified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. ANNOUNCEMENTS TABLE
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    created_by_warden_id INT REFERENCES wardens(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General' CHECK (category IN ('General', 'Mess', 'Maintenance', 'Holiday', 'Meeting', 'Emergency', 'Important')),
    attachment_url TEXT,
    is_scheduled BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP,
    priority_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. LETTERS TO WARDEN TABLE
CREATE TABLE letters (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    letter_type VARCHAR(100) NOT NULL CHECK (letter_type IN ('Leave Request', 'Outing Request', 'Medical Leave', 'Family Emergency', 'Room Change Request', 'Hostel Permission', 'Other')),
    subject VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    supporting_doc_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    warden_remarks TEXT,
    reviewed_by_warden_id INT REFERENCES wardens(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. OUTPASSES TABLE
CREATE TABLE outpasses (
    id SERIAL PRIMARY KEY,
    outpass_code VARCHAR(50) UNIQUE NOT NULL,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    letter_id INT REFERENCES letters(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    out_date DATE NOT NULL,
    out_time TIME NOT NULL,
    expected_return_date DATE NOT NULL,
    expected_return_time TIME NOT NULL,
    actual_return_time TIMESTAMP,
    warden_id INT REFERENCES wardens(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'OUTSIDE', 'RETURNED', 'OVERDUE', 'EXPIRED')),
    qr_code_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. PAYMENTS & FEE RECEIPTS TABLE
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('HOSTEL_FEE', 'MESS_FEE', 'CAUTION_DEPOSIT', 'OTHER')),
    receipt_file_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verified_by_warden_id INT REFERENCES wardens(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. LEAVE REQUESTS TABLE
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    leave_type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    parent_contact VARCHAR(20) NOT NULL,
    supporting_doc_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    warden_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. ROOM CHANGE REQUESTS TABLE
CREATE TABLE room_change_requests (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    current_room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    requested_room_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    supporting_doc_url TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    assigned_room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
    warden_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. MESS FEEDBACK TABLE
CREATE TABLE mess_feedback (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    food_quality_rating INT CHECK (food_quality_rating BETWEEN 1 AND 5),
    taste_rating INT CHECK (taste_rating BETWEEN 1 AND 5),
    cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    menu_rating INT CHECK (menu_rating BETWEEN 1 AND 5),
    service_rating INT CHECK (service_rating BETWEEN 1 AND 5),
    overall_rating DECIMAL(3,2),
    comments TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. HOSTEL FEEDBACK TABLE
CREATE TABLE hostel_feedback (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5),
    security_rating INT CHECK (security_rating BETWEEN 1 AND 5),
    facilities_rating INT CHECK (facilities_rating BETWEEN 1 AND 5),
    warden_service_rating INT CHECK (warden_service_rating BETWEEN 1 AND 5),
    maintenance_rating INT CHECK (maintenance_rating BETWEEN 1 AND 5),
    overall_rating DECIMAL(3,2),
    feedback_text TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. LOST & FOUND TABLE
CREATE TABLE lost_found (
    id SERIAL PRIMARY KEY,
    posted_by_student_id INT REFERENCES students(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(150) NOT NULL,
    date_lost_found DATE NOT NULL DEFAULT CURRENT_DATE,
    photo_url TEXT,
    contact_info VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'LOST' CHECK (status IN ('LOST', 'FOUND', 'RETURNED', 'CLOSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR FREQUENT LOOKUPS
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_reg_no ON students(register_number);
CREATE INDEX idx_rooms_number ON rooms(room_number);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_outpasses_code ON outpasses(outpass_code);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_complaints_priority ON complaints(priority);
