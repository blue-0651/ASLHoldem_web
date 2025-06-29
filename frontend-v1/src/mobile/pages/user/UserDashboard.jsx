import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, logout } from '../../../utils/auth';
import { getDisplayName } from '../../../utils/userUtils';
import MobileHeader from '../../components/MobileHeader';
// MobileStyles.css는 _mobile-commons.scss로 통합됨

const UserDashboard = () => {
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
      <MobileHeader title="ASL 리그" />
      
      {/* 컨텐츠 영역 */}
      <Container className="asl-mobile-content">
        <Row className="mb-4">
          <Col>
            <div className="asl-welcome-card">
              <h2>환영합니다, {getDisplayName(user, '사용자')}님!</h2>
              <p>ASL 리그에서 즐거운 시간을 보내세요.</p>
            </div>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col xs={6} className="mb-3">
            <Card className="asl-action-card" onClick={() => navigate('/mobile/common/tournaments-list')}>
              <Card.Body className="text-center">
                <i className="fas fa-calendar-alt fa-2x mb-2"></i>
                <Card.Title>토너먼트 일정</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} className="mb-3">
                            <Card className="asl-action-card" onClick={() => navigate('/mobile/user/myreservations')}>
              <Card.Body className="text-center">
                <i className="fas fa-ticket-alt fa-2x mb-2"></i>
                <Card.Title>내 예약</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} className="mb-3">
            <Card className="asl-action-card" onClick={() => navigate('/mobile/user/qr-code')}>
              <Card.Body className="text-center">
                <i className="fas fa-qrcode fa-2x mb-2"></i>
                <Card.Title>QR 코드</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} className="mb-3">
            <Card className="asl-action-card" onClick={() => navigate('/mobile/common/store-search')}>
              <Card.Body className="text-center">
                <i className="fas fa-search-location fa-2x mb-2"></i>
                <Card.Title>매장 찾기</Card.Title>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} className="mb-3">
            <Card className="asl-action-card" onClick={() => navigate('/mobile/common/settings')}>
              <Card.Body className="text-center">
                <i className="fas fa-cog fa-2x mb-2"></i>
                <Card.Title>환경 설정</Card.Title>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col>
            <Card className="asl-summary-card">
              <Card.Body>
                <Card.Title>나의 활동</Card.Title>
                <div className="d-flex justify-content-between my-3">
                  <div className="text-center">
                    <div className="fs-4 fw-bold">5</div>
                    <div className="text-muted">참가 토너먼트</div>
                  </div>
                  <div className="text-center">
                    <div className="fs-4 fw-bold">3</div>
                    <div className="text-muted">현재 예약</div>
                  </div>
                  <div className="text-center">
                    <div className="fs-4 fw-bold">2</div>
                    <div className="text-muted">즐겨찾기</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col>
            <Card className="asl-upcoming-card">
              <Card.Body>
                <Card.Title>다가오는 예약</Card.Title>
                <div className="asl-reservation-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5>주간 토너먼트</h5>
                      <div className="text-muted">오늘 19:00 @ 강남점</div>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate('/mobile/common/under-construction', { 
                        state: { 
                          title: '예약 상세', 
                          message: '예약 상세 보기 기능은 현재 개발 중입니다.' 
                        } 
                      })}
                    >
                      상세 보기
                    </Button>
                  </div>
                </div>
                <div className="asl-reservation-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5>주말 토너먼트</h5>
                      <div className="text-muted">토요일 14:00 @ 홍대점</div>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate('/mobile/common/under-construction', { 
                        state: { 
                          title: '예약 상세', 
                          message: '예약 상세 보기 기능은 현재 개발 중입니다.' 
                        } 
                      })}
                    >
                      상세 보기
                    </Button>
                  </div>
                </div>
                <div className="asl-reservation-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5>특별 이벤트</h5>
                      <div className="text-muted">일요일 16:00 @ 강남점</div>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate('/mobile/common/under-construction', { 
                        state: { 
                          title: '예약 상세', 
                          message: '예약 상세 보기 기능은 현재 개발 중입니다.' 
                        } 
                      })}
                    >
                      상세 보기
                    </Button>
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

export default UserDashboard;
