import React, { Suspense, Fragment, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 어드민 관리자 화면
import LoginPage from './admin/pages/LoginPage';
import Dashboard from './admin/pages/Dashboard';
import TournamentManagement from './admin/pages/TournamentManagement';
import StoreManagement from './admin/pages/StoreManagement';
import TicketIssuePage from './admin/pages/TicketIssuePage'; // admin 에서는 미사용.
import SeatManagementPage from './admin/pages/SeatManagementPage';
import Layout from './admin/components/Layout';
import ProtectedRoute from './admin/components/ProtectedRoute';
import UserInfoPage from './admin/pages/UserInfoPage';
import PlayerRegistrationPage from './admin/pages/PlayerRegistrationPage';
import LogoutPage from './admin/pages/LogoutPage';
import BannerManagementPage from './admin/pages/BannerManagementPage';

// 모바일 페이지 컴포넌트
import {
  StoreDashboard,
  StoreInfo,
  Tournament,
  PlayerRegistration,
  TicketIssue,
  UserDashboard
} from './mobile/pages';

// 사용자 QR 코드 페이지
import QRCode from './mobile/pages/user/QRCode';

// 토너먼트 상세 페이지 추가
import TournamentDetail from './mobile/pages/store/TournamentDetail';
import MyReservations from './mobile/pages/user/MyReservations';

// 모바일 레이아웃
import NavigationLayout from './mobile/layouts/NavigationLayout';

// 모바일 공통 컴포넌트
import MobileLogin from './mobile/pages/common/MobileLogin';
import MobileSignup from './mobile/pages/common/MobileSignup';
import TournamentsList from './mobile/pages/common/tournaments-list/TournamentsList';
import Reservations from './mobile/pages/common/reservations/Reservations';
import StoreSearchPage from './mobile/pages/common/store-search/StoreSearchPage';
import StoreDetailPage from './mobile/pages/common/store-search/StoreDetailPage';
import StoreMapPage from './mobile/pages/common/store-search/StoreMapPage';
import AslAd from './mobile/pages/common/AslAd';
import Settings from './mobile/pages/common/Settings';
import UnderConstruction from './mobile/pages/common/UnderConstruction';

// 만든 샘플 페이지.
//import NotFound404 from './views/errors/NotFound404';
import Maintenance from './views/maintenance/Maintenance';

import { BrowserRouter } from 'react-router-dom';
import AdminLayout from './admin/layouts/AdminLayout';
import SamplePage from './views/extra/SamplePage';
import BoardManagementPage from './admin/pages/BoardManagementPage';
import DashAnalytics from './views/dashboard/index';



function App() {
  // 모바일 디바이스 체크
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* 샘플 페이지: 테스트 용으로 만든 페이지 */}

        {/* 지연 로딩 화면 테스트*/}
        <Route
          path="/404"
          element={
            <Suspense fallback={<div>Loading...</div>}>{React.createElement(lazy(() => import('./views/errors/NotFound404')))}</Suspense>
          }
        />
        <Route path="/maintenance" element={<Maintenance />} />

        {/* 모바일 디바이스에서 관리자 페이지로 접근 시도 시 모바일 페이지로 리다이렉트 */}
        {isMobile && (
          <>
            <Route path="/dashboard" element={<Navigate to="/mobile/user/dashboard" replace />} />
            <Route path="/tournaments" element={<Navigate to="/mobile/user/dashboard" replace />} />
            <Route path="/stores" element={<Navigate to="/mobile/user/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/mobile/login" replace />} />
          </>
        )}

        {/* ASL 광고 페이지 - NavigationLayout 없이 독립적으로 실행 */}
        <Route path="/mobile/advertisement" element={<AslAd />} />
        <Route path="/mobile/asl-ad" element={<AslAd />} />

        {/* 모바일 회원가입 - NavigationLayout 없이 독립적으로 실행 */}
        <Route path="/mobile/signup" element={<MobileSignup />} />

        {/* 모바일 라우트 */}
        <Route path="/mobile" element={<NavigationLayout />}>
          <Route path="login" element={<MobileLogin />} />
          <Route path="store" element={<ProtectedRoute userType="store" />}>
            <Route path="dashboard" element={<StoreDashboard />} />
            <Route path="tournament" element={<Tournament />} />
            <Route path="tournament/:id" element={<TournamentDetail />} />
            <Route path="info" element={<StoreInfo />} />
            <Route path="ticket-issue" element={<TicketIssue />} />
            <Route path="player-registration" element={<PlayerRegistration />} />
          </Route>
          <Route path="user" element={<ProtectedRoute userType="user" />}>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="qr-code" element={<QRCode />} />
            <Route path="reservations" element={<MyReservations />} />
            <Route path="myreservations" element={<MyReservations />} />
          </Route>
          <Route path="common" element={<ProtectedRoute />}>
            <Route path="tournaments-list" element={<TournamentsList />} />
            <Route path="tournament/:id" element={<TournamentDetail />} />
            <Route path="reservations" element={<Navigate to="/mobile/user/myreservations" replace />} />
            <Route path="store-search" element={<StoreSearchPage />} />
            <Route path="store/:id" element={<StoreDetailPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route index element={<Navigate to="/mobile/advertisement" replace />} />
          <Route path="*" element={<Navigate to="/mobile/advertisement" replace />} />
        </Route>

        {/* 매장 검색 관련 라우트 */}
        <Route path="/mobile/common/store-search" element={<StoreSearchPage />} />
        <Route path="/mobile/common/store-detail/:storeId" element={<StoreDetailPage />} />
        <Route path="/mobile/common/store-map" element={<StoreMapPage />} />

        {/* 공사중 페이지 - 개발되지 않은 기능들 */}
        <Route path="/mobile/common/under-construction" element={<UnderConstruction />} />
        <Route path="/mobile/common/notices" element={<UnderConstruction title="공지사항" message="공지사항 페이지는 현재 개발 중입니다." />} />
        <Route path="/mobile/common/profile" element={<UnderConstruction title="프로필" message="프로필 페이지는 현재 개발 중입니다." />} />
        <Route path="/mobile/common/help" element={<UnderConstruction title="도움말" message="도움말 페이지는 현재 개발 중입니다." />} />

        {/* 공개 라우트 - 모바일이 아닌 경우에만 적용 */}
        {/* Login --> LoginPage 변경 */}
        {!isMobile && <Route path="/login" element={<LoginPage />} />}
        
        
        {/* 보호된 라우트 - 모바일이 아닌 경우에만 적용 */}
        {!isMobile && (
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tournaments" element={<TournamentManagement />} />
              <Route path="/stores" element={<StoreManagement />} />
              <Route path="/ticket-issue" element={<SeatManagementPage />} />
              <Route path="/users" element={<UserInfoPage />} />
              <Route path="/player-registration" element={<PlayerRegistrationPage />} />
              <Route path="/board" element={<BoardManagementPage />} />
              <Route path="/sample-page" element={<SamplePage />} />
              <Route path="/dash-analytics" element={<DashAnalytics />} />
              <Route path="/logout" element={<LogoutPage />} />

              <Route path="/banners" element={<BannerManagementPage />} />
            </Route>
          </Route>
        )}

        {/* 루트 경로 - 모바일은 광고 페이지, 데스크톱은 관리자 로그인 페이지 */}
        <Route path="/" element={isMobile ? <Navigate to="/mobile/advertisement" replace /> : <LoginPage />} />
        <Route path="*" element={isMobile ? <Navigate to="/mobile/advertisement" replace /> : <Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
