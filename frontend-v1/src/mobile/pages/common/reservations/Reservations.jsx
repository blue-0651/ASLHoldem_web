import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Badge, Tab, Tabs } from 'react-bootstrap';
import axios from 'axios';
import MobileHeader from '../../../components/MobileHeader';

// 간소화된 API 인스턴스 생성
const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1'
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

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('asl_holdem_access_token');
      
      // 내 토너먼트 참가 정보 조회
      const tournamentResponse = await API.get('/tournaments/my/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // 내 시트권 정보 조회
      const seatResponse = await API.get('/seats/tickets/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // 토너먼트 참가 정보를 예약 형태로 변환
      const tournamentReservations = tournamentResponse.data.map(tournament => ({
        id: tournament.id,
        tournament: {
          title: tournament.name,
          start_date: tournament.start_time,
          store: {
            name: tournament.store_name || '매장 정보 없음'
          }
        },
        status: tournament.status === 'UPCOMING' ? 'confirmed' : 
                tournament.status === 'ACTIVE' ? 'confirmed' :
                tournament.status === 'COMPLETED' ? 'completed' : 'cancelled',
        reservation_code: `T${tournament.id}`
      }));
      
      setReservations(tournamentReservations);
      setError(null);
    } catch (err) {
      console.error('예약 목록 가져오기 오류:', err);
      if (err.response?.status === 404) {
        setError('예약 정보를 찾을 수 없습니다.');
      } else if (err.response?.status === 401) {
        setError('로그인이 필요합니다.');
      } else {
      setError('예약 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 날짜 기준으로 예약 필터링
  const getFilteredReservations = () => {
    const now = new Date();

    if (activeTab === 'upcoming') {
      return reservations.filter((reservation) => new Date(reservation.tournament.start_date) > now);
    } else if (activeTab === 'past') {
      return reservations.filter((reservation) => new Date(reservation.tournament.start_date) < now);
    }

    return reservations;
  };

  // 예약 상태 배지 색상 설정
  const getStatusBadge = (reservation) => {
    switch (reservation.status) {
      case 'confirmed':
        return <Badge bg="success">확정됨</Badge>;
      case 'pending':
        return (
          <Badge bg="warning" text="dark">
            대기 중
          </Badge>
        );
      case 'cancelled':
        return <Badge bg="danger">취소됨</Badge>;
      case 'completed':
        return <Badge bg="secondary">완료됨</Badge>;
      default:
        return <Badge bg="info">상태 정보 없음</Badge>;
    }
  };

  // 예약 취소 처리
  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('정말 이 토너먼트 참가를 취소하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('asl_holdem_access_token');
      await API.delete(`/tournaments/${reservationId}/register/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // 성공 후 목록 새로고침
      fetchReservations();
      alert('토너먼트 참가가 취소되었습니다.');
    } catch (err) {
      console.error('예약 취소 오류:', err);
      alert('토너먼트 참가 취소에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 토너먼트 상세 보기로 이동
  const handleViewReservation = (reservationId) => {
    navigate(`/mobile/common/tournaments-list/${reservationId}`);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  return (
    <div className="asl-mobile-container">
      <MobileHeader title="내 예약" backButton />

      {/* 메인 컨텐츠 */}
      <div className="asl-mobile-dashboard">
        {/* 탭 필터 */}
        <Tabs activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)} className="mb-3" style={{ fontSize: '14px' }}>
          <Tab eventKey="upcoming" title="예정된 예약" />
          <Tab eventKey="past" title="지난 예약" />
          <Tab eventKey="all" title="전체 예약" />
        </Tabs>

        {/* 로딩 및 에러 처리 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </Spinner>
            <p style={{ marginTop: '10px' }}>예약 정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="mobile-empty-state">
            <i className="fas fa-exclamation-triangle mobile-empty-icon"></i>
            <p>{error}</p>
            <Button variant="outline-primary" size="sm" onClick={fetchReservations}>
              다시 시도
            </Button>
          </div>
        ) : getFilteredReservations().length === 0 ? (
          <div className="mobile-empty-state">
            <i className="fas fa-calendar-times mobile-empty-icon"></i>
            <p>
              {activeTab === 'upcoming'
                ? '예정된 예약이 없습니다.'
                : activeTab === 'past'
                  ? '지난 예약이 없습니다.'
                  : '예약 내역이 없습니다.'}
            </p>
            <Button variant="outline-primary" size="sm" onClick={() => navigate('/mobile/common/tournaments-list')}>
              토너먼트 찾아보기
            </Button>
          </div>
        ) : (
          /* 예약 목록 */
          <div>
            {getFilteredReservations().map((reservation) => (
              <Card key={reservation.id} className="mobile-card" style={{ marginBottom: '15px' }}>
                <Card.Body>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{reservation.tournament.title}</div>
                    {getStatusBadge(reservation)}
                  </div>

                  <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                    <i className="fas fa-store" style={{ marginRight: '8px' }}></i>
                    {reservation.tournament.store.name}
                  </div>

                  <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                    <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
                    {formatDate(reservation.tournament.start_date)}
                  </div>

                  <div style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>
                    <i className="fas fa-ticket-alt" style={{ marginRight: '8px' }}></i>
                    예약 번호: {reservation.reservation_code}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="outline-primary" size="sm" onClick={() => handleViewReservation(reservation.id)} style={{ flex: 1 }}>
                      상세 보기
                    </Button>

                    {/* 예약 취소는 예정된 예약에만 표시 */}
                    {activeTab === 'upcoming' && reservation.status !== 'cancelled' && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation.id)}
                        style={{ flex: 1 }}
                      >
                        예약 취소
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
