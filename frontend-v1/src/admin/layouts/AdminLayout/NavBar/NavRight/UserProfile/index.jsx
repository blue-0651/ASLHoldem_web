import React, { useState, useEffect, useCallback, useRef } from 'react';

// utils import
import { getCurrentUser } from '../../../../../../utils/auth';

// ==============================|| USER PROFILE ||============================== //

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // 사용자 정보 로드 함수
  const loadUserInfo = useCallback(() => {
    try {
      console.log('UserProfile - 사용자 정보 로드 시작');
      
      // 로그인된 사용자 정보 가져오기
      const currentUser = getCurrentUser();
      console.log('UserProfile - getCurrentUser 결과:', currentUser);
      console.log('UserProfile - localStorage USER_INFO:', localStorage.getItem('asl_holdem_user_info'));
      
      if (mountedRef.current) {
        if (currentUser) {
          setUserInfo(currentUser);
          console.log('UserProfile - 사용자 정보 설정됨:', currentUser);
        } else {
          console.log('UserProfile - 사용자 정보 없음');
          setUserInfo(null);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('UserProfile - 사용자 정보 로드 오류:', error);
      if (mountedRef.current) {
        setUserInfo(null);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // 초기 로드
    loadUserInfo();
    
    // localStorage 변경 감지
    const handleStorageChange = (e) => {
      if (e.key === 'asl_holdem_user_info' || e.key === 'asl_holdem_access_token') {
        console.log('UserProfile - localStorage 변경 감지:', e.key);
        loadUserInfo();
      }
    };

    // 사용자 정보 재로드를 위한 커스텀 이벤트 리스너
    const handleUserInfoUpdate = () => {
      console.log('UserProfile - 사용자 정보 업데이트 이벤트 받음');
      loadUserInfo();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate);
    };
  }, [loadUserInfo]);

  console.log('UserProfile - 렌더링, userInfo:', userInfo, 'isLoading:', isLoading);

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="text-white px-3 py-2">
        <div style={{ fontSize: '12px' }}>로딩 중...</div>
      </div>
    );
  }

  // 사용자 정보가 없을 때
  if (!userInfo) {
    return (
      <div className="text-white px-3 py-2">
        <div style={{ fontSize: '12px' }}>로그인 정보 없음</div>
      </div>
    );
  }

  // 사용자 권한 표시
  const getRoleDisplay = () => {
    if (userInfo.is_superuser) return '최고관리자';
    if (userInfo.is_staff) return '관리자';
    if (userInfo.is_store_owner) return '매장관리자';
    if (userInfo.role === 'ADMIN') return '관리자';
    if (userInfo.role === 'STORE_OWNER') return '매장관리자';
    return '사용자';
  };

  return (
    <div 
      className="d-flex flex-column align-items-end text-white px-3 py-2 me-3"
      style={{
        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        minWidth: '200px'
      }}
    >
      {/* 닉네임/이름과 권한 */}
      <div 
        className="fw-bold text-white mb-1"
        style={{ fontSize: '14px', lineHeight: '1.2' }}
      >
        {userInfo.nickname || '사용자'}
        <span 
          className="badge bg-light text-dark ms-2"
          style={{ fontSize: '10px', fontWeight: 'normal' }}
        >
          {getRoleDisplay()}
        </span>
      </div>
      
      {/* 전화번호와 이메일을 한 라인으로 */}
      <div 
        className="text-white"
        style={{ fontSize: '12px', opacity: 0.9, lineHeight: '1.2' }}
      >
        {userInfo.phone}
        {userInfo.email && (
          <span> ({userInfo.email})</span>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 