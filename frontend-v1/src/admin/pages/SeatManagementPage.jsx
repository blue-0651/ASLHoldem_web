import React, { useState, useEffect, useRef } from 'react';
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
import { userAPI, tournamentAPI, storeAPI, seatTicketAPI } from '../../utils/api';

const SeatManagementPage = () => {
  // 탭 상태
  const [activeTab, setActiveTab] = useState('send');

  // 기본 상태
  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [source, setSource] = useState('ADMIN');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [confirmModal, setConfirmModal] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // 회수용 추가 상태
  const [userTickets, setUserTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);

  // API 호출 중복 방지를 위한 ref
  const hasFetchedData = useRef(false);

  // 초기 데이터 로드 (중복 호출 방지)
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      console.log('🚀 SeatManagement 초기 데이터 로딩 시작');
      fetchTournaments();
      fetchStores();
    }
  }, []);

  // 토너먼트 목록 조회
  const fetchTournaments = async () => {
    console.log('📋 토너먼트 목록 조회 시작');
    setTournamentsLoading(true);
    try {
      const response = await tournamentAPI.getAllTournaments();
      const tournamentsData = response.data.results || response.data;
      console.log('✅ 토너먼트 목록 조회 완료:', tournamentsData?.length || 0, '개');
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('❌ 토너먼트 목록 조회 실패:', error);
      showAlert('warning', '토너먼트 목록을 불러오는데 실패했습니다.');
    } finally {
      setTournamentsLoading(false);
    }
  };

  // 매장 목록 조회 (TournamentManagement.jsx 방식 참고)
  const fetchStores = async () => {
    setStoresLoading(true);
    try {
      console.log('🏪 매장 정보 로딩 시작');
      const response = await storeAPI.getAllStores();
      const storesData = Array.isArray(response.data) ? response.data : [];
      console.log('✅ 매장 정보 로딩 완료:', storesData.length, '개 매장');
      
      setStores(storesData);
      
      // 첫 번째 매장을 현재 매장으로 설정 (또는 로그인한 사용자의 매장으로 설정)
      if (storesData.length > 0) {
        setCurrentStore(storesData[0]);
        console.log('현재 매장 설정:', storesData[0]);
      }
    } catch (error) {
      console.error('❌ 매장 목록 조회 실패:', error);
      showAlert('warning', '매장 정보를 불러오는데 실패했습니다.');
    } finally {
      setStoresLoading(false);
    }
  };



  // 사용자 검색 함수
  const searchUser = async () => {
    if (!searchPhone.trim()) {
      showAlert('warning', '전화번호를 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    try {
      // 전화번호 형식 정리
      const cleanPhone = searchPhone.replace(/-/g, '');
      const formattedPhone = `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7)}`;

      const response = await userAPI.getUserByPhoneOrId({
        phone: formattedPhone
      });

      const userData = response.data;
      console.log('사용자 검색 결과:', userData);

      // role이 'USER'인지 확인
      if (userData && userData.id) {
        if (userData.role === 'USER') {
          setSelectedUser(userData);

          // 회수 탭일 때 사용자의 SEAT권 목록 로드
          if (activeTab === 'retrieve') {
            loadUserTickets(userData.id);
          }

          showAlert('success', '사용자를 찾았습니다.');
        } else {
          setSelectedUser(null);
          showAlert('warning', '일반 사용자만 SEAT권을 전송/회수할 수 있습니다.');
        }
      } else {
        setSelectedUser(null);
        showAlert('warning', '해당 전화번호의 사용자를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      setSelectedUser(null);

      // API 에러 응답 처리
      if (error.response?.data?.error) {
        showAlert('warning', error.response.data.error);
      } else {
        showAlert('danger', '사용자 검색 중 오류가 발생했습니다.');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  // 사용자의 SEAT권 목록 로드
  const loadUserTickets = async (userId) => {
    try {
      console.log('🎫 사용자 SEAT권 목록 조회 시작:', userId);
      
      // 사용자의 활성 SEAT권만 조회
      const response = await seatTicketAPI.getTicketsByTournament(null, {
        user_id: userId,
        status: 'ACTIVE'
      });
      
      const ticketsData = response.data.results || response.data || [];
      console.log('✅ 사용자 SEAT권 조회 완료:', ticketsData.length, '개');
      
      setUserTickets(ticketsData);
    } catch (error) {
      console.error('❌ 사용자 SEAT권 목록 조회 실패:', error);
      setUserTickets([]);
      showAlert('warning', '사용자의 SEAT권 정보를 불러오는데 실패했습니다.');
    }
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

  // 확인 후 실행 (실제 API 호출)
  const confirmAction = async () => {
    setLoading(true);

    try {
      if (activeTab === 'send') {
        // SEAT권 전송 API 호출
        const grantData = {
          tournament_id: selectedTournament,
          user_id: selectedUser.id,
          store_id: currentStore?.id,
          quantity: parseInt(quantity),
          source: source,
          memo: memo || ''
        };

        console.log('🎫 SEAT권 전송 요청:', grantData);
        const response = await seatTicketAPI.grantTickets(grantData);
        console.log('✅ SEAT권 전송 성공:', response.data);

        // 성공 시 거래 내역에 추가
        const newTransaction = {
          id: recentTransactions.length + 1,
          type: 'SEND',
          tournament_name: tournaments.find(t => t.id == selectedTournament)?.name || '',
          user_name: selectedUser?.nickname || selectedUser?.username || '이름 없음',
          user_phone: selectedUser?.phone || '',
          quantity: parseInt(quantity),
          memo: memo,
          created_at: new Date().toISOString(),
          status: 'COMPLETED'
        };

        setRecentTransactions([newTransaction, ...recentTransactions]);
        showAlert('success', `SEAT권 ${quantity}개가 성공적으로 전송되었습니다.`);

      } else if (activeTab === 'retrieve') {
        // SEAT권 회수 API 호출
        const retrieveData = {
          operation: 'cancel',
          ticket_ids: selectedTickets,
          memo: memo || '관리자 회수'
        };

        console.log('🔄 SEAT권 회수 요청:', retrieveData);
        const response = await seatTicketAPI.bulkOperation(retrieveData);
        console.log('✅ SEAT권 회수 성공:', response.data);

        // 성공 시 거래 내역에 추가
        const newTransaction = {
          id: recentTransactions.length + 1,
          type: 'RETRIEVE',
          tournament_name: userTickets.length > 0 ? userTickets[0].tournament_name : '다양한 토너먼트',
          user_name: selectedUser?.nickname || selectedUser?.username || '이름 없음',
          user_phone: selectedUser?.phone || '',
          quantity: selectedTickets.length,
          memo: memo,
          created_at: new Date().toISOString(),
          status: 'COMPLETED'
        };

        setRecentTransactions([newTransaction, ...recentTransactions]);
        showAlert('success', `SEAT권 ${selectedTickets.length}개가 성공적으로 회수되었습니다.`);

        // 사용자 SEAT권 목록 다시 로드
        loadUserTickets(selectedUser.id);
      }

      // 폼 초기화
      setSelectedTournament('');
      setSelectedUser(null);
      setSearchPhone('');
      setQuantity(1);
      setSource('ADMIN');
      setMemo('');
      setSelectedTickets([]);
      setUserTickets([]);

    } catch (error) {
      console.error('❌ SEAT권 처리 실패:', error);
      
      // 에러 메시지 처리
      let errorMessage = 'SEAT권 처리 중 오류가 발생했습니다.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert('danger', errorMessage);
    } finally {
      setConfirmModal(false);
      setLoading(false);
    }
  };

  // 알림 표시
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const phoneNumber = value.replace(/[^\d]/g, '');

    // 11자리를 초과하지 않도록 제한
    const limitedPhoneNumber = phoneNumber.slice(0, 11);

    // 자동 하이픈 삽입
    if (limitedPhoneNumber.length <= 3) {
      return limitedPhoneNumber;
    } else if (limitedPhoneNumber.length <= 7) {
      return `${limitedPhoneNumber.slice(0, 3)}-${limitedPhoneNumber.slice(3)}`;
    } else {
      return `${limitedPhoneNumber.slice(0, 3)}-${limitedPhoneNumber.slice(3, 7)}-${limitedPhoneNumber.slice(7)}`;
    }
  };

  // 전화번호 입력 핸들러
  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setSearchPhone(formattedPhone);
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
                      setQuantity(1);
                      setSource('ADMIN');
                      setMemo('');
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
                      setQuantity(1);
                      setSource('ADMIN');
                      setMemo('');
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
                            disabled={tournamentsLoading}
                          >
                            <option value="">
                              {tournamentsLoading ? '토너먼트 목록 로딩 중...' : '토너먼트를 선택하세요'}
                            </option>
                            {tournaments.map(tournament => (
                              <option key={tournament.id} value={tournament.id}>
                                {tournament.name} ({new Date(tournament.start_time).toLocaleDateString()}) - {tournament.status}
                              </option>
                            ))}
                          </Input>
                          {tournaments.length === 0 && !tournamentsLoading && (
                            <small className="text-muted">
                              토너먼트가 없습니다.
                            </small>
                          )}
                          {tournamentsLoading && (
                            <small className="text-muted">
                              <Spinner size="sm" className="me-2" />
                              토너먼트 목록을 불러오는 중...
                            </small>
                          )}
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="source">전송 방법</Label>
                          <Input
                            type="select"
                            id="source"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                          >
                            <option value="ADMIN">관리자 지급</option>
                            <option value="EVENT">이벤트</option>
                            <option value="PROMOTION">프로모션</option>
                            <option value="REWARD">보상</option>
                          </Input>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <FormGroup>
                          <Label for="searchPhone">전화번호 (사용자 검색) *</Label>
                          <div className="d-flex">
                            <Input
                              type="text"
                              id="searchPhone"
                              placeholder="전화번호를 입력하세요 (숫자만 입력)"
                              value={searchPhone}
                              onChange={handlePhoneChange}
                              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                              inputMode="numeric"
                              pattern="[0-9-]*"
                              maxLength="13"
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
                    </Row>

                    <Row>
                      <Col md={12}>
                        <div className="user-search-result-area p-3 border rounded bg-light" style={{ minHeight: '80px' }}>
                          {selectedUser ? (
                            <div className="user-info">
                              <div className="d-flex align-items-center">
                                <div className="user-avatar me-3" style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '50%',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '18px'
                                }}>
                                  {((selectedUser.nickname || selectedUser.first_name || selectedUser.phone || 'U')).charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                  <div className="user-name fw-bold" style={{ fontSize: '16px' }}>
                                    {selectedUser.nickname || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || '이름 없음'}
                                  </div>
                                  <div className="user-phone text-muted" style={{ fontSize: '14px' }}>
                                    {selectedUser.phone || '전화번호 없음'}
                                  </div>
                                  <div className="user-email text-muted" style={{ fontSize: '12px' }}>
                                    {selectedUser.email || '이메일 없음'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted d-flex align-items-center justify-content-center h-100">
                              <User size={20} className="me-2" />
                              {searchLoading ? '사용자 검색 중...' : '전화번호를 입력하고 검색 버튼을 클릭하세요.'}
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <FormGroup>
                          <Label for="quantity">수량 *</Label>
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
                      <Col md={4}>
                        <FormGroup>
                          <Label for="store">현재 매장</Label>
                          {storesLoading ? (
                            <Input
                              type="text"
                              id="store"
                              value="매장 정보 로딩 중..."
                              disabled
                              readOnly
                            />
                          ) : stores.length > 0 ? (
                            <Input
                              type="select"
                              id="store"
                              value={currentStore ? currentStore.id : ''}
                              onChange={(e) => {
                                const selectedStore = stores.find(store => store.id === parseInt(e.target.value));
                                setCurrentStore(selectedStore);
                                console.log('매장 변경:', selectedStore);
                              }}
                            >
                              {stores.map(store => (
                                <option key={store.id} value={store.id}>
                                  {store.name}
                                </option>
                              ))}
                            </Input>
                          ) : (
                            <Input
                              type="text"
                              id="store"
                              value="매장 정보를 불러올 수 없습니다"
                              disabled
                              readOnly
                            />
                          )}
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
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
                      <Col md={12}>
                        <FormGroup>
                          <Label for="searchPhoneRetrieve">전화번호 (사용자 검색) *</Label>
                          <div className="d-flex">
                            <Input
                              type="text"
                              id="searchPhoneRetrieve"
                              placeholder="전화번호를 입력하세요 (숫자만 입력)"
                              value={searchPhone}
                              onChange={handlePhoneChange}
                              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                              inputMode="numeric"
                              pattern="[0-9-]*"
                              maxLength="13"
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
                    </Row>

                    <Row>
                      <Col md={12}>
                        <div className="user-search-result-area p-3 border rounded bg-light" style={{ minHeight: '80px' }}>
                          {selectedUser ? (
                            <div className="user-info">
                              <div className="d-flex align-items-center">
                                <div className="user-avatar me-3" style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '50%',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '18px'
                                }}>
                                  {((selectedUser.nickname || selectedUser.first_name || selectedUser.phone || 'U')).charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                  <div className="user-name fw-bold" style={{ fontSize: '16px' }}>
                                    {selectedUser.nickname || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || '이름 없음'}
                                  </div>
                                  <div className="user-phone text-muted" style={{ fontSize: '14px' }}>
                                    {selectedUser.phone || '전화번호 없음'}
                                  </div>
                                  <div className="user-email text-muted" style={{ fontSize: '12px' }}>
                                    {selectedUser.email || '이메일 없음'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted d-flex align-items-center justify-content-center h-100">
                              <User size={20} className="me-2" />
                              {searchLoading ? '사용자 검색 중...' : '전화번호를 입력하고 검색 버튼을 클릭하세요.'}
                            </div>
                          )}
                        </div>
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
                                          checked={selectedTickets.includes(ticket.ticket_id)}
                                          onChange={() => toggleTicketSelection(ticket.ticket_id)}
                                        />
                                      </td>
                                      <td>
                                        <span className="text-monospace">
                                          {ticket.ticket_id}
                                        </span>
                                      </td>
                                      <td>{ticket.tournament?.name || '토너먼트 정보 없음'}</td>
                                      <td>{getStatusBadge(ticket.status)}</td>
                                      <td>
                                        {new Date(ticket.created_at).toLocaleDateString()}
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
