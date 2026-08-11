import type { ReactNode } from 'react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Vendors from './screens/Vendors';
import VendorProfile from './screens/VendorProfile';
import Alerts from './screens/Alerts';
import MsmeDeadlines from './screens/MsmeDeadlines';
import AuditTrail from './screens/AuditTrail';
import Reports from './screens/Reports';
import Settings from './screens/Settings';
import Sidebar from './components/Sidebar';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', color: '#131B2E', fontSize: 14 }}>
      <Sidebar />
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', overflowX: 'hidden', background: '#F6F7F9' }}>{children}</div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppShell>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/vendors/:id" element={<VendorProfile />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/msme" element={<MsmeDeadlines />} />
                <Route path="/audit" element={<AuditTrail />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/vendors" replace />} />
              </Routes>
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
