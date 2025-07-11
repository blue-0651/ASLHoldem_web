//매장관리자 대시보드
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, logout } from '../../../utils/auth';
import { getDisplayName } from '../../../utils/userUtils';
import MobileHeader from '../../components/MobileHeader';

const StoreDashboard = () => {
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
      {/* MobileHeader 컴포넌트 사용 */}
      <MobileHeader title="ASL 홀덤" />
      
      {/* 컨텐츠 영역 */}
      <Container className="asl-mobile-content">
        <Row className="mb-4">
          <Col>
            <div>
              <h2 className="main-title">환영합니다, {getDisplayName(user, '매장 관리자')}님!</h2>
              <p className="main-title">매장과 토너먼트를 효율적으로 관리하세요.</p>
            </div>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col xs={6} className="mb-3">
            <Card className="asl-action-card" onClick={() => navigate('/mobile/store/tournament')}>
              <Card.Body className="text-center">
                <i className="fas fa-trophy fa-2x mb-2"></i>
                <Card.Title>토너먼트 관리</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} className="mb-3">
            <Card className="asl-action-card" onClick={() => navigate('/mobile/store/info')}>
              <Card.Body className="text-center">
                <i className="fas fa-store fa-2x mb-2"></i>
                <Card.Title>매장 정보</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} className="mb-3">
            <Card className="asl-action-card" onClick={() => navigate('/mobile/store/player-registration')}>
              <Card.Body className="text-center">
                <i className="fas fa-user-plus fa-2x mb-2"></i>
                <Card.Title>선수 회원 참가</Card.Title>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col>
            <Card className="asl-summary-card">
              <Card.Body>
                <Card.Title>매장 현황</Card.Title>
                <div className="d-flex justify-content-between my-3">
                  <div className="text-center">
                    <div className="fs-4 fw-bold">3</div>
                    <div className="text-muted">예정된 토너먼트</div>
                  </div>
                  <div className="text-center">
                    <div className="fs-4 fw-bold">24</div>
                    <div className="text-muted">등록 선수</div>
                  </div>
                  <div className="text-center">
                    <div className="fs-4 fw-bold">12</div>
                    <div className="text-muted">예약</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        

      </Container>
    </div>
  );
};

export default StoreDashboard; 