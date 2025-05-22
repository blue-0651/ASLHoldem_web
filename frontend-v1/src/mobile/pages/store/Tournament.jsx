import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated } from '../../../utils/auth';
import MobileHeader from '../../components/MobileHeader';

const Tournament = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [tournaments, setTournaments] = useState([
    {
      id: 1,
      name: '주간 홀덤 토너먼트',
      date: '2023-05-15',
      time: '19:00',
      buyIn: '30,000원',
      players: 24,
      status: 'upcoming'
    },
    {
      id: 2,
      name: '주말 스페셜 토너먼트',
      date: '2023-05-20',
      time: '14:00',
      buyIn: '50,000원',
      players: 32,
      status: 'upcoming'
    },
    {
      id: 3,
      name: 'VIP 멤버십 토너먼트',
      date: '2023-05-21',
      time: '16:00',
      buyIn: '100,000원',
      players: 16,
      status: 'upcoming'
    }
  ]);
  
  const [newTournament, setNewTournament] = useState({
    name: '',
    date: '',
    time: '',
    buyIn: '',
    maxPlayers: ''
  });

  useEffect(() => {
    // 인증 상태 확인
    if (!isAuthenticated()) {
      navigate('/mobile/login');
      return;
    }
    
    // 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [navigate]);

  const handleNewTournamentChange = (e) => {
    const { name, value } = e.target;
    setNewTournament(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTournament = () => {
    // 새 토너먼트 추가 로직 (여기서는 예시로 간단하게 처리)
    const newId = tournaments.length + 1;
    const createdTournament = {
      id: newId,
      name: newTournament.name,
      date: newTournament.date,
      time: newTournament.time,
      buyIn: newTournament.buyIn,
      players: 0,
      status: 'upcoming'
    };
    
    setTournaments([...tournaments, createdTournament]);
    setNewTournament({
      name: '',
      date: '',
      time: '',
      buyIn: '',
      maxPlayers: ''
    });
    setShowModal(false);
  };

  return (
    <div className="asl-mobile-container">
      {/* MobileHeader 컴포넌트 사용 */}
      <MobileHeader title="토너먼트 관리" backButton={true} />
      
      {/* 컨텐츠 영역 */}
      <Container className="asl-mobile-content">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="fs-4 mb-0">내 토너먼트 목록</h2>
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
        
        {tournaments.map(tournament => (
          <Row key={tournament.id} className="mb-3">
            <Col>
              <Card className="asl-tournament-card">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="fs-5 mb-1">{tournament.name}</h3>
                      <p className="text-muted mb-2">
                        {tournament.date} {tournament.time} | 바이인: {tournament.buyIn}
                      </p>
                      <p className="mb-0">
                        <span className="badge bg-primary me-2">참가자: {tournament.players}명</span>
                        <span className={`badge ${tournament.status === 'upcoming' ? 'bg-success' : 'bg-secondary'}`}>
                          {tournament.status === 'upcoming' ? '예정됨' : '종료'}
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
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => console.log('토너먼트 취소:', tournament.id)}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ))}
        
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