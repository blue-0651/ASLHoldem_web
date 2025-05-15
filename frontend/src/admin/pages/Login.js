import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '../../utils/auth';

const Login = () => {
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
    setIsLoading(true);
    setError('');

    // 디버그 로그 추가
    console.log('관리자 로그인 시도:', { username, password: '******' });

    try {
      // 관리자 로그인 시도 (admin 타입 유지)
      const { success, error: loginError } = await login(username, password, 'admin');
      
      console.log('로그인 결과:', { success, error: loginError });
      
      if (success) {
        // 로그인 성공 시 대시보드로 이동
        navigate('/dashboard');
      } else {
        // 로그인 실패 시 오류 메시지 표시
        setError(loginError.detail || '로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col lg={6} md={8} sm={10} xs={12} className="text-center mb-4">
          <div className="text-center mb-4">
            <img 
              src="/images/asl_logo.png"
              alt="ASL 로고" 
              style={{
                width: '120px',
                height: '120px',
                maxWidth: '100%',
                objectFit: 'contain',
                background: 'transparent',
                borderRadius: '4px'
              }} 
            />
          </div>
          <h2 className="mt-3">ASL 홀덤 본사관리자 로그인</h2>
        </Col>
      </Row>
      
      <Row className="justify-content-center">
        <Col lg={6} md={8} sm={10} xs={12}>
          <Card className="mb-4">
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>관리자 ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="관리자 ID 입력"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>비밀번호</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={isLoading}
                    style={{ 
                      backgroundColor: '#b01836', 
                      borderColor: '#b01836' 
                    }}
                  >
                    {isLoading ? '로그인 중...' : '관리자 로그인'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login; 