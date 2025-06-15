import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Badge, Form, InputGroup, Alert } from 'react-bootstrap';
import axios from 'axios';
import { isAuthenticated, getToken, getCurrentUser } from '../../../../utils/auth';

// API 기본 설정
const API = axios.create({
  baseURL: '/api/v1', // 직접 기본 URL 설정
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 요청/응답 로깅 인터셉터 추가
API.interceptors.request.use(
  (config) => {
    // 토큰 자동 추가
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 서버 응답이 있는 경우
      console.error('서버 응답 에러:', error.response.data);
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('응답 수신 실패:', error.request);
    } else {
      // 요청 설정 중 에러 발생
      console.error('요청 설정 에러:', error.message);
    }
    return Promise.reject(error);
  }
);

const TournamentsList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // 인증 상태 확인
    if (!isAuthenticated()) {
      navigate('/mobile/login');
      return;
    }
    
    fetchTournaments();
  }, [navigate]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 현재 사용자 정보 확인
      const currentUser = getCurrentUser();
      console.log('🔍 현재 사용자:', currentUser);
      
      // 사용자 타입에 따라 다른 API 엔드포인트 호출
      let endpoint = '/tournaments/';
      
      if (currentUser?.role === 'STORE' || currentUser?.is_store_owner) {
        // 매장 관리자인 경우 매장 토너먼트 조회
        endpoint = '/store/tournaments/';
      } else {
        // 일반 사용자인 경우 전체 토너먼트 조회
        endpoint = '/tournaments/all_info/';
      }
      
      console.log(`🎯 API 엔드포인트: ${endpoint}`);
      
      const response = await API.get(endpoint);
      
      if (Array.isArray(response.data)) {
        setTournaments(response.data);
        console.log(`📊 토너먼트 ${response.data.length}개 로드됨`);
      } else {
        console.error('❌ API 응답이 배열이 아닙니다:', response.data);
        setTournaments([]);
      }
      
      setRetryCount(0); // 성공 시 재시도 카운트 리셋
    } catch (err) {
      console.error('❌ 토너먼트 목록 가져오기 오류:', err);
      
      let errorMessage = '토너먼트 목록을 불러오는 중 오류가 발생했습니다.';
      
      if (err.response?.status === 401) {
        errorMessage = '로그인이 필요합니다. 다시 로그인 해주세요.';
        // 토큰이 만료된 경우 로그인 페이지로 이동
        setTimeout(() => navigate('/mobile/login'), 2000);
      } else if (err.response?.status === 403) {
        errorMessage = '접근 권한이 없습니다. 매장 관리자 권한을 확인해주세요.';
      } else if (err.response?.status === 404) {
        errorMessage = 'API 엔드포인트를 찾을 수 없습니다. 관리자에게 문의하세요.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = '요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.';
      } else if (!err.response) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
      }
      
      setError(errorMessage);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // 재시도 기능
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchTournaments();
  };

  // 토너먼트 필터링 및 검색
  const getFilteredTournaments = () => {
    let filteredTournaments = [...tournaments];

    // 상태 필터링
    if (filter === 'upcoming') {
      filteredTournaments = filteredTournaments.filter((tournament) => {
        const startTime = new Date(tournament.start_time);
        const now = new Date();
        return startTime > now || tournament.status === 'UPCOMING';
      });
    } else if (filter === 'ongoing') {
      filteredTournaments = filteredTournaments.filter((tournament) => {
        const startTime = new Date(tournament.start_time);
        const now = new Date();
        // 종료 시간은 시작 시간 + 8시간으로 가정
        const endTime = new Date(startTime.getTime() + (8 * 60 * 60 * 1000));
        return (startTime <= now && endTime >= now) || tournament.status === 'ONGOING';
      });
    } else if (filter === 'completed') {
      filteredTournaments = filteredTournaments.filter((tournament) => {
        const startTime = new Date(tournament.start_time);
        const now = new Date();
        const endTime = new Date(startTime.getTime() + (8 * 60 * 60 * 1000));
        return endTime < now || tournament.status === 'COMPLETED';
      });
    }

    // 검색어 필터링
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filteredTournaments = filteredTournaments.filter((tournament) =>
        tournament.name.toLowerCase().includes(term) ||
        (tournament.description && tournament.description.toLowerCase().includes(term))
      );
    }

    return filteredTournaments.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  };

  // 토너먼트 상태 배지 색상 설정
  const getStatusBadge = (tournament) => {
    const now = new Date();
    const startTime = new Date(tournament.start_time);
    const endTime = new Date(startTime.getTime() + (8 * 60 * 60 * 1000));

    // 백엔드에서 제공하는 상태 우선 사용
    if (tournament.status === 'UPCOMING' || startTime > now) {
      return <Badge bg="primary">예정됨</Badge>;
    } else if (tournament.status === 'ONGOING' || (startTime <= now && endTime >= now)) {
      return <Badge bg="success">진행 중</Badge>;
    } else if (tournament.status === 'COMPLETED' || endTime < now) {
      return <Badge bg="secondary">종료됨</Badge>;
    } else if (tournament.status === 'CANCELLED') {
      return <Badge bg="danger">취소됨</Badge>;
    } else {
      return <Badge bg="secondary">알 수 없음</Badge>;
    }
  };

  // 토너먼트 상세 보기로 이동
  const handleViewTournament = (tournamentId) => {
    navigate(`/mobile/store/tournament/${tournamentId}`);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    
    try {
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('ko-KR', options);
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '날짜 형식 오류';
    }
  };

  // 숫자 포맷팅 (null/undefined 처리)
  const formatNumber = (value) => {
    return value != null ? value.toLocaleString() : '0';
  };

  return (
    <div className="asl-mobile-container">
      {/* 헤더 */}
      <div className="asl-mobile-header">
        <button className="asl-mobile-nav-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="asl-mobile-header-title">토너먼트 일정</h1>
        <button className="asl-mobile-nav-button" onClick={handleRetry} disabled={loading}>
          <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="asl-mobile-dashboard">
        {/* 재시도 알림 */}
        {retryCount > 0 && (
          <Alert variant="info" className="mb-3">
            <i className="fas fa-info-circle me-2"></i>
            재시도 중입니다... ({retryCount}회)
          </Alert>
        )}

        {/* 필터 및 검색 */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
            <Button
              variant={filter === 'all' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setFilter('all')}
              style={{ flex: 1, borderRadius: '20px' }}
            >
              전체
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setFilter('upcoming')}
              style={{ flex: 1, borderRadius: '20px' }}
            >
              예정
            </Button>
            <Button
              variant={filter === 'ongoing' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setFilter('ongoing')}
              style={{ flex: 1, borderRadius: '20px' }}
            >
              진행 중
            </Button>
            <Button
              variant={filter === 'completed' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => setFilter('completed')}
              style={{ flex: 1, borderRadius: '20px' }}
            >
              완료
            </Button>
          </div>

          <InputGroup size="sm">
            <Form.Control
              placeholder="토너먼트 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: '20px 0 0 20px' }}
            />
            <Button variant="outline-secondary" style={{ borderRadius: '0 20px 20px 0' }}>
              <i className="fas fa-search"></i>
            </Button>
          </InputGroup>
        </div>

        {/* 로딩 및 에러 처리 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">로딩 중...</span>
            </Spinner>
            <p style={{ marginTop: '10px', color: '#666' }}>토너먼트 정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="mobile-empty-state">
            <i className="fas fa-exclamation-triangle mobile-empty-icon" style={{ color: '#dc3545' }}></i>
            <p style={{ color: '#dc3545', marginBottom: '10px' }}>{error}</p>
            <Button variant="outline-primary" size="sm" onClick={handleRetry}>
              <i className="fas fa-redo me-2"></i>
              다시 시도
            </Button>
          </div>
        ) : getFilteredTournaments().length === 0 ? (
          <div className="mobile-empty-state">
            <i className="fas fa-calendar-times mobile-empty-icon"></i>
            <p>표시할 토너먼트가 없습니다.</p>
            {searchTerm && <p style={{ fontSize: '14px', color: '#777' }}>검색어: "{searchTerm}"에 맞는 결과가 없습니다.</p>}
            {tournaments.length === 0 && (
              <p style={{ fontSize: '14px', color: '#777' }}>
                아직 등록된 토너먼트가 없습니다.
              </p>
            )}
          </div>
        ) : (
          /* 토너먼트 목록 */
          <div>
            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              총 {getFilteredTournaments().length}개의 토너먼트
            </div>
            
            {getFilteredTournaments().map((tournament) => (
              <Card key={tournament.id} className="mobile-card" style={{ marginBottom: '15px' }}>
                <Card.Body>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{tournament.name}</div>
                    {getStatusBadge(tournament)}
                  </div>

                  <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                    <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
                    {formatDate(tournament.start_time)}
                  </div>

                  {/* 매장 관리자용 정보 */}
                  {tournament.allocated_quantity !== undefined && (
                    <>
                      <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                        <i className="fas fa-ticket-alt" style={{ marginRight: '8px' }}></i>
                        배분된 좌석: {formatNumber(tournament.allocated_quantity)}석
                      </div>

                      <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                        <i className="fas fa-chair" style={{ marginRight: '8px' }}></i>
                        남은 좌석: {formatNumber(tournament.remaining_quantity)}석
                      </div>
                    </>
                  )}

                  {/* 일반 사용자용 정보 */}
                  {tournament.ticket_quantity !== undefined && (
                    <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                      <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                      총 좌석: {formatNumber(tournament.ticket_quantity)}석
                    </div>
                  )}

                  <div style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>
                    <i className="fas fa-coins" style={{ marginRight: '8px' }}></i>
                    필요 좌석권: {formatNumber(tournament.buy_in)}개
                  </div>

                  {tournament.description && (
                    <div style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>
                      <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                      {tournament.description}
                    </div>
                  )}

                  {tournament.distribution_created_at && (
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                      <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
                      SEAT권 배분일: {formatDate(tournament.distribution_created_at)}
                    </div>
                  )}

                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleViewTournament(tournament.id)}
                    style={{ width: '100%', marginTop: '5px' }}
                  >
                    <i className="fas fa-eye me-2"></i>
                    상세 보기
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentsList;
