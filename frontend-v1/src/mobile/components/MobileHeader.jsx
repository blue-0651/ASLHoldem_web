import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, logout } from '../../utils/auth';
import { getDisplayName } from '../../utils/userUtils';

/**
 * 모바일 화면의 헤더 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.title - 헤더 타이틀
 * @param {boolean} props.backButton - 뒤로가기 버튼 표시 여부
 * @param {function} props.onBackClick - 뒤로가기 버튼 클릭 시 호출되는 함수
 * @param {boolean} props.showMenuButton - 메뉴 버튼 표시 여부 (기본값: true)
 */
const MobileHeader = ({ title, backButton = false, onBackClick, showMenuButton = true }) => {
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

  // 대시보드로 이동하는 함수
  const handleGoToDashboard = () => {
    const dashboardPath = userType === 'store' 
      ? '/mobile/store/dashboard' 
      : '/mobile/user/dashboard';
    navigate(dashboardPath);
    setIsNavOpen(false); // 사이드바 닫기
  };

  // 메뉴 항목 정의
  const getMenuItems = () => {
    // 매장관리자 메뉴
    if (userType === 'store') {
      return [
        { name: "매장정보", href: "/mobile/store/info", icon: "fas fa-store" },
        { name: "토너먼트 관리", href: "/mobile/store/tournament", icon: "fas fa-trophy" },
        { name: "선수회원 등록", href: "/mobile/store/player-registration", icon: "fas fa-qrcode" },
        { name: "환경설정", href: "/mobile/common/settings", icon: "fas fa-cog" },
        { name: "로그아웃", href: "#", icon: "fas fa-sign-out-alt", onClick: handleLogout, isLogout: true }
      ];
    } 
    // 일반 사용자 메뉴
    else {
      return [
        { name: "토너먼트 일정", href: "/mobile/common/tournaments-list", icon: "fas fa-calendar-alt" },
        { name: "내 예약", href: "/mobile/common/reservations", icon: "fas fa-ticket-alt" },
        { name: "매장 찾기", href: "/mobile/common/store-search", icon: "fas fa-search-location" },
        { name: "환경 설정", href: "/mobile/common/settings", icon: "fas fa-cog" },
        { name: "로그아웃", href: "#", icon: "fas fa-sign-out-alt", onClick: handleLogout, isLogout: true }
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
            className="asl-mobile-nav-toggle"
            onClick={handleBack}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        ) : showMenuButton ? (
          <button
            className="asl-mobile-nav-toggle"
            onClick={toggleNav}
          >
            <i className="fas fa-bars"></i>
          </button>
        ) : (
          <div style={{ width: '40px' }}></div>
        )}
        <h1 className="asl-mobile-header-title">{title}</h1>
        <div style={{ width: '40px' }}></div> {/* 균형을 위한 빈 공간 */}
      </div>

      {/* 오버레이 */}
      <div
        className={`asl-mobile-drawer-overlay ${isNavOpen ? 'open' : ''}`}
        onClick={toggleNav}
      ></div>

      {/* 사이드바 */}
      <div
        ref={sidebarRef}
        className={`asl-mobile-drawer ${isNavOpen ? 'open' : ''}`}
      >
        {/* 사이드바 헤더 */}
        <div className={`asl-mobile-drawer-header ${userType === 'store' ? 'store' : 'user'}`}>
          <div 
            className="drawer-logo-section" 
            onClick={handleGoToDashboard}
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              flex: 1,
              padding: '10px 0'
            }}
          >
            <div className="drawer-icon">
              <i className={userType === 'store' ? "fas fa-store" : "fas fa-user"}></i>
            </div>
            <div className="drawer-title">
              <div className="main-title">ASL 홀덤</div>
              <div className="sub-title">
                {userType === 'store' ? '매장 관리자' : '일반 사용자'}
              </div>
            </div>
          </div>
          <button className="close-button" onClick={toggleNav}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 사용자 정보 */}
        {user && (
          <div className="asl-mobile-drawer-user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <div className="username">{getDisplayName(user, '사용자')}</div>
              <div className="email">{user.email || '이메일 정보 없음'}</div>
            </div>
          </div>
        )}

        {/* 메뉴 항목 */}
        <div className="asl-mobile-drawer-menu">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
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
                className={`${item.icon} menu-icon ${
                  item.isLogout ? 'logout' : 
                  userType === 'store' ? 'store' : 'user'
                }`}
              ></i>
              <span className={`menu-text ${item.isLogout ? 'logout' : ''}`}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileHeader; 