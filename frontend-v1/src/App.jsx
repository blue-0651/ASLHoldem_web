import React, { Suspense, Fragment, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 어드민 관리자 화면
import LoginPage from './admin/pages/LoginPage';
import Dashboard from './admin/pages/Dashboard';
import TournamentManagement from './admin/pages/TournamentManagement';
import StoreManagement from './admin/pages/StoreManagement';
import Layout from './admin/components/Layout';
import ProtectedRoute from './admin/components/ProtectedRoute';
import UserInfoPage from './admin/pages/UserInfoPage';

// 모바일 페이지 컴포넌트
import {
  StoreDashboard,
  StoreInfo,
  Tournament,
  PlayerRegistration,
  UserDashboard
} from './mobile/pages';

// 모바일 레이아웃
import NavigationLayout from './mobile/layouts/NavigationLayout';

// 모바일 공통 컴포넌트
import MobileLogin from './mobile/pages/common/MobileLogin';
import MobileSignup from './mobile/pages/common/MobileSignup';
import TournamentsList from './mobile/pages/common/tournaments-list/TournamentsList';
import Reservations from './mobile/pages/common/reservations/Reservations';
import StoreSearchPage from './mobile/pages/common/store-search/StoreSearchPage';
import StoreDetailPage from './mobile/pages/common/store-search/StoreDetailPage';
import Settings from './mobile/pages/common/Settings';
import UnderConstruction from './mobile/pages/common/UnderConstruction';

// 만든 샘플 페이지.
//import NotFound404 from './views/errors/NotFound404';
import Maintenance from './views/maintenance/Maintenance';

import { BrowserRouter } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import SamplePage from './views/extra/SamplePage';
import BoardManagementPage from './admin/pages/BoardManagementPage';

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

        {/* 로그인 데모 페이지: 테스트 용으로 만든 페이지 */}
        {/*<Route path="/demo/mobile/sampleLogin" element={<SampleLogin />} />*/}
        {/*<Route path="/demo/mobile/userlogin" element={<UserLoginPage />} />*/}
        {/*<Route path="/demo/mobile/storelogin" element={<StoreLoginPage />} />*/}

        {/* 로그인 실제 페이지: 바로가기로 만들어 놓은 실제는 라우터 삭제 필요 */}
        {/*<Route path="/demo/mobile/login" element={<MobileLoginPage />} />*/}
        {/*<Route path="/demo/mobile/signup" element={<MobileSignUpPage />} />*/}

        {/* 데모용 UI 소스 작업 */}
        {/* <Route path="/demo/admin/" element={<ProtectedRoute />} >
          <Route element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tournaments" element={<TournamentManagement />} />
            <Route path="stores" element={<StoreManagement />} />
          </Route>
        </Route> */}

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
        <Route path="/mobile" element={<NavigationLayout />}>
          <Route path="login" element={<MobileLogin />} />
          <Route path="store" element={<ProtectedRoute userType="store" />}>
            <Route path="dashboard" element={<StoreDashboard />} />
            <Route path="tournament" element={<Tournament />} />
            <Route path="info" element={<StoreInfo />} />
            <Route path="player-registration" element={<PlayerRegistration />} />
          </Route>
          <Route path="user" element={<ProtectedRoute userType="user" />}>
            <Route path="dashboard" element={<UserDashboard />} />
          </Route>
          <Route path="common" element={<ProtectedRoute />}>
            <Route path="tournaments-list" element={<TournamentsList />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="store-search" element={<StoreSearchPage />} />
            <Route path="store/:id" element={<StoreDetailPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route index element={<Navigate to="/mobile/login" replace />} />
          <Route path="*" element={<Navigate to="/mobile/login" replace />} />
        </Route>

        {/* 모바일 회원가입 */}
        <Route path="/mobile/signup" element={<MobileSignup />} />

        {/* 일반 사용자 라우트 */}
        <Route path="/mobile/common/tournaments-list" element={<TournamentsList />} />
        <Route path="/mobile/common/reservations" element={<Reservations />} />
        <Route path="/mobile/common/settings" element={<Settings />} />

        {/* 매장 검색 관련 라우트 */}
        <Route path="/mobile/common/store-search" element={<StoreSearchPage />} />
        <Route path="/mobile/common/store-detail/:storeId" element={<StoreDetailPage />} />

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
              <Route path="/users" element={<UserInfoPage />} />
              <Route path="/board" element={<BoardManagementPage />} />
              <Route path="/sample-page" element={<SamplePage />} />
            </Route>
          </Route>
        )}

        {/* 기본 리다이렉트 - 모바일 디바이스면 모바일 경로로 */}
        <Route path="/" element={isMobile ? <Navigate to="/mobile/user/dashboard" replace /> : <Navigate to="/dashboard" replace />} />
        <Route path="*" element={isMobile ? <Navigate to="/mobile/user/dashboard" replace /> : <Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
