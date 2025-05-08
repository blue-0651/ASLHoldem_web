import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '../../utils/auth';
import '../styles/MobileStyles.css';
import aslLogo from '../../assets/asl_logo.png';

const MobileLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('store'); // 'store' 또는 'user'
  const navigate = useNavigate();

  // 이미 로그인되어 있으면 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/mobile/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 로그인 시도
      const { success, error: loginError } = await login(username, password, userType);
      
      if (success) {
        // 로그인 성공 시 모바일 대시보드로 이동
        navigate('/mobile/dashboard');
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

  const toggleUserType = () => {
    setUserType(userType === 'store' ? 'user' : 'store');
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <Container className="mobile-login-container">
      <div className="mobile-logo-container">
        <img 
          src={aslLogo}
          alt="ASL 로고" 
          className="mobile-logo"
        />
        <h3 className="mt-3">ASL 홀덤</h3>
      </div>
      
      <div className="mobile-login-card">
        <div className="mobile-user-toggle">
          <button 
            className={`mobile-user-toggle-btn ${userType === 'store' ? 'active' : ''}`}
            onClick={() => userType !== 'store' && toggleUserType()}
          >
            매장 관리자
          </button>
          <button 
            className={`mobile-user-toggle-btn ${userType === 'user' ? 'active' : ''}`}
            onClick={() => userType !== 'user' && toggleUserType()}
          >
            일반 사용자
          </button>
        </div>
        
        {error && <Alert variant="danger" className="mobile-alert">{error}</Alert>}
        
        <Form onSubmit={handleSubmit} className="mobile-form">
          <Form.Group className="mb-3">
            <Form.Label>{userType === 'store' ? '매장 관리자 ID' : '사용자 ID'}</Form.Label>
            <Form.Control
              type="text"
              placeholder={userType === 'store' ? '매장 관리자 ID 입력' : '사용자 ID 입력'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mobile-form-control"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>비밀번호</Form.Label>
            <Form.Control
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mobile-form-control"
              required
            />
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading}
            className={`mobile-login-btn ${userType === 'store' ? 'store-btn' : 'user-btn'}`}
          >
            {isLoading ? '로그인 중...' : userType === 'store' ? '매장 관리자 로그인' : '일반 사용자 로그인'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default MobileLogin; 