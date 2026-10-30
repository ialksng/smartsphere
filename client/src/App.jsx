import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import GoogleDriveHub from './pages/GoogleDriveHub';
import DocHub from './pages/DocHub';
import DocEditor from './pages/DocEditor';
import CloudHub from './pages/CloudHub';
import BuddyBot from './pages/BuddyBot';
import MyStorage from './pages/MyStorage';

import MainLayout from './layouts/MainLayout';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('sphere_token');
  return token ? children : <Navigate to="/auth" replace />;
};

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

const getBasename = () => {
  if (
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/work/projects/smartsphere/app')
  ) {
    return '/work/projects/smartsphere/app';
  }
  return '';
};

function App() {
  return (
    <BrowserRouter basename={getBasename()}>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/cloudhub"
          element={
            <ProtectedLayout>
              <CloudHub />
            </ProtectedLayout>
          }
        />

        <Route
          path="/cloudhub/google"
          element={
            <ProtectedLayout>
              <GoogleDriveHub />
            </ProtectedLayout>
          }
        />

        <Route
          path="/mystorage"
          element={
            <ProtectedLayout>
              <MyStorage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/dochub"
          element={
            <ProtectedLayout>
              <DocHub />
            </ProtectedLayout>
          }
        />

        {/* Supports direct URL IDs (e.g. from DocHub) */}
        <Route
          path="/doceditor/:id"
          element={
            <ProtectedLayout>
              <DocEditor />
            </ProtectedLayout>
          }
        />

        {/* Supports state-based navigation (e.g. from MyStorage) */}
        <Route
          path="/doceditor"
          element={
            <ProtectedLayout>
              <DocEditor />
            </ProtectedLayout>
          }
        />

        <Route
          path="/buddybot"
          element={
            <ProtectedLayout>
              <BuddyBot />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
