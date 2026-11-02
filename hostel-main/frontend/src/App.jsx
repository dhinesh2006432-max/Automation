import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import QRVerificationPage from './pages/QRVerificationPage';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentProfilePage from './pages/StudentProfilePage';
import RoomRequestPage from './pages/RoomRequestPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentComplaintsPage from './pages/StudentComplaintsPage';
import StudentOutpassPage from './pages/StudentOutpassPage';
import StudentFeePage from './pages/StudentFeePage';
import MessFeedbackPage from './pages/MessFeedbackPage';
import LostFoundPage from './pages/LostFoundPage';
import EmergencyPage from './pages/EmergencyPage';

// Warden Pages
import WardenDashboard from './pages/WardenDashboard';
import WardenRoomManagement from './pages/WardenRoomManagement';
import WardenAllocationPage from './pages/WardenAllocationPage';
import WardenAttendancePage from './pages/WardenAttendancePage';
import WardenComplaintPage from './pages/WardenComplaintPage';
import WardenOutpassPage from './pages/WardenOutpassPage';
import WardenAnnouncementsPage from './pages/WardenAnnouncementsPage';
import WardenReportsPage from './pages/WardenReportsPage';
import WardenStudentsPage from './pages/WardenStudentsPage';
import WardenFeeVerificationPage from './pages/WardenFeeVerificationPage';

// Student Extra Pages
import StudentAnnouncementsPage from './pages/StudentAnnouncementsPage';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Authenticating...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/qr-verify" element={<QRVerificationPage />} />
            <Route path="/qr-verify/:code" element={<QRVerificationPage />} />

            {/* Authenticated Dashboard Routes */}
            <Route element={<MainLayout />}>
              {/* Student Routes */}
              <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentProfilePage /></ProtectedRoute>} />
              <Route path="/student/room-request" element={<ProtectedRoute allowedRoles={['STUDENT']}><RoomRequestPage /></ProtectedRoute>} />
              <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentAttendancePage /></ProtectedRoute>} />
              <Route path="/student/complaints" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentComplaintsPage /></ProtectedRoute>} />
              <Route path="/student/outpass" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentOutpassPage /></ProtectedRoute>} />
              <Route path="/student/fee" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentFeePage /></ProtectedRoute>} />
              <Route path="/student/feedback" element={<ProtectedRoute allowedRoles={['STUDENT']}><MessFeedbackPage /></ProtectedRoute>} />
              <Route path="/student/lost-found" element={<ProtectedRoute allowedRoles={['STUDENT']}><LostFoundPage /></ProtectedRoute>} />
              <Route path="/student/emergency" element={<ProtectedRoute allowedRoles={['STUDENT']}><EmergencyPage /></ProtectedRoute>} />
              <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentAnnouncementsPage /></ProtectedRoute>} />

              {/* Warden Routes */}
              <Route path="/warden/dashboard" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenDashboard /></ProtectedRoute>} />
              <Route path="/warden/rooms" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenRoomManagement /></ProtectedRoute>} />
              <Route path="/warden/allocations" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenAllocationPage /></ProtectedRoute>} />
              <Route path="/warden/attendance" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenAttendancePage /></ProtectedRoute>} />
              <Route path="/warden/complaints" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenComplaintPage /></ProtectedRoute>} />
              <Route path="/warden/outpasses" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenOutpassPage /></ProtectedRoute>} />
              <Route path="/warden/announcements" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenAnnouncementsPage /></ProtectedRoute>} />
              <Route path="/warden/reports" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenReportsPage /></ProtectedRoute>} />
              <Route path="/warden/students" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenStudentsPage /></ProtectedRoute>} />
              <Route path="/warden/fee-verification" element={<ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}><WardenFeeVerificationPage /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
