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
    phone: '',
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

  // 전화번호 형식 검증
  const validatePhone = (phone) => {
    const phoneRegex = /^\d{3}-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  // JWT 토큰 디코딩 함수
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('토큰 디코딩 오류:', error);
      return null;
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 전화번호 형식 검증
    if (!validatePhone(formData.phone)) {
      setError('전화번호는 010-1234-5678 형식으로 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 로그인 API 호출
      let loginUrl = '/accounts/token/user/'; // 기본값: 일반 사용자
      if (formData.userType === 'store') {
        loginUrl = '/accounts/token/store/'; // 매장 관리자
      }
      
      console.log(`로그인 시도: ${formData.userType} - ${loginUrl}`);
      
      const response = await API.post(loginUrl, {
        phone: formData.phone,
        password: formData.password
      });
      
      // 토큰 저장 (백엔드 응답에 맞게 수정)
      localStorage.setItem('asl_holdem_access_token', response.data.access);
      localStorage.setItem('asl_holdem_refresh_token', response.data.refresh);
      
      // 토큰에서 실제 사용자 유형 확인
      const tokenPayload = decodeJWT(response.data.access);
      console.log('토큰 내용:', tokenPayload);
      
      let actualUserType = 'user'; // 기본값
      let redirectPath = '/mobile/user/dashboard'; // 기본값
      
      if (tokenPayload) {
        // 토큰에서 사용자 유형 결정
        if (tokenPayload.user_type === 'store_manager' || tokenPayload.is_store_owner === true) {
          actualUserType = 'store';
          redirectPath = '/mobile/store/dashboard';
        } else if (tokenPayload.user_type === 'admin') {
          actualUserType = 'admin';
          redirectPath = '/admin/dashboard';
        } else {
          actualUserType = 'user';
          redirectPath = '/mobile/user/dashboard';
        }
      }
      
      // 사용자 정보 저장 (실제 토큰 내용 기반)
      localStorage.setItem('user_type', actualUserType);
      localStorage.setItem('user_data', JSON.stringify({
        phone: formData.phone,
        userType: actualUserType,
        is_store_owner: tokenPayload?.is_store_owner || false,
        user_type_from_token: tokenPayload?.user_type || 'unknown'
      }));
      
      console.log(`실제 사용자 유형: ${actualUserType}, 리다이렉션: ${redirectPath}`);
      
      // 실제 사용자 유형에 따른 리다이렉션
      navigate(redirectPath);
      
    } catch (err) {
      console.error('로그인 오류:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.non_field_errors?.[0] || 
                          '로그인에 실패했습니다. 전화번호와 비밀번호를 확인해주세요.';
      setError(errorMessage);
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
                <Form.Label>전화번호</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  placeholder="전화번호를 입력하세요 (010-1234-5678)"
                  value={formData.phone}
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