import React, { useState, useEffect } from 'react';

// utils import
import { getCurrentUser } from '../../../../../../utils/auth';

// ==============================|| USER PROFILE ||============================== //

const UserProfile = () => {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // 로그인된 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    console.log('UserProfile - getCurrentUser 결과:', currentUser);
    console.log('UserProfile - localStorage USER_INFO:', localStorage.getItem('asl_holdem_user_info'));
    
    if (currentUser) {
      setUserInfo(currentUser);
      console.log('UserProfile - 사용자 정보 설정됨:', currentUser);
    } else {
      console.log('UserProfile - 사용자 정보 없음');
    }
  }, []);

  console.log('UserProfile - 렌더링, userInfo:', userInfo);

  if (!userInfo) {
    return (
      <div className="text-white px-3 py-2">
        <div style={{ fontSize: '12px' }}>로그인 정보 없음</div>
      </div>
    );
  }

  return (
    <div 
      className="d-flex flex-column align-items-end text-white px-3 py-2 me-3"
      style={{
        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        minWidth: '200px'
      }}
    >
      {/* 닉네임/이름 */}
      <div 
        className="fw-bold text-white mb-1"
        style={{ fontSize: '14px', lineHeight: '1.2' }}
      >
        {userInfo.nickname || '사용자'}
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