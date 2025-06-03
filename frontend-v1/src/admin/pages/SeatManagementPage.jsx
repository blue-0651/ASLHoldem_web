import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from 'reactstrap';
import { 
  Search, 
  Send, 
  RotateCcw, 
  User, 
  Award, 
  Calendar, 
  DollarSign,
  Users,
  ArrowRight,
  ArrowLeft
} from 'react-feather';

const SeatManagementPage = () => {
  // 탭 상태
  const [activeTab, setActiveTab] = useState('send');

  // 기본 상태
  const [tournaments, setTournaments] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [confirmModal, setConfirmModal] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // 회수용 추가 상태
  const [userTickets, setUserTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);

  // 더미 데이터 초기화
  useEffect(() => {
    initializeDummyData();
  }, []);

  const initializeDummyData = () => {
    // 더미 토너먼트 데이터
    const dummyTournaments = [
      {
        id: 1,
        name: '2024년 신년 토너먼트',
        start_time: '2024-01-15T14:00:00',
        buy_in: 2,
        ticket_quantity: 100,
        status: 'UPCOMING'
      },
      {
        id: 2,
        name: '주말 스페셜 토너먼트',
        start_time: '2024-01-20T19:00:00',
        buy_in: 3,
        ticket_quantity: 150,
        status: 'UPCOMING'
      },
      {
        id: 3,
        name: '월말 챔피언십',
        start_time: '2024-01-30T16:00:00',
        buy_in: 5,
        ticket_quantity: 200,
        status: 'ONGOING'
      }
    ];

    // 더미 매장 데이터
    const dummyStore = {
      id: 1,
      name: '강남 홀덤 매장',
      address: '서울시 강남구 테헤란로 123',
      max_capacity: 50
    };

    // 더미 거래 내역
    const dummyTransactions = [
      {
        id: 1,
        type: 'SEND',
        tournament_name: '2024년 신년 토너먼트',
        user_name: '김철수',
        user_phone: '010-1234-5678',
        quantity: 2,
        memo: '신규 고객 환영 SEAT권',
        created_at: '2024-01-10T10:30:00',
        status: 'COMPLETED'
      },
      {
        id: 2,
        type: 'RETRIEVE',
        tournament_name: '주말 스페셜 토너먼트',
        user_name: '이영희',
        user_phone: '010-2345-6789',
        quantity: 1,
        memo: '참가 취소로 인한 회수',
        created_at: '2024-01-10T09:15:00',
        status: 'COMPLETED'
      },
      {
        id: 3,
        type: 'SEND',
        tournament_name: '월말 챔피언십',
        user_name: '박민수',
        user_phone: '010-3456-7890',
        quantity: 3,
        memo: '이벤트 당첨 SEAT권',
        created_at: '2024-01-09T16:45:00',
        status: 'COMPLETED'
      }
    ];

    setTournaments(dummyTournaments);
    setCurrentStore(dummyStore);
    setRecentTransactions(dummyTransactions);
  };

  // 사용자 검색 함수 (더미)
  const searchUser = () => {
    if (!searchPhone.trim()) {
      showAlert('warning', '전화번호를 입력해주세요.');
      return;
    }

    setSearchLoading(true);

    // 더미 사용자 데이터
    const dummyUsers = [
      {
        id: 1,
        nickname: '김철수',
        phone: '010-1234-5678',
        username: 'chulsoo_kim'
      },
      {
        id: 2,
        nickname: '이영희',
        phone: '010-2345-6789',
        username: 'younghee_lee'
      },
      {
        id: 3,
        nickname: '박민수',
        phone: '010-3456-7890',
        username: 'minsu_park'
      }
    ];

    // 전화번호로 사용자 찾기
    setTimeout(() => {
      const foundUser = dummyUsers.find(user => 
        user.phone.includes(searchPhone.replace(/[^0-9]/g, ''))
      );

      if (foundUser) {
        setSelectedUser(foundUser);
        
        // 회수 탭일 때 사용자의 SEAT권 목록 로드
        if (activeTab === 'retrieve') {
          loadUserTickets(foundUser.id);
        }
        
        showAlert('success', '사용자를 찾았습니다.');
      } else {
        setSelectedUser(null);
        setUserTickets([]);
        showAlert('error', '해당 전화번호로 등록된 사용자를 찾을 수 없습니다.');
      }
      setSearchLoading(false);
    }, 1000);
  };

  // 사용자의 SEAT권 목록 로드 (더미)
  const loadUserTickets = (userId) => {
    const dummyUserTickets = [
      {
        id: 'ticket_001',
        tournament_id: 1,
        tournament_name: '2024년 신년 토너먼트',
        status: 'ACTIVE',
        issued_at: '2024-01-08T14:30:00',
        expires_at: null
      },
      {
        id: 'ticket_002',
        tournament_id: 1,
        tournament_name: '2024년 신년 토너먼트',
        status: 'ACTIVE',
        issued_at: '2024-01-08T14:30:00',
        expires_at: null
      },
      {
        id: 'ticket_003',
        tournament_id: 2,
        tournament_name: '주말 스페셜 토너먼트',
        status: 'ACTIVE',
        issued_at: '2024-01-09T16:20:00',
        expires_at: null
      }
    ];

    setUserTickets(dummyUserTickets);
  };

  // SEAT권 전송 처리
  const handleSendTickets = () => {
    if (!selectedTournament) {
      showAlert('warning', '토너먼트를 선택해주세요.');
      return;
    }
    if (!selectedUser) {
      showAlert('warning', '사용자를 검색해주세요.');
      return;
    }
    if (!quantity || quantity < 1) {
      showAlert('warning', '올바른 수량을 입력해주세요.');
      return;
    }

    setConfirmModal(true);
  };

  // SEAT권 회수 처리
  const handleRetrieveTickets = () => {
    if (selectedTickets.length === 0) {
      showAlert('warning', '회수할 SEAT권을 선택해주세요.');
      return;
    }

    setConfirmModal(true);
  };

  // 확인 후 실행
  const confirmAction = () => {
    setLoading(true);
    
    setTimeout(() => {
      const newTransaction = {
        id: recentTransactions.length + 1,
        type: activeTab === 'send' ? 'SEND' : 'RETRIEVE',
        tournament_name: tournaments.find(t => t.id == selectedTournament)?.name || '',
        user_name: selectedUser?.nickname || selectedUser?.username || '이름 없음',
        user_phone: selectedUser?.phone || '',
        quantity: activeTab === 'send' ? parseInt(quantity) : selectedTickets.length,
        memo: memo,
        created_at: new Date().toISOString(),
        status: 'COMPLETED'
      };

      setRecentTransactions([newTransaction, ...recentTransactions]);
      
      // 폼 초기화
      setSelectedTournament('');
      setSelectedUser(null);
      setSearchPhone('');
      setQuantity(1);
      setMemo('');
      setSelectedTickets([]);
      setUserTickets([]);

      setConfirmModal(false);
      setLoading(false);
      
      const actionType = activeTab === 'send' ? '전송' : '회수';
      showAlert('success', `SEAT권 ${actionType}이 완료되었습니다.`);
    }, 1500);
  };

  // 알림 표시
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // 상태 배지
  const getStatusBadge = (status) => {
    const statusMap = {
      'ACTIVE': { color: 'success', text: '활성' },
      'USED': { color: 'secondary', text: '사용됨' },
      'EXPIRED': { color: 'warning', text: '만료됨' },
      'CANCELLED': { color: 'danger', text: '취소됨' },
      'COMPLETED': { color: 'success', text: '완료' }
    };
    
    const statusInfo = statusMap[status] || { color: 'secondary', text: status };
    return <Badge color={statusInfo.color}>{statusInfo.text}</Badge>;
  };

  // 거래 타입 배지
  const getTransactionTypeBadge = (type) => {
    const typeMap = {
      'SEND': { color: 'primary', text: '전송', icon: <ArrowRight size={12} /> },
      'RETRIEVE': { color: 'warning', text: '회수', icon: <ArrowLeft size={12} /> }
    };
    
    const typeInfo = typeMap[type] || { color: 'secondary', text: type, icon: null };
    return (
      <Badge color={typeInfo.color} className="d-flex align-items-center gap-1">
        {typeInfo.icon}
        {typeInfo.text}
      </Badge>
    );
  };

  // 체크박스 토글
  const toggleTicketSelection = (ticketId) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  return (
    <div className="container-fluid seat-management-page">
      {/* 페이지 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>SEAT권 전송 및 회수 관리</h2>
      </div>

      {/* 알림 섹션 */}
      {alert.show && (
        <Alert color={alert.type} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <Row>
        <Col md={12}>
          <Card className="form-section">
            <CardHeader>
              {/* 기존 타이틀 제거 */}
            </CardHeader>
            <CardBody>
              {/* 탭 네비게이션 */}
              <Nav tabs className="mb-4">
                <NavItem>
                  <NavLink
                    className={activeTab === 'send' ? 'active' : ''}
                    onClick={() => {
                      setActiveTab('send');
                      setSelectedUser(null);
                      setSearchPhone('');
                      setUserTickets([]);
                      setSelectedTickets([]);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Send size={16} className="me-2" />
                    SEAT권 전송
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === 'retrieve' ? 'active' : ''}
                    onClick={() => {
                      setActiveTab('retrieve');
                      setSelectedUser(null);
                      setSearchPhone('');
                      setUserTickets([]);
                      setSelectedTickets([]);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <RotateCcw size={16} className="me-2" />
                    SEAT권 회수
                  </NavLink>
                </NavItem>
              </Nav>

              {/* 탭 컨텐츠 */}
              <TabContent activeTab={activeTab}>
                {/* SEAT권 전송 탭 */}
                <TabPane tabId="send">
                  <Form>
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="tournament">토너먼트 선택 * (총 {tournaments.length}개)</Label>
                          <Input
                            type="select"
                            id="tournament"
                            value={selectedTournament}
                            onChange={(e) => setSelectedTournament(e.target.value)}
                          >
                            <option value="">토너먼트를 선택하세요</option>
                            {tournaments.map(tournament => (
                              <option key={tournament.id} value={tournament.id}>
                                {tournament.name} ({new Date(tournament.start_time).toLocaleDateString()})
                              </option>
                            ))}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="store">현재 매장</Label>
                          <Input
                            type="text"
                            id="store"
                            value={currentStore ? currentStore.name : '매장 정보 로딩 중...'}
                            disabled
                            readOnly
                          />
                          {currentStore && (
                            <small className="text-muted">
                              {currentStore.address} | 최대 수용인원: {currentStore.max_capacity}명
                            </small>
                          )}
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={8}>
                        <FormGroup>
                          <Label for="searchPhone">사용자 검색 (전화번호) *</Label>
                          <div className="d-flex">
                            <Input
                              type="text"
                              id="searchPhone"
                              placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                              value={searchPhone}
                              onChange={(e) => setSearchPhone(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                            />
                            <Button
                              color="primary"
                              className="ms-2"
                              onClick={searchUser}
                              disabled={searchLoading}
                            >
                              {searchLoading ? <Spinner size="sm" /> : <Search size={16} />}
                            </Button>
                          </div>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        {selectedUser && (
                          <div className="user-search-result mt-4">
                            <div className="user-info p-3 border rounded bg-light">
                              <div className="d-flex align-items-center">
                                <div className="user-avatar me-3" style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold'
                                }}>
                                  {((selectedUser.nickname || selectedUser.username || selectedUser.phone || 'U')).charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                  <div className="user-name fw-bold">
                                    {selectedUser.nickname || selectedUser.username || '이름 없음'}
                                  </div>
                                  <div className="user-phone text-muted">
                                    {selectedUser.phone || '전화번호 없음'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <FormGroup>
                          <Label for="quantity">전송할 수량 *</Label>
                          <Input
                            type="number"
                            id="quantity"
                            min="1"
                            max="100"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={8}>
                        <FormGroup>
                          <Label for="memo">메모</Label>
                          <Input
                            type="textarea"
                            id="memo"
                            rows="2"
                            placeholder="전송 사유나 기타 메모를 입력하세요"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <div className="text-end">
                      <Button
                        color="primary"
                        size="lg"
                        onClick={handleSendTickets}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            전송 중...
                          </>
                        ) : (
                          <>
                            <Send size={16} className="me-2" />
                            SEAT권 전송
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </TabPane>

                {/* SEAT권 회수 탭 */}
                <TabPane tabId="retrieve">
                  <Form>
                    <Row>
                      <Col md={8}>
                        <FormGroup>
                          <Label for="searchPhoneRetrieve">사용자 검색 (전화번호) *</Label>
                          <div className="d-flex">
                            <Input
                              type="text"
                              id="searchPhoneRetrieve"
                              placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                              value={searchPhone}
                              onChange={(e) => setSearchPhone(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                            />
                            <Button
                              color="primary"
                              className="ms-2"
                              onClick={searchUser}
                              disabled={searchLoading}
                            >
                              {searchLoading ? <Spinner size="sm" /> : <Search size={16} />}
                            </Button>
                          </div>
                        </FormGroup>
                      </Col>
                      <Col md={4}>
                        {selectedUser && (
                          <div className="user-search-result mt-4">
                            <div className="user-info p-3 border rounded bg-light">
                              <div className="d-flex align-items-center">
                                <div className="user-avatar me-3" style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold'
                                }}>
                                  {((selectedUser.nickname || selectedUser.username || selectedUser.phone || 'U')).charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                  <div className="user-name fw-bold">
                                    {selectedUser.nickname || selectedUser.username || '이름 없음'}
                                  </div>
                                  <div className="user-phone text-muted">
                                    {selectedUser.phone || '전화번호 없음'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Col>
                    </Row>

                    {/* 사용자가 선택되고 SEAT권이 있을 때 SEAT권 목록 표시 */}
                    {selectedUser && userTickets.length > 0 && (
                      <Row className="mt-4">
                        <Col md={12}>
                          <FormGroup>
                            <Label>회수할 SEAT권 선택 *</Label>
                            <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                              <Table responsive size="sm" className="mb-0">
                                <thead>
                                  <tr>
                                    <th width="50">선택</th>
                                    <th>SEAT권 ID</th>
                                    <th>토너먼트</th>
                                    <th>상태</th>
                                    <th>발급일</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {userTickets.map(ticket => (
                                    <tr key={ticket.id}>
                                      <td>
                                        <Input
                                          type="checkbox"
                                          checked={selectedTickets.includes(ticket.id)}
                                          onChange={() => toggleTicketSelection(ticket.id)}
                                        />
                                      </td>
                                      <td>
                                        <span className="text-monospace">
                                          {ticket.id}
                                        </span>
                                      </td>
                                      <td>{ticket.tournament_name}</td>
                                      <td>{getStatusBadge(ticket.status)}</td>
                                      <td>
                                        {new Date(ticket.issued_at).toLocaleDateString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                            <small className="text-muted mt-2 d-block">
                              선택된 SEAT권: {selectedTickets.length}개
                            </small>
                          </FormGroup>
                        </Col>
                      </Row>
                    )}

                    {selectedUser && userTickets.length === 0 && (
                      <Row className="mt-4">
                        <Col md={12}>
                          <Alert color="info">
                            이 사용자는 현재 보유한 SEAT권이 없습니다.
                          </Alert>
                        </Col>
                      </Row>
                    )}

                    <Row className="mt-4">
                      <Col md={12}>
                        <FormGroup>
                          <Label for="memoRetrieve">회수 메모</Label>
                          <Input
                            type="textarea"
                            id="memoRetrieve"
                            rows="2"
                            placeholder="회수 사유나 기타 메모를 입력하세요"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <div className="text-end">
                      <Button
                        color="warning"
                        size="lg"
                        onClick={handleRetrieveTickets}
                        disabled={loading || selectedTickets.length === 0}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            회수 중...
                          </>
                        ) : (
                          <>
                            <RotateCcw size={16} className="me-2" />
                            SEAT권 회수 ({selectedTickets.length}개)
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </TabPane>
              </TabContent>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* 최근 거래 내역 */}
      <Row>
        <Col md={12}>
          <Card className="form-section">
            <CardHeader>
              <CardTitle tag="h5">최근 거래 내역</CardTitle>
            </CardHeader>
            <CardBody>
              <Table responsive className="recent-transactions-table">
                <thead>
                  <tr>
                    <th>거래 타입</th>
                    <th>토너먼트</th>
                    <th>사용자</th>
                    <th>전화번호</th>
                    <th>수량</th>
                    <th>상태</th>
                    <th>메모</th>
                    <th>거래일시</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{getTransactionTypeBadge(transaction.type)}</td>
                      <td>{transaction.tournament_name}</td>
                      <td>{transaction.user_name}</td>
                      <td>{transaction.user_phone}</td>
                      <td className="text-center">
                        <Badge color="info">{transaction.quantity}개</Badge>
                      </td>
                      <td>{getStatusBadge(transaction.status)}</td>
                      <td className="text-muted" style={{ maxWidth: '200px' }}>
                        {transaction.memo || '-'}
                      </td>
                      <td>
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {recentTransactions.length === 0 && (
                <div className="text-center py-4 text-muted">
                  거래 내역이 없습니다.
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* 확인 모달 */}
      <Modal isOpen={confirmModal} toggle={() => setConfirmModal(false)}>
        <ModalHeader toggle={() => setConfirmModal(false)}>
          {activeTab === 'send' ? 'SEAT권 전송 확인' : 'SEAT권 회수 확인'}
        </ModalHeader>
        <ModalBody>
          <p>다음 내용으로 SEAT권을 {activeTab === 'send' ? '전송' : '회수'}하시겠습니까?</p>
          <ul>
            {activeTab === 'send' && (
              <>
                <li><strong>토너먼트:</strong> {tournaments.find(t => t.id == selectedTournament)?.name}</li>
                <li><strong>매장:</strong> {currentStore?.name}</li>
                <li><strong>사용자:</strong> {selectedUser?.nickname || selectedUser?.username || '이름 없음'} ({selectedUser?.phone})</li>
                <li><strong>수량:</strong> {quantity}개</li>
              </>
            )}
            {activeTab === 'retrieve' && (
              <>
                <li><strong>사용자:</strong> {selectedUser?.nickname || selectedUser?.username || '이름 없음'} ({selectedUser?.phone})</li>
                <li><strong>회수할 SEAT권:</strong> {selectedTickets.length}개</li>
                <li><strong>SEAT권 ID:</strong> {selectedTickets.join(', ')}</li>
              </>
            )}
            {memo && <li><strong>메모:</strong> {memo}</li>}
          </ul>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setConfirmModal(false)}>
            취소
          </Button>
          <Button 
            color={activeTab === 'send' ? 'primary' : 'warning'} 
            onClick={confirmAction}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                처리 중...
              </>
            ) : (
              <>
                {activeTab === 'send' ? '전송 확인' : '회수 확인'}
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SeatManagementPage;
