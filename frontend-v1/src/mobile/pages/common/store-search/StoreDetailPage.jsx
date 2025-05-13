import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import MobileHeader from '../../../components/MobileHeader';
import '../../../styles/MobileStyles.css';

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

const StoreDetailPage = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const navigate = useNavigate();

  // 매장 정보 불러오기
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 매장 정보 가져오기
        const storeResponse = await API.get(`/stores/${storeId}/`);
        setStore(storeResponse.data);
        
        // 매장의 토너먼트 목록 가져오기
        const tournamentsResponse = await API.get(`/tournaments/?store=${storeId}`);
        setTournaments(tournamentsResponse.data.results || []);
        
        setLoading(false);
      } catch (err) {
        console.error('매장 데이터 로드 오류:', err);
        setError('매장 정보를 불러오는 데 실패했습니다.');
        setLoading(false);
      }
    };

    if (storeId) {
      fetchStoreData();
    }
  }, [storeId]);

  // 토너먼트 상세 페이지로 이동
  const handleTournamentClick = (tournamentId) => {
    navigate(`/mobile/common/tournament-detail/${tournamentId}`);
  };

  // 지도에서 매장 위치 보기
  const openMapLocation = (address) => {
    // 주소를 인코딩하여 Google 지도로 연결
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  // 전화 걸기
  const callStore = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <MobileHeader title="매장 정보" backButton />
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">매장 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-container">
        <MobileHeader title="매장 정보" backButton />
        <Alert variant="danger" className="m-3">
          {error}
          <div className="mt-3">
            <Button variant="outline-danger" onClick={() => navigate(-1)}>
              뒤로 가기
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="mobile-container">
        <MobileHeader title="매장 정보" backButton />
        <div className="mobile-empty-state">
          <i className="fas fa-exclamation-circle mobile-empty-icon"></i>
          <h5>매장 정보를 찾을 수 없습니다</h5>
          <Button variant="primary" onClick={() => navigate(-1)} className="mt-3">
            매장 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <MobileHeader title={store.name} backButton />
      
      <div className="mobile-content p-0">
        {/* 매장 이미지 */}
        <div className="store-image-container position-relative">
          <img 
            src={store.image || 'https://via.placeholder.com/800x400?text=매장+이미지'} 
            alt={store.name}
            className="w-100"
            style={{ 
              maxHeight: '200px', 
              objectFit: 'cover',
              borderRadius: '0'
            }}
          />
          <div className="position-absolute bottom-0 start-0 p-3 w-100" 
               style={{ 
                 background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
                 borderRadius: '0' 
               }}>
            <h4 className="text-white mb-1">{store.name}</h4>
            <p className="text-white mb-0 small">
              <i className="fas fa-map-marker-alt me-1"></i> {store.address}
            </p>
          </div>
        </div>
        
        {/* 상태 배지 */}
        <div className="px-3 py-2 d-flex justify-content-between align-items-center">
          <div>
            {store.is_open ? (
              <Badge bg="success" className="me-2">영업중</Badge>
            ) : (
              <Badge bg="secondary" className="me-2">영업종료</Badge>
            )}
            {store.has_tournament && (
              <Badge bg="primary">토너먼트 진행중</Badge>
            )}
          </div>
          <div>
            <Button 
              variant="outline-primary" 
              size="sm"
              className="me-2"
              onClick={() => callStore(store.phone_number)}
            >
              <i className="fas fa-phone-alt me-1"></i> 전화
            </Button>
            <Button 
              variant="outline-success" 
              size="sm"
              onClick={() => openMapLocation(store.address)}
            >
              <i className="fas fa-map-marked-alt me-1"></i> 지도
            </Button>
          </div>
        </div>
        
        {/* 탭 메뉴 */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3 mt-2 px-2"
        >
          <Tab eventKey="info" title="매장 정보">
            <div className="p-3">
              <Card className="mb-3">
                <Card.Body>
                  <h5 className="mb-3">기본 정보</h5>
                  
                  <Row className="mb-2">
                    <Col xs={4} className="text-muted">영업 시간</Col>
                    <Col xs={8}>{store.business_hours || '정보 없음'}</Col>
                  </Row>
                  
                  <Row className="mb-2">
                    <Col xs={4} className="text-muted">연락처</Col>
                    <Col xs={8}>{store.phone_number || '정보 없음'}</Col>
                  </Row>
                  
                  <Row className="mb-2">
                    <Col xs={4} className="text-muted">주소</Col>
                    <Col xs={8}>{store.address || '정보 없음'}</Col>
                  </Row>
                  
                  {store.website && (
                    <Row className="mb-2">
                      <Col xs={4} className="text-muted">웹사이트</Col>
                      <Col xs={8}>
                        <a href={store.website} target="_blank" rel="noopener noreferrer">
                          {store.website}
                        </a>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Body>
                  <h5 className="mb-3">매장 소개</h5>
                  <p>{store.description || '매장 소개 정보가 없습니다.'}</p>
                </Card.Body>
              </Card>
            </div>
          </Tab>
          
          <Tab eventKey="tournaments" title="토너먼트">
            <div className="p-3">
              {tournaments.length === 0 ? (
                <div className="mobile-empty-state">
                  <i className="fas fa-calendar-times mobile-empty-icon"></i>
                  <h5>예정된 토너먼트가 없습니다</h5>
                  <p className="text-muted">
                    현재 이 매장에서 진행 예정인 토너먼트가 없습니다.
                  </p>
                </div>
              ) : (
                tournaments.map((tournament) => (
                  <Card 
                    key={tournament.id}
                    className="mb-3 tournament-card"
                    onClick={() => handleTournamentClick(tournament.id)}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-1">{tournament.name}</h5>
                          <p className="text-muted mb-2">
                            <i className="fas fa-calendar-alt me-1"></i> 
                            {new Date(tournament.start_date).toLocaleDateString('ko-KR')}
                            {' '}
                            {new Date(tournament.start_date).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div>
                            {tournament.is_active && (
                              <Badge bg="success" className="me-2">진행중</Badge>
                            )}
                            {new Date(tournament.start_date) > new Date() && (
                              <Badge bg="primary" className="me-2">예정됨</Badge>
                            )}
                            {tournament.seats_available > 0 ? (
                              <Badge bg="info">좌석 가능: {tournament.seats_available}석</Badge>
                            ) : (
                              <Badge bg="danger">매진</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/mobile/common/tournament-registration/${tournament.id}`);
                            }}
                            disabled={tournament.seats_available <= 0}
                          >
                            <i className="fas fa-ticket-alt me-1"></i> 예약
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>
          </Tab>
          
          <Tab eventKey="reviews" title="리뷰">
            <div className="p-3">
              <div className="mobile-empty-state">
                <i className="fas fa-comments mobile-empty-icon"></i>
                <h5>등록된 리뷰가 없습니다</h5>
                <p className="text-muted">
                  첫 번째 리뷰를 작성해보세요!
                </p>
                <Button variant="primary" className="mt-2">
                  <i className="fas fa-pencil-alt me-1"></i> 리뷰 작성
                </Button>
              </div>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default StoreDetailPage; 