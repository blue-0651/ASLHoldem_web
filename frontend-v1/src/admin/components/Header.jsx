import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../../utils/auth';

const Header = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-header">
      <Container>
        <Row className="align-items-center">
          <Col>
            <h1>ASL 홀덤 관리자</h1>
            <p className="mb-0">토너먼트 및 매장 관리 시스템</p>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            {currentUser && (
              <>
                <span className="me-3">
                  {currentUser.username} ({currentUser.is_staff ? '관리자' : '사용자'})
                </span>
                <Button variant="outline-light" size="sm" onClick={handleLogout} className="me-3">
                  로그아웃
                </Button>
              </>
            )}
          
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Header; 