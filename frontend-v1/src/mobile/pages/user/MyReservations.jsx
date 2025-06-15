import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../../components/MobileHeader';
import { getCurrentUser } from '../../../utils/auth';
import API from '../../../utils/api';

const MyReservations = () => {
  const [tournaments, setTournaments] = useState([]);
  const [seats, setSeats] = useState([]);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const fetchReservations = async () => {
    setError(null);
    
    try {
      // 현재 사용자 정보 확인
      if (!currentUser || !currentUser.id) {
        throw new Error('사용자 정보가 없습니다.');
      }

      console.log(`사용자 예약 정보 조회 시작: ${currentUser.id}`);
      console.log('API 기본 URL:', API.defaults.baseURL);
      
      // API 유틸리티 사용하여 상대 경로로 호출
      const response = await API.get(`/seats/tickets/user_stats/?user_id=${currentUser.id}`);
      console.log('사용자 예약 정보 응답 성공:', response.data);
      
      const data = response.data;
      
      // 토너먼트 정보를 tournaments 상태로 설정
      const tournamentStats = data.tournament_stats || [];
      setTournaments(tournamentStats.map(stat => ({
        id: stat.tournament_id,
        name: stat.tournament_name,
        start_time: stat.tournament_start_time,
        status: new Date(stat.tournament_start_time) > new Date() ? 'UPCOMING' : 
                new Date(stat.tournament_start_time) < new Date() ? 'COMPLETED' : 'ACTIVE',
        active_tickets: stat.active_tickets,
        used_tickets: stat.used_tickets,
        total_tickets: stat.total_tickets
      })));

      // 전체 시트권 정보를 seats 상태로 설정
      const overallStats = data.overall_stats || {};
      setSeats([{
        id: 'overall',
        store_name: '전체 보유 시트권',
        quantity: overallStats.active_tickets || 0,
        used_quantity: overallStats.used_tickets || 0,
        total_quantity: overallStats.total_tickets || 0
      }]);

      setIsLoaded(true);

    } catch (err) {
      // 오류 객체를 문자열로 안전하게 변환
      let errorDetails = '';
      try {
        errorDetails = JSON.stringify({
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          code: err.code,
          name: err.name
        }, null, 2);
      } catch (stringifyError) {
        errorDetails = `오류 직렬화 실패: ${err.toString()}`;
      }
      
      console.error('예약 정보 조회 오류 상세:', errorDetails);
      console.error('원본 오류 객체:', err);
      
      // 사용자에게 표시할 오류 메시지 결정
      let userErrorMessage = '';
      
      if (err.response?.status === 401) {
        userErrorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
        navigate('/mobile/login');
      } else if (err.response?.status === 403) {
        userErrorMessage = '접근 권한이 없습니다.';
      } else if (err.response?.status === 404) {
        userErrorMessage = '사용자 정보를 찾을 수 없습니다.';
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error') || err.message?.includes('Failed to fetch')) {
        userErrorMessage = '네트워크 연결을 확인해주세요. 서버에 연결할 수 없습니다.';
      } else if (err.response?.data?.detail) {
        userErrorMessage = err.response.data.detail;
      } else if (err.message) {
        userErrorMessage = err.message;
      } else {
        userErrorMessage = '예약 정보를 불러오는 중 알 수 없는 오류가 발생했습니다.';
      }
      
      setError(userErrorMessage);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      navigate('/mobile/login');
      return;
    }
    fetchReservations();
  }, []);

  // Android WebView 뒤로가기 버튼 처리
  useEffect(() => {
    const handlePopState = (event) => {
      console.log('Android 뒤로가기 버튼 감지');
      navigate(-1);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge bg="primary">예정</Badge>;
      case 'ACTIVE':
        return <Badge bg="success">진행중</Badge>;
      case 'COMPLETED':
        return <Badge bg="secondary">종료</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger">취소</Badge>;
      default:
        return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  return (
    <div className="asl-mobile-container" style={{ 
      WebkitOverflowScrolling: 'touch',
      overflowY: 'auto'
    }}>
      <MobileHeader title="내 예약" backButton />
      <Container className="asl-mobile-content">
        {!isLoaded && !error && (
          <div className="text-center py-4">
            <p>예약 정보를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="mb-4">
            <Alert.Heading>오류가 발생했습니다</Alert.Heading>
            <p>{error}</p>
            <hr />
            <div className="d-flex justify-content-end">
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={() => fetchReservations()}
              >
                다시 시도
              </button>
            </div>
          </Alert>
        )}

        {isLoaded && !error && (
          <>
            <h5 className="mb-3"><i className="fas fa-calendar-check me-2"></i>참가중인 토너먼트</h5>
            {tournaments.length > 0 ? (
              <ListGroup className="mb-4">
                {tournaments.map((t) => (
                  <ListGroup.Item key={t.id} action onClick={() => {
                    console.log('토너먼트 클릭:', t.id, t.name);
                    // 일반 사용자용 토너먼트 상세 페이지로 이동
                    navigate(`/mobile/common/tournament/${t.id}`);
                  }} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div><strong>{t.name}</strong></div>
                      <div className="text-muted small">{formatDate(t.start_time)}</div>
                      <div className="text-info small">
                        보유: {t.active_tickets}개 | 사용: {t.used_tickets}개 | 총: {t.total_tickets}개
                      </div>
                    </div>
                    {getStatusBadge(t.status)}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <Card body className="text-center text-muted mb-4">보유한 시트권이 있는 토너먼트가 없습니다.</Card>
            )}

            <h5 className="mb-3"><i className="fas fa-couch me-2"></i>보유 시트권</h5>
            {seats.length > 0 ? (
              <Row>
                {seats.map((seat) => (
                  <Col key={seat.id} xs={12} md={6} className="mb-3">
                    <Card>
                      <Card.Body>
                        <Card.Title>{seat.store_name}</Card.Title>
                        <div>
                          <div>활성 시트권: <strong className="text-success">{seat.quantity}개</strong></div>
                          <div>사용된 시트권: <strong className="text-secondary">{seat.used_quantity}개</strong></div>
                          <div>총 시트권: <strong className="text-primary">{seat.total_quantity}개</strong></div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Card body className="text-center text-muted">보유한 시트권이 없습니다.</Card>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default MyReservations; 