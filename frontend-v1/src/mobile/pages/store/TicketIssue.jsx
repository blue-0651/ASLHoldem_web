import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Modal, Spinner } from 'react-bootstrap';
import { Search, Plus, Award } from 'react-feather';
import MobileHeader from '../../components/MobileHeader';
import API from '../../../utils/api';
import { isAuthenticated, getToken, getCurrentUser } from '../../../utils/auth';

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
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
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
      console.log('🏪 현재 사용자 매장 정보 조회 시작');
      
      if (!isAuthenticated()) {
        console.error('❌ 인증되지 않은 사용자');
        showAlert('warning', '로그인이 필요합니다. 다시 로그인해주세요.');
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.user_id) {
        console.error('❌ 사용자 정보를 가져올 수 없습니다.');
        showAlert('warning', '사용자 정보를 가져올 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      console.log('🔍 사용자 ID로 매장 조회:', currentUser.user_id);
      
      // 해당 사용자가 소유한 매장 조회
      const storeResponse = await API.get(`/stores/by_owner/`, {
        params: { owner_id: currentUser.user_id }
      });
      
      if (storeResponse.data) {
        console.log('✅ 사용자 소유 매장 데이터:', storeResponse.data);
        setCurrentStore(storeResponse.data);
        showAlert('success', `${storeResponse.data.name} 매장으로 로그인되었습니다.`);
      } else {
        console.warn('⚠️ 사용자 소유 매장을 찾을 수 없습니다.');
        showAlert('warning', '매장 정보를 찾을 수 없습니다. 올바른 매장 관리자 계정으로 다시 로그인해주세요.');
      }
      
    } catch (error) {
      console.error('❌ 현재 사용자 매장 정보 조회 실패:', error);
      
      // 오류 메시지 개선 - Android WebView 호환성
      let errorMessage = '매장 정보 조회 중 오류가 발생했습니다.';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.response.status === 403) {
          errorMessage = '매장 관리자 권한이 없습니다.';
        } else if (error.response.status === 404) {
          errorMessage = '매장 정보를 찾을 수 없습니다.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      showAlert('danger', errorMessage);
    }
  };

  const fetchTournamentsForStore = async (storeId) => {
    setTournamentsLoading(true);
    try {
      console.log('🎯 매장별 토너먼트 조회 시작, 매장 ID:', storeId);
      
      // API 유틸리티 사용으로 변경
      const response = await API.get('/store/tournaments/');
      
      console.log('✅ 토너먼트 데이터 조회 성공:', response.data);
      
      // 배포된 토너먼트 목록 설정
      const tournamentsData = Array.isArray(response.data) ? response.data : [];
      setTournaments(tournamentsData);
      
      if (tournamentsData.length === 0) {
        showAlert('info', '현재 배포된 토너먼트가 없습니다.');
      }
      
    } catch (error) {
      console.error('❌ 매장별 토너먼트 조회 실패:', error);
      
      // 오류 메시지 개선 - Android WebView 호환성
      let errorMessage = '토너먼트 목록을 불러오는데 실패했습니다.';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.response.status === 403) {
          errorMessage = '토너먼트 조회 권한이 없습니다.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      showAlert('danger', errorMessage);
      setTournaments([]);
    } finally {
      setTournamentsLoading(false);
    }
  };

  const fetchRecentTickets = async () => {
    try {
      console.log('📋 최근 좌석권 조회 시작');
      
      const response = await API.get('/seats/tickets/', {
        params: { limit: 10 }
      });
      
      const ticketsData = response.data.results || response.data || [];
      setRecentTickets(ticketsData);
      console.log('✅ 최근 좌석권 조회 완료:', ticketsData.length, '개');
      
    } catch (error) {
      console.error('❌ 최근 좌석권 조회 실패:', error);
      // 최근 좌석권 조회 실패는 치명적이지 않으므로 조용히 처리
      setRecentTickets([]);
    }
  };

  const searchUser = async () => {
    if (!searchPhone.trim()) {
      showAlert('warning', '전화번호를 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    try {
      console.log('🔍 사용자 검색 시작:', searchPhone);
      
      // 전화번호 형식 정리
      const cleanPhone = searchPhone.replace(/-/g, '');
      const formattedPhone = `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,7)}-${cleanPhone.slice(7)}`;
      
      const response = await API.post('/accounts/users/get_user/', {
        phone: formattedPhone
      });
      
      if (response.data && response.data.id) {
        console.log('✅ 사용자 검색 성공:', response.data);
        setSelectedUser(response.data);
        showAlert('success', '사용자를 찾았습니다.');
      } else {
        console.warn('⚠️ 사용자를 찾을 수 없습니다.');
        setSelectedUser(null);
        showAlert('warning', '해당 전화번호의 사용자를 찾을 수 없습니다.');
      }
      
    } catch (error) {
      console.error('❌ 사용자 검색 실패:', error);
      
      // 오류 메시지 개선 - Android WebView 호환성
      let errorMessage = '해당 전화번호의 사용자를 찾을 수 없습니다.';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = '해당 전화번호로 등록된 사용자가 없습니다.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      setSelectedUser(null);
      showAlert('warning', errorMessage);
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
      // 매장 정보 유효성 검사 추가
      if (!currentStore || !currentStore.id) {
        showAlert('danger', '매장 정보가 설정되지 않았습니다. 올바른 매장 관리자 계정으로 다시 로그인해주세요.');
        setLoading(false);
        return;
      }

      const requestData = {
        user_id: selectedUser.id,
        tournament_id: parseInt(selectedTournament),
        store_id: currentStore.id,
        quantity: parseInt(quantity),
        source: 'ADMIN', // 모바일에서는 기본값으로 설정
        memo: memo
      };

      console.log('🎫 SEAT권 발급 요청:', requestData);

      const response = await API.post('/seats/tickets/grant/', requestData);
      
      console.log('✅ SEAT권 발급 성공:', response.data);
      showAlert('success', `${selectedUser.nickname || selectedUser.username || '사용자'}님에게 SEAT권이 성공적으로 발급되었습니다.`);
      
      // 폼 초기화
      setSelectedUser(null);
      setSearchPhone('');
      setQuantity(1);
      setMemo('');
      
      // 최근 발급 목록 새로고침
      fetchRecentTickets();
      
    } catch (error) {
      console.error('❌ SEAT권 발급 실패:', error);
      
      // 오류 메시지 개선 - Android WebView 호환성
      let errorMessage = 'SEAT권 발급에 실패했습니다.';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.error || '입력 정보를 확인해주세요.';
        } else if (error.response.status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.response.status === 403) {
          errorMessage = 'SEAT권 발급 권한이 없습니다.';
        } else if (error.response.status === 404) {
          errorMessage = '토너먼트 또는 사용자 정보를 찾을 수 없습니다.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      showAlert('danger', errorMessage);
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
    const config = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getSourceBadge = (source) => {
    const sourceMap = {
      'PURCHASE': { variant: 'primary', text: '구매' },
      'REWARD': { variant: 'success', text: '보상' },
      'GIFT': { variant: 'info', text: '선물' },
      'ADMIN': { variant: 'warning', text: '관리자' }
    };
    const config = sourceMap[source] || { variant: 'secondary', text: source };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  // Android WebView 호환성을 위한 CSS 스타일
  const webViewStyles = {
    container: {
      WebkitOverflowScrolling: 'touch',
      overflowY: 'auto'
    },
    card: {
      WebkitBoxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  };

  return (
    <div className="asl-mobile-container" style={webViewStyles.container}>
      <MobileHeader title="SEAT권 발급" />
      
      <Container className="asl-mobile-content">
        {alert.show && (
          <Alert variant={alert.type} className="mb-4">
            {alert.message}
          </Alert>
        )}

        <Card className="mb-4" style={webViewStyles.card}>
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
                  disabled={tournamentsLoading}
                >
                  <option value="">
                    {tournamentsLoading ? '토너먼트 목록 로딩 중...' : '토너먼트를 선택하세요'}
                  </option>
                  {tournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name} ({new Date(tournament.start_time).toLocaleDateString()})
                    </option>
                  ))}
                </Form.Select>
                {tournaments.length === 0 && !tournamentsLoading && (
                  <Form.Text className="text-muted">
                    배포된 토너먼트가 없습니다.
                  </Form.Text>
                )}
                {tournamentsLoading && (
                  <Form.Text className="text-muted">
                    <Spinner size="sm" className="me-2" />
                    토너먼트 목록을 불러오는 중...
                  </Form.Text>
                )}
              </Form.Group>

              {/* 사용자 검색 */}
              <Form.Group className="mb-3">
                <Form.Label>사용자 검색 *</Form.Label>
                <Row>
                  <Col xs={8}>
                    <Form.Control
                      type="text"
                      placeholder="전화번호 입력 (예: 010-1234-5678)"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                    />
                  </Col>
                  <Col xs={4}>
                    <Button 
                      variant="outline-primary" 
                      onClick={searchUser}
                      disabled={searchLoading}
                      className="w-100"
                    >
                      {searchLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <Search size={16} className="me-1" />
                          검색
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
                {selectedUser && (
                  <div className="mt-2 p-2 bg-light rounded">
                    <strong>{selectedUser.nickname || selectedUser.username || '이름 없음'}</strong>
                    <br />
                    <small className="text-muted">{selectedUser.phone}</small>
                  </div>
                )}
              </Form.Group>

              {/* 수량 입력 */}
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
              <Form.Group className="mb-3">
                <Form.Label>메모</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="발급 관련 메모를 입력하세요 (선택사항)"
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
                  disabled={loading || !selectedTournament || !selectedUser}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      발급 중...
                    </>
                  ) : (
                    <>
                      <Plus className="me-2" size={20} />
                      SEAT권 발급
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* 최근 발급된 SEAT권 목록 */}
        {recentTickets.length > 0 && (
          <Card style={webViewStyles.card}>
            <Card.Header>
              <h6 className="mb-0">최근 발급된 SEAT권</h6>
            </Card.Header>
            <Card.Body>
              <Table responsive size="sm">
                <thead>
                  <tr>
                    <th>사용자</th>
                    <th>토너먼트</th>
                    <th>상태</th>
                    <th>발급일</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.slice(0, 5).map((ticket, index) => (
                    <tr key={index}>
                      <td>
                        <small>
                          {ticket.user_nickname || ticket.user_phone || '알 수 없음'}
                        </small>
                      </td>
                      <td>
                        <small>
                          {ticket.tournament_name || `토너먼트 ${ticket.tournament}`}
                        </small>
                      </td>
                      <td>{getStatusBadge(ticket.status)}</td>
                      <td>
                        <small>
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

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