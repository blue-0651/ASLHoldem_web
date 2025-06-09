import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { login } from '../../../utils/auth';
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
    // 하이픈 제거
    const cleanPhone = phone.replace(/-/g, '');
    
    // 숫자만 있는지 확인
    if (!/^\d+$/.test(cleanPhone)) {
      return false;
    }
    
    // 길이 확인 (하이픈 제외 11자리)
    if (cleanPhone.length !== 11) {
      return false;
    }
    
    // 010으로 시작하는지 확인
    if (!cleanPhone.startsWith('010')) {
      return false;
    }
    
    return true;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 전화번호 형식 검증
    if (!validatePhone(formData.phone)) {
      setError('전화번호는 010으로 시작하는 11자리 숫자여야 합니다.');
      setLoading(false);
      return;
    }

    // 비밀번호 길이 검증
    if (formData.password.length < 3) {
      setError('비밀번호는 3자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      console.log(`로그인 시도: ${formData.userType}`);
      
      // auth.jsx의 login 함수 사용
      const result = await login(formData.phone, formData.password, formData.userType);
      
      if (result.success) {
        console.log('로그인 성공:', result.user);
        
        // 사용자 유형에 따른 리다이렉션
        let redirectPath = '/mobile/user/dashboard'; // 기본값
        
        if (result.user.is_store_owner || result.user.role === 'STORE_OWNER') {
          redirectPath = '/mobile/store/dashboard';
        } else if (result.user.role === 'ADMIN') {
          redirectPath = '/admin/dashboard';
        }
        
        console.log(`리다이렉션: ${redirectPath}`);
        navigate(redirectPath);
      } else {
        throw new Error(result.error?.detail || '로그인에 실패했습니다.');
      }
      
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(err.message || '로그인에 실패했습니다. 전화번호와 비밀번호를 확인해주세요.');
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
                    style={{
                      color: formData.userType === 'user' ? 'white' : '#2c3e50',
                      backgroundColor: formData.userType === 'user' ? '#b5002e' : 'rgba(44, 62, 80, 0.1)',
                      fontWeight: '600'
                    }}
                  >
                    일반 사용자
                  </Button>
                  <Button 
                    className={`asl-mobile-user-toggle-btn ${formData.userType === 'store' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, userType: 'store'})}
                    type="button"
                    style={{
                      color: formData.userType === 'store' ? 'white' : '#2c3e50',
                      backgroundColor: formData.userType === 'store' ? '#b5002e' : 'rgba(44, 62, 80, 0.1)',
                      fontWeight: '600'
                    }}
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