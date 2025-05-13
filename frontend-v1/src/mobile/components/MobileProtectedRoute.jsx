import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';

/**
 * 모바일 보호된 라우트 컴포넌트
 * 인증되지 않은 사용자를 모바일 로그인 페이지로 리다이렉트
 */
const MobileProtectedRoute = () => {
  const auth = isAuthenticated();
  
  // 인증되지 않았으면 모바일 로그인 페이지로 리다이렉트
  if (!auth) {
    return <Navigate to="/mobile/login" replace />;
  }

  // 인증되었으면 자식 라우트 렌더링
  return <Outlet />;
};

export default MobileProtectedRoute; 