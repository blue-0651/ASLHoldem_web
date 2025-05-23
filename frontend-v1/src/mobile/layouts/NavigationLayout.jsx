import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

/**
 * 모바일 페이지의 기본 레이아웃 컴포넌트
 * - 로그인 화면 등 특정 페이지를 제외한 모든 페이지에서 사용
 * - Outlet을 통해 자식 라우트 컴포넌트 렌더링
 */
const NavigationLayout = () => {
  const location = useLocation();
  
  // 로그인 페이지인 경우 레이아웃 없이 그대로 렌더링
  if (location.pathname === '/mobile/login') {
    return <Outlet />;
  }
  
  return (
    <div className="asl-mobile-layout">
      <Outlet />
    </div>
  );
};

export default NavigationLayout; 