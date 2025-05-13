import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Modal, Spinner, Alert } from 'react-bootstrap';
import { tournamentAPI, storeAPI } from '../../utils/api';

const TournamentManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    store: '',
    start_date: '',
    start_time: '',
    buy_in: '',
    ticket_quantity: '',
    description: '',
    status: 'UPCOMING'
  });
  
  // 필터 상태
  const [filters, setFilters] = useState({
    status: '',
    store: '',
    startDate: '',
    endDate: ''
  });
  
  // 페이지 로드 시 토너먼트 목록 가져오기
  useEffect(() => {
    fetchTournaments();
    fetchStores();
  }, []);
  
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      
      // 실제 API 연동
      const response = await tournamentAPI.getAllTournamentInfo();
      setTournaments(response.data);
      setLoading(false);
      
      // 샘플 데이터 부분은 주석 처리
      /*
      setTimeout(() => {
        const sampleData = [
          // ... 샘플 데이터 ...
        ];
        
        setTournaments(sampleData);
        setLoading(false);
      }, 500);
      */
      
    } catch (err) {
      console.error('토너먼트 목록 로드 오류:', err);
      setError('토너먼트 목록을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
      
      // API 연동 오류 시 샘플 데이터 사용
      setTimeout(() => {
        const sampleData = [
          {
            id: 1,
            name: 'ASL A 대회',
            store_name: 'AA 매장',
            store: 1,
            start_time: '2024-05-15T13:00:00',
            status: 'UPCOMING',
            ticket_quantity: 100,
            participant_count: 70
          },
          {
            id: 2,
            name: 'ASL B 대회',
            store_name: 'BB 매장',
            store: 2,
            start_time: '2024-05-20T14:00:00',
            status: 'UPCOMING',
            ticket_quantity: 80,
            participant_count: 45
          },
          {
            id: 3,
            name: 'ASL C 대회',
            store_name: 'CC 매장',
            store: 3,
            start_time: '2024-04-10T10:00:00',
            status: 'COMPLETED',
            ticket_quantity: 120,
            participant_count: 120
          }
        ];
        
        setTournaments(sampleData);
        setLoading(false);
      }, 500);
    }
  };
  
  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      
      // 실제 API 연동
      const response = await storeAPI.getAllStores();
      setStores(response.data);
      setLoadingStores(false);
      
      // 샘플 데이터 부분은 주석 처리
      /*
      setTimeout(() => {
        const sampleStores = [
          { id: 1, name: 'AA 매장' },
          { id: 2, name: 'BB 매장' },
          { id: 3, name: 'CC 매장' }
        ];
        
        setStores(sampleStores);
        setLoadingStores(false);
      }, 300);
      */
      
    } catch (err) {
      console.error('매장 목록 로드 오류:', err);
      setLoadingStores(false);
      
      // API 연동 오류 시 샘플 데이터 사용
      setTimeout(() => {
        const sampleStores = [
          { id: 1, name: 'AA 매장' },
          { id: 2, name: 'BB 매장' },
          { id: 3, name: 'CC 매장' }
        ];
        
        setStores(sampleStores);
        setLoadingStores(false);
      }, 300);
    }
  };
  
  // 폼 필드 변경 핸들러
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 필터 변경 핸들러
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // 필터 적용
  const applyFilters = () => {
    // 실제 API 연동 시 필터를 적용한 API 호출
    // fetchTournaments(filters);
    console.log('필터 적용:', filters);
  };
  
  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      status: '',
      store: '',
      startDate: '',
      endDate: ''
    });
  };
  
  // 토너먼트 생성 제출 핸들러
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // 필수 필드 검증
      if (!formData.name || !formData.store || !formData.start_date || 
          !formData.start_time || !formData.buy_in || !formData.ticket_quantity) {
        setError('모든 필수 필드를 입력해주세요.');
        setLoading(false);
        return;
      }
      
      // 날짜 & 시간 결합
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      
      // 폼 데이터 준비
      const tournamentData = {
        name: formData.name,
        store: formData.store, // 문자열로 보내고 백엔드에서 변환하도록
        start_time: startDateTime,
        buy_in: formData.buy_in,
        ticket_quantity: formData.ticket_quantity,
        description: formData.description || "",
        status: formData.status
      };
      
      console.log('토너먼트 생성 데이터:', tournamentData);
      
      // 실제 API 연동
      await tournamentAPI.createTournament(tournamentData);
      
      setSuccess('토너먼트가 성공적으로 생성되었습니다.');
      // 폼 초기화
      setFormData({
        name: '',
        store: '',
        start_date: '',
        start_time: '',
        buy_in: '',
        ticket_quantity: '',
        description: '',
        status: 'UPCOMING'
      });
      
      // 토너먼트 목록 다시 불러오기
      fetchTournaments();
      
      // 모달 닫기
      setShowCreateModal(false);
      setLoading(false);
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('토너먼트 생성 오류:', err);
      if (err.response && err.response.data) {
        // 백엔드 오류 메시지 표시
        setError(`토너먼트 생성 중 오류가 발생했습니다: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('토너먼트 생성 중 오류가 발생했습니다.');
      }
      setLoading(false);
    }
  };
  
  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>토너먼트 관리</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          새 토너먼트 생성
        </Button>
      </div>
      
      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* 필터 섹션 */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>상태</Form.Label>
                <Form.Select 
                  name="status" 
                  value={filters.status} 
                  onChange={handleFilterChange}
                >
                  <option value="">모든 상태</option>
                  <option value="UPCOMING">예정</option>
                  <option value="ONGOING">진행중</option>
                  <option value="COMPLETED">완료</option>
                  <option value="CANCELLED">취소</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>매장</Form.Label>
                <Form.Select 
                  name="store" 
                  value={filters.store} 
                  onChange={handleFilterChange}
                >
                  <option value="">모든 매장</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>시작일</Form.Label>
                <Form.Control 
                  type="date" 
                  name="startDate" 
                  value={filters.startDate} 
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>종료일</Form.Label>
                <Form.Control 
                  type="date" 
                  name="endDate" 
                  value={filters.endDate} 
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end">
            <Button variant="secondary" className="me-2" onClick={resetFilters}>초기화</Button>
            <Button variant="primary" onClick={applyFilters}>필터 적용</Button>
          </div>
        </Card.Body>
      </Card>

      {/* 토너먼트 목록 */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">데이터를 불러오는 중입니다...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이름</th>
                    <th>매장</th>
                    <th>시작일</th>
                    <th>상태</th>
                    <th>좌석권 수량</th>
                    <th>등록 수</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.length > 0 ? (
                    tournaments.map(tournament => (
                      <tr key={tournament.id}>
                        <td>{tournament.id}</td>
                        <td>{tournament.name}</td>
                        <td>{tournament.store_name}</td>
                        <td>{formatDate(tournament.start_time)}</td>
                        <td>
                          <span className={`badge bg-${
                            tournament.status === 'UPCOMING' ? 'warning' :
                            tournament.status === 'ONGOING' ? 'success' :
                            tournament.status === 'COMPLETED' ? 'secondary' : 'danger'
                          }`}>
                            {tournament.status === 'UPCOMING' ? '예정' :
                            tournament.status === 'ONGOING' ? '진행중' :
                            tournament.status === 'COMPLETED' ? '완료' : '취소'}
                          </span>
                        </td>
                        <td>{tournament.ticket_quantity}</td>
                        <td>{tournament.participant_count}</td>
                        <td>
                          <Button variant="outline-primary" size="sm">
                            수정
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">토너먼트 데이터가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* 토너먼트 생성 모달 */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>새 토너먼트 생성</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateTournament}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>토너먼트 이름 *</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="이름 입력" 
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장 *</Form.Label>
                  <Form.Select 
                    name="store"
                    value={formData.store}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">매장 선택</option>
                    {loadingStores ? (
                      <option disabled>로딩 중...</option>
                    ) : (
                      stores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>시작 날짜 *</Form.Label>
                  <Form.Control 
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>시작 시간 *</Form.Label>
                  <Form.Control 
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>바이인 금액 *</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="금액 입력" 
                    name="buy_in"
                    value={formData.buy_in}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>좌석권 수량 *</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="좌석권 수량 입력" 
                    name="ticket_quantity"
                    value={formData.ticket_quantity}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>설명</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="토너먼트 설명 입력" 
                name="description"
                value={formData.description}
                onChange={handleFormChange}
              />
            </Form.Group>
            <div className="text-end mt-4">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="me-2">
                취소
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    처리 중...
                  </>
                ) : '토너먼트 생성'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TournamentManagement; 