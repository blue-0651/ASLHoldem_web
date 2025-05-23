import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import API from '../../../utils/api';
import '../../../assets/scss/mobile/_mobile-commons.scss';

/**
 * 모바일 로그인 페이지 컴포넌트
 * 매장 관리자와 일반 사용자 모두 이 페이지를 통해 로그인 합니다.
 */
const MobileLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'user' // 기본값은 일반 사용자
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 로그인 API 호출
      let loginUrl = '/accounts/token/user/'; // 기본값: 일반 사용자
      if (formData.userType === 'store') {
        loginUrl = '/accounts/token/store/'; // 매장 관리자
      }
      const response = await API.post(loginUrl, formData);
      
      // 토큰 저장
      localStorage.setItem('asl_holdem_access_token', response.data.access_token);
      localStorage.setItem('asl_holdem_refresh_token', response.data.refresh_token);
      
      // 사용자 정보 저장
      localStorage.setItem('user_type', formData.userType);
      localStorage.setItem('user_data', JSON.stringify({
        username: formData.username,
        userType: formData.userType,
      }));
      
      // 리다이렉션
      if (formData.userType === 'store') {
        navigate('/mobile/store/dashboard');
      } else {
        navigate('/mobile/user/dashboard');
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      setError('로그인에 실패했습니다. 사용자 이름과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asl-mobile-container">
      <div className="asl-mobile-logo-container">
        <img 
          src="/images/asl_logo.png" 
          alt="ASL 홀덤 로고" 
          className="asl-mobile-logo"
        />
      </div>

      <Container className="asl-mobile-login-container">
        <Card className="asl-mobile-login-card">
          <Card.Body>
            <div className="text-center mb-4">
              <h2 className="mb-2">ASL 홀덤</h2>
              <p className="text-muted">계정에 로그인하세요</p>
            </div>
            
            {error && (
              <Alert variant="danger" className="asl-mobile-alert">
                {error}
              </Alert>
            )}
            
            <Form className="asl-mobile-form" onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label>사용자 유형</Form.Label>
                <div className="asl-mobile-user-toggle">
                  <Button 
                    className={`asl-mobile-user-toggle-btn ${formData.userType === 'user' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, userType: 'user'})}
                    type="button"
                  >
                    일반 사용자
                  </Button>
                  <Button 
                    className={`asl-mobile-user-toggle-btn ${formData.userType === 'store' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, userType: 'store'})}
                    type="button"
                  >
                    매장 관리자
                  </Button>
                </div>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>아이디</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  placeholder="아이디를 입력하세요"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="asl-mobile-form-control"
                />
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>비밀번호</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="asl-mobile-form-control"
                />
              </Form.Group>
              
              <Button 
                type="submit" 
                className={`asl-mobile-login-btn ${formData.userType === 'user' ? 'asl-user-btn' : 'asl-store-btn'}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    로그인 중...
                  </>
                ) : '로그인'}
              </Button>
            </Form>
            
            <div className="text-center mt-4">
              <Link to="/forgot-password" className="d-block mb-2">비밀번호를 잊으셨나요?</Link>
              <p className="mb-0">
                계정이 없으신가요? <Link to="/mobile/signup">회원가입</Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default MobileLogin; 