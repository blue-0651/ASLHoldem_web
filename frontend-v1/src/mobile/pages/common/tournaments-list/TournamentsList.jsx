import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Badge, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';

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

const TournamentsList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await API.get('/tournaments/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setTournaments(response.data);
      setError(null);
    } catch (err) {
      console.error('토너먼트 목록 가져오기 오류:', err);
      setError('토너먼트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 토너먼트 필터링 및 검색
  const getFilteredTournaments = () => {
    let filteredTournaments = [...tournaments];

    // 상태 필터링
    if (filter === 'upcoming') {
      filteredTournaments = filteredTournaments.filter((tournament) => new Date(tournament.start_date) > new Date());
    } else if (filter === 'ongoing') {
      const now = new Date();
      filteredTournaments = filteredTournaments.filter(
        (tournament) => new Date(tournament.start_date) <= now && new Date(tournament.end_date) >= now
      );
    }

    // 검색어 필터링
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filteredTournaments = filteredTournaments.filter(
        (tournament) => tournament.title.toLowerCase().includes(term) || tournament.store.name.toLowerCase().includes(term)
      );
    }

    return filteredTournaments;
  };

  // 토너먼트 상태 배지 색상 설정
  const getStatusBadge = (tournament) => {
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);

    if (startDate > now) {
      return <Badge bg="primary">예정됨</Badge>;
    } else if (startDate <= now && endDate >= now) {
      return <Badge bg="success">진행 중</Badge>;
    } else {
      return <Badge bg="secondary">종료됨</Badge>;
    }
  };

  // 토너먼트 상세 보기로 이동
  const handleViewTournament = (tournamentId) => {
    navigate(`/mobile/common/tournament/${tournamentId}`);
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
      {/* 헤더 */}
      <div className="asl-mobile-header">
        <button className="asl-mobile-nav-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="asl-mobile-header-title">토너먼트 일정</h1>
        <div style={{ width: '24px' }}></div> {/* 균형을 위한 빈 공간 */}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="asl-mobile-dashboard">
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
          </div>

          <InputGroup size="sm">
            <Form.Control
              placeholder="토너먼트 또는 매장 검색"
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
            <Spinner animation="border" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </Spinner>
            <p style={{ marginTop: '10px' }}>토너먼트 정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="mobile-empty-state">
            <i className="fas fa-exclamation-triangle mobile-empty-icon"></i>
            <p>{error}</p>
            <Button variant="outline-primary" size="sm" onClick={fetchTournaments}>
              다시 시도
            </Button>
          </div>
        ) : getFilteredTournaments().length === 0 ? (
          <div className="mobile-empty-state">
            <i className="fas fa-calendar-times mobile-empty-icon"></i>
            <p>표시할 토너먼트가 없습니다.</p>
            {searchTerm && <p style={{ fontSize: '14px', color: '#777' }}>검색어: "{searchTerm}"에 맞는 결과가 없습니다.</p>}
          </div>
        ) : (
          /* 토너먼트 목록 */
          <div>
            {getFilteredTournaments().map((tournament) => (
              <Card key={tournament.id} className="mobile-card" style={{ marginBottom: '15px' }}>
                <Card.Body>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{tournament.title}</div>
                    {getStatusBadge(tournament)}
                  </div>

                  <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                    <i className="fas fa-store" style={{ marginRight: '8px' }}></i>
                    {tournament.store.name}
                  </div>

                  <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                    <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
                    {formatDate(tournament.start_date)}
                  </div>

                  <div style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>
                    <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                    참가비: {tournament.entry_fee.toLocaleString()}원 / 참가자: {tournament.participants_count}/
                    {tournament.max_participants}명
                  </div>

                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleViewTournament(tournament.id)}
                    style={{ width: '100%', marginTop: '5px' }}
                  >
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
