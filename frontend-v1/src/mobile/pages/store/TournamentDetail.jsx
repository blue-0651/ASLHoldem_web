import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../../components/MobileHeader';
import API from '../../../utils/api';
import { getCurrentUser } from '../../../utils/auth';

const TournamentDetail = () => {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = getCurrentUser();
  const isStoreManager = currentUser?.user_type === 'store';

  useEffect(() => {
    fetchTournamentDetail();
  }, [id]);

  const fetchTournamentDetail = async () => {
    try {
      setLoading(true);
      console.log(`토너먼트 상세 정보 조회: ${id}, 사용자 타입: ${currentUser?.user_type}`);
      
      let response;
      let foundTournament;
      
      if (isStoreManager) {
        // 매장 관리자용 API 사용
        response = await API.get('/store/tournaments/');
        console.log('매장 토너먼트 목록 응답:', response.data);
        foundTournament = response.data.find(t => t.id === parseInt(id));
      } else {
        // 일반 사용자용 API 사용
        try {
          response = await API.get('/tournaments/all_info/');
          console.log('일반 토너먼트 목록 응답:', response.data);
          foundTournament = response.data.find(t => t.id === parseInt(id));
        } catch (apiError) {
          // all_info API 실패 시 기본 tournaments API 시도
          console.log('all_info API 실패, 기본 API 시도');
          response = await API.get('/tournaments/');
          foundTournament = response.data.find(t => t.id === parseInt(id));
        }
      }
      
      if (foundTournament) {
        setTournament(foundTournament);
        setError(null);
      } else {
        setError('토너먼트를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('토너먼트 상세 정보 조회 오류:', err);
      if (err.response?.status === 403) {
        setError('접근 권한이 없습니다.');
      } else if (err.response?.status === 401) {
        setError('로그인이 필요합니다.');
      } else {
        setError('토너먼트 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTournament = async () => {
    try {
      setCancelling(true);
      console.log(`토너먼트 취소: ${id}`);
      
      const response = await API.post(`/store/tournaments/${id}/cancel/`);
      console.log('토너먼트 취소 응답:', response.data);
      
      // 성공 시 토너먼트 정보 다시 조회
      await fetchTournamentDetail();
      setShowCancelModal(false);
      
      // 성공 메시지 표시
      alert('토너먼트가 성공적으로 취소되었습니다.');
    } catch (err) {
      console.error('토너먼트 취소 오류:', err);
      if (err.response?.status === 403) {
        alert('토너먼트를 취소할 권한이 없습니다.');
      } else {
        alert('토너먼트 취소 중 오류가 발생했습니다.');
      }
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'UPCOMING': { variant: 'success', text: '예정됨' },
      'ONGOING': { variant: 'primary', text: '진행중' },
      'COMPLETED': { variant: 'secondary', text: '종료' },
      'CANCELLED': { variant: 'danger', text: '취소됨' }
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', text: '알 수 없음' };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  if (loading) {
    return (
      <div className="asl-mobile-container">
        <MobileHeader title="토너먼트 상세" />
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">로딩 중...</span>
          </Spinner>
          <p style={{ marginTop: '10px' }}>토너먼트 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="asl-mobile-container">
        <MobileHeader title="토너먼트 상세" />
        <Container className="asl-mobile-content">
          <Alert variant="danger">{error}</Alert>
          <Button variant="outline-primary" onClick={() => navigate(-1)}>
            돌아가기
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="asl-mobile-container">
      <MobileHeader title="토너먼트 상세" />
      
      <Container className="asl-mobile-content">
        {tournament && (
          <>
            {/* 기본 정보 카드 */}
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{tournament.name}</h5>
                {getStatusBadge(tournament.status)}
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col xs={12} className="mb-3">
                    <h6><i className="fas fa-calendar-alt me-2"></i>일정</h6>
                    <p className="text-muted mb-0">{formatDate(tournament.start_time)}</p>
                  </Col>
                  
                  <Col xs={6} className="mb-3">
                    <h6><i className="fas fa-coins me-2"></i>참가비</h6>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">필요 SEAT권:</span>
                      <p className="text-muted mb-0">{tournament.buy_in}개</p>
                    </div>
                  </Col>
                  
                  <Col xs={6} className="mb-3">
                    <h6><i className="fas fa-users me-2"></i>총 SEAT</h6>
                    <p className="text-muted mb-0">{tournament.ticket_quantity}석</p>
                  </Col>
                  
                  {tournament.description && (
                    <Col xs={12} className="mb-3">
                      <h6><i className="fas fa-info-circle me-2"></i>설명</h6>
                      <p className="text-muted mb-0">{tournament.description}</p>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>

            {/* SEAT 배분 정보 카드 */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0"><i className="fas fa-ticket-alt me-2"></i>SEAT 배분 정보</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col xs={6} className="mb-2">
                    <small className="text-muted">배분된 SEAT</small>
                    <h5 className="text-primary">{tournament.allocated_quantity || 0}석</h5>
                  </Col>
                  <Col xs={6} className="mb-2">
                    <small className="text-muted">남은 SEAT</small>
                    <h5 className="text-success">{tournament.remaining_quantity || 0}석</h5>
                  </Col>
                  {tournament.distribution_created_at && (
                    <Col xs={12}>
                      <small className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        배분일: {formatDate(tournament.distribution_created_at)}
                      </small>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>

            {/* 액션 버튼들 */}
            <div className="d-grid gap-2">
              {tournament.status === 'UPCOMING' && (
                <Button 
                  variant="danger" 
                  size="lg"
                  onClick={() => setShowCancelModal(true)}
                >
                  <i className="fas fa-times me-2"></i>토너먼트 취소
                </Button>
              )}
              
              <Button 
                variant="outline-secondary" 
                size="lg"
                onClick={() => navigate(-1)}
              >
                <i className="fas fa-arrow-left me-2"></i>목록으로 돌아가기
              </Button>
            </div>
          </>
        )}

        {/* 취소 확인 모달 */}
        <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>토너먼트 취소 확인</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>정말로 이 토너먼트를 취소하시겠습니까?</p>
            <p className="text-danger">
              <strong>주의:</strong> 취소된 토너먼트는 복구할 수 없습니다.
            </p>
            {tournament && (
              <div className="bg-light p-3 rounded">
                <strong>{tournament.name}</strong><br />
                <small className="text-muted">{formatDate(tournament.start_time)}</small>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              아니오
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancelTournament}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  취소 중...
                </>
              ) : (
                '예, 취소합니다'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default TournamentDetail; 