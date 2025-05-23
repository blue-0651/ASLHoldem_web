import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, logout } from '../../utils/auth';
import { Navbar, Container } from 'react-bootstrap';

/**
 * 모바일 화면의 헤더 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.title - 헤더 타이틀
 * @param {boolean} props.backButton - 뒤로가기 버튼 표시 여부
 * @param {function} props.onBackClick - 뒤로가기 버튼 클릭 시 호출되는 함수
 */
const MobileHeader = ({ title, backButton, onBackClick }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const userType = localStorage.getItem('user_type');

  useEffect(() => {
    // 인증 상태 확인
    if (isAuthenticated()) {
      // 사용자 정보 가져오기
      const currentUser = getCurrentUser();
      setUser(currentUser);
    }
  }, []);

  // 외부 클릭 시 사이드바 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isNavOpen) {
        setIsNavOpen(false);
      }
    };

    if (isNavOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNavOpen]);

  const handleLogout = () => {
    logout();
    navigate('/mobile/login');
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  // 메뉴 항목 정의
  const getMenuItems = () => {
    // 매장관리자 메뉴 (요청한 4가지 항목)
    if (userType === 'store') {
      return [
        { name: "매장정보", href: "/mobile/store/info", icon: "fas fa-store" },
        { name: "토너먼트 관리", href: "/mobile/store/tournament", icon: "fas fa-trophy" },
        { name: "선수회원 등록", href: "/mobile/store/player-registration", icon: "fas fa-qrcode" },
        { name: "환경설정", href: "/mobile/common/settings", icon: "fas fa-cog" },
        { name: "로그아웃", href: "#", icon: "fas fa-sign-out-alt", onClick: handleLogout }
      ];
    } 
    // 일반 사용자 메뉴
    else {
      return [
        { name: "토너먼트 일정", href: "/mobile/common/tournaments-list", icon: "fas fa-calendar-alt" },
        { name: "내 예약", href: "/mobile/common/reservations", icon: "fas fa-ticket-alt" },
        { name: "매장 찾기", href: "/mobile/common/store-search", icon: "fas fa-search-location" },
        { name: "환경 설정", href: "/mobile/common/settings", icon: "fas fa-cog" },
        { name: "로그아웃", href: "#", icon: "fas fa-sign-out-alt", onClick: handleLogout }
      ];
    }
  };

  const menuItems = getMenuItems();

  // 현재 페이지가 활성화된 메뉴인지 확인
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* 헤더 */}
      <div className="asl-mobile-header">
        {backButton ? (
          <button
            className="mobile-nav-button"
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#333',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        ) : (
          <button
            className="asl-mobile-nav-button"
            onClick={toggleNav}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#333',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-bars"></i>
          </button>
        )}
        <h1 className="asl-mobile-header-title">{title}</h1>
        <div style={{ width: '24px' }}></div> {/* 균형을 위한 빈 공간 */}
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
            background: userType === 'store' ? '#2c3e50' : '#3498db',
            color: 'white'
          }}
        >
          <div style={{ width: '40px', marginRight: '12px', textAlign: 'center' }}>
            <i className={userType === 'store' ? "fas fa-store fa-lg" : "fas fa-user fa-lg"}></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>
              ASL 홀덤
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {userType === 'store' ? '매장 관리자' : '일반 사용자'}
            </div>
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
              cursor: 'pointer'
            }}
            onClick={toggleNav}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 사용자 정보 */}
        {user && (
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
                marginRight: '12px',
                color: '#777'
              }}
            >
              <i className="fas fa-user"></i>
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>
                {user.username || '사용자'}
              </div>
              <div style={{ fontSize: '13px', color: '#777' }}>
                {user.email || '이메일 정보 없음'}
              </div>
            </div>
          </div>
        )}

        {/* 메뉴 항목 */}
        <div style={{ padding: '10px 0' }}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '15px 20px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                backgroundColor: isActive(item.href) ? '#f0f0f0' : 'transparent',
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
                  color: userType === 'store' ? '#2c3e50' : '#3498db',
                  fontSize: '18px'
                }}
              ></i>
              <span style={{ marginLeft: '15px', fontSize: '16px' }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileHeader; 