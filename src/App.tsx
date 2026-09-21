import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import { MemberPortal } from './pages/portal/MemberPortal';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
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

          {/* Member Portal Routes */}
          <Route path="/portal/*" element={<MemberPortal />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
