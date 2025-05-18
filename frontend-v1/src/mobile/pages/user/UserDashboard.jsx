import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, logout } from '../../../utils/auth';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

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

  // 외부 클릭 시 사이드바 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isNavOpen) {
        setIsNavOpen(false);
      }
    };

    if (isNavOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNavOpen]);

  const handleLogout = () => {
    logout();
    navigate('/mobile/login');
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // 현재 페이지가 활성화된 메뉴인지 확인
  const isActive = (path) => {
    return location.pathname === path;
  };

  // 메뉴 항목 정의
  const menuData = {
    main: {
      title: '메인 메뉴',
      items: [{ name: '홈', href: '/mobile/user/dashboard', icon: 'fas fa-home' }]
    },
    user: {
      title: '사용자 메뉴',
      items: [
        { name: '토너먼트 일정', href: '/mobile/common/tournaments-list', icon: 'fas fa-calendar-alt' },
        { name: '내 예약', href: '/mobile/common/reservations', icon: 'fas fa-ticket-alt' },
        { name: '매장 찾기', href: '/mobile/common/store-search', icon: 'fas fa-search-location' }
      ]
    },
    settings: {
      title: '설정',
      items: [
        { name: '환경 설정', href: '/mobile/common/settings', icon: 'fas fa-cog' },
        { name: '공지사항', href: '/mobile/common/notices', icon: 'fas fa-bullhorn' },
        { name: '로그아웃', href: '#', icon: 'fas fa-sign-out-alt', onClick: handleLogout }
      ]
    }
  };

  return (
    <div className="asl-mobile-container">
      {/* 헤더 */}
      <div className="asl-mobile-header">
        <button className="asl-mobile-nav-button" onClick={toggleNav}>
          <i className="fas fa-bars"></i>
        </button>
        <h1 className="asl-mobile-header-title">ASL 홀덤</h1>
        <img src="/images/asl_logo.png" alt="ASL 로고" className="asl-mobile-header-logo" />
      </div>

      {/* 오버레이 */}
      {isNavOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)'
          }}
          onClick={toggleNav}
        ></div>
      )}

      {/* 사이드바 */}
      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '80%',
          maxWidth: '320px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 101,
          overflowY: 'auto',
          boxShadow: '2px 0 20px rgba(0, 0, 0, 0.15)',
          transform: isNavOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: '0',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* 사이드바 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '20px 15px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            position: 'relative',
            background: '#3498db',
            color: 'white'
          }}
        >
          <img
            src="/images/asl_logo.png"
            alt="ASL 로고"
            style={{
              width: '40px',
              height: '40px',
              marginRight: '12px'
            }}
          />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>ASL 홀덤</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>일반 사용자</div>
          </div>
          <button
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%'
            }}
            onClick={toggleNav}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 사용자 정보 */}
        <div
          style={{
            padding: '15px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}
          >
            <i className="fas fa-user" style={{ color: '#777' }}></i>
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{user?.username || '사용자'}</div>
            <div style={{ fontSize: '14px', color: '#777' }}>{user?.email || '로그인 정보'}</div>
          </div>
        </div>

        {/* 메뉴 항목 */}
        <div style={{ marginTop: '10px' }}>
          {Object.entries(menuData).map(([key, category]) => (
            <div key={key} style={{ marginBottom: '15px' }}>
              {/* 카테고리 제목 */}
              <div
                style={{
                  padding: '12px 15px',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#333',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                {category.title}
              </div>

              {/* 메뉴 아이템 */}
              <div>
                {category.items.map((item) => (
                  <div
                    key={item.href}
                    style={{
                      padding: '12px 15px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: isActive(item.href) ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                      borderLeft: isActive(item.href) ? '4px solid #3498db' : '4px solid transparent'
                    }}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        navigate(item.href);
                      }
                      setIsNavOpen(false);
                    }}
                  >
                    <i
                      className={item.icon}
                      style={{
                        width: '24px',
                        textAlign: 'center',
                        marginRight: '15px',
                        fontSize: '18px',
                        color: isActive(item.href) ? '#3498db' : item.href === '#' ? '#e74c3c' : '#555'
                      }}
                    ></i>
                    <span
                      style={{
                        color: isActive(item.href) ? '#3498db' : item.href === '#' ? '#e74c3c' : '#333',
                        fontWeight: isActive(item.href) ? '600' : '400',
                        fontSize: '15px'
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 버전 정보 */}
        <div
          style={{
            padding: '15px',
            fontSize: '12px',
            color: '#999',
            textAlign: 'center',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            marginTop: '20px'
          }}
        >
          ASL 홀덤 v1.0.0
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="asl-mobile-dashboard">
        {/*<h2 className="asl-mobile-text" style={{ fontSize: '18px', marginBottom: '20px' }}>사용자 메뉴</h2>*/}
        <h5 className="asl-mobile-text mb-3">사용자 메뉴</h5>

        {/* 일반 사용자 컨텐츠 */}
        <Card className="asl-mobile-card">
          <Card.Body>
            <div className="asl-mobile-card-title">토너먼트 일정</div>
            <p>참여 가능한 토너먼트 일정을 확인합니다.</p>
            <Button variant="primary" className="asl-mobile-btn-secondary" onClick={() => navigate('/mobile/common/tournaments-list')}>
              토너먼트 보기
            </Button>
          </Card.Body>
        </Card>

        <Card className="asl-mobile-card">
          <Card.Body>
            <div className="asl-mobile-card-title">내 예약</div>
            <p>예약한 토너먼트를 확인합니다.</p>
            <Button variant="primary" className="mobile-btn-secondary" onClick={() => navigate('/mobile/common/reservations')}>
              예약 확인
            </Button>
          </Card.Body>
        </Card>

        <Card className="asl-mobile-card">
          <Card.Body>
            <div className="mobile-card-title">매장 찾기</div>
            <p>가까운 ASL 홀덤 매장을 찾습니다.</p>
            <Button variant="primary" className="mobile-btn-secondary" onClick={() => navigate('/mobile/common/store-search')}>
              매장 찾기
            </Button>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
