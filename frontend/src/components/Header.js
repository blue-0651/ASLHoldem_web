import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Header = () => {
  return (
    <div className="admin-header">
      <Container>
        <Row>
          <Col>
            <h1>ASL 홀덤 관리자</h1>
            <p className="mb-0">토너먼트 및 매장 관리 시스템</p>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <span className="me-3">관리자</span>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Header; 