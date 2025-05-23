import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import MobileHeader from '../../components/MobileHeader';

/**
 * 공사중 임시 페이지 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.title - 페이지 제목 (기본값: "공사중")
 * @param {string} props.message - 표시할 메시지 (기본값: "이 페이지는 현재 개발 중입니다.")
 * @param {boolean} props.showBackButton - 뒤로가기 버튼 표시 여부 (기본값: true)
 */
const UnderConstruction = ({ 
  title: propTitle = "공사중", 
  message: propMessage = "이 페이지는 현재 개발 중입니다.",
  showBackButton = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 라우트 state에서 제목과 메시지를 가져오거나 props 사용
  const title = location.state?.title || propTitle;
  const message = location.state?.message || propMessage;

  return (
    <div className="asl-mobile-container">
      <MobileHeader 
        title={title} 
        backButton={showBackButton}
        showMenuButton={!showBackButton}
      />
      
      <div className="asl-mobile-content">
        <div className="asl-mobile-empty-state">
          <i className="fas fa-tools asl-mobile-empty-icon" style={{ fontSize: '60px', color: '#f39c12' }}></i>
          <h3 style={{ color: '#2c3e50', marginTop: '20px', marginBottom: '15px' }}>
            공사중입니다
          </h3>
          <p className="asl-mobile-text" style={{ textAlign: 'center', marginBottom: '30px' }}>
            {message}
          </p>
          <p className="asl-mobile-text" style={{ textAlign: 'center', fontSize: '14px', color: '#7f8c8d' }}>
            빠른 시일 내에 서비스를 제공하겠습니다.
          </p>
          
          <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {showBackButton && (
              <Button 
                variant="outline-primary" 
                onClick={() => navigate(-1)}
                className="asl-mobile-btn-secondary"
              >
                <i className="fas fa-arrow-left me-2"></i>
                뒤로가기
              </Button>
            )}
            <Button 
              variant="primary" 
              onClick={() => navigate('/mobile/dashboard')}
              className="asl-mobile-btn-primary"
            >
              <i className="fas fa-home me-2"></i>
              홈으로
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction; 