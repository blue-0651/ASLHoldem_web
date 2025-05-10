import React, { useState } from 'react';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/MobileStyles.css';

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

const MobileLogin = () => {
  const [userType, setUserType] = useState('user'); // 'user' 또는 'store'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 사용자 유형에 따라 다른 API 엔드포인트 호출
      const endpoint = userType === 'user' 
        ? '/accounts/token/user/' 
        : '/accounts/token/';
        
      const response = await API.post(endpoint, {
        username,
        password
      });
      
      if (response.data && response.data.access) {
        console.log('로그인 성공:', response.data);
        // 로그인 성공 - 토큰과 사용자 정보 저장
        localStorage.setItem('asl_holdem_access_token', response.data.access);
        localStorage.setItem('asl_holdem_refresh_token', response.data.refresh);
        localStorage.setItem('user_type', userType);
        
        // 사용자 정보가 있으면 저장
        if (response.data.user) {
          localStorage.setItem('asl_holdem_user_info', JSON.stringify(response.data.user));
        }
        
        // 사용자 유형에 따라 다른 대시보드로 리디렉션
        if (userType === 'user') {
          navigate('/mobile/user/dashboard');
        } else {
          navigate('/mobile/store/dashboard');
        }
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(
        err.response?.data?.detail || 
        '로그인에 실패했습니다. 사용자 이름과 비밀번호를 확인하세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-login-container">
      <div className="mobile-logo-container">
        <img 
          src="/images/asl_logo.png" 
          alt="ASL 홀덤 로고" 
          className="mobile-logo"
        />
        <h2 style={{ marginTop: '10px', fontSize: '20px', fontWeight: 'bold' }}>ASL 홀덤</h2>
      </div>
      
      <div className="mobile-login-card">
        <h3 style={{ marginBottom: '20px', fontSize: '18px', textAlign: 'center' }}>
          로그인
        </h3>
        
        {/* 사용자 유형 토글 */}
        <div className="mobile-user-toggle">
          <button 
            className={`mobile-user-toggle-btn ${userType === 'user' ? 'active' : ''}`}
            onClick={() => setUserType('user')}
            type="button"
          >
            일반 사용자
          </button>
          <button 
            className={`mobile-user-toggle-btn ${userType === 'store' ? 'active' : ''}`}
            onClick={() => setUserType('store')}
            type="button"
          >
            매장 관리자
          </button>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <Alert variant="danger" className="mobile-alert">
            {error}
          </Alert>
        )}
        
        {/* 로그인 폼 */}
        <Form onSubmit={handleSubmit} className="mobile-form">
          <Form.Group controlId="username">
            <Form.Control
              type="text"
              placeholder="사용자 이름"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mobile-form-control"
            />
          </Form.Group>
          
          <Form.Group controlId="password">
            <Form.Control
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mobile-form-control"
            />
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
            className={`mobile-login-btn ${userType === 'store' ? 'store-btn' : 'user-btn'}`}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </Form>
        
        {/* 계정 관련 링크 */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          <p>
            계정이 없으신가요? <a href="#" style={{ color: '#3498db', textDecoration: 'none' }}>가입하기</a>
          </p>
          <p>
            <a href="#" style={{ color: '#777', textDecoration: 'none' }}>비밀번호를 잊으셨나요?</a>
          </p>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '20px' }}>
        © 2023 ASL 홀덤. 모든 권리 보유.
      </div>
    </div>
  );
};

export default MobileLogin; 