import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TournamentManagement from './pages/TournamentManagement';
import StoreManagement from './pages/StoreManagement';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import MobileLogin from './mobile/pages/MobileLogin';
import MobileDashboard from './mobile/pages/MobileDashboard';
import MobileProtectedRoute from './mobile/components/MobileProtectedRoute';
import './App.css';

function App() {
  // 모바일 디바이스 체크
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="App">
      <Routes>
        {/* 모바일 라우트 */}
        <Route path="/mobile/login" element={<MobileLogin />} />
        
        {/* 모바일 보호된 라우트 */}
        <Route element={<MobileProtectedRoute />}>
          <Route path="/mobile/dashboard" element={<MobileDashboard />} />
          {/* 추가 모바일 보호된 페이지들 */}
        </Route>
        
        {/* 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        
        {/* 보호된 라우트 */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tournaments" element={<TournamentManagement />} />
            <Route path="/stores" element={<StoreManagement />} />
          </Route>
        </Route>
        
        {/* 기본 리다이렉트 - 모바일 디바이스면 모바일 경로로 */}
        <Route path="/" element={
          isMobile 
            ? <Navigate to="/mobile/dashboard" replace /> 
            : <Navigate to="/dashboard" replace />
        } />
        <Route path="*" element={
          isMobile 
            ? <Navigate to="/mobile/dashboard" replace /> 
            : <Navigate to="/dashboard" replace />
        } />
      </Routes>
    </div>
  );
}

export default App; 