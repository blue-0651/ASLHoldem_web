import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, getToken } from '../../../utils/auth';
import MobileHeader from '../../components/MobileHeader';
import API from '../../../utils/api';

const Tournament = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        console.log('=== 인증 및 데이터 로딩 시작 ===');
        
        // localStorage 내용 확인
        const token = getToken();
        const currentUser = getCurrentUser();
        const userType = localStorage.getItem('user_type');
        
        console.log('토큰:', token ? '존재함' : '없음');
        console.log('사용자 정보:', currentUser);
        console.log('사용자 타입:', userType);
        console.log('인증 상태:', isAuthenticated());
        
        // localStorage의 모든 asl_holdem 관련 항목 확인
        console.log('=== localStorage 전체 확인 ===');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('asl_holdem')) {
            console.log(`${key}:`, localStorage.getItem(key));
          }
        }
        
        // 임시로 인증 체크 우회 (디버깅용)
        console.log('인증 체크 우회 - 토너먼트 목록 가져오기 시도');
        
        // 기본 사용자 정보 설정 (로그인되지 않은 경우)
        if (!currentUser) {
          console.log('사용자 정보가 없어서 기본값 설정');
          const defaultUser = { id: 1, phone: 'test', nickname: 'test' };
          setUser(defaultUser);
        } else {
          setUser(currentUser);
        }
        
        console.log('토너먼트 목록 가져오기 시작...');
        // 매장 토너먼트 목록 가져오기
        await fetchTournaments();
      } catch (err) {
        console.error('초기 데이터 로딩 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);
  
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      console.log('토너먼트 목록 가져오기 시작');
      
      const currentUser = getCurrentUser();
      console.log('fetchTournaments - 현재 사용자 정보:', currentUser);
      
      // 매장 관리자용 토너먼트 목록 API 호출
      try {
        console.log('매장 관리자용 토너먼트 목록 API 호출: /store/tournaments/');
        const response = await API.get('/store/tournaments/');
        console.log('토너먼트 목록 응답:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          setTournaments(response.data);
          console.log(`토너먼트 ${response.data.length}개 로드 완료`);
        } else {
          console.log('토너먼트 응답이 배열이 아님:', typeof response.data);
          setTournaments([]);
        }
      } catch (apiError) {
        console.error('매장 토너먼트 목록 가져오기 실패:', apiError);
        console.error('API 에러 상세:', {
          message: apiError.message,
          response: apiError.response,
          status: apiError.response?.status,
          data: apiError.response?.data
        });
        
        if (apiError.response?.status === 401) {
          setError('로그인이 필요합니다.');
        } else if (apiError.response?.status === 403) {
          setError('매장 관리자 권한이 없습니다.');
        } else {
          setError('토너먼트 목록을 불러올 수 없습니다. 나중에 다시 시도해주세요.');
        }
        setTournaments([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('토너먼트 목록 가져오기 오류:', err);
      setError(err.message || '토너먼트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTournament = async (tournamentId) => {
    try {
      console.log('토너먼트 취소 시작', tournamentId);
      
      const response = await API.post(`/store/tournaments/${tournamentId}/cancel/`);
      console.log('토너먼트 취소 응답:', response.data);
      
      // 취소 후 목록 다시 불러오기
      fetchTournaments();
    } catch (err) {
      console.error('토너먼트 취소 오류:', err);
      alert('토너먼트 취소 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="asl-mobile-container">
      {/* MobileHeader 컴포넌트 사용 */}
      <MobileHeader title="토너먼트 관리" />
      
      {/* 컨텐츠 영역 */}
      <Container className="asl-mobile-content">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="fs-4 mb-0">매장 토너먼트 목록</h2>
            </div>
          </Col>
        </Row>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spinner animation="border" size="sm" />
            <p style={{ marginTop: '10px' }}>토너먼트 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : tournaments.length === 0 ? (
          <p className="text-muted">등록된 토너먼트가 없습니다.</p>
        ) : (
          tournaments.map(tournament => (
            <Row key={tournament.id} className="mb-3">
              <Col>
                <Card className="asl-tournament-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between">
                      <div>
                        <h3 className="fs-5 mb-1">{tournament.name}</h3>
                        <p className="text-muted mb-2">
                          {new Date(tournament.start_time).toLocaleString()} | 바이인: {tournament.buy_in?.toLocaleString()}원
                        </p>
                        <div className="mb-2">
                          <small className="text-muted d-block">
                            <i className="fas fa-ticket-alt me-1"></i>
                            배분된 좌석: {tournament.allocated_quantity || 0}석
                          </small>
                          <small className="text-muted d-block">
                            <i className="fas fa-chair me-1"></i>
                            남은 좌석: {tournament.remaining_quantity || 0}석
                          </small>
                          {tournament.description && (
                            <small className="text-muted d-block">
                              <i className="fas fa-info-circle me-1"></i>
                              {tournament.description}
                            </small>
                          )}
                        </div>
                        <p className="mb-0">
                          <span className={`badge ${tournament.status === 'UPCOMING' ? 'bg-success' : 'bg-secondary'}`}>
                            {tournament.status === 'UPCOMING' ? '예정됨' : 
                             tournament.status === 'ONGOING' ? '진행중' :
                             tournament.status === 'COMPLETED' ? '종료' : '취소됨'}
                          </span>
                        </p>
                      </div>
                      <div className="d-flex flex-column">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="mb-2"
                          onClick={() => navigate(`/mobile/store/tournament/${tournament.id}`)}
                        >
                          상세 보기
                        </Button>
                        {tournament.status === 'UPCOMING' && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`'${tournament.name}' 토너먼트를 취소하시겠습니까?`)) {
                                handleCancelTournament(tournament.id);
                              }
                            }}
                          >
                            취소
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ))
        )}
      </Container>
    </div>
  );
};

export default Tournament; 