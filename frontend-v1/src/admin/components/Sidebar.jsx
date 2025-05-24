import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  return (
    <div
      className="asl-mobile-container d-flex flex-column min-vh-100"
      style={{
        background: 'radial-gradient(circle at center, #7a0e29, #5c071c)',
        minWidth: 220,
        maxWidth: 260,
        padding: '0',
        borderRight: '1px solid #e0e0e0',
      }}
    >
      <div className="asl-mobile-logo-container" style={{ paddingTop: 30, marginBottom: 10 }}>
        <img
          src="/images/asl_logo.png"
          alt="ASL 로고"
          className="asl-mobile-logo"
          style={{ width: '90px', height: '90px', objectFit: 'contain', background: 'transparent', borderRadius: '8px' }}
        />
      </div>
      <Nav className="flex-column" style={{ flex: 1 }}>
        <Nav.Link
          as={Link}
          to="/"
          className={location.pathname === '/' ? 'active asl-mobile-nav-item' : 'asl-mobile-nav-item'}
          style={{ color: '#fff', fontWeight: 600, fontSize: 18, padding: '18px 24px', borderRadius: 0, background: location.pathname === '/' ? '#b5002e' : 'none' }}
        >
          <i className="bi bi-speedometer2 me-2"></i> 대시보드
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/tournaments"
          className={location.pathname === '/tournaments' ? 'active asl-mobile-nav-item' : 'asl-mobile-nav-item'}
          style={{ color: '#fff', fontWeight: 600, fontSize: 18, padding: '18px 24px', borderRadius: 0, background: location.pathname === '/tournaments' ? '#b5002e' : 'none' }}
        >
          <i className="bi bi-trophy me-2"></i> 토너먼트 관리
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/stores"
          className={location.pathname === '/stores' ? 'active asl-mobile-nav-item' : 'asl-mobile-nav-item'}
          style={{ color: '#fff', fontWeight: 600, fontSize: 18, padding: '18px 24px', borderRadius: 0, background: location.pathname === '/stores' ? '#b5002e' : 'none' }}
        >
          <i className="bi bi-shop me-2"></i> 매장 관리
        </Nav.Link>
      </Nav>
      <div className="mt-auto text-center mb-4" style={{ color: '#e4dfdf', fontSize: 13, letterSpacing: 1 }}>
        <small>© 2024 ASL 홀덤</small>
      </div>
    </div>
  );
};

export default Sidebar; 