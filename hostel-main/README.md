# Hostel Room Allocation and Management System

A production-style, modern, responsive **Hostel Room Allocation and Management System** built with **React, Vite, Tailwind CSS, Node.js, Express.js, and PostgreSQL**.

---

## 🚀 Deploying to Vercel

This repository is pre-configured with a root `vercel.json` for 1-click deployment on **Vercel**.

### Option 1: Deploy via Vercel Dashboard & GitHub (Recommended)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Hostel Management System ready for Vercel"
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository.
3. Vercel will automatically detect `vercel.json` and build both the Express API and Vite React frontend.
4. Click **Deploy**!

### Option 2: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 🌟 Key Features

### 🏢 1. Landing & Authentication
- **College Landing Page**: Professional college hostel website with facilities, about section, contact info, and login portals.
- **Role-Based Access Control**: Separate secure portals for **Students**, **Wardens**, and **Admins**.
- **Warden & Student Registration**: Separate registration workflows with employee IDs, block assignments, & student roll numbers.
- **JWT & Password Hashing**: Passwords encrypted using `bcrypt`. JWT tokens for API protection.
- **Email Verification**: Email OTP verification and password reset flows with Nodemailer.

### 🛏️ 2. Smart Room Allocation Engine
- **Automated Matching**: Matches student preferences (Block, Floor, Room Type, AC/Non-AC, Attached/Common Bathroom) against room capacity & gender rules.
- **Capacity Integrity**: Automatically sets room status to `FULL`, `PARTIALLY_OCCUPIED`, `AVAILABLE`, or `MAINTENANCE`.
- **Warden Override**: Wardens can manually allocate or change room assignments.
- **Allocation PDF**: Generates downloadable official **Room Allocation Confirmation PDFs**.

### 🎫 3. Digital Outpass & QR Code Verification
- **Digital Outing Letters**: Students write digital leave/outing letters to warden.
- **Auto Outpass Generation**: Warden approval automatically generates an official **PDF Outpass**.
- **QR Code Verification**: Embedded QR code on outpasses for live security gate verification (`/qr-verify?code=...`).
- **Overdue Tracking**: Warden dashboard monitors outside students and flags overdue returns.
- **Parent Notifications**: Automatic email notification sent to registered parent/guardian upon outpass approval.

### 🛠️ 4. Maintenance & Priority Complaints Queue
- **Category & Photo Upload**: Students submit maintenance issues (Fan, Light, Plumbing, Wi-Fi, Food) with issue photos.
- **Priority Queue**: `LOW`, `MEDIUM`, `HIGH`, and `EMERGENCY` priorities. Emergency complaints flash at top of warden dashboard.
- **Rectification Proof**: Wardens update status (`PENDING`, `IN_PROGRESS`, `RECTIFIED`) and upload repair photos.

### 📋 5. Attendance & Fee Management
- **Night Roll Call**: Wardens mark daily block-wise attendance (`PRESENT`, `ABSENT`, `LEAVE`, `OUTPASS`).
- **Low Attendance Warning**: Automatic warning notification triggered if student attendance drops below 75%.
- **Fee Receipt Upload & PDF**: Students upload payment receipts; wardens verify and issue official downloadable fee receipt PDFs.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Student (Male)** | `alex.johnson@student.edu` | `Student@123` | Student Dashboard, Room Request, Outpass, Complaints, Fee |
| **Student (Female)** | `sophia.williams@student.edu` | `Student@123` | Student Dashboard, Block B Room Details, Outpasses |
| **Warden (Boys)** | `warden.boys@hostel.edu` | `Warden@123` | Warden Dashboard, Room CRUD, Smart Allocations, Complaints |
| **Warden (Girls)** | `warden.girls@hostel.edu` | `Warden@123` | Block B Warden Operations, Outpass Approvals |
| **System Admin** | `admin@hostel.edu` | `Admin@123` | Master Control, All Wardens & Students, System Reports |

---

## 📁 Project Structure

```text
hostel-room-allocation/
├── vercel.json              # Vercel serverless & static routing rules
├── package.json             # Root Vercel build script
├── database/
│   ├── schema.sql           # PostgreSQL DDL table definitions & triggers
│   └── seed.sql             # Demo seed data (Students, Wardens, Rooms, Allocations)
│
├── backend/
│   ├── config/              # Database pool & persistent store manager
│   ├── controllers/         # Auth, Room, Allocation, Attendance, Complaint, Outpass controllers
│   ├── middleware/          # JWT auth & Multer upload middlewares
│   ├── routes/              # Express REST API endpoints
│   ├── utils/               # PDFKit generator & Nodemailer email services
│   ├── server.js            # Express server & Vercel serverless export
│   └── .env                 # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, StatCard, Badge
│   │   ├── context/         # AuthContext & NotificationContext
│   │   ├── layouts/         # MainLayout (Sidebar + Navbar)
│   │   ├── pages/           # Landing, Login, Register, Dashboards, Outpass, Reports
│   │   ├── App.jsx          # React Router hierarchy
│   │   └── index.css        # Tailwind CSS design system
│   └── vite.config.js       # Vite configuration
│
└── README.md
```
