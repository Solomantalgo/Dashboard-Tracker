import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { MemberProfile } from './pages/MemberProfile';
import { Attendance } from './pages/Attendance';
import { Payments } from './pages/Payments';
import { Assessments } from './pages/Assessments';
import { Finance } from './pages/Finance';
import { Coaches } from './pages/Coaches';
import { ContentTracker } from './pages/ContentTracker';
import { Equipment } from './pages/Equipment';
import { Settings } from './pages/Settings';
import { MoreMenu } from './pages/MoreMenu';
import { MemberPortal } from './pages/portal/MemberPortal';
import { CoachPortal } from './pages/coach/CoachPortal';

const AppRoutes: React.FC = () => {
  const { role, user, isDemoMode, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center text-[#9AA1AE] text-sm font-semibold">
        Loading PFFI Member Tracker...
      </div>
    );
  }

  // A role value is not authentication. Only explicit demo mode may render
  // protected routes without a real Supabase session.
  if (!isDemoMode && !user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Role-Based Navigation Routing */}
      {role === 'admin' && (
        <>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberProfile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/content" element={<ContentTracker />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/more" element={<MoreMenu />} />
        </>
      )}

      {role === 'client' && (
        <>
          <Route path="/" element={<Navigate to="/portal" replace />} />
          <Route path="/portal/*" element={<MemberPortal />} />
        </>
      )}

      {role === 'coach' && (
        <>
          <Route path="/" element={<Navigate to="/coach" replace />} />
          <Route path="/coach/*" element={<CoachPortal />} />
        </>
      )}

      {/* Fallback navigation based on active role */}
      <Route
        path="*"
        element={
          <Navigate
            to={role === 'client' ? '/portal' : role === 'coach' ? '/coach' : '/dashboard'}
            replace
          />
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
