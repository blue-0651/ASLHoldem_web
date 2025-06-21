import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Spinner, Alert, Badge, Container } from 'react-bootstrap';
import { FiPlus, FiUser, FiMail, FiPhone, FiAward, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { tournamentAPI, userAPI, seatTicketAPI, dashboardAPI } from '../../utils/api';

const PlayerRegistrationPage = () => {
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // 폼 데이터
  const [playerData, setPlayerData] = useState({
    lastname: '',
    firstname: '',
    email: '',
    phone: '',
    birth_date: '',
    gender_digit: ''
  });
  
  // 토너먼트 관련
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [allTournaments, setAllTournaments] = useState([]);
  const [storeTournaments, setStoreTournaments] = useState([]);
  const [tournamentFilter, setTournamentFilter] = useState('all');
  
  // 사용자 검색 관련
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [phoneSearched, setPhoneSearched] = useState(false);
  
  // 통계 데이터
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    todayRegistrations: 0,
    totalTournaments: 0
  });

  /**
   * 컴포넌트 마운트 시 초기 데이터 로드
   */
  useEffect(() => {
    fetchInitialData();
  }, []);

  /**
   * 초기 데이터 로드 (토너먼트 목록, 통계)
   */
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 PlayerRegistrationPage - 초기 데이터 로드 시작');
      
      // 현재 사용자 정보 확인
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const isAdmin = userInfo?.is_staff || userInfo?.is_superuser || false;
      const isStoreOwner = userInfo?.is_store_owner || false;
      
      console.log('👤 사용자 권한 확인:', { 
        isAdmin, 
        isStoreOwner, 
        userInfo: userInfo 
      });
      
      // 매장 배포 토너먼트 목록 가져오기 - 관리자/매장관리자 모두 지원
      const axios = (await import('axios')).default;
      const token = localStorage.getItem('asl_holdem_access_token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const storeResponse = await axios.get('/api/v1/store/tournaments/', { headers });
      const storeData = Array.isArray(storeResponse.data) ? storeResponse.data : [];
      
      console.log('✅ 토너먼트 목록 조회 완료:', storeData.length, '개');
      console.log('토너먼트 데이터:', storeData);
      
      if (isAdmin) {
        console.log('🔧 관리자 권한으로 모든 토너먼트 조회됨');
      } else if (isStoreOwner) {
        console.log('🏪 매장 관리자 권한으로 매장 배분 토너먼트 조회됨');
      }
      
      setStoreTournaments(storeData);
      
      // 전체 토너먼트 목록 가져오기
      let allData = [];
      try {
        const allResponse = await tournamentAPI.getAllTournaments();
        allData = Array.isArray(allResponse.data) ? allResponse.data : [];
        setAllTournaments(allData);
        console.log('✅ 전체 토너먼트 목록 조회 완료:', allData.length, '개');
      } catch (allErr) {
        console.warn('⚠️ 전체 토너먼트 목록 로드 실패:', allErr);
        allData = storeData; // 실패 시 매장 토너먼트로 대체
        setAllTournaments(storeData);
      }
      
      // 초기 필터에 따른 토너먼트 설정 (전체 토너먼트 로드 후 적용)
      updateTournamentsByFilter('all');
      
      // 통계 데이터 로드
      await loadStats(allData.length > 0 ? allData : storeData);
      
    } catch (err) {
      console.error('❌ 초기 데이터 로드 오류:', err);
      let errorMessage = '데이터를 불러오는 중 오류가 발생했습니다.';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else if (err.response.status === 403) {
          // 사용자 권한에 따른 상세 메시지
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          const isAdmin = userInfo?.is_staff || userInfo?.is_superuser || false;
          const isStoreOwner = userInfo?.is_store_owner || false;
          
          if (!isAdmin && !isStoreOwner) {
            errorMessage = '매장 관리자 또는 시스템 관리자 권한이 필요합니다.';
          } else {
            errorMessage = '권한이 부족합니다. 관리자에게 문의하세요.';
          }
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      setError(errorMessage);
      setStoreTournaments([]);
      setAllTournaments([]);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터에 따른 토너먼트 목록 업데이트
   */
  const updateTournamentsByFilter = (filterType, storeData = null) => {
    let filteredTournaments = [];
    const sourceStoreTournaments = Array.isArray(storeData) ? storeData : Array.isArray(storeTournaments) ? storeTournaments : [];
    
    try {
      switch (filterType) {
        case 'store':
          filteredTournaments = sourceStoreTournaments;
          break;
        case 'all':
          filteredTournaments = Array.isArray(allTournaments) ? allTournaments : [];
          break;
        case 'today':
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          filteredTournaments = sourceStoreTournaments.filter(tournament => {
            const tournamentDate = new Date(tournament.start_time).toISOString().split('T')[0];
            return tournamentDate === todayStr;
          });
          break;
        default:
          filteredTournaments = sourceStoreTournaments;
      }
      
      setTournaments(filteredTournaments);
      
      // 선택된 토너먼트가 필터된 목록에 없으면 초기화
      if (selectedTournament && Array.isArray(filteredTournaments) && !filteredTournaments.find(t => t.id.toString() === selectedTournament.toString())) {
        setSelectedTournament('');
      }
      
    } catch (err) {
      console.error('토너먼트 필터링 오류:', err);
      setError('토너먼트 목록 필터링 중 오류가 발생했습니다.');
      setTournaments([]);
    }
  };

  /**
   * 통계 데이터 로드
   */
  const loadStats = async (tournamentsData = null) => {
    try {
      const statsResponse = await dashboardAPI.getStats();
      const dashboardStats = statsResponse.data || {};
      
      const tournamentsToCount = tournamentsData || tournaments;
      
      setStats({
        totalPlayers: dashboardStats.player_count || 0,
        activePlayers: dashboardStats.player_count || 0,
        todayRegistrations: dashboardStats.today_registrations || 0,
        totalTournaments: Array.isArray(tournamentsToCount) ? tournamentsToCount.length : 0
      });
      
    } catch (err) {
      console.error('통계 데이터 로드 오류:', err);
      const tournamentsToCount = tournamentsData || tournaments;
      setStats({
        totalPlayers: 0,
        activePlayers: 0,
        todayRegistrations: 0,
        totalTournaments: Array.isArray(tournamentsToCount) ? tournamentsToCount.length : 0
      });
    }
  };

  /**
   * 토너먼트 참가 여부 확인
   */
  const checkTournamentParticipation = async (phone, tournamentId) => {
    if (!phone || !tournamentId) return;
    
    try {
      console.log(`토너먼트 참가 여부 확인 시작: phone=${phone}, tournamentId=${tournamentId}`);
      
      // SEAT권 정보 조회
      const ticketResponse = await seatTicketAPI.getUserStats(foundUser?.id || null, tournamentId);
      
      console.log('SEAT권 정보 조회 결과:', ticketResponse.data);
      
      setFoundUser(prev => ({
        ...prev,
        ticketInfo: ticketResponse.data,
        participationInfo: { is_registered: false, registration_info: null }
      }));
      
    } catch (err) {
      console.error('토너먼트 정보 조회 실패:', err);
      setFoundUser(prev => ({
        ...prev,
        ticketInfo: null,
        participationInfo: null
      }));
    }
  };

  /**
   * 휴대폰 번호로 사용자 검색
   */
  const searchUserByPhone = async (phone) => {
    if (!phone || phone.length < 10) return;
    
    setPhoneSearchLoading(true);
    setError(null);
    
    try {
      const response = await userAPI.getUserByPhone(phone);
      
      console.log('API 응답에서 받은 사용자 정보:', response.data);
      
      if (response.data.found && response.data.user) {
        setFoundUser(response.data.user);
        setIsNewUser(false);
        setPlayerData({
          lastname: response.data.user.last_name || response.data.user.lastname || '',
          firstname: response.data.user.first_name || response.data.user.firstname || '',
          email: response.data.user.email,
          phone: response.data.user.phone,
          birth_date: response.data.user.birth_date || '',
          gender_digit: response.data.user.gender_digit || ''
        });
        
        // 선택된 토너먼트가 있으면 해당 토너먼트의 SEAT권 현황과 참가 여부도 조회
        if (selectedTournament) {
          await checkTournamentParticipation(phone, selectedTournament);
        }
      } else {
        console.log('사용자 검색 결과: 해당 휴대폰 번호로 등록된 사용자 없음');
        setFoundUser(null);
        setIsNewUser(true);
        setPlayerData(prev => ({
          ...prev,
          lastname: '',
          firstname: '',
          email: '',
          birth_date: '',
          gender_digit: ''
        }));
      }
      
      setPhoneSearched(true);
    } catch (err) {
      console.error('사용자 검색 오류:', err);
      setError('사용자 검색 중 오류가 발생했습니다.');
      setFoundUser(null);
      setIsNewUser(false);
      setPhoneSearched(false);
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  /**
   * 휴대폰 번호 입력 핸들러 (디바운스 적용)
   */
  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    setPlayerData(prev => ({ ...prev, phone }));
    
    // 기존 검색 결과 초기화
    setFoundUser(null);
    setIsNewUser(false);
    setPhoneSearched(false);
    
    // 디바운스: 1초 후 검색 실행
    clearTimeout(window.phoneSearchTimeout);
    window.phoneSearchTimeout = setTimeout(() => {
      if (phone.length >= 10) {
        searchUserByPhone(phone);
      }
    }, 1000);
  };

  /**
   * 입력 필드 변경 핸들러
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      handlePhoneChange(e);
      return;
    }
    
    // 생년월일 필드는 숫자만 허용
    if (name === 'birth_date') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setPlayerData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }
    
    // 성별구분 필드는 1-2 숫자만 허용
    if (name === 'gender_digit') {
      const numericValue = value.replace(/[^1-2]/g, '');
      setPlayerData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }
    
    setPlayerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * 토너먼트 선택 핸들러
   */
  const handleTournamentChange = async (e) => {
    const tournamentId = e.target.value;
    setSelectedTournament(tournamentId);
    
    // 토너먼트가 선택되고 사용자 정보가 있으면 참가 여부 확인
    if (tournamentId && foundUser) {
      await checkTournamentParticipation(foundUser.phone, tournamentId);
    }
  };

  /**
   * 토너먼트 필터 변경 핸들러
   */
  const handleFilterChange = (filterType) => {
    setTournamentFilter(filterType);
    updateTournamentsByFilter(filterType);
  };

  /**
   * 선수 등록 폼 제출
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 필수 필드 검증
      if (!selectedTournament) {
        setError('토너먼트를 선택해주세요.');
        return;
      }
      
      if (!playerData.phone) {
        setError('휴대폰 번호를 입력해주세요.');
        return;
      }
      
      // 신규 사용자인 경우 추가 정보 검증
      if (isNewUser && (!playerData.lastname || !playerData.firstname || !playerData.email)) {
        setError('신규 사용자는 성, 이름과 이메일을 입력해주세요.');
        return;
      }

      // API 요청 데이터 준비
      const requestData = {
        tournament_id: selectedTournament,
        phone_number: playerData.phone
      };
      
      // 기존 사용자인 경우 user_id 추가
      if (foundUser) {
        requestData.user_id = foundUser.id;
      } else {
        // 신규 사용자인 경우 추가 정보 포함
        requestData.lastname = playerData.lastname;
        requestData.firstname = playerData.firstname;
        requestData.email = playerData.email;
        requestData.birth_date = playerData.birth_date;
        requestData.gender_digit = playerData.gender_digit;
      }

      // 직접 API 호출
      const response = await fetch('/api/v1/store/register-player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('asl_holdem_access_token')}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        
        // 폼 초기화
        setPlayerData({
          lastname: '',
          firstname: '',
          email: '',
          phone: '',
          birth_date: '',
          gender_digit: ''
        });
        setFoundUser(null);
        setIsNewUser(false);
        setPhoneSearched(false);
        
        // 통계 다시 로드
        await loadStats();
        
      } else {
        setError(result.error || '선수 참가 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('선수 참가 오류:', err);
      setError('선수 참가 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && (!Array.isArray(tournaments) || tournaments.length === 0)) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">데이터를 불러오는 중입니다...</p>
        <div className="mt-3">
          <small className="text-muted">
            매장에 배포된 토너먼트 목록을 가져오고 있습니다...
          </small>
        </div>
      </div>
    );
  }

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>선수회원 참가</h2>
          <div className="mt-1">
            {(() => {
              const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
              const isAdmin = userInfo?.is_staff || userInfo?.is_superuser || false;
              const isStoreOwner = userInfo?.is_store_owner || false;
              
              if (isAdmin) {
                return <small className="text-success"><FiAward className="me-1" />시스템 관리자 - 모든 토너먼트 관리 가능</small>;
              } else if (isStoreOwner) {
                return <small className="text-info"><FiUser className="me-1" />매장 관리자 - 매장 배분 토너먼트 관리</small>;
              } else {
                return <small className="text-muted"><FiUser className="me-1" />권한 확인 중...</small>;
              }
            })()}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={fetchInitialData}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                새로고침 중...
              </>
            ) : (
              <>
                <FiRefreshCw className="me-1" />
                새로고침
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <FiX className="me-2" />
              {error}
            </div>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => {
                setError(null);
                fetchInitialData();
              }}
              disabled={loading}
            >
              <FiRefreshCw className="me-1" />
              다시 시도
            </Button>
          </div>
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <FiCheck className="me-2" />
          선수회원이 성공적으로 참가되었습니다.
        </Alert>
      )}

      {/* 통계 카드 */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">전체 선수</h6>
                  <h3 className="mb-0">{stats.totalPlayers}</h3>
                </div>
                <FiUser className="text-primary" size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">활성 선수</h6>
                  <h3 className="mb-0">{stats.activePlayers}</h3>
                </div>
                <FiUser className="text-success" size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">오늘 참가</h6>
                  <h3 className="mb-0">{stats.todayRegistrations}</h3>
                </div>
                <FiPlus className="text-info" size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">활성 토너먼트</h6>
                  <h3 className="mb-0">{Array.isArray(tournaments) ? tournaments.filter(t => t.status === 'UPCOMING' || t.status === 'ONGOING').length : 0}</h3>
                </div>
                <FiAward className="text-warning" size={32} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 선수 참가 폼 */}
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* 휴대폰 번호 입력 필드 */}
            <Form.Group className="mb-3">
              <Form.Label>
                <FiPhone className="me-2" />
                휴대폰 번호 
                <span className="text-danger">*</span>
                {phoneSearchLoading && <Spinner animation="border" size="sm" className="ms-2" />}
              </Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={playerData.phone}
                onChange={handleChange}
                placeholder="'-' 없이 입력하세요 (예: 01012345678)"
                required
              />
              <Form.Text className="text-muted">
                휴대폰 번호를 입력하면 자동으로 기존 회원 정보를 검색합니다.
              </Form.Text>
            </Form.Group>

            {/* 사용자 검색 결과 표시 */}
            {phoneSearched && foundUser && (
              <Alert variant="success" className="mb-3">
                <div className="d-flex align-items-center">
                  <FiUser className="me-2" />
                  <div className="flex-grow-1">
                    <strong>기존 회원 발견!</strong>
                    <div className="mt-1">
                      <small>
                        이름: {(() => {
                          const fullName = (foundUser.last_name || foundUser.lastname || '') + (foundUser.first_name || foundUser.firstname || '');
                          const nickname = foundUser.nickname ? `(${foundUser.nickname})` : '';
                          return fullName ? fullName + nickname : foundUser.username || '정보 없음';
                        })()} | 이메일: {foundUser.email}
                      </small>
                    </div>
                    <div className="mt-2 p-2 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <FiAward className="me-1" />
                          SEAT권 현황
                        </small>
                        <div className="d-flex gap-2">
                          <Badge bg="success">
                            <FiCheck className="me-1" style={{fontSize: '10px'}} />
                            사용가능: {foundUser.ticketInfo?.active_tickets || 0}개
                          </Badge>
                          <Badge bg="secondary">
                            <FiX className="me-1" style={{fontSize: '10px'}} />
                            사용됨: {foundUser.ticketInfo?.used_tickets || 0}개
                          </Badge>
                        </div>
                      </div>
                        
                      {/* 토너먼트 참가 여부 표시 */}
                      {selectedTournament && (
                        <div className="mt-2 p-2 rounded" style={{
                          backgroundColor: foundUser.participationInfo === null ? '#f8f9fa' : 
                                         foundUser.participationInfo?.is_registered ? '#fff3cd' : 
                                         (foundUser.ticketInfo?.active_tickets >= (tournaments.find(t => t.id.toString() === selectedTournament.toString())?.buy_in || 1)) ? '#d1ecf1' : '#f8d7da'
                        }}>
                          <div className="d-flex align-items-center">
                            {foundUser.participationInfo === null ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                <small className="text-muted fw-bold">
                                  토너먼트 참가 여부 확인 중...
                                </small>
                              </>
                            ) : foundUser.participationInfo?.is_registered ? (
                              <>
                                <FiCheck className="text-warning me-2" />
                                <div className="flex-grow-1">
                                  <small className="text-warning fw-bold">
                                    이미 이 토너먼트에 참가되어 있습니다 (중복 참가 가능)
                                  </small>
                                </div>
                              </>
                            ) : (() => {
                              const selectedTournamentData = Array.isArray(tournaments) ? tournaments.find(t => t.id.toString() === selectedTournament.toString()) : null;
                              const requiredTickets = selectedTournamentData?.buy_in || 1;
                              const availableTickets = foundUser.ticketInfo?.active_tickets || 0;
                              const canParticipate = availableTickets >= requiredTickets;
                              
                              return canParticipate ? (
                                <>
                                  <FiPlus className="text-info me-2" />
                                  <small className="text-info fw-bold">
                                    이 토너먼트에 참가 가능합니다
                                  </small>
                                </>
                              ) : (
                                <>
                                  <FiX className="text-danger me-2" />
                                  <div className="flex-grow-1">
                                    <small className="text-danger fw-bold">
                                      SEAT권이 부족하여 참가할 수 없습니다
                                    </small>
                                    <div className="mt-1">
                                      <small className="text-muted">
                                        필요: {requiredTickets}개 | 보유: {availableTickets}개 | 부족: {requiredTickets - availableTickets}개
                                      </small>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Alert>
            )}

            {phoneSearched && isNewUser && (
              <Alert variant="info" className="mb-3">
                <div className="d-flex align-items-center">
                  <FiPlus className="me-2" />
                  <div>
                    <strong>신규 회원</strong>
                    <div className="mt-1">
                      <small>해당 휴대폰 번호로 참가된 회원이 없습니다. 추가 정보를 입력해주세요.</small>
                    </div>
                  </div>
                </div>
              </Alert>
            )}

            {/* 토너먼트 필터 선택 버튼 그룹 */}
            <Form.Group className="mb-3">
              <Form.Label>토너먼트 필터</Form.Label>
              <div className="d-flex gap-2 mb-2">
                <Button
                  variant={tournamentFilter === 'store' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => handleFilterChange('store')}
                  className="flex-fill"
                >
                  매장 배포
                  {Array.isArray(storeTournaments) && storeTournaments.length > 0 && (
                    <Badge bg="light" text="dark" className="ms-1">
                      {storeTournaments.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={tournamentFilter === 'all' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => handleFilterChange('all')}
                  className="flex-fill"
                >
                  전체
                  {Array.isArray(allTournaments) && allTournaments.length > 0 && (
                    <Badge bg="light" text="dark" className="ms-1">
                      {allTournaments.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={tournamentFilter === 'today' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => handleFilterChange('today')}
                  className="flex-fill"
                >
                  당일
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayCount = Array.isArray(storeTournaments) ? storeTournaments.filter(tournament => {
                      const tournamentDate = new Date(tournament.start_time).toISOString().split('T')[0];
                      return tournamentDate === today;
                    }).length : 0;
                    return todayCount > 0 && (
                      <Badge bg="light" text="dark" className="ms-1">
                        {todayCount}
                      </Badge>
                    );
                  })()}
                </Button>
              </div>
              <Form.Text className="text-muted">
                {(() => {
                  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                  const isAdmin = userInfo?.is_staff || userInfo?.is_superuser || false;
                  
                  if (tournamentFilter === 'store') {
                    if (isAdmin) {
                      return '본사로부터 매장에 배포된 토너먼트 목록입니다. (관리자는 모든 토너먼트 조회 가능)';
                    } else {
                      return '본사로부터 이 매장에 배포된 토너먼트 목록입니다.';
                    }
                  } else if (tournamentFilter === 'all') {
                    if (isAdmin) {
                      return '시스템의 모든 토너먼트 목록입니다. (관리자 권한)';
                    } else {
                      return '시스템의 모든 토너먼트 목록입니다.';
                    }
                  } else if (tournamentFilter === 'today') {
                    if (isAdmin) {
                      return '오늘 개최되는 모든 토너먼트 목록입니다. (관리자 권한)';
                    } else {
                      return '오늘 이 매장에서 개최되는 토너먼트 목록입니다.';
                    }
                  }
                  return '';
                })()}
              </Form.Text>
            </Form.Group>

            {/* 토너먼트 선택 드롭다운 */}
            <Form.Group className="mb-3">
              <Form.Label>
                <FiAward className="me-2" />
                토너먼트 선택 <span className="text-danger">*</span>
                {loading && <Spinner animation="border" size="sm" className="ms-2" />}
              </Form.Label>
              <Form.Select 
                value={selectedTournament} 
                onChange={handleTournamentChange} 
                required
                disabled={loading}
              >
                <option value="">
                  {loading ? '토너먼트 목록을 불러오는 중...' : 
                   (!Array.isArray(tournaments) || tournaments.length === 0) ? 
                   '토너먼트가 없습니다' : '토너먼트를 선택하세요'}
                </option>
                {Array.isArray(tournaments) && tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name} - Buy-in: {tournament.buy_in || 1}개 ({new Date(tournament.start_time).toLocaleString()})
                  </option>
                ))}
              </Form.Select>
              {(!Array.isArray(tournaments) || tournaments.length === 0) && !loading && (
                <div className="mt-2">
                  <Alert variant="warning" className="mb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <FiAward className="me-2" />
                        <strong>선택한 필터에 해당하는 토너먼트가 없습니다.</strong>
                        <div className="mt-1">
                          <small>
                            {tournamentFilter === 'store' && '본사에서 이 매장에 배포된 토너먼트가 없습니다.'}
                            {tournamentFilter === 'all' && '시스템에 등록된 토너먼트가 없습니다.'}
                            {tournamentFilter === 'today' && '오늘 이 매장에서 개최되는 토너먼트가 없습니다.'}
                          </small>
                        </div>
                      </div>
                      <Button 
                        variant="outline-warning" 
                        size="sm" 
                        onClick={fetchInitialData}
                        disabled={loading}
                      >
                        <FiRefreshCw className="me-1" />
                        새로고침
                      </Button>
                    </div>
                  </Alert>
                </div>
              )}
            </Form.Group>

            {/* 선택된 토너먼트 정보 표시 */}
            {selectedTournament && (() => {
              const selectedTournamentData = Array.isArray(tournaments) ? tournaments.find(t => t.id.toString() === selectedTournament.toString()) : null;
              return selectedTournamentData && (
                <Alert variant="info" className="mb-3">
                  <div className="d-flex align-items-center">
                    <FiAward className="me-2" />
                    <div>
                      <strong>선택된 토너먼트 정보</strong>
                      <div className="mt-1">
                        <div><strong>토너먼트명:</strong> {selectedTournamentData.name}</div>
                        <div><strong>시작 시간:</strong> {new Date(selectedTournamentData.start_time).toLocaleString()}</div>
                        <div><strong>Buy-in (필요 SEAT권):</strong> 
                          <Badge bg="warning" text="dark" className="ms-1">
                            {selectedTournamentData.buy_in || 1}개
                          </Badge>
                        </div>
                        {selectedTournamentData.description && (
                          <div><strong>설명:</strong> {selectedTournamentData.description}</div>
                        )}
                        <div><strong>상태:</strong> 
                          <Badge 
                            bg={
                              selectedTournamentData.status === 'UPCOMING' ? 'primary' :
                              selectedTournamentData.status === 'ONGOING' ? 'success' :
                              selectedTournamentData.status === 'COMPLETED' ? 'secondary' : 'danger'
                            } 
                            className="ms-1"
                          >
                            {
                              selectedTournamentData.status === 'UPCOMING' ? '예정' :
                              selectedTournamentData.status === 'ONGOING' ? '진행중' :
                              selectedTournamentData.status === 'COMPLETED' ? '완료' : '취소됨'
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Alert>
              );
            })()}

            {/* 기존 사용자 정보 표시 */}
            {foundUser && (
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title className="h6">
                    <FiUser className="me-2" />
                    기존 회원 정보
                  </Card.Title>
                  
                  <Row className="mb-2">
                    <Col md={3}><strong>이름:</strong></Col>
                    <Col md={9}>
                      {foundUser.last_name && foundUser.first_name ? 
                        `${foundUser.last_name}${foundUser.first_name}` + 
                        (foundUser.nickname ? `(${foundUser.nickname})` : '') : 
                        foundUser.username || '정보 없음'
                      }
                    </Col>
                  </Row>
                  
                  <Row className="mb-2">
                    <Col md={3}><strong>주민번호:</strong></Col>
                    <Col md={9}>
                      {foundUser.birth_date && foundUser.gender_digit ? 
                        `${foundUser.birth_date}-${foundUser.gender_digit}xxxxxx` : 
                        '정보 없음'
                      }
                    </Col>
                  </Row>
                  
                  <Row className="mb-2">
                    <Col md={3}><strong>이메일:</strong></Col>
                    <Col md={9}>{foundUser.email || '정보 없음'}</Col>
                  </Row>
                  
                  <Row>
                    <Col md={3}><strong>전화번호:</strong></Col>
                    <Col md={9}>{foundUser.phone || '정보 없음'}</Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* 신규 사용자 입력 필드들 */}
            {isNewUser && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>성 <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="lastname"
                        value={playerData.lastname}
                        onChange={handleChange}
                        placeholder="성을 입력하세요"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>이름 <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="firstname"
                        value={playerData.firstname}
                        onChange={handleChange}
                        placeholder="이름을 입력하세요"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>주민번호 앞 7자리 <span className="text-danger">*</span></Form.Label>
                  <Row>
                    <Col md={7}>
                      <Form.Control
                        type="text"
                        name="birth_date"
                        value={playerData.birth_date}
                        onChange={handleChange}
                        placeholder="생년월일 6자리 (예: 901225)"
                        maxLength="6"
                        required
                      />
                    </Col>
                    <Col md={1} className="d-flex align-items-center justify-content-center">
                      <span>-</span>
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="text"
                        name="gender_digit"
                        value={playerData.gender_digit}
                        onChange={handleChange}
                        placeholder="성별구분 1자리"
                        maxLength="1"
                        required
                      />
                    </Col>
                  </Row>
                  <Form.Text className="text-muted">
                    생년월일 6자리와 성별구분 숫자를 입력하세요. (남자: 1, 여자: 2, 예: 901225-1)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <FiMail className="me-2" />
                    이메일 <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={playerData.email}
                    onChange={handleChange}
                    placeholder="이메일 주소를 입력하세요"
                    required
                  />
                </Form.Group>
              </>
            )}

            {/* 제출 버튼 - 휴대폰 번호 검색 후에만 표시 */}
            {(phoneSearched || foundUser) && (
              <div className="d-grid gap-2">
                                 {(() => {
                   // SEAT권 부족 여부 확인
                   const selectedTournamentData = Array.isArray(tournaments) ? tournaments.find(t => t.id.toString() === selectedTournament.toString()) : null;
                   const requiredTickets = selectedTournamentData?.buy_in || 1;
                   const availableTickets = foundUser?.ticketInfo?.active_tickets || 0;
                   const canParticipate = foundUser ? availableTickets >= requiredTickets : true; // 신규 사용자는 참가 가능
                   const isDisabled = loading || phoneSearchLoading || (foundUser && !canParticipate);
                  
                  return (
                    <Button 
                      variant={canParticipate ? "primary" : "danger"} 
                      type="submit" 
                      disabled={isDisabled}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          참가 중...
                        </>
                      ) : !canParticipate && foundUser ? (
                        <>
                          <FiX className="me-2" />
                          SEAT권 부족 (참가 불가)
                        </>
                      ) : (
                        <>
                          <FiPlus className="me-2" />
                          {foundUser ? '토너먼트 참가' : '신규 회원 등록 및 토너먼트 참가'}
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            )}

            {/* 안내 메시지 */}
            {!phoneSearched && !foundUser && playerData.phone.length > 0 && playerData.phone.length < 10 && (
              <Alert variant="warning" className="mb-3">
                휴대폰 번호를 10자리 이상 입력해주세요.
              </Alert>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PlayerRegistrationPage; 