import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './admin/pages/Dashboard';
import TournamentManagement from './admin/pages/TournamentManagement';
import StoreManagement from './admin/pages/StoreManagement';
import Login from './admin/pages/Login';
import Layout from './admin/components/Layout';
import ProtectedRoute from './admin/components/ProtectedRoute';

// 모바일 페이지 컴포넌트
import { 
  MobileLogin,
  UserDashboard,
  StoreDashboard,
  Tournament,
  StoreInfo,
  TournamentsList,
  Reservations,
  StoreSearchPage,
  StoreDetailPage,
  PlayerRegistration
} from './mobile/pages';

// 공통 스타일
import './App.css';

function App() {
  // 모바일 디바이스 체크
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="App">
      <Routes>
        {/* 모바일 디바이스에서 관리자 페이지로 접근 시도 시 모바일 페이지로 리다이렉트 */}
        {isMobile && (
          <>
            <Route path="/dashboard" element={<Navigate to="/mobile/user/dashboard" replace />} />
            <Route path="/tournaments" element={<Navigate to="/mobile/user/dashboard" replace />} />
            <Route path="/stores" element={<Navigate to="/mobile/user/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/mobile/login" replace />} />
          </>
        )}

        {/* 모바일 라우트 */}
        <Route path="/mobile/login" element={<MobileLogin />} />
        
        {/* 모바일 사용자 라우트 */}
        <Route path="/mobile/user/dashboard" element={<UserDashboard />} />
        
        {/* 매장 관리자 라우트 */}
        <Route path="/mobile/store/dashboard" element={<StoreDashboard />} />
        <Route path="/mobile/store/tournament" element={<Tournament />} />
        <Route path="/mobile/store/info" element={<StoreInfo />} />
        <Route path="/mobile/store/player-registration" element={<PlayerRegistration />} />
        
        {/* 일반 사용자 라우트 */}
        <Route path="/mobile/common/tournaments-list" element={<TournamentsList />} />
        <Route path="/mobile/common/reservations" element={<Reservations />} />
        
        {/* 매장 검색 관련 라우트 */}
        <Route path="/mobile/common/store-search" element={<StoreSearchPage />} />
        <Route path="/mobile/common/store-detail/:storeId" element={<StoreDetailPage />} />
        
        {/* 공개 라우트 - 모바일이 아닌 경우에만 적용 */}
        {!isMobile && <Route path="/login" element={<Login />} />}
        
        {/* 보호된 라우트 - 모바일이 아닌 경우에만 적용 */}
        {!isMobile && (
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tournaments" element={<TournamentManagement />} />
              <Route path="/stores" element={<StoreManagement />} />
            </Route>
          </Route>
        )}
        
        {/* 기본 리다이렉트 - 모바일 디바이스면 모바일 경로로 */}
        <Route path="/" element={
          isMobile 
            ? <Navigate to="/mobile/user/dashboard" replace /> 
            : <Navigate to="/dashboard" replace />
        } />
        <Route path="*" element={
          isMobile 
            ? <Navigate to="/mobile/user/dashboard" replace /> 
            : <Navigate to="/dashboard" replace />
        } />
      </Routes>
    </div>
  );
}

export default App; 