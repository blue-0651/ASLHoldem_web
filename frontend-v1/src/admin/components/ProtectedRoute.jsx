import React from 'react';
import { reqIsAuthenticated } from '../../utils/auth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 */
const ProtectedRoute = () => {
  const auth = reqIsAuthenticated();
  console.log('Authentication status:', auth);

  if (!auth) {
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    return <Navigate to="/login" replace />;
  }

  const location = useLocation();
  console.log('Outlet 경로:', location.pathname);


  // 인증된 경우 자식 라우트를 렌더링
  return <Outlet />;
};

export default ProtectedRoute;
