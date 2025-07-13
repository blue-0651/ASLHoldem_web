import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, getToken } from '../../../utils/auth';
import { getDisplayName } from '../../../utils/userUtils';
import MobileHeader from '../../components/MobileHeader';

const QRCode = () => {
  const [user, setUser] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 인증 상태 확인
    if (!isAuthenticated()) {
      navigate('/mobile/login');
      return;
    }
    
    // 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // QR 코드 데이터 가져오기
    fetchQRCode();
  }, [navigate]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getToken();
      if (!token) {
        setError('로그인 토큰이 없습니다. 다시 로그인해주세요.');
        navigate('/mobile/login');
        return;
      }
      
      console.log('QR 코드 조회 시작...');
      
      const response = await fetch('/api/v1/user/my-qr-code/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API 응답 상태:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('로그인이 만료되었습니다. 다시 로그인해주세요.');
          navigate('/mobile/login');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('QR 코드 데이터:', data);

      if (data.success) {
        setQrData(data.user_info);
        console.log('QR 코드 URL:', data.user_info.qr_code_url);
      } else {
        setError(data.error || 'QR 코드를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('QR 코드 조회 오류:', err);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('네트워크 연결을 확인해주세요.');
      } else {
        setError(err.message || '네트워크 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchQRCode();
  };

  const handleDownload = () => {
    if (qrData?.qr_code_url) {
      // QR 코드 이미지 다운로드
      const link = document.createElement('a');
      link.href = qrData.qr_code_url;
      link.download = `qr_code_${qrData.nickname || qrData.phone}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (navigator.share && qrData?.qr_code_url) {
      try {
        await navigator.share({
          title: 'ASL 홀덤 QR 코드',
          text: `${getDisplayName(qrData, '사용자')}님의 ASL 홀덤 QR 코드입니다.`,
          url: qrData.qr_code_url
        });
      } catch (err) {
        console.log('공유 취소됨');
      }
    } else {
      // 클립보드에 URL 복사
      if (qrData?.qr_code_url) {
        navigator.clipboard.writeText(qrData.qr_code_url);
        alert('QR 코드 URL이 클립보드에 복사되었습니다.');
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleImageStart = () => {
    setImageLoading(true);
    setImageError(false);
  };

  return (
    <div className="asl-mobile-container">
      <MobileHeader 
        title="내 QR 코드" 
        showBackButton={true}
        onBackClick={() => navigate('/mobile/user/dashboard')}
      />
      
      <Container className="asl-mobile-content">
        {loading ? (
          <Row className="justify-content-center">
            <Col xs="auto">
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">로딩 중...</span>
                </Spinner>
                <div className="mt-2">QR 코드를 불러오는 중...</div>
              </div>
            </Col>
          </Row>
        ) : error ? (
          <Row>
            <Col>
              <Alert variant="danger" className="mb-4">
                <Alert.Heading>오류 발생</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={handleRefresh}>
                  다시 시도
                </Button>
              </Alert>
            </Col>
          </Row>
        ) : qrData ? (
          <>
            {/* 사용자 정보 카드 */}
            <Row className="mb-4">
              <Col>
                <Card className="asl-user-info-card">
                  <Card.Body className="text-center">
                    <div className="mb-3">
                      <i className="fas fa-user-circle fa-3x text-primary"></i>
                    </div>
                    <h4>{getDisplayName(qrData, '사용자')}</h4>
                    <p className="text-muted mb-0">{qrData.phone}</p>
                    {qrData.email && (
                      <p className="text-muted mb-0">{qrData.email}</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* QR 코드 카드 */}
            <Row className="mb-4">
              <Col>
                <Card className="asl-qr-code-card">
                  <Card.Body className="text-center">
                    <Card.Title className="mb-4">
                      <i className="fas fa-qrcode me-2"></i>
                      내 QR 코드
                    </Card.Title>
                    
                    {qrData.qr_code_url ? (
                      <div className="qr-code-container mb-4" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        minHeight: '300px'
                      }}>
                        {imageLoading && (
                          <div className="text-center mb-3">
                            <Spinner animation="border" size="sm" />
                            <div className="mt-2">QR 코드 로딩 중...</div>
                          </div>
                        )}
                        
                        {imageError ? (
                          <div className="mb-4">
                            <Alert variant="warning">
                              <div className="text-center">
                                <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
                                <p>QR 코드 이미지를 불러올 수 없습니다.</p>
                                <Button 
                                  variant="outline-warning" 
                                  size="sm"
                                  onClick={() => {
                                    setImageError(false);
                                    handleImageStart();
                                  }}
                                >
                                  다시 시도
                                </Button>
                              </div>
                            </Alert>
                          </div>
                        ) : (
                          <img 
                            src={qrData.qr_code_url} 
                            alt="사용자 QR 코드"
                            className="img-fluid"
                            style={{ 
                              maxWidth: '250px', 
                              maxHeight: '250px',
                              width: '250px',
                              height: '250px',
                              objectFit: 'contain',
                              border: '2px solid #dee2e6',
                              borderRadius: '8px',
                              padding: '10px',
                              backgroundColor: 'white',
                              display: imageLoading ? 'none' : 'block',
                              margin: '0 auto',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            onLoadStart={handleImageStart}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="mb-4" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '300px'
                      }}>
                        <Alert variant="warning">
                          <div className="text-center">
                            <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
                            <p>QR 코드가 생성되지 않았습니다.</p>
                            <Button 
                              variant="outline-warning" 
                              onClick={handleRefresh}
                            >
                              다시 생성
                            </Button>
                          </div>
                        </Alert>
                      </div>
                    )}

                    <div className="d-grid gap-2">
                      <Button 
                        variant="primary" 
                        onClick={handleDownload}
                        disabled={!qrData.qr_code_url}
                      >
                        <i className="fas fa-download me-2"></i>
                        QR 코드 저장
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        onClick={handleShare}
                        disabled={!qrData.qr_code_url}
                      >
                        <i className="fas fa-share-alt me-2"></i>
                        공유하기
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        onClick={handleRefresh}
                      >
                        <i className="fas fa-sync-alt me-2"></i>
                        새로고침
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* 사용 안내 카드 */}
            <Row>
              <Col>
                <Card className="asl-info-card">
                  <Card.Body>
                    <Card.Title>
                      <i className="fas fa-info-circle me-2"></i>
                      QR 코드 사용 방법
                    </Card.Title>
                    <ul className="mb-0">
                      <li>매장에서 토너먼트 참가 시 이 QR 코드를 보여주세요</li>
                      <li>매장 관리자가 QR 코드를 스캔하여 빠르게 참가 처리할 수 있습니다</li>
                      <li>QR 코드는 개인 정보 보호를 위해 암호화되어 있습니다</li>
                      <li>분실 시 새로고침 버튼을 눌러 다시 불러올 수 있습니다</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        ) : null}
      </Container>
    </div>
  );
};

export default QRCode; 