import React from 'react';

// react-bootstrap
import { Card, Row, Col, Button, InputGroup, Form } from 'react-bootstrap';

// third party
import FeatherIcon from 'feather-icons-react';

// assets
import aslLogo from 'assets/images/asl-logo.png';
import { NavLink } from 'react-router-dom';

const StoreLoginPage = () => (
  <div className="asl-admin-wrapper">
    <div className="asl-admin-content text-center">
      <Card className="borderless asl-admin-card-bg">
        <Row className="align-items-center text-center">
          <Col>
            <Card.Body className="card-body">
              <img src={aslLogo} alt="" className="img-fluid mb-4 rounded" />
              <h4 className="mb-3 f-w-400 asl-admin-text">매장 관리자 로그인</h4>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <FeatherIcon icon="user" />
                </InputGroup.Text>
                <Form.Control type="text" placeholder="사용자명 입력" />
              </InputGroup>
              <InputGroup className="mb-4">
                <InputGroup.Text>
                  <FeatherIcon icon="lock" />
                </InputGroup.Text>
                <Form.Control type="password" placeholder="비밀번호 입력" />
              </InputGroup>
              <Button variant="secondary" size="lg" className="btn-block mt-4 mb-4 w-100">
                로그인
              </Button>
              <p className="mb-4 asl-admin-text">
                <NavLink to="/auth/signup-1" className="f-w-400">
                  <span className="asl-admin-text">아이디 찾기</span>
                </NavLink>
                &nbsp;{' | '}&nbsp;
                <NavLink to="/auth/reset-password-1" className="f-w-400">
                  <span className="asl-admin-text">비밀번호 찾기</span>
                </NavLink>
              </p>
              <p className="mb-2 asl-admin-text">
                <NavLink to="/auth/signin-1" className="f-w-400">
                  <span className="asl-admin-text text-decoration-underline text-underline-offset-4 fs-6">일반 사용자 로그인</span>
                </NavLink>
              </p>
            </Card.Body>
          </Col>
        </Row>
      </Card>
    </div>
  </div>
);

export default StoreLoginPage;
