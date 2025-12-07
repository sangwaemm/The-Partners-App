
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import Contributions from './pages/Contributions';
import Activities from './pages/Activities';
import Investment from './pages/Investment';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { UserRole } from './types';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useData();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><Layout><Members /></Layout></ProtectedRoute>} />
      <Route path="/contributions" element={<ProtectedRoute><Layout><Contributions /></Layout></ProtectedRoute>} />
      <Route path="/loans" element={<ProtectedRoute><Layout><Loans /></Layout></ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute><Layout><Activities /></Layout></ProtectedRoute>} />
      <Route path="/investment" element={<ProtectedRoute><Layout><Investment /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};;

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </DataProvider>
  );
}
