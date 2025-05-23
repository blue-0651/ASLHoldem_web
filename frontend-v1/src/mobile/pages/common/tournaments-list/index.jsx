import React, { useState, useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated } from '../../../../utils/auth';
import MobileHeader from '../../../components/MobileHeader';

const MobileTournamentsList = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 인증 상태 확인
    if (!isAuthenticated()) {
      navigate('/mobile/login');
      return;
    }
    
    // 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [navigate]);

  return (
    <div className="asl-mobile-container">
      <MobileHeader title="토너먼트 일정" />
      
      <div className="asl-mobile-content">
        <div className="asl-mobile-page-title">토너먼트 일정</div>
        <p className="asl-mobile-text">참여 가능한 토너먼트 일정을 확인하세요.</p>
        
        {/* 컨텐츠 추가 예정 */}
        <div className="asl-mobile-empty-state">
          <i className="fas fa-calendar-alt asl-mobile-empty-icon"></i>
          <p>토너먼트 일정 조회 기능 준비 중입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default MobileTournamentsList; 