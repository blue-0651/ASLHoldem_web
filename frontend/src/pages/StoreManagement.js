import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Modal, Tabs, Tab, Badge, Spinner } from 'react-bootstrap';
import { storeAPI } from '../utils/api';

const StoreManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeTickets, setStoreTickets] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 샘플 데이터: 실제 API 연동 시 대체해야 함
  const stores = [
    {
      id: 1,
      name: 'AA 매장',
      address: '서울시 강남구 역삼동 123-45',
      phone: '02-1234-5678',
      ticket_quantity: 10,
      tournament_count: 5
    },
    {
      id: 2,
      name: 'BB 매장',
      address: '서울시 서초구 서초동 456-78',
      phone: '02-2345-6789',
      ticket_quantity: 10,
      tournament_count: 3
    },
    {
      id: 3,
      name: 'CC 매장',
      address: '서울시 송파구 송파동 789-12',
      phone: '02-3456-7890',
      ticket_quantity: 10,
      tournament_count: 4
    }
  ];

  const handleTicketManagement = async (store) => {
    setSelectedStore(store);
    setShowTicketModal(true);
    setLoading(true);
    
    try {
      // 실제 API 연동 시 주석 해제
      // const response = await storeAPI.getStoreTournamentTickets(store.id);
      // setStoreTickets(response.data);
      
      // 샘플 데이터 (API 연동 전까지 사용)
      setTimeout(() => {
        const sampleData = {
          store_name: store.name,
          store_id: store.id,
          tournaments: [
            {
              토너먼트_id: 1,
              토너먼트명: 'ASL A 대회',
              시작_시간: '2024-05-15 13:00',
              총_좌석권_수량: 100,
              배포된_좌석권_수량: 75,
              남은_좌석권_수량: 25,
              선수별_좌석권: [
                { 선수명: 'A 선수', 배포_일시: '2024-05-01 14:30', 좌석권_상태: '사용 가능' },
                { 선수명: 'B 선수', 배포_일시: '2024-05-02 15:45', 좌석권_상태: '사용 가능' },
                { 선수명: 'C 선수', 배포_일시: '2024-05-03 16:20', 좌석권_상태: '사용 완료' }
              ]
            },
            {
              토너먼트_id: 2,
              토너먼트명: 'ASL B 대회',
              시작_시간: '2024-05-20 14:00',
              총_좌석권_수량: 80,
              배포된_좌석권_수량: 45,
              남은_좌석권_수량: 35,
              선수별_좌석권: [
                { 선수명: 'D 선수', 배포_일시: '2024-05-05 10:20', 좌석권_상태: '사용 가능' },
                { 선수명: 'E 선수', 배포_일시: '2024-05-06 11:30', 좌석권_상태: '사용 가능' }
              ]
            }
          ]
        };
        
        setStoreTickets(sampleData);
        if (sampleData.tournaments && sampleData.tournaments.length > 0) {
          setSelectedTournament(sampleData.tournaments[0]);
        }
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('매장 좌석권 정보 로드 오류:', error);
      setLoading(false);
    }
  };

  // 토너먼트 변경 핸들러
  const handleTournamentChange = (tournamentId) => {
    if (storeTickets && storeTickets.tournaments) {
      const tournament = storeTickets.tournaments.find(t => t.토너먼트_id === parseInt(tournamentId));
      if (tournament) {
        setSelectedTournament(tournament);
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>매장 관리</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          새 매장 등록
        </Button>
      </div>

      {/* 필터 섹션 */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>매장명</Form.Label>
                <Form.Control type="text" placeholder="매장명 검색..." />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>주소</Form.Label>
                <Form.Control type="text" placeholder="주소 검색..." />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>정렬</Form.Label>
                <Form.Select>
                  <option value="name">매장명 (오름차순)</option>
                  <option value="-name">매장명 (내림차순)</option>
                  <option value="tournament_count">토너먼트 수 (오름차순)</option>
                  <option value="-tournament_count">토너먼트 수 (내림차순)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end">
            <Button variant="secondary" className="me-2">초기화</Button>
            <Button variant="primary">필터 적용</Button>
          </div>
        </Card.Body>
      </Card>

      {/* 매장 목록 */}
      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>매장명</th>
                  <th>주소</th>
                  <th>전화번호</th>
                  <th>좌석권 수량</th>
                  <th>토너먼트 수</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.id}>
                    <td>{store.id}</td>
                    <td>{store.name}</td>
                    <td>{store.address}</td>
                    <td>{store.phone}</td>
                    <td>{store.ticket_quantity}</td>
                    <td>{store.tournament_count}</td>
                    <td>
                      <Button 
                        variant="info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleTicketManagement(store)}
                      >
                        좌석권 관리
                      </Button>
                      <Button variant="outline-primary" size="sm">
                        수정
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* 매장 등록 모달 */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>새 매장 등록</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>매장명</Form.Label>
              <Form.Control type="text" placeholder="매장명 입력" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>주소</Form.Label>
              <Form.Control type="text" placeholder="주소 입력" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>전화번호</Form.Label>
              <Form.Control type="text" placeholder="전화번호 입력" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>초기 좌석권 수량</Form.Label>
              <Form.Control type="number" placeholder="수량 입력" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            취소
          </Button>
          <Button variant="primary">
            매장 등록
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 좌석권 관리 모달 */}
      <Modal 
        show={showTicketModal} 
        onHide={() => setShowTicketModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedStore && selectedStore.name} 좌석권 관리
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">좌석권 정보를 불러오는 중입니다...</p>
            </div>
          ) : (
            storeTickets && (
              <>
                {/* 토너먼트 선택 부분 */}
                <Form.Group className="mb-4">
                  <Form.Label><strong>토너먼트 선택</strong></Form.Label>
                  <Form.Select 
                    onChange={(e) => handleTournamentChange(e.target.value)}
                  >
                    {storeTickets.tournaments.map(tournament => (
                      <option 
                        key={tournament.토너먼트_id} 
                        value={tournament.토너먼트_id}
                      >
                        {tournament.토너먼트명} ({tournament.시작_시간})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {selectedTournament && (
                  <>
                    <div className="d-flex justify-content-between mb-4">
                      <div className="text-center p-3 border rounded">
                        <h6>총 좌석권 수량</h6>
                        <h4>{selectedTournament.총_좌석권_수량}</h4>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <h6>배포된 좌석권</h6>
                        <h4>{selectedTournament.배포된_좌석권_수량}</h4>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <h6>남은 좌석권 수량</h6>
                        <h4>{selectedTournament.남은_좌석권_수량}</h4>
                      </div>
                    </div>

                    <h5 className="mb-3">{selectedTournament.토너먼트명} - 좌석권 배포 내역</h5>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>선수명</th>
                            <th>배포 일시</th>
                            <th>상태</th>
                            <th>액션</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTournament.선수별_좌석권.length > 0 ? (
                            selectedTournament.선수별_좌석권.map((ticket, index) => (
                              <tr key={index}>
                                <td>{ticket.선수명}</td>
                                <td>{ticket.배포_일시}</td>
                                <td>
                                  <Badge bg={ticket.좌석권_상태 === '사용 가능' ? 'success' : 'secondary'}>
                                    {ticket.좌석권_상태}
                                  </Badge>
                                </td>
                                <td>
                                  {ticket.좌석권_상태 === '사용 가능' && (
                                    <Button variant="outline-danger" size="sm">
                                      회수
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center">배포된 좌석권이 없습니다.</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>

                    <Form className="mt-4">
                      <h5 className="mb-3">좌석권 추가 배포 - {selectedTournament.토너먼트명}</h5>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>선수 선택</Form.Label>
                            <Form.Select>
                              <option value="">선수 선택</option>
                              <option value="1">D 선수</option>
                              <option value="2">E 선수</option>
                              <option value="3">F 선수</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>배포 수량</Form.Label>
                            <Form.Control type="number" min="1" defaultValue="1" />
                          </Form.Group>
                        </Col>
                      </Row>
                      <div className="text-end">
                        <Button variant="primary">좌석권 배포</Button>
                      </div>
                    </Form>
                  </>
                )}
              </>
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTicketModal(false)}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StoreManagement; 