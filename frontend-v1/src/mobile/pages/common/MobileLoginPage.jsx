import React, { useState } from 'react';
import { Card, Row, Col, Button, InputGroup, Form } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import aslLogo from 'assets/images/asl-logo.png';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

// 간소화된 API 인스턴스 생성
const API = axios.create({
  baseURL: '/api/v1'
});

// 요청/응답 로깅 인터셉터 추가
API.interceptors.request.use(
  (config) => {
    console.log(`API 요청: ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API 응답 오류: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error('API 응답 없음:', error.request);
    } else {
      console.error('API 오류:', error.message);
    }
    return Promise.reject(error);
  }
);

const MobileLoginPage = () => {
  const [loginType, setLoginType] = useState('user'); // 'user' or 'store'

  const isUser = loginType === 'user';

  return (
    <div className="asl-admin-wrapper">
      <div className="asl-admin-content text-center">
        <Card className="borderless asl-admin-card-bg">
          <Row className="align-items-center text-center">
            <Col>
              <Card.Body className="card-body">
                <img src={aslLogo} alt="" className="img-fluid mb-4 rounded" />
                <h4 className="mb-3 f-w-400 asl-admin-text">{isUser ? 'ASL 사용자 로그인' : '매장 관리자 로그인'}</h4>
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
                <Button variant={isUser ? 'primary' : 'secondary'} size="lg" className="btn-block mt-4 mb-4 w-100">
                  로그인
                </Button>
                {isUser ? (
                  <>
                    <p className="mb-4 asl-admin-text">
                      <NavLink to="/auth/signin-1" className="f-w-400">
                        <span className="asl-admin-text">회원가입</span>
                      </NavLink>
                      &nbsp;{' | '}&nbsp;
                      <NavLink to="/auth/signup-1" className="f-w-400">
                        <span className="asl-admin-text">아이디 찾기</span>
                      </NavLink>
                      &nbsp;{' | '}&nbsp;
                      <NavLink to="/auth/reset-password-1" className="f-w-400">
                        <span className="asl-admin-text">비밀번호 찾기</span>
                      </NavLink>
                    </p>
                    <p className="mb-2 asl-admin-text">
                      <span
                        className="asl-admin-text text-decoration-underline text-underline-offset-4 fs-6"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setLoginType('store')}
                        onKeyDown={(e) => e.key === 'Enter' && setLoginType('store')}
                        role="button"
                        tabIndex={0}
                      >
                        매장 관리자 로그인
                      </span>
                    </p>
                  </>
                ) : (
                  <>
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
                      <span
                        className="asl-admin-text text-decoration-underline text-underline-offset-4 fs-6"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setLoginType('user')}
                        onKeyDown={(e) => e.key === 'Enter' && setLoginType('user')}
                        role="button"
                        tabIndex={0}
                      >
                        일반 사용자 로그인
                      </span>
                    </p>
                  </>
                )}
              </Card.Body>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default MobileLoginPage;
