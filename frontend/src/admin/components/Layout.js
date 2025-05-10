import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        <Col md={2} className="admin-sidebar">
          <Sidebar />
        </Col>
        <Col md={10} className="content-area">
          <Header />
          <Container fluid className="py-3">
            <Outlet />
          </Container>
        </Col>
      </Row>
    </Container>
  );
};

export default Layout; 