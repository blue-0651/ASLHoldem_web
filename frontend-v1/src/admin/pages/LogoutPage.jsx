import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { reqLogout } from '../../utils/auth';

const LogoutPage = () => {
  useEffect(() => {
    // 로그아웃 처리
    reqLogout();
    
    // 선택적으로 추가 로그아웃 로직을 여기에 추가할 수 있습니다
    console.log('사용자가 로그아웃되었습니다.');
  }, []);

  // 로그아웃 후 로그인 페이지로 리다이렉트
  return <Navigate to="/login" replace />;
};

export default LogoutPage; 