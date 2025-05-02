import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  return (
    <div className="py-4 d-flex flex-column min-vh-100">
      <h3 className="text-center mb-4">ASL 홀덤</h3>
      <Nav className="flex-column">
        <Nav.Link 
          as={Link} 
          to="/" 
          className={location.pathname === '/' ? 'active' : ''}
        >
          대시보드
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/tournaments" 
          className={location.pathname === '/tournaments' ? 'active' : ''}
        >
          토너먼트 관리
        </Nav.Link>
        <Nav.Link 
          as={Link} 
          to="/stores" 
          className={location.pathname === '/stores' ? 'active' : ''}
        >
          매장 관리
        </Nav.Link>
      </Nav>
      <div className="mt-auto text-center mb-4">
        <small>© 2024 ASL 홀덤</small>
      </div>
    </div>
  );
};

export default Sidebar; 