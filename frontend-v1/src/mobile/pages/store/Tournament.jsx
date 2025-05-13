import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Badge, Tab, Tabs } from 'react-bootstrap';
import axios from 'axios';
import '../../styles/MobileStyles.css';

// 로컬 axios 인스턴스 생성 및 인터셉터 설정
const api = axios.create({
  baseURL: '/api/v1'
});

// 요청 인터셉터 설정
api.interceptors.request.use(
  (config) => {
    // 토큰 가져오기 및 로깅
    const token = localStorage.getItem('asl_holdem_access_token');
    console.log('API 요청 시 사용되는 토큰:', token ? `${token.substring(0, 15)}...` : '없음');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('인증 토큰이 없습니다. 로그인이 필요할 수 있습니다.');
    }
    
    console.log(`API 요청: ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
api.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버 응답이 있는 오류
      console.error(`API 응답 오류 (${error.response.status}):`, error.response.data);
      
      // 401 오류 처리
      if (error.response.status === 401) {
        console.warn('인증 오류가 발생했습니다. 다시 로그인이 필요합니다.');
        // 선택적: 로그인 페이지로 리디렉션
        // window.location.href = '/mobile/login';
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답이 없는 오류
      console.error('API 요청에 대한 응답이 없습니다:', error.request);
    } else {
      // 요청 설정 중 발생한 오류
      console.error('API 요청 설정 오류:', error.message);
    }
    
    return Promise.reject(error);
  }
);

const Tournament = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    // 컴포넌트 마운트 시 인증 상태 확인
    const token = localStorage.getItem('asl_holdem_access_token');
    if (!token) {
      console.warn('토큰이 없습니다. 로그인 상태를 확인하세요.');
      setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      setLoading(false);
      return;
    }
    
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      // 로컬 스토리지에서 토큰 확인
      const token = localStorage.getItem('asl_holdem_access_token');
      console.log('토큰 확인:', token ? '토큰 있음' : '토큰 없음');
      
      // axios 인스턴스 사용
      const response = await api.get('/store/tournaments/');
      console.log('토너먼트 데이터 수신:', response.data);
      setTournaments(response.data);
      setError(null);
    } catch (err) {
      console.error('토너먼트 목록 가져오기 오류:', err);
      if (err.response && err.response.status === 401) {
        setError('로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인해주세요.');
      } else if (err.response && err.response.status === 500) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('토너먼트 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 날짜 기준으로 토너먼트 필터링
  const getFilteredTournaments = () => {
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return tournaments.filter(
        tournament => new Date(tournament.start_date) > now
      );
    } else if (activeTab === 'ongoing') {
      return tournaments.filter(
        tournament => 
          new Date(tournament.start_date) <= now && 
          new Date(tournament.end_date) >= now
      );
    } else if (activeTab === 'past') {
      return tournaments.filter(
        tournament => new Date(tournament.end_date) < now
      );
    }
    
    return tournaments;
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

  // 토너먼트 취소 처리
  const handleCancelTournament = async (tournamentId) => {
    if (!window.confirm('정말 이 토너먼트를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      // axios 인스턴스 사용
      await api.post(`/store/tournaments/${tournamentId}/cancel/`);
      
      // 성공 후 목록 새로고침
      fetchTournaments();
    } catch (err) {
      console.error('토너먼트 취소 오류:', err);
      alert('토너먼트 취소에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 토너먼트 상세 보기로 이동
  const handleEditTournament = (tournamentId) => {
    navigate(`/mobile/store/tournament/${tournamentId}/edit`);
  };

  // 토너먼트 참가자 관리로 이동
  const handleManageParticipants = (tournamentId) => {
    navigate(`/mobile/store/tournament/${tournamentId}/participants`);
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
    <div className="mobile-container">
      <div className="mobile-header">
        <button 
          className="mobile-nav-button" 
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="mobile-header-title">토너먼트 관리</h1>
        <div style={{ width: '24px' }}></div> {/* 균형을 위한 빈 공간 */}
      </div>
      
      {/* 탭 필터 */}
      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        className="mb-3"
        style={{ fontSize: '14px' }}
      >
        <Tab eventKey="upcoming" title="예정된 토너먼트" />
        <Tab eventKey="ongoing" title="진행 중인 토너먼트" />
        <Tab eventKey="past" title="지난 토너먼트" />
        <Tab eventKey="all" title="전체 토너먼트" />
      </Tabs>
      
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
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={fetchTournaments}
          >
            다시 시도
          </Button>
        </div>
      ) : getFilteredTournaments().length === 0 ? (
        <div className="mobile-empty-state">
          <i className="fas fa-calendar-times mobile-empty-icon"></i>
          <p>
            {activeTab === 'upcoming' ? '예정된 토너먼트가 없습니다.' : 
            activeTab === 'ongoing' ? '진행 중인 토너먼트가 없습니다.' :
            activeTab === 'past' ? '지난 토너먼트가 없습니다.' :
            '등록된 토너먼트가 없습니다.'}
          </p>
        </div>
      ) : (
        /* 토너먼트 목록 */
        <div>
          {getFilteredTournaments().map(tournament => (
            <Card 
              key={tournament.id} 
              className="mobile-card"
              style={{ marginBottom: '15px' }}
            >
              <Card.Body>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{tournament.title}</div>
                  {getStatusBadge(tournament)}
                </div>
                
                <div style={{ color: '#555', fontSize: '14px', marginBottom: '5px' }}>
                  <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
                  {formatDate(tournament.start_date)}
                </div>
                
                <div style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>
                  <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                  참가비: {tournament.entry_fee.toLocaleString()}원 / 참가자: {tournament.participants_count}/{tournament.max_participants}명
                </div>
                
                {/* 토너먼트 상태에 따라 다른 버튼 표시 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: activeTab === 'past' ? '1fr' : '1fr 1fr',
                  gap: '10px'
                }}>
                  {activeTab !== 'past' && (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => handleEditTournament(tournament.id)}
                    >
                      <i className="fas fa-edit" style={{ marginRight: '5px' }}></i>
                      수정
                    </Button>
                  )}
                  
                  <Button 
                    variant={activeTab === 'past' ? "outline-primary" : "outline-success"} 
                    size="sm" 
                    onClick={() => handleManageParticipants(tournament.id)}
                  >
                    <i className="fas fa-users" style={{ marginRight: '5px' }}></i>
                    참가자 관리
                  </Button>
                </div>
                
                {/* 예정된 토너먼트에만 취소 버튼 표시 */}
                {activeTab === 'upcoming' && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleCancelTournament(tournament.id)}
                    style={{ width: '100%', marginTop: '10px' }}
                  >
                    <i className="fas fa-times-circle" style={{ marginRight: '5px' }}></i>
                    토너먼트 취소
                  </Button>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournament; 