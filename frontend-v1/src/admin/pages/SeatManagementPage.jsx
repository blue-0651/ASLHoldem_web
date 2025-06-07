import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// third party
import DataTable from 'react-data-table-component';

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
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState(''); // 토너먼트 필터용

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
      fetchRecentTransactions();
    }
  }, []);

  // 토너먼트 목록 조회
  const fetchTournaments = async () => {
    console.log('📋 토너먼트 목록 조회 시작');
    setTournamentsLoading(true);
    try {
      // 전체 토너먼트를 가져오기 위해 limit 제거
      const response = await tournamentAPI.getAllTournaments({
        ordering: '-created_at'  // 최신순 정렬
        // limit 파라미터 제거로 전체 토너먼트 조회
      });
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
      
      // 하드코딩된 첫 번째 매장 자동 선택 로직 제거
      // 관리자가 적절한 매장을 수동으로 선택하도록 변경
      console.warn('⚠️ 관리자는 적절한 매장을 수동으로 선택해주세요.');
      showAlert('info', '매장을 선택한 후 SEAT권 관리를 시작하세요.');
    } catch (error) {
      console.error('❌ 매장 목록 조회 실패:', error);
      showAlert('warning', '매장 정보를 불러오는데 실패했습니다.');
    } finally {
      setStoresLoading(false);
    }
  };

  // 최근 발급된 SEAT권 조회
  const fetchRecentTransactions = async (tournamentFilter = null) => {
    setTransactionsLoading(true);
    try {
      const filterTournamentId = tournamentFilter !== null ? tournamentFilter : selectedTournamentFilter;
      console.log('📋 최근 발급된 SEAT권 조회 시작, 토너먼트 필터:', filterTournamentId || '전체');
      
      const params = {
        page_size: 50,  // Django REST Framework pagination 파라미터
        ordering: '-created_at'  // 최신순 정렬
      };
      
      // 토너먼트 필터가 있으면 추가
      if (filterTournamentId && filterTournamentId !== '') {
        params.tournament_id = filterTournamentId;
      }
      
      const response = await seatTicketAPI.getRecentTransactions(params);
      
      const transactionsData = response.data.results || response.data || [];
      console.log('✅ 최근 발급된 SEAT권 조회 완료:', transactionsData.length, '개');
      
      setRecentTransactions(transactionsData);
    } catch (error) {
      console.error('❌ 최근 발급된 SEAT권 조회 실패:', error);
      showAlert('warning', 'SEAT권 목록을 불러오는데 실패했습니다.');
      setRecentTransactions([]);
    } finally {
      setTransactionsLoading(false);
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
      console.log('🔍 첫 번째 좌석권 데이터 구조:', ticketsData[0]);
      
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

        // 성공 시 SEAT권 목록 다시 로드
        fetchRecentTransactions();
        showAlert('success', `SEAT권 ${quantity}개가 성공적으로 전송되었습니다.`);

      } else if (activeTab === 'retrieve') {
        // 선택된 좌석권들에서 필요한 정보 추출
        const selectedTicketDetails = userTickets.filter(ticket => 
          selectedTickets.includes(ticket.ticket_id)
        );
        
        if (selectedTicketDetails.length === 0) {
          throw new Error('선택된 좌석권 정보를 찾을 수 없습니다.');
        }

        console.log('🔍 선택된 좌석권 상세 정보:', selectedTicketDetails);

        // 토너먼트 ID 추출 - SeatTicketSerializer 구조에 맞게
        let tournamentId;
        const firstTicket = selectedTicketDetails[0];
        
        // 1. tournament 필드 직접 사용 (ID 값)
        if (firstTicket.tournament && typeof firstTicket.tournament === 'number') {
          tournamentId = firstTicket.tournament;
        }
        // 2. tournament_id 필드가 있는 경우
        else if (firstTicket.tournament_id) {
          tournamentId = firstTicket.tournament_id;
        }
        // 3. tournament 객체에서 id 추출 (백업)
        else if (firstTicket.tournament?.id) {
          tournamentId = firstTicket.tournament.id;
        }
        
        console.log('🎯 추출된 토너먼트 ID:', tournamentId);
        console.log('🎫 첫 번째 좌석권 전체 구조:', firstTicket);
        
        if (!tournamentId) {
          throw new Error('토너먼트 정보를 찾을 수 없습니다. 좌석권 데이터를 확인해주세요.');
        }

        // SEAT권 회수 API 호출 (백엔드 형식에 맞게 변환)
        const retrieveData = {
          operation: 'cancel',
          user_ids: [selectedUser.id],
          tournament_id: tournamentId,
          quantity: selectedTickets.length,
          reason: memo || '관리자 회수'
        };

        console.log('🔄 SEAT권 회수 요청:', retrieveData);
        const response = await seatTicketAPI.bulkOperation(retrieveData);
        console.log('✅ SEAT권 회수 성공:', response.data);

        // 성공 시 SEAT권 목록 다시 로드
        fetchRecentTransactions();
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

  // 토너먼트 필터 변경 핸들러
  const handleTournamentFilterChange = (e) => {
    const newFilter = e.target.value;
    setSelectedTournamentFilter(newFilter);
    fetchRecentTransactions(newFilter);
  };

  // 상태 배지
  const getStatusBadge = (status) => {
    const statusMap = {
      'ACTIVE': { color: 'success', text: '활성' },
      'USED': { color: 'secondary', text: '사용됨' },
      'EXPIRED': { color: 'warning', text: '만료됨' },
      'CANCELLED': { color: 'danger', text: '회수됨' },
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

  // 거래 타입 한국어 매핑
  const getTransactionTypeText = (type) => {
    const typeMap = {
      'GRANT': '지급',
      'USE': '사용',
      'CANCEL': '취소',
      'EXPIRE': '만료',
      'TRANSFER': '이전'
    };
    return typeMap[type] || type;
  };

  // 상태 배지 클래스 반환 함수
  const getStatusBadgeClass = (status) => {
    const statusClassMap = {
      'ACTIVE': 'badge-success',
      'USED': 'badge-secondary',
      'EXPIRED': 'badge-warning',
      'CANCELLED': 'badge-danger',
      'COMPLETED': 'badge-success'
    };
    return statusClassMap[status] || 'badge-secondary';
  };

  // SEAT권 내역 테이블 컬럼 정의 (TicketIssuePage.jsx와 동일한 데이터 구조)
  const transactionColumns = useMemo(() => [
    {
      name: <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24' }}>SEAT권 ID</span>,
      selector: (row) => row.ticket_id || '정보 없음',
      center: true,
      width: '130px',
      cell: (row) => (
        <span className="text-monospace" style={{ fontSize: '10px' }}>
          {row.ticket_id ? row.ticket_id.slice(-8) : '정보 없음'}
        </span>
      )
    },
    {
      name: <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24' }}>토너먼트</span>,
      selector: (row) => row.tournament_name || '정보 없음',
      center: true,
      width: '200px',
      cell: (row) => (
        <div style={{ fontSize: '12px' }}>
          {row.tournament_name || '정보 없음'}
        </div>
      )
    },
    {
      name: <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24' }}>사용자</span>,
      selector: (row) => row.user_name || '정보 없음',
      center: true,
      width: '120px',
      cell: (row) => (
        <div style={{ fontSize: '12px' }}>
          <div>{row.user_name || '정보 없음'}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>{row.user_phone || ''}</div>
        </div>
      )
    },
    {
      name: <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24' }}>상태</span>,
      selector: (row) => row.status_display || row.status,
      center: true,
      width: '120px',
      cell: (row) => {
        const statusStyleMap = {
          'ACTIVE': { 
            backgroundColor: '#28a745', 
            color: 'white', 
            text: '활성' 
          },
          'USED': { 
            backgroundColor: '#6c757d', 
            color: 'white', 
            text: '사용됨' 
          },
          'EXPIRED': { 
            backgroundColor: '#ffc107', 
            color: '#212529', 
            text: '만료됨' 
          },
          'CANCELLED': { 
            backgroundColor: '#dc3545', 
            color: 'white', 
            text: '회수됨' 
          },
          'COMPLETED': { 
            backgroundColor: '#28a745', 
            color: 'white', 
            text: '완료' 
          }
        };
        
        const statusInfo = statusStyleMap[row.status] || { 
          backgroundColor: '#6c757d', 
          color: 'white', 
          text: row.status_display || row.status 
        };
        
        return (
          <span 
            className="badge"
            style={{
              backgroundColor: statusInfo.backgroundColor,
              color: statusInfo.color,
              fontSize: '11px',
              fontWeight: '500',
              padding: '6px 12px',
              borderRadius: '15px',
              border: 'none',
              textTransform: 'none'
            }}
          >
            {statusInfo.text}
          </span>
        );
      }
    },
    {
      name: <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24' }}>발급방법</span>,
      selector: (row) => row.source,
      center: true,
      width: '100px',
      cell: (row) => {
        const sourceMap = {
          'PURCHASE': { color: 'primary', text: '구매' },
          'REWARD': { color: 'success', text: '보상' },
          'GIFT': { color: 'info', text: '선물' },
          'ADMIN': { color: 'warning', text: '관리자' },
          'EVENT': { color: 'secondary', text: '이벤트' }
        };
        
        const sourceInfo = sourceMap[row.source] || { color: 'secondary', text: row.source };
        return (
          <Badge color={sourceInfo.color} style={{ fontSize: '11px' }}>
            {sourceInfo.text}
          </Badge>
        );
      }
    },
    {
      name: <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24' }}>매장</span>,
      selector: (row) => row.store_name || '정보 없음',
      center: true,
      width: '120px',
      cell: (row) => (
        <span style={{ fontSize: '12px' }}>{row.store_name || '정보 없음'}</span>
      )
    },
    {
      name: <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24' }}>발급일시</span>,
      selector: (row) => row.created_at,
      center: true,
      width: '140px',
      cell: (row) => (
        <div style={{ fontSize: '11px' }}>
          <div>{new Date(row.created_at).toLocaleDateString('ko-KR')}</div>
          <div style={{ color: '#666' }}>{new Date(row.created_at).toLocaleTimeString('ko-KR')}</div>
        </div>
      )
    },
    {
      name: <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#721c24' }}>메모</span>,
      selector: (row) => row.memo || '-',
      center: false,
      wrap: true,
      cell: (row) => (
        <div style={{ fontSize: '11px', color: '#666', maxWidth: '150px' }}>
          {row.memo || '-'}
        </div>
      )
    }
  ], []);

  // DataTable 커스텀 스타일 (StoreManagement.jsx 참고)
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8f9fa',
        minHeight: '50px'
      }
    },
    headCells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
        paddingTop: '8px',
        paddingBottom: '8px',
        backgroundColor: '#ffffff',
        fontSize: '13px'
      }
    },
    cells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
        paddingTop: '8px',
        paddingBottom: '8px',
        fontSize: '12px'
      }
    },
    rows: {
      style: {
        minHeight: '55px'  // 각 행의 최소 높이 설정
      }
    }
  };

  return (
    <div className="container-fluid seat-management-page">
      {/* 페이지 헤더 */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>SEAT권 전송 및 회수 관리</h2>
      </div>

      {/* 알림 섹션 */}
      {alert.show && (
        <Alert color={alert.type} className="mb-4" fade={false}>
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
                                      <td>{ticket.tournament_name || '토너먼트 정보 없음'}</td>
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
                          <Alert color="info" fade={false}>
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
          <Card className="form-section" style={{ height: '750px', display: 'flex', flexDirection: 'column' }}>
            <CardHeader style={{ flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <CardTitle tag="h5" className="mb-0">최근 발급된 SEAT권</CardTitle>
                <div className="d-flex align-items-center gap-3">
                  {/* 토너먼트 필터 */}
                  <div className="d-flex align-items-center">
                    <Label className="me-2 mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>토너먼트:</Label>
                    <Input
                      type="select"
                      value={selectedTournamentFilter}
                      onChange={handleTournamentFilterChange}
                      style={{ width: '200px', fontSize: '13px' }}
                      disabled={transactionsLoading}
                    >
                      <option value="">전체 토너먼트</option>
                      {tournaments.map(tournament => (
                        <option key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </option>
                      ))}
                    </Input>
                  </div>
                  
                  {/* 새로고침 버튼 */}
                  <Button 
                    color="outline-primary" 
                    size="sm"
                    onClick={() => fetchRecentTransactions()}
                    disabled={transactionsLoading}
                  >
                    {transactionsLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        새로고침 중...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={14} className="me-2" />
                        새로고침
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  최근 발급된 SEAT권의 상태와 정보를 확인할 수 있습니다.
                  {selectedTournamentFilter && (
                    <span className="ms-2">
                      (필터: {tournaments.find(t => t.id == selectedTournamentFilter)?.name || '선택된 토너먼트'})
                    </span>
                  )}
                </small>
                <small className="text-muted">
                  총 {recentTransactions.length}개 항목
                </small>
              </div>
            </CardHeader>
            <CardBody style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              padding: '1rem'
            }}>
              {transactionsLoading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">SEAT권 목록을 불러오는 중입니다...</p>
                </div>
              ) : (
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <DataTable
                    columns={transactionColumns}
                    data={recentTransactions}
                    customStyles={{
                      ...customStyles,
                      table: {
                        style: {
                          height: '100%'
                        }
                      },
                      tableWrapper: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }
                      }
                    }}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[5, 10, 15, 20]}
                    noDataComponent={
                      <div className="text-center p-5">
                        <div className="mb-3">
                          <i className="fas fa-ticket-alt fa-3x text-muted"></i>
                        </div>
                        <h5 className="text-muted">발급된 SEAT권이 없습니다.</h5>
                        <p className="text-muted mb-0">SEAT권 전송을 시작해보세요.</p>
                      </div>
                    }
                    highlightOnHover
                    striped
                    dense
                    fixedHeader
                    fixedHeaderScrollHeight="calc(100vh - 400px)"
                  />
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
