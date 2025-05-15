import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';


// 어드민 관리자 화면
import LoginPage from './admin/pages/LoginPage';
import Dashboard from './admin/pages/Dashboard';
import TournamentManagement from './admin/pages/TournamentManagement';
import StoreManagement from './admin/pages/StoreManagement';
import Layout from './admin/components/Layout';
import ProtectedRoute from './admin/components/ProtectedRoute';

// 모바일 페이지 컴포넌트
import {
  MobileLoginPage,
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

// 만든 샘플 페이지.
import NotFound404 from './views/errors/NotFound404';
import Maintenance from './views/maintenance/Maintenance';
import MobileSignUpPage from './mobile/pages/common/MobileSignUpPage';
// import SampleLogin from './views/sample/SampleLogin';
// import UserLoginPage from './views/sample/UserLoginPage';
// import StoreLoginPage from './views/sample/StoreLoginPage';




function App() {
  // 모바일 디바이스 체크
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="App">
      <Routes>
        {/* 샘플 페이지: 테스트 용으로 만든 페이지 */}
        <Route path="/404" element={<NotFound404 />} />
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
        <Route path="/mobile/login" element={<MobileLoginPage />} />

        {/* 모바일 회원가입 */}
        <Route path="/mobile/signup" element={<MobileSignUpPage />} />

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
        {/* Login --> LoginPage 변경 */}
        {!isMobile && <Route path="/login" element={<LoginPage />} />}

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
        <Route path="/" element={isMobile ? <Navigate to="/mobile/user/dashboard" replace /> : <Navigate to="/dashboard" replace />} />
        <Route path="*" element={isMobile ? <Navigate to="/mobile/user/dashboard" replace /> : <Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
