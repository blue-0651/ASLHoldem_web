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
  Spinner
} from 'reactstrap';
import { Search, Plus, Award, User, Calendar, DollarSign } from 'react-feather';

const TicketIssuePage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [source, setSource] = useState('ADMIN');
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [confirmModal, setConfirmModal] = useState(false);
  const [recentTickets, setRecentTickets] = useState([]);

  // 토너먼트 목록 조회
  useEffect(() => {
    fetchCurrentUserStore();
  }, []);

  // 현재 매장이 설정되면 토너먼트 조회
  useEffect(() => {
    if (currentStore) {
      setSelectedStore(currentStore.id);
      fetchTournamentsForStore(currentStore.id);
      fetchRecentTickets();
    }
  }, [currentStore]);

  const fetchCurrentUserStore = async () => {
    try {
      const token = localStorage.getItem('asl_holdem_access_token');
      console.log('현재 사용자 매장 정보 조회 시작, 토큰:', token);
      
      if (!token) {
        console.error('토큰이 없습니다.');
        // 토큰이 없으면 첫 번째 매장을 기본값으로 사용
        fetchStores();
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // JWT 토큰에서 사용자 정보 추출
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        console.log('토큰 페이로드:', tokenPayload);
        
        // 토큰에서 사용자 ID 추출
        const userId = tokenPayload.user_id;
        if (userId) {
          // 해당 사용자가 소유한 매장 조회
          const storeResponse = await fetch(`http://localhost:8000/api/v1/stores/?owner_id=${userId}`, {
            headers: headers
          });
          
          if (storeResponse.ok) {
            const storeData = await storeResponse.json();
            console.log('사용자 소유 매장 데이터:', storeData);
            
            const storesList = storeData.results || storeData;
            if (storesList.length > 0) {
              setCurrentStore(storesList[0]); // 첫 번째 소유 매장을 현재 매장으로 설정
              return;
            }
          }
        }
      } catch (tokenError) {
        console.error('토큰 파싱 실패:', tokenError);
      }

      // 토큰에서 사용자 정보를 가져올 수 없는 경우, 사용자 정보 API 호출
      const userPhone = localStorage.getItem('userPhone'); // 로그인 시 저장된 전화번호
      if (userPhone) {
        const userResponse = await fetch('http://localhost:8000/api/v1/accounts/users/get_user/', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ phone: userPhone })
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('사용자 데이터:', userData);
          
          // 해당 사용자가 소유한 매장 조회
          const storeResponse = await fetch(`http://localhost:8000/api/v1/stores/?owner_id=${userData.id}`, {
            headers: headers
          });
          
          if (storeResponse.ok) {
            const storeData = await storeResponse.json();
            console.log('사용자 소유 매장 데이터:', storeData);
            
            const storesList = storeData.results || storeData;
            if (storesList.length > 0) {
              setCurrentStore(storesList[0]); // 첫 번째 소유 매장을 현재 매장으로 설정
              return;
            }
          }
        }
      }
      
      // 모든 방법이 실패한 경우 첫 번째 매장을 기본값으로 사용
      console.log('사용자별 매장 정보를 가져올 수 없어 전체 매장 목록을 조회합니다.');
      fetchStores();
      
    } catch (error) {
      console.error('현재 사용자 매장 정보 조회 실패:', error);
      // 에러 발생 시 첫 번째 매장을 기본값으로 사용
      fetchStores();
    }
  };

  const fetchTournamentsForStore = async (storeId) => {
    try {
      const token = localStorage.getItem('asl_holdem_access_token');
      console.log('매장별 토너먼트 조회 시작, 매장 ID:', storeId);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 매장 관리자용 토너먼트 목록 API 사용 (선수참가 화면과 동일)
      const response = await fetch('http://localhost:8000/api/v1/store/tournaments/', {
        headers: headers
      });
      
      console.log('토너먼트 응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('토너먼트 데이터:', data);
        
        // 배포된 토너먼트 목록 설정
        setTournaments(data);
      } else {
        console.error('토너먼트 조회 실패:', response.status, response.statusText);
        // 실패 시 전체 토너먼트 조회
        fetchAllTournaments();
      }
    } catch (error) {
      console.error('매장별 토너먼트 조회 실패:', error);
      // 에러 발생 시 전체 토너먼트 조회
      fetchAllTournaments();
    }
  };

  const fetchAllTournaments = async () => {
    try {
      const token = localStorage.getItem('asl_holdem_access_token');
      console.log('전체 토너먼트 조회 시작');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:8000/api/v1/tournaments/', {
        headers: headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('전체 토너먼트 데이터:', data);
        setTournaments(data.results || data);
      }
    } catch (error) {
      console.error('전체 토너먼트 조회 실패:', error);
    }
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('asl_holdem_access_token');
      console.log('매장 조회 시작, 토큰:', token);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:8000/api/v1/stores/', {
        headers: headers
      });
      
      console.log('매장 응답 상태:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('매장 데이터:', data);
        const storesList = data.results || data;
        setStores(storesList);
        
        // 첫 번째 매장을 기본값으로 설정
        if (storesList.length > 0 && !currentStore) {
          setCurrentStore(storesList[0]);
        }
      } else {
        console.error('매장 조회 실패:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('에러 내용:', errorData);
      }
    } catch (error) {
      console.error('매장 조회 실패:', error);
    }
  };

  const fetchRecentTickets = async () => {
    try {
      const token = localStorage.getItem('asl_holdem_access_token');
      const response = await fetch('http://localhost:8000/api/v1/seats/tickets/?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentTickets(data.results || data);
      }
    } catch (error) {
      console.error('최근 좌석권 조회 실패:', error);
    }
  };

  const searchUser = async () => {
    if (!searchPhone.trim()) {
      showAlert('warning', '전화번호를 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem('asl_holdem_access_token');
      
      // 전화번호 형식 정리
      const cleanPhone = searchPhone.replace(/-/g, '');
      const formattedPhone = `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,7)}-${cleanPhone.slice(7)}`;
      
      const response = await fetch(`http://localhost:8000/api/v1/accounts/users/get_user/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: formattedPhone
        })
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('사용자 검색 결과:', userData);
        
        if (userData && userData.id) {
          setSelectedUser(userData);
          showAlert('success', '사용자를 찾았습니다.');
        } else {
          setSelectedUser(null);
          showAlert('warning', '해당 전화번호의 사용자를 찾을 수 없습니다.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSelectedUser(null);
        showAlert('warning', errorData.error || '해당 전화번호의 사용자를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      showAlert('danger', '사용자 검색 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleIssueTicket = () => {
    if (!selectedTournament) {
      showAlert('warning', '토너먼트를 선택해주세요.');
      return;
    }
    if (!currentStore) {
      showAlert('warning', '매장 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (!selectedUser) {
      showAlert('warning', '사용자를 선택해주세요.');
      return;
    }
    if (quantity < 1 || quantity > 100) {
      showAlert('warning', '수량은 1~100개 사이로 입력해주세요.');
      return;
    }

    setConfirmModal(true);
  };

  const confirmIssueTicket = async () => {
    setLoading(true);
    setConfirmModal(false);

    try {
      const token = localStorage.getItem('asl_holdem_access_token');
      const requestData = {
        user_id: selectedUser.id,
        tournament_id: parseInt(selectedTournament),
        store_id: currentStore.id,
        quantity: parseInt(quantity),
        source: source,
        amount: parseFloat(amount),
        memo: memo
      };

      if (expiresAt) {
        requestData.expires_at = new Date(expiresAt).toISOString();
      }

      const response = await fetch('http://localhost:8000/api/v1/seats/tickets/grant/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        const data = await response.json();
        showAlert('success', `${selectedUser.nickname || selectedUser.username || '사용자'}님에게 SEAT권이 성공적으로 발급되었습니다.`);
        
        // 폼 초기화
        setSelectedUser(null);
        setSearchPhone('');
        setQuantity(1);
        setAmount(0);
        setMemo('');
        setExpiresAt('');
        
        // 최근 발급 목록 새로고침
        fetchRecentTickets();
      } else {
        const errorData = await response.json();
        showAlert('danger', errorData.error || 'SEAT권 발급에 실패했습니다.');
      }
    } catch (error) {
      console.error('SEAT권 발급 실패:', error);
      showAlert('danger', 'SEAT권 발급 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACTIVE': { color: 'success', text: '활성' },
      'USED': { color: 'secondary', text: '사용됨' },
      'EXPIRED': { color: 'warning', text: '만료됨' },
      'CANCELLED': { color: 'danger', text: '취소됨' }
    };
    
    const statusInfo = statusMap[status] || { color: 'secondary', text: status };
    return <Badge color={statusInfo.color}>{statusInfo.text}</Badge>;
  };

  const getSourceBadge = (source) => {
    const sourceMap = {
      'PURCHASE': { color: 'primary', text: '구매' },
      'REWARD': { color: 'success', text: '보상' },
      'GIFT': { color: 'info', text: '선물' },
      'ADMIN': { color: 'warning', text: '관리자 지급' }
    };
    
    const sourceInfo = sourceMap[source] || { color: 'secondary', text: source };
    return <Badge color={sourceInfo.color}>{sourceInfo.text}</Badge>;
  };

  return (
    <div className="container-fluid ticket-issue-page">
      <Row>
        <Col md={12}>
          <Card className="form-section">
            <CardHeader>
              <CardTitle tag="h4">
                <Award className="me-2" size={24} />
                SEAT권 발급
              </CardTitle>
            </CardHeader>
            <CardBody>
              {alert.show && (
                <Alert color={alert.type} className="mb-4">
                  {alert.message}
                </Alert>
              )}

              <Form>
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Label for="tournament">배포된 토너먼트 선택 * (총 {tournaments.length}개)</Label>
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
                      {tournaments.length === 0 && (
                        <small className="text-muted">
                          {currentStore ? '이 매장에 배포된 토너먼트가 없습니다.' : '토너먼트 데이터를 불러오는 중...'}
                        </small>
                      )}
                    </FormGroup>
                  </Col>
                  <Col md={4}>
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
                  <Col md={4}>
                    <FormGroup>
                      <Label for="source">발급 방법</Label>
                      <Input
                        type="select"
                        id="source"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                      >
                        <option value="ADMIN">관리자 지급</option>
                        <option value="PURCHASE">구매</option>
                        <option value="REWARD">보상</option>
                        <option value="GIFT">선물</option>
                      </Input>
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
                      <div className="user-search-result">
                        <div className="user-info">
                          <div className="user-avatar">
                            {((selectedUser.nickname || selectedUser.username || selectedUser.phone || 'U')).charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <div className="user-name">
                              {selectedUser.nickname || selectedUser.username || '이름 없음'}
                            </div>
                            <div className="user-phone">{selectedUser.phone || '전화번호 없음'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Col>
                </Row>

                <Row>
                  <Col md={3}>
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
                  <Col md={3}>
                    <FormGroup>
                      <Label for="amount">금액</Label>
                      <Input
                        type="number"
                        id="amount"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="expiresAt">만료 시간 (선택사항)</Label>
                      <Input
                        type="datetime-local"
                        id="expiresAt"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                      />
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
                        rows="3"
                        placeholder="발급 사유나 기타 메모를 입력하세요"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <div className="text-end">
                  <Button
                    className="issue-button"
                    size="lg"
                    onClick={handleIssueTicket}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        발급 중...
                      </>
                    ) : (
                      <>
                        <Plus size={16} className="me-2" />
                        SEAT권 발급
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* 최근 발급된 SEAT권 목록 */}
      <Row>
        <Col md={12}>
          <Card className="form-section">
            <CardHeader>
              <CardTitle tag="h5">최근 발급된 SEAT권</CardTitle>
            </CardHeader>
            <CardBody>
              <Table responsive className="recent-tickets-table">
                <thead>
                  <tr>
                    <th>SEAT권 ID</th>
                    <th>토너먼트</th>
                    <th>사용자</th>
                    <th>상태</th>
                    <th>발급방법</th>
                    <th>금액</th>
                    <th>발급일시</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>
                        <span className="ticket-id">
                          {ticket.ticket_id.substring(0, 8)}...
                        </span>
                      </td>
                      <td>{ticket.tournament_name}</td>
                      <td>{ticket.user_name}</td>
                      <td>{getStatusBadge(ticket.status)}</td>
                      <td>{getSourceBadge(ticket.source)}</td>
                      <td className="amount-cell">
                        {ticket.amount > 0 && (
                          <>
                            <DollarSign size={14} className="me-1" />
                            {Number(ticket.amount).toLocaleString()}원
                          </>
                        )}
                      </td>
                      <td className="date-cell">
                        {new Date(ticket.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* 확인 모달 */}
      <Modal isOpen={confirmModal} toggle={() => setConfirmModal(false)}>
        <ModalHeader toggle={() => setConfirmModal(false)}>
          SEAT권 발급 확인
        </ModalHeader>
        <ModalBody>
          <p>다음 내용으로 SEAT권을 발급하시겠습니까?</p>
          <ul>
            <li><strong>토너먼트:</strong> {tournaments.find(t => t.id == selectedTournament)?.name}</li>
            <li><strong>매장:</strong> {currentStore?.name}</li>
            <li><strong>사용자:</strong> {selectedUser?.nickname || selectedUser?.username || '이름 없음'} ({selectedUser?.phone})</li>
            <li><strong>수량:</strong> {quantity}개</li>
            <li><strong>발급방법:</strong> {source}</li>
            <li><strong>금액:</strong> {amount}원</li>
            {memo && <li><strong>메모:</strong> {memo}</li>}
          </ul>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setConfirmModal(false)}>
            취소
          </Button>
          <Button color="primary" onClick={confirmIssueTicket}>
            발급 확인
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default TicketIssuePage; 