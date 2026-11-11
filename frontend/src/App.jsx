import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import SelectRolePage from './pages/SelectRolePage';
import CitizenLogin from './pages/CitizenLogin';
import CitizenRegister from './pages/CitizenRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportIssue from './pages/ReportIssue';
import CitizenIssues from './pages/CitizenIssues';
import CitizenIssueDetails from './pages/CitizenIssueDetails';
import CitizenNotifications from './pages/CitizenNotifications';
import CitizenProfile from './pages/CitizenProfile';
import MunicipalLogin from './pages/MunicipalLogin';

import MunicipalDashboard from './pages/MunicipalDashboard';
import MunicipalIssues from './pages/MunicipalIssues';
import MunicipalIssueDetails from './pages/MunicipalIssueDetails';
import MunicipalNotifications from './pages/MunicipalNotifications';
import MunicipalMap from './pages/MunicipalMap';
import MunicipalDepartments from './pages/MunicipalDepartments';
import MunicipalAnalytics from './pages/MunicipalAnalytics';
import MunicipalProfile from './pages/MunicipalProfile';
import WorkerTasks from './pages/WorkerTasks';

const MUNICIPAL_ROLES = ['ADMIN', 'OFFICER', 'WORKER'];

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home based on role
    if (user.role === 'citizen') return <Navigate to="/citizen/dashboard" />;
    if (user.role === 'WORKER') return <Navigate to="/municipal/tasks" />;
    return <Navigate to="/municipal/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-[#F4F5F6] text-[#202226] font-sans selection:bg-[#FF8A3D]/25 selection:text-[#17191C]">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select-role" element={<SelectRolePage />} />
        <Route path="/login" element={<Navigate to="/select-role" replace />} />
        
        <Route path="/citizen/login" element={<CitizenLogin />} />
        <Route path="/citizen/register" element={<CitizenRegister />} />
        
        <Route path="/municipal/login" element={<MunicipalLogin />} />
        <Route path="/admin/login" element={<Navigate to="/municipal/login" replace />} />
        <Route path="/officer/login" element={<Navigate to="/municipal/login" replace />} />
        <Route path="/worker/login" element={<Navigate to="/municipal/login" replace />} />

        {/* Public Password Recovery Routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Protected Citizen Routes */}
        <Route path="/citizen/dashboard" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/citizen/report" element={<ProtectedRoute allowedRoles={['citizen']}><ReportIssue /></ProtectedRoute>} />
        <Route path="/citizen/issues" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenIssues /></ProtectedRoute>} />
        <Route path="/citizen/issues/:id" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenIssueDetails /></ProtectedRoute>} />
        <Route path="/citizen/notifications" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenNotifications /></ProtectedRoute>} />
        <Route path="/citizen/profile" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenProfile /></ProtectedRoute>} />

        {/* Protected Municipal Routes - ADMIN & OFFICER */}
        <Route path="/municipal/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'OFFICER']}><MunicipalDashboard /></ProtectedRoute>} />
        <Route path="/municipal/issues" element={<ProtectedRoute allowedRoles={['ADMIN', 'OFFICER']}><MunicipalIssues /></ProtectedRoute>} />
        <Route path="/municipal/map" element={<ProtectedRoute allowedRoles={MUNICIPAL_ROLES}><MunicipalMap /></ProtectedRoute>} />
        <Route path="/municipal/departments" element={<ProtectedRoute allowedRoles={['ADMIN']}><MunicipalDepartments /></ProtectedRoute>} />
        <Route path="/municipal/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><MunicipalAnalytics /></ProtectedRoute>} />
        <Route path="/municipal/notifications" element={<ProtectedRoute allowedRoles={MUNICIPAL_ROLES}><MunicipalNotifications /></ProtectedRoute>} />
        <Route path="/municipal/profile" element={<ProtectedRoute allowedRoles={MUNICIPAL_ROLES}><MunicipalProfile /></ProtectedRoute>} />

        {/* Worker route */}
        <Route path="/municipal/tasks" element={<ProtectedRoute allowedRoles={['WORKER']}><WorkerTasks /></ProtectedRoute>} />

        {/* Issue details accessible to all municipal roles */}
        <Route path="/municipal/issues/:id" element={<ProtectedRoute allowedRoles={MUNICIPAL_ROLES}><MunicipalIssueDetails /></ProtectedRoute>} />

        {/* Catch-all 404 route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
