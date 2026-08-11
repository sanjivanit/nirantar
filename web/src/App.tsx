import type { ReactNode } from 'react';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Login from './screens/Login';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function VendorsPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 32, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <p>
        Signed in as {user?.name} ({user?.role})
      </p>
      <p>Vendors list lands in Task 8.</p>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/vendors"
        element={
          <RequireAuth>
            <VendorsPlaceholder />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/vendors" replace />} />
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
