import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, getToken } from '../../../utils/auth';
import MobileHeader from '../../components/MobileHeader';
import API from '../../../utils/api';

const Tournament = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newTournament, setNewTournament] = useState({
    name: '',
    date: '',
    time: '',
    buyIn: '',
    maxPlayers: ''
  });

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
      
      // 먼저 백엔드 서버 연결 상태 확인
      try {
        console.log('백엔드 서버 연결 테스트...');
        const healthCheck = await API.get('/');
        console.log('백엔드 서버 응답:', healthCheck);
      } catch (healthError) {
        console.error('백엔드 서버 연결 실패:', healthError);
        console.error('서버가 실행되지 않았을 수 있습니다.');
      }
      
      // 매장 정보 가져오기 시도
      try {
        console.log('매장 정보 API 호출 시도...');
        const storeResponse = await API.get('/store/info/');
        console.log('매장 정보 응답:', storeResponse.data);
        
        if (storeResponse.data && storeResponse.data.id) {
          // 해당 매장의 토너먼트 목록을 가져옵니다
          console.log(`토너먼트 목록 API 호출: /tournaments/all_info/?store_id=${storeResponse.data.id}`);
          const response = await API.get(`/tournaments/all_info/?store_id=${storeResponse.data.id}`);
          console.log('토너먼트 목록 응답:', response.data);
          
          if (response.data && Array.isArray(response.data)) {
            setTournaments(response.data);
            console.log(`토너먼트 ${response.data.length}개 로드 완료`);
          } else {
            console.log('토너먼트 응답이 배열이 아님:', typeof response.data);
            setTournaments([]);
          }
        } else {
          console.log('매장 정보가 없음 - 빈 토너먼트 목록 설정');
          setTournaments([]);
        }
      } catch (storeError) {
        console.error('매장 정보 가져오기 실패:', storeError);
        console.error('매장 정보 에러 상세:', {
          message: storeError.message,
          response: storeError.response,
          status: storeError.response?.status,
          data: storeError.response?.data
        });
        
        // 매장 정보 API 실패 시 모든 토너먼트 조회 시도
        console.log('모든 토너먼트 목록 조회 시도...');
        try {
          const allTournamentsResponse = await API.get('/tournaments/all_info/');
          console.log('모든 토너먼트 응답:', allTournamentsResponse.data);
          
          if (allTournamentsResponse.data && Array.isArray(allTournamentsResponse.data)) {
            setTournaments(allTournamentsResponse.data);
            console.log(`모든 토너먼트 ${allTournamentsResponse.data.length}개 로드 완료`);
          } else {
            console.log('모든 토너먼트 응답이 배열이 아님:', typeof allTournamentsResponse.data);
            setTournaments([]);
          }
        } catch (allTournamentsError) {
          console.error('모든 토너먼트 조회도 실패:', allTournamentsError);
          console.error('모든 토너먼트 에러 상세:', {
            message: allTournamentsError.message,
            response: allTournamentsError.response,
            status: allTournamentsError.response?.status,
            data: allTournamentsError.response?.data
          });
          setTournaments([]);
          
          // 에러를 던지지 말고 빈 목록으로 처리
          console.log('API 호출 실패했지만 빈 목록으로 처리');
          setError('토너먼트 목록을 불러올 수 없습니다. 나중에 다시 시도해주세요.');
          return; // throw 대신 return 사용
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('토너먼트 목록 가져오기 오류:', err);
      setError(err.message || '토너먼트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTournamentChange = (e) => {
    const { name, value } = e.target;
    setNewTournament(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTournament = async () => {
    try {
      console.log('토너먼트 생성 시작', newTournament);
      
      // API 요청 데이터 구성
      const tournamentData = {
        name: newTournament.name,
        start_date: newTournament.date,
        start_time: newTournament.time,
        buy_in: newTournament.buyIn,
        max_seats: newTournament.maxPlayers
      };
      
      const response = await API.post('/store/tournaments/', tournamentData);
      console.log('토너먼트 생성 응답:', response.data);
      
      // 성공 시 목록에 추가
      fetchTournaments();
      
      // 입력 필드 초기화
      setNewTournament({
        name: '',
        date: '',
        time: '',
        buyIn: '',
        maxPlayers: ''
      });
      
      // 모달 닫기
      setShowModal(false);
    } catch (err) {
      console.error('토너먼트 생성 오류:', err);
      alert('토너먼트 생성 중 오류가 발생했습니다.');
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
              <h2 className="fs-4 mb-0"> 매장 토너먼트 목록</h2>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowModal(true)}
              >
                <i className="fas fa-plus me-2"></i>새 토너먼트
              </Button>
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
                          {new Date(tournament.start_time).toLocaleString()} | 바이인: {tournament.buy_in}원
                        </p>
                        <p className="mb-0">
                          <span className="badge bg-primary me-2">
                            참가자: {tournament.participant_count || 0}명
                          </span>
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
                          onClick={() => console.log('토너먼트 상세:', tournament.id)}
                        >
                          상세 보기
                        </Button>
                        {tournament.status === 'UPCOMING' && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleCancelTournament(tournament.id)}
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
        
        {/* 토너먼트 생성 모달 */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>새 토너먼트 생성</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>토너먼트 이름</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="토너먼트 이름을 입력하세요"
                  name="name"
                  value={newTournament.name}
                  onChange={handleNewTournamentChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>날짜</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={newTournament.date}
                  onChange={handleNewTournamentChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>시간</Form.Label>
                <Form.Control
                  type="time"
                  name="time"
                  value={newTournament.time}
                  onChange={handleNewTournamentChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>바이인 금액</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="예: 30,000원"
                  name="buyIn"
                  value={newTournament.buyIn}
                  onChange={handleNewTournamentChange}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>최대 참가자 수</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="최대 참가자 수를 입력하세요"
                  name="maxPlayers"
                  value={newTournament.maxPlayers}
                  onChange={handleNewTournamentChange}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleCreateTournament}>
              토너먼트 생성
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default Tournament; 