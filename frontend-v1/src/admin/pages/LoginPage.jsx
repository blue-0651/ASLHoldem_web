import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, InputGroup, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import FeatherIcon from 'feather-icons-react';
import { login, isAuthenticated } from '../../utils/auth';
import aslLogo from 'assets/images/asl-logo-120.png';

// TODO(SJHAN): Login.js 과 동일한 동작을 하는 코드로 화면 스타일만 변경
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 이미 로그인되어 있으면 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(`[MgrLoginPage] Login attempt for user: ${username}`);

    setIsLoading(true);
    setError('');

    try {
      // 관리자 로그인 시도
      const { success, error: loginError } = await login(username, password, 'admin');

      if (success) {
        // 로그인 성공 시 대시보드로 이동
        console.log(`[MgrLoginPage] Login successful for user: ${username}`);
        navigate('/dashboard');
      } else {
        // 로그인 실패 시 오류 메시지 표시
        setError(loginError.detail || '로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('[MgrLoginPage] Login error:', err);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="asl-admin-wrapper" style={{ alignItems: 'flex-start' }}>
        <div className="asl-admin-content text-center">
          <img src={aslLogo} alt="" className="img-fluid mt-5 mb-4 w-10 rounded" />
          <h2 className="mb-5 f-w-400 asl-admin-text">ASL 본사 관리자 로그인</h2>
          <Card className="borderless maintenance-bg">
            <Row className="align-items-center text-center">
              <Col>
                <Card.Body className="card-body">
                  {error && <Alert variant="danger">{error}</Alert>}
                  <Form onSubmit={handleSubmit}>
                    <div className="d-flex justify-content-center">
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FeatherIcon icon="user" />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="관리자 ID 입력"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                    <div className="d-flex justify-content-center">
                      <InputGroup className="mb-5">
                        <InputGroup.Text>
                          <FeatherIcon icon="lock" />
                        </InputGroup.Text>
                        <Form.Control
                          type="password"
                          placeholder="비밀번호 입력"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                    <Button type="submit" disabled={isLoading} variant="info" size="lg" className="btn-block w-100">
                      {isLoading ? '로그인 중...' : '관리자 로그인'}
                    </Button>
                  </Form>
                  <h6 className="mt-5 f-w-400 asl-admin-text">© 2025 ASL. 모든 권리 보유.</h6>
                </Card.Body>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
