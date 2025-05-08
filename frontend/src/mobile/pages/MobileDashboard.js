import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, logout } from '../../utils/auth';
import '../styles/MobileStyles.css';
import aslLogo from '../../assets/asl_logo.png';

const MobileDashboard = () => {
  const [user, setUser] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();
  const userType = localStorage.getItem('user_type');

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

  const handleLogout = () => {
    logout();
    navigate('/mobile/login');
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // 매장 관리자용 컨텐츠
  const renderStoreManagerContent = () => (
    <>
      <Card className="mobile-card">
        <Card.Body>
          <div className="mobile-card-title">토너먼트 관리</div>
          <p>매장의 토너먼트를 등록하고 관리합니다.</p>
          <Button 
            variant="primary" 
            className="mobile-btn-primary"
            onClick={() => navigate('/mobile/tournaments')}
          >
            토너먼트 관리
          </Button>
        </Card.Body>
      </Card>

      <Card className="mobile-card">
        <Card.Body>
          <div className="mobile-card-title">매장 정보</div>
          <p>매장 정보를 확인하고 수정합니다.</p>
          <Button 
            variant="primary" 
            className="mobile-btn-primary"
            onClick={() => navigate('/mobile/store-info')}
          >
            매장 정보 관리
          </Button>
        </Card.Body>
      </Card>

      <Card className="mobile-card">
        <Card.Body>
          <div className="mobile-card-title">QR 코드 관리</div>
          <p>매장 QR 코드를 관리합니다.</p>
          <Button 
            variant="primary" 
            className="mobile-btn-primary"
            onClick={() => navigate('/mobile/qr-codes')}
          >
            QR 코드 관리
          </Button>
        </Card.Body>
      </Card>
    </>
  );

  // 일반 사용자용 컨텐츠
  const renderUserContent = () => (
    <>
      <Card className="mobile-card">
        <Card.Body>
          <div className="mobile-card-title">토너먼트 일정</div>
          <p>참여 가능한 토너먼트 일정을 확인합니다.</p>
          <Button 
            variant="primary" 
            className="mobile-btn-secondary"
            onClick={() => navigate('/mobile/tournaments-list')}
          >
            토너먼트 보기
          </Button>
        </Card.Body>
      </Card>

      <Card className="mobile-card">
        <Card.Body>
          <div className="mobile-card-title">내 예약</div>
          <p>예약한 토너먼트를 확인합니다.</p>
          <Button 
            variant="primary" 
            className="mobile-btn-secondary"
            onClick={() => navigate('/mobile/my-reservations')}
          >
            예약 확인
          </Button>
        </Card.Body>
      </Card>

      <Card className="mobile-card">
        <Card.Body>
          <div className="mobile-card-title">매장 찾기</div>
          <p>가까운 ASL 홀덤 매장을 찾습니다.</p>
          <Button 
            variant="primary" 
            className="mobile-btn-secondary"
            onClick={() => navigate('/mobile/find-stores')}
          >
            매장 찾기
          </Button>
        </Card.Body>
      </Card>
    </>
  );

  return (
    <div className="mobile-container">
      {/* 헤더 */}
      <div className="mobile-header">
        <button className="mobile-nav-button" onClick={toggleNav}>
          <i className="fas fa-bars"></i>
        </button>
        <h1 className="mobile-header-title">ASL 홀덤</h1>
        <img 
          src={aslLogo}
          alt="ASL 로고" 
          className="mobile-header-logo"
        />
      </div>
      
      {/* 네비게이션 오버레이 */}
      <div className={`mobile-nav-overlay ${isNavOpen ? 'open' : ''}`} onClick={toggleNav}></div>
      
      {/* 사이드 네비게이션 */}
      <div className={`mobile-nav ${isNavOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <img 
            src={aslLogo}
            alt="ASL 로고" 
            style={{ width: 40, height: 'auto' }}
          />
          <div className="mobile-nav-user">
            <p className="mobile-nav-username">{user?.username || '사용자'}</p>
            <p className="mobile-nav-role">{userType === 'store' ? '매장 관리자' : '일반 사용자'}</p>
          </div>
        </div>
        
        {userType === 'store' ? (
          <>
            <div className="mobile-nav-item">
              <i className="fas fa-home"></i>
              <a href="/mobile/dashboard" className="mobile-nav-link">홈</a>
            </div>
            <div className="mobile-nav-item">
              <i className="fas fa-trophy"></i>
              <a href="/mobile/tournaments" className="mobile-nav-link">토너먼트 관리</a>
            </div>
            <div className="mobile-nav-item">
              <i className="fas fa-store"></i>
              <a href="/mobile/store-info" className="mobile-nav-link">매장 정보</a>
            </div>
            <div className="mobile-nav-item">
              <i className="fas fa-qrcode"></i>
              <a href="/mobile/qr-codes" className="mobile-nav-link">QR 코드 관리</a>
            </div>
          </>
        ) : (
          <>
            <div className="mobile-nav-item">
              <i className="fas fa-home"></i>
              <a href="/mobile/dashboard" className="mobile-nav-link">홈</a>
            </div>
            <div className="mobile-nav-item">
              <i className="fas fa-trophy"></i>
              <a href="/mobile/tournaments-list" className="mobile-nav-link">토너먼트 일정</a>
            </div>
            <div className="mobile-nav-item">
              <i className="fas fa-calendar-check"></i>
              <a href="/mobile/my-reservations" className="mobile-nav-link">내 예약</a>
            </div>
            <div className="mobile-nav-item">
              <i className="fas fa-store"></i>
              <a href="/mobile/find-stores" className="mobile-nav-link">매장 찾기</a>
            </div>
          </>
        )}
        
        <div className="mobile-nav-item">
          <i className="fas fa-user-cog"></i>
          <a href="/mobile/profile" className="mobile-nav-link">내 정보</a>
        </div>
        
        <div className="mobile-nav-item">
          <i className="fas fa-sign-out-alt"></i>
          <a href="#" className="mobile-nav-link" onClick={handleLogout}>로그아웃</a>
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="mobile-dashboard">
        <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>
          {userType === 'store' ? '매장 관리 메뉴' : '사용자 메뉴'}
        </h2>
        
        {/* 사용자 타입에 따라 다른 컨텐츠 렌더링 */}
        {userType === 'store' ? renderStoreManagerContent() : renderUserContent()}
      </div>
    </div>
  );
};

export default MobileDashboard; 