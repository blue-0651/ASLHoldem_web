import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Modal, Spinner } from 'react-bootstrap';
import { Search, Plus, Award } from 'react-feather';
import MobileHeader from '../../components/MobileHeader';

const TicketIssue = () => {
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
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    fetchCurrentUserStore();
  }, []);

  useEffect(() => {
    if (currentStore) {
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

      // 모든 방법이 실패한 경우 첫 번째 매장을 기본값으로 사용
      console.log('사용자별 매장 정보를 가져올 수 없어 전체 매장 목록을 조회합니다.');
      fetchStores();
      
    } catch (error) {
      console.error('현재 사용자 매장 정보 조회 실패:', error);
      fetchStores();
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
        
        // 첫 번째 매장을 기본값으로 설정
        if (storesList.length > 0 && !currentStore) {
          setCurrentStore(storesList[0]);
        }
      } else {
        console.error('매장 조회 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('매장 조회 실패:', error);
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
      
      // 매장 관리자용 토너먼트 목록 API 사용
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
      }
    } catch (error) {
      console.error('매장별 토너먼트 조회 실패:', error);
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
      setSelectedUser(null);
      showAlert('warning', '해당 전화번호의 사용자를 찾을 수 없습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleIssueTicket = () => {
    if (!selectedTournament) {
      showAlert('warning', '토너먼트를 선택해주세요.');
      return;
    }
    if (!selectedUser) {
      showAlert('warning', '사용자를 검색해주세요.');
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
        source: 'ADMIN', // 모바일에서는 기본값으로 설정
        memo: memo
      };

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
        setMemo('');
        
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
      'ACTIVE': { variant: 'success', text: '활성' },
      'USED': { variant: 'secondary', text: '사용됨' },
      'EXPIRED': { variant: 'warning', text: '만료됨' },
      'CANCELLED': { variant: 'danger', text: '취소됨' }
    };
    
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const getSourceBadge = (source) => {
    const sourceMap = {
      'PURCHASE': { variant: 'primary', text: '구매' },
      'REWARD': { variant: 'success', text: '보상' },
      'GIFT': { variant: 'info', text: '선물' },
      'ADMIN': { variant: 'warning', text: '관리자 지급' }
    };
    
    const sourceInfo = sourceMap[source] || { variant: 'secondary', text: source };
    return <Badge bg={sourceInfo.variant}>{sourceInfo.text}</Badge>;
  };

  return (
    <div className="asl-mobile-container">
      <MobileHeader title="SEAT권 발급" />
      
      <Container className="asl-mobile-content">
        {alert.show && (
          <Alert variant={alert.type} className="mb-4">
            {alert.message}
          </Alert>
        )}

        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <Award className="me-2" size={20} />
              SEAT권 발급
            </h5>
          </Card.Header>
          <Card.Body>
            <Form>
              {/* 토너먼트 선택 */}
              <Form.Group className="mb-3">
                <Form.Label>토너먼트 선택 *</Form.Label>
                <Form.Select
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                >
                  <option value="">토너먼트를 선택하세요</option>
                  {tournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name} ({new Date(tournament.start_time).toLocaleDateString()})
                    </option>
                  ))}
                </Form.Select>
                {tournaments.length === 0 && (
                  <Form.Text className="text-muted">
                    배포된 토너먼트가 없습니다.
                  </Form.Text>
                )}
              </Form.Group>

              {/* 사용자 검색 */}
              <Form.Group className="mb-3">
                <Form.Label>사용자 검색 (전화번호) *</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                  />
                  <Button
                    variant="primary"
                    className="ms-2"
                    onClick={searchUser}
                    disabled={searchLoading}
                  >
                    {searchLoading ? <Spinner size="sm" /> : <Search size={16} />}
                  </Button>
                </div>
              </Form.Group>

              {/* 검색된 사용자 정보 */}
              {selectedUser && (
                <Alert variant="info" className="mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#0d6efd',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {((selectedUser.nickname || selectedUser.username || selectedUser.phone || 'U')).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-bold">
                        {selectedUser.nickname || selectedUser.username || '이름 없음'}
                      </div>
                      <div className="text-muted small">
                        {selectedUser.phone || '전화번호 없음'}
                      </div>
                    </div>
                  </div>
                </Alert>
              )}

              {/* 수량 */}
              <Form.Group className="mb-3">
                <Form.Label>수량 *</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Form.Group>

              {/* 메모 */}
              <Form.Group className="mb-4">
                <Form.Label>메모 (선택사항)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="좌석권 발급 관련 메모를 입력하세요"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </Form.Group>

              {/* 발급 버튼 */}
              <div className="d-grid">
                <Button
                  variant="primary"
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
          </Card.Body>
        </Card>

        {/* 최근 발급된 SEAT권 목록 */}
        <Card>
          <Card.Header>
            <h6 className="mb-0">최근 발급된 SEAT권</h6>
          </Card.Header>
          <Card.Body>
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>SEAT권 ID</th>
                  <th>토너먼트</th>
                  <th>사용자</th>
                  <th>상태</th>
                  <th>발급일시</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        {ticket.ticket_id?.substring(0, 8)}...
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{ticket.tournament_name}</td>
                    <td style={{ fontSize: '12px' }}>{ticket.user_name}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td style={{ fontSize: '11px' }}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recentTickets.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">
                      발급된 SEAT권이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* 확인 모달 */}
        <Modal show={confirmModal} onHide={() => setConfirmModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>SEAT권 발급 확인</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>다음 내용으로 SEAT권을 발급하시겠습니까?</p>
            <ul>
              <li><strong>토너먼트:</strong> {tournaments.find(t => t.id == selectedTournament)?.name}</li>
              <li><strong>사용자:</strong> {selectedUser?.nickname || selectedUser?.username || '이름 없음'} ({selectedUser?.phone})</li>
              <li><strong>수량:</strong> {quantity}개</li>
              {memo && <li><strong>메모:</strong> {memo}</li>}
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setConfirmModal(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={confirmIssueTicket}>
              발급 확인
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default TicketIssue; 