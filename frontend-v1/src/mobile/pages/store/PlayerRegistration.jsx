import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Form, Spinner, Alert, Table, Container, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import MobileHeader from '../../components/MobileHeader';
import QRScanner from '../../components/QRScanner';

/**
 * 로컬 axios 인스턴스 생성 및 인터셉터 설정
 * 모든 API 요청에 공통으로 적용될 설정입니다.
 */
const api = axios.create({
  baseURL: '/api/v1'
});

/**
 * 요청 인터셉터 설정
 * 모든 HTTP 요청이 발생하기 전에 실행됩니다.
 * 토큰을 헤더에 추가하고 디버깅을 위한 로그를 출력합니다.
 */
api.interceptors.request.use(
  (config) => {
    // 토큰 가져오기 및 로깅
    const token = localStorage.getItem('asl_holdem_access_token');
    console.log('API 요청 시 사용되는 토큰:', token ? `${token.substring(0, 15)}...` : '없음');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('인증 토큰이 없습니다. 로그인이 필요할 수 있습니다.');
    }

    console.log(`API 요청: ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 설정
 * 모든 HTTP 응답이 도착한 후에 실행됩니다.
 * 응답 데이터를 로깅하고 오류를 처리합니다.
 */
api.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버 응답이 있는 오류
      console.error(`API 응답 오류 (${error.response.status}):`, error.response.data);

      // 401 오류 처리
      if (error.response.status === 401) {
        console.warn('인증 오류가 발생했습니다. 다시 로그인이 필요합니다.');
        // 선택적: 로그인 페이지로 리디렉션
        // window.location.href = '/mobile/login';
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답이 없는 오류
      console.error('API 요청에 대한 응답이 없습니다:', error.request);
    } else {
      // 요청 설정 중 발생한 오류
      console.error('API 요청 설정 오류:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * 선수회원 참가 컴포넌트
 * 매장관리자가 선수를 등록하고 토너먼트에 매핑할 수 있는 페이지입니다.
 */
const PlayerRegistration = () => {
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [playerData, setPlayerData] = useState({
    lastname: '',
    firstname: '',
    email: '',
    phone: '',
    birth_date: '',
    gender_digit: ''
  });
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // 새로 추가된 상태들
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [phoneSearched, setPhoneSearched] = useState(false);
  
  // 토너먼트 필터 관련 상태 추가
  const [tournamentFilter, setTournamentFilter] = useState('store'); // 'store', 'all', 'today'
  const [allTournaments, setAllTournaments] = useState([]); // 전체 토너먼트 목록
  const [storeTournaments, setStoreTournaments] = useState([]); // 매장 배포 토너먼트 목록
  
  const navigate = useNavigate();

  /**
   * 초기 데이터 로드
   * 컴포넌트가 마운트될 때 매장관리자의 토너먼트 목록을 가져옵니다.
   */
  useEffect(() => {
    fetchTournaments();
  }, []);



  /**
   * 매장관리자의 토너먼트 목록 가져오기
   * 현재 로그인한 매장관리자의 매장에 할당된 토너먼트 목록을 조회합니다.
   */
  const fetchTournaments = async () => {
    setLoading(true);
    try {
      // 매장 배포 토너먼트 목록 가져오기
      const storeResponse = await api.get('/store/tournaments/');
      setStoreTournaments(storeResponse.data);
      
      // 전체 토너먼트 목록 가져오기
      try {
        const allResponse = await api.get('/tournaments/all_info/');
        setAllTournaments(allResponse.data);
      } catch (allErr) {
        console.warn('전체 토너먼트 목록 로드 실패:', allErr);
        setAllTournaments(storeResponse.data); // 실패 시 매장 토너먼트로 대체
      }
      
      // 초기 필터에 따른 토너먼트 설정
      updateTournamentsByFilter('store', storeResponse.data);
      
    } catch (err) {
      console.error('토너먼트 목록 로드 오류:', err);
      setError('토너먼트 목록을 불러오는데 실패했습니다.');
      // 에러 발생 시 빈 배열로 초기화
      setStoreTournaments([]);
      setAllTournaments([]);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터에 따른 토너먼트 목록 업데이트
   * @param {string} filterType - 필터 타입 ('store', 'all', 'today')
   * @param {Array} storeData - 매장 토너먼트 데이터 (선택사항)
   */
  const updateTournamentsByFilter = (filterType, storeData = null) => {
    let filteredTournaments = [];
    const sourceStoreTournaments = storeData || storeTournaments;
    
    try {
      switch (filterType) {
        case 'store':
          // 본사로부터 해당 매장으로 배포된 토너먼트 리스트
          filteredTournaments = sourceStoreTournaments;
          break;
        case 'all':
          // 전체 토너먼트 리스트
          filteredTournaments = allTournaments;
          break;
        case 'today':
          // 당일 매장에서 개최되는 토너먼트 리스트
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
          
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
      if (selectedTournament && !filteredTournaments.find(t => t.id.toString() === selectedTournament.toString())) {
        setSelectedTournament('');
      }
      
      // 필터된 목록이 있고 선택된 토너먼트가 없으면 첫 번째 토너먼트 선택
      if (filteredTournaments.length > 0 && !selectedTournament) {
        setSelectedTournament(filteredTournaments[0].id);
      }
    } catch (err) {
      console.error('토너먼트 필터링 오류:', err);
      setError('토너먼트 목록 필터링 중 오류가 발생했습니다.');
      setTournaments([]);
    }
  };

  /**
   * 토너먼트 필터 변경 핸들러
   * @param {string} filterType - 필터 타입
   */
  const handleFilterChange = (filterType) => {
    setTournamentFilter(filterType);
    updateTournamentsByFilter(filterType);
  };



  /**
   * 토너먼트 참가 여부 확인
   * @param {string} phone - 휴대폰 번호
   * @param {string} tournamentId - 토너먼트 ID
   */
  const checkTournamentParticipation = async (phone, tournamentId) => {
    if (!phone || !tournamentId) return;
    
    try {
      console.log(`토너먼트 참가 여부 확인 시작: phone=${phone}, tournamentId=${tournamentId}`);
      
      // SEAT권 정보 조회
      const ticketResponse = await api.get('/store/user-tickets/', {
        params: { 
          phone_number: phone,
          tournament_id: tournamentId
        }
      });
      
      console.log('SEAT권 정보 조회 결과:', ticketResponse.data);
      
      // 참가 여부 확인을 위해 토너먼트 참가자 목록 조회
      let participationInfo = { is_registered: false, registration_info: null };
      
      try {
        // 토너먼트 참가자 목록에서 해당 사용자 찾기
        const participantsResponse = await api.get(`/tournaments/${tournamentId}/participants/`);
        console.log(`토너먼트 ${tournamentId} 참가자 목록:`, participantsResponse.data);
        
        // 휴대폰 번호로 참가 여부 확인
        const isRegistered = participantsResponse.data.some(participant => {
          const participantPhone = participant.phone || participant.user_phone;
          return participantPhone === phone;
        });
        
        if (isRegistered) {
          const registrationInfo = participantsResponse.data.find(participant => {
            const participantPhone = participant.phone || participant.user_phone;
            return participantPhone === phone;
          });
          
          participationInfo = {
            is_registered: true,
            registration_info: registrationInfo
          };
          
          console.log(`참가 확인됨:`, registrationInfo);
        } else {
          console.log(`참가하지 않음: 전체 ${participantsResponse.data.length}명 중 해당 번호 없음`);
        }
        
      } catch (participantsErr) {
        console.warn('토너먼트 참가자 목록 조회 실패:', participantsErr);
        
        // 대체 방법: 매장별 참가자 목록 확인 (아직 구현되지 않은 API)
        console.log('매장별 참가자 목록 확인은 아직 구현되지 않음');
      }
      
      setFoundUser(prev => ({
        ...prev,
        ticketInfo: ticketResponse.data,
        participationInfo: participationInfo
      }));
      
    } catch (err) {
      console.error('토너먼트 정보 조회 실패:', err);
      
      // 에러 발생 시에도 기본 SEAT권 정보는 유지하되, 참가 정보는 null로 설정
      try {
        const ticketResponse = await api.get('/store/user-tickets/', {
          params: { 
            phone_number: phone,
            tournament_id: tournamentId
          }
        });
        
        console.log('에러 발생 시 SEAT권 정보 조회 결과:', ticketResponse.data);
        
        setFoundUser(prev => ({
          ...prev,
          ticketInfo: ticketResponse.data,
          participationInfo: null // 확인 불가 상태
        }));
      } catch (ticketErr) {
        console.error('SEAT권 정보 조회도 실패:', ticketErr);
        setFoundUser(prev => ({
          ...prev,
          ticketInfo: null,
          participationInfo: null
        }));
      }
    }
  };

  /**
   * 휴대폰 번호로 사용자 검색
   * @param {string} phone - 검색할 휴대폰 번호
   */
  const searchUserByPhone = async (phone) => {
    if (!phone || phone.length < 10) return;
    
    setPhoneSearchLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/store/search-user/', {
        params: { phone }
      });
      
      if (response.data.found) {
        console.log('API 응답에서 받은 사용자 정보:', response.data.user);
        console.log('닉네임 필드 확인:', {
          nickname: response.data.user.nickname,
          username: response.data.user.username,
          last_name: response.data.user.last_name,
          first_name: response.data.user.first_name
        });
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
      // 404 에러는 사용자가 없다는 정상적인 응답이므로 에러로 처리하지 않음
      if (err.response?.status === 404) {
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
        setPhoneSearched(true);
      } else {
        console.error('사용자 검색 오류:', err);
        setError('사용자 검색 중 오류가 발생했습니다.');
        setFoundUser(null);
        setIsNewUser(false);
        setPhoneSearched(false);
      }
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
   * 사용자 입력에 따라 폼 데이터를 업데이트합니다.
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
      setPlayerData((prev) => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }
    
    // 성별구분 필드는 1-2 숫자만 허용 (남자: 1, 여자: 2)
    if (name === 'gender_digit') {
      const numericValue = value.replace(/[^1-2]/g, '');
      setPlayerData((prev) => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }
    
    setPlayerData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * 토너먼트 선택 핸들러
   * 토너먼트 선택 드롭다운에서 값이 변경될 때 호출됩니다.
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
   * QR 스캔 시작 핸들러
   * QR 스캔 버튼을 눌렀을 때 호출됩니다.
   */
  const handleStartScan = () => {
    if (!selectedTournament) {
      setError('먼저 토너먼트를 선택해주세요.');
      return;
    }
    
    setScanResult(null);
    setError(null);
    setShowQRScanner(true);
  };

  /**
   * QR 스캐너 오류 처리
   * @param {Error} error - 스캔 오류
   */
  const handleScanError = (error) => {
    console.error('QR 스캔 오류:', error);
    setError('QR 스캔 중 오류가 발생했습니다. 카메라 권한을 확인해주세요.');
    setShowQRScanner(false);
  };

  /**
   * QR 코드 스캔 처리
   * @param {string} qrData - 스캔된 QR 코드 데이터
   */
  const handleQRScan = async (qrData) => {
    try {
      setLoading(true);
      setError(null);
      
      // QR 코드 스캔 API 호출
      const response = await api.post('/user/scan-qr-code/', {
        qr_data: qrData
      });
      
      if (response.data.success) {
        const userInfo = response.data.user_info;
        
        setScanResult(userInfo);
        setFoundUser(userInfo);
        setIsNewUser(false);
        setPlayerData({
          lastname: userInfo.last_name || userInfo.lastname || '',
          firstname: userInfo.first_name || userInfo.firstname || '',
          email: userInfo.email,
          phone: userInfo.phone,
          birth_date: userInfo.birth_date || '',
          gender_digit: userInfo.gender_digit || ''
        });
        setPhoneSearched(true);
        
        // 선택된 토너먼트가 있으면 해당 토너먼트의 SEAT권 현황과 참가 여부도 조회
        if (selectedTournament) {
          await checkTournamentParticipation(userInfo.phone, selectedTournament);
        }
        
        // QR 스캔 성공 후 자동으로 토너먼트 참가 처리
        if (selectedTournament) {
          await handleAutoRegister(userInfo);
        }
        
      } else {
        setError(response.data.error || 'QR 코드 스캔에 실패했습니다.');
      }
    } catch (err) {
      console.error('QR 스캔 오류:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('QR 코드 스캔 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      setShowQRScanner(false);
    }
  };

  /**
   * QR 스캔 후 자동 참가 처리
   * @param {Object} userInfo - 스캔된 사용자 정보
   */
  const handleAutoRegister = async (userInfo) => {
    try {
      const requestData = {
        tournament_id: selectedTournament,
        user_id: userInfo.id,
        phone_number: userInfo.phone
      };

      console.log('QR 스캔 후 자동 참가 요청:', requestData);

      const response = await api.post('/store/register-player/', requestData);
      
      if (response.data.success) {
                setSuccess(true);
        
        // 성공 메시지 표시
                        const fullName = (userInfo.last_name || userInfo.lastname || '') + (userInfo.first_name || userInfo.firstname || '');
                        const nickname = userInfo.nickname ? `(${userInfo.nickname})` : '';
                        const displayName = fullName ? fullName + nickname : userInfo.username || userInfo.phone;
                        alert(`${displayName}님이 토너먼트에 성공적으로 참가되었습니다!`);
      }
    } catch (err) {
      console.error('자동 참가 처리 오류:', err);
      if (err.response?.data?.error) {
        setError(`자동 참가 실패: ${err.response.data.error}`);
      } else {
        setError('자동 참가 처리 중 오류가 발생했습니다.');
      }
    }
  };

  /**
   * 폼 제출 핸들러
   * 선수 참가 폼을 제출할 때 호출됩니다.
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
        setLoading(false);
        return;
      }
      
      if (!playerData.phone) {
        setError('휴대폰 번호를 입력해주세요.');
        setLoading(false);
        return;
      }
      
      // 신규 사용자인 경우 추가 정보 검증
      if (isNewUser && (!playerData.lastname || !playerData.firstname || !playerData.email)) {
        setError('신규 사용자는 성, 이름과 이메일을 입력해주세요.');
        setLoading(false);
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

      console.log('선수 참가 요청 데이터:', requestData);

      const response = await api.post('/store/register-player/', requestData);
      
      if (response.data.success) {
        setSuccess(true);
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
        setScanResult(null);
      }
    } catch (err) {
      console.error('선수 참가 오류:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('선수 참가 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="asl-mobile-container">
      {/* MobileHeader 컴포넌트 사용 */}
      <MobileHeader title="선수회원 참가" backButton={true} />
      
      <Container className="asl-mobile-content">
        {/* QR 스캔 영역 */}
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>QR 코드 스캔</Card.Title>
            <Card.Text>
              사용자의 QR 코드를 스캔하여 토너먼트에 참가하세요.
            </Card.Text>
            
            <Button 
              variant="primary" 
              onClick={handleStartScan} 
              className="w-100"
              disabled={loading || !selectedTournament}>
              <i className="fas fa-qrcode me-2"></i>
              QR 코드 스캔 시작
            </Button>
            
            {!selectedTournament && (
              <Form.Text className="text-warning mt-2">
                <i className="fas fa-exclamation-triangle me-1"></i>
                먼저 토너먼트를 선택해주세요.
              </Form.Text>
            )}
            
            {scanResult && (
              <Alert variant="success" className="mt-3 mb-0">
                <strong>스캔 완료!</strong> 사용자 정보가 자동으로 입력되었습니다.
              </Alert>
            )}
          </Card.Body>
        </Card>

        {/* 선수 참가 폼 */}
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>선수회원 참가</Card.Title>
            
            {success && (
              <Alert variant="success" className="mb-3">
                선수회원이 성공적으로 참가되었습니다.
              </Alert>
            )}

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
              {/* 휴대폰 번호 입력 필드 - 가장 먼저 배치 */}
              <Form.Group className="mb-3">
                <Form.Label>
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
                    <i className="fas fa-user-check me-2"></i>
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
                            <i className="fas fa-ticket-alt me-1"></i>
                            SEAT권 현황
                          </small>
                          <div className="d-flex gap-2">
                            <Badge bg="success" className="d-flex align-items-center">
                              <i className="fas fa-check-circle me-1" style={{fontSize: '10px'}}></i>
                              사용가능: {foundUser.ticketInfo?.active_tickets || 0}개
                            </Badge>
                            <Badge bg="secondary" className="d-flex align-items-center">
                              <i className="fas fa-times-circle me-1" style={{fontSize: '10px'}}></i>
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
                                    <i className="fas fa-spinner fa-spin text-muted me-2"></i>
                                    <small className="text-muted fw-bold">
                                      토너먼트 참가 여부 확인 중...
                                    </small>
                                  </>
                                ) : foundUser.participationInfo?.is_registered ? (
                                  <>
                                    <i className="fas fa-user-check text-warning me-2"></i>
                                    <div className="flex-grow-1">
                                      <small className="text-warning fw-bold">
                                        이미 이 토너먼트에 참가되어 있습니다 (중복 참가 가능)
                                      </small>
                                      {foundUser.participationInfo.registration_info && (
                                        <div className="mt-1">
                                          <small className="text-muted">
                                            최근 참가일시: {new Date(foundUser.participationInfo.registration_info.created_at).toLocaleString()}
                                          </small>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (() => {
                                  const selectedTournamentData = tournaments.find(t => t.id.toString() === selectedTournament.toString());
                                  const requiredTickets = selectedTournamentData?.buy_in || 1;
                                  const availableTickets = foundUser.ticketInfo?.active_tickets || 0;
                                  const canParticipate = availableTickets >= requiredTickets;
                                  
                                  return canParticipate ? (
                                    <>
                                      <i className="fas fa-user-plus text-info me-2"></i>
                                      <small className="text-info fw-bold">
                                        이 토너먼트에 참가 가능합니다
                                      </small>
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-times-circle text-danger me-2"></i>
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
                          
                          <div className="mt-1">
                            {(() => {
                              if (foundUser.participationInfo === null) {
                                return (
                                  <small className="text-muted">
                                    <i className="fas fa-spinner fa-spin me-1"></i>
                                    참가 여부 확인 중...
                                  </small>
                                );
                              }
                              
                              const selectedTournamentData = tournaments.find(t => t.id.toString() === selectedTournament.toString());
                              const requiredTickets = selectedTournamentData?.buy_in || 1;
                              const availableTickets = foundUser.ticketInfo?.active_tickets || 0;
                              const canParticipate = availableTickets >= requiredTickets;
                              
                              if (!canParticipate) {
                                return (
                                  <small className="text-danger">
                                    <i className="fas fa-times me-1"></i>
                                    SEAT권 부족으로 참가할 수 없습니다.
                                  </small>
                                );
                              }
                              
                              return (
                                <small className="text-success">
                                  <i className="fas fa-check me-1"></i>
                                  토너먼트 참가 가능합니다.
                                  {foundUser.participationInfo?.is_registered && (
                                    <span className="text-info"> (중복 참가 허용)</span>
                                  )}
                                </small>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}

              {phoneSearched && isNewUser && (
                <Alert variant="info" className="mb-3">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-user-plus me-2"></i>
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
                    <i className="fas fa-store me-1"></i>
                    매장 배포
                    {storeTournaments.length > 0 && (
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
                    <i className="fas fa-globe me-1"></i>
                    전체
                    {allTournaments.length > 0 && (
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
                    <i className="fas fa-calendar-day me-1"></i>
                    당일
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const todayCount = storeTournaments.filter(tournament => {
                        const tournamentDate = new Date(tournament.start_time).toISOString().split('T')[0];
                        return tournamentDate === today;
                      }).length;
                      return todayCount > 0 && (
                        <Badge bg="light" text="dark" className="ms-1">
                          {todayCount}
                        </Badge>
                      );
                    })()}
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  {tournamentFilter === 'store' && '본사로부터 이 매장에 배포된 토너먼트 목록입니다.'}
                  {tournamentFilter === 'all' && '시스템의 모든 토너먼트 목록입니다.'}
                  {tournamentFilter === 'today' && '오늘 이 매장에서 개최되는 토너먼트 목록입니다.'}
                </Form.Text>
              </Form.Group>

              {/* 토너먼트 선택 드롭다운 */}
              <Form.Group className="mb-3">
                <Form.Label>토너먼트 선택 <span className="text-danger">*</span></Form.Label>
                <Form.Select name="tournament" value={selectedTournament} onChange={handleTournamentChange} required>
                  <option value="">토너먼트를 선택하세요</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name} - Buy-in: {tournament.buy_in || 1}개 ({new Date(tournament.start_time).toLocaleString()})
                    </option>
                  ))}
                </Form.Select>
                {tournaments.length === 0 && (
                  <Form.Text className="text-warning">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    선택한 필터에 해당하는 토너먼트가 없습니다.
                  </Form.Text>
                )}
              </Form.Group>

              {/* 선택된 토너먼트 정보 표시 */}
              {selectedTournament && (() => {
                const selectedTournamentData = tournaments.find(t => t.id.toString() === selectedTournament.toString());
                return selectedTournamentData && (
                  <Alert variant="info" className="mb-3">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-info-circle me-2"></i>
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
                      <i className="fas fa-user me-2"></i>
                      기존 회원 정보
                    </Card.Title>
                    
                                         <Row className="mb-2">
                       <Col xs={3}><strong>이름:</strong></Col>
                       <Col xs={9}>
                         {foundUser.last_name && foundUser.first_name ? 
                           `${foundUser.last_name}${foundUser.first_name}` + 
                           (foundUser.nickname ? `(${foundUser.nickname})` : '') : 
                           foundUser.username || '정보 없음'
                         }
                       </Col>
                     </Row>
                    
                    <Row className="mb-2">
                      <Col xs={3}><strong>주민번호:</strong></Col>
                      <Col xs={9}>
                        {foundUser.birth_date && foundUser.gender_digit ? 
                          `${foundUser.birth_date}-${foundUser.gender_digit}xxxxxx` : 
                          '정보 없음'
                        }
                      </Col>
                    </Row>
                    
                    <Row className="mb-2">
                      <Col xs={3}><strong>이메일:</strong></Col>
                      <Col xs={9}>{foundUser.email || '정보 없음'}</Col>
                    </Row>
                    
                    <Row>
                      <Col xs={3}><strong>전화번호:</strong></Col>
                      <Col xs={9}>{foundUser.phone || '정보 없음'}</Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* 신규 사용자 입력 필드들 */}
              {isNewUser && (
                <>
                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          성 <span className="text-danger">*</span>
                        </Form.Label>
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
                    <Col xs={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          이름 <span className="text-danger">*</span>
                        </Form.Label>
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
                    <Form.Label>
                      주민번호 앞 7자리 <span className="text-danger">*</span>
                    </Form.Label>
                    <Row>
                      <Col xs={7}>
                        <Form.Control
                          type="text"
                          name="birth_date"
                          value={playerData.birth_date}
                          onChange={handleChange}
                          placeholder="생년월일 6자리 (예: 901225)"
                          maxLength="6"
                          pattern="[0-9]{6}"
                          required
                        />
                      </Col>
                      <Col xs={1} className="d-flex align-items-center justify-content-center">
                        <span>-</span>
                      </Col>
                      <Col xs={4}>
                        <Form.Control
                          type="text"
                          name="gender_digit"
                          value={playerData.gender_digit}
                          onChange={handleChange}
                          placeholder="성별구분 1자리"
                          maxLength="1"
                          pattern="[1-2]"
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
                    const selectedTournamentData = tournaments.find(t => t.id.toString() === selectedTournament.toString());
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
                            <i className="fas fa-times me-2"></i>
                            SEAT권 부족 (참가 불가)
                          </>
                        ) : (
                          <>
                            <i className="fas fa-user-plus me-2"></i>
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
                  <i className="fas fa-info-circle me-2"></i>
                  휴대폰 번호를 10자리 이상 입력해주세요.
                </Alert>
              )}
            </Form>
          </Card.Body>
        </Card>


      </Container>

      {/* QR 스캐너 모달 */}
      <QRScanner
        show={showQRScanner}
        onHide={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        onError={handleScanError}
      />
    </div>
  );
};

export default PlayerRegistration;
