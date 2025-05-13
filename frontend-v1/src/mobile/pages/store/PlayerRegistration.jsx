import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Form, Spinner, Alert, Table } from 'react-bootstrap';
import axios from 'axios';
import '../../styles/MobileStyles.css';

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
 * 선수회원 등록 컴포넌트
 * 매장관리자가 선수를 등록하고 토너먼트에 매핑할 수 있는 페이지입니다.
 */
const PlayerRegistration = () => {
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [playerData, setPlayerData] = useState({
    username: '',
    email: '',
    phone: '',
    nickname: ''
  });
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [playerMappingData, setPlayerMappingData] = useState(null);
  const navigate = useNavigate();

  /**
   * 초기 데이터 로드
   * 컴포넌트가 마운트될 때 매장관리자의 토너먼트 목록을 가져옵니다.
   */
  useEffect(() => {
    fetchTournaments();
  }, []);

  /**
   * 토너먼트 선택 시 매핑 정보 로드
   * 토너먼트를 선택하면 해당 토너먼트의 선수 매핑 정보를 가져옵니다.
   */
  useEffect(() => {
    if (selectedTournament) {
      fetchPlayerMapping(selectedTournament);
    }
  }, [selectedTournament]);

  /**
   * 매장관리자의 토너먼트 목록 가져오기
   * 현재 로그인한 매장관리자의 매장에 할당된 토너먼트 목록을 조회합니다.
   */
  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/store/tournaments/');
      setTournaments(response.data);
      if (response.data.length > 0) {
        setSelectedTournament(response.data[0].id);
      }
    } catch (err) {
      console.error('토너먼트 목록 로드 오류:', err);
      setError('토너먼트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 선수 매핑 정보 가져오기
   * 선택한 토너먼트의 선수 매핑 정보를 dashboard/player_mapping API를 통해 조회합니다.
   * @param {string} tournamentId - 토너먼트 ID
   */
  const fetchPlayerMapping = async (tournamentId) => {
    setLoading(true);
    try {
      const response = await api.get('/tournaments/dashboard/player_mapping/', {
        params: { tournament_id: tournamentId }
      });
      setPlayerMappingData(response.data);
    } catch (err) {
      console.error('선수 매핑 정보 로드 오류:', err);
      setError('선수 매핑 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 입력 필드 변경 핸들러
   * 사용자 입력에 따라 폼 데이터를 업데이트합니다.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlayerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * 토너먼트 선택 핸들러
   * 토너먼트 선택 드롭다운에서 값이 변경될 때 호출됩니다.
   */
  const handleTournamentChange = (e) => {
    setSelectedTournament(e.target.value);
  };

  /**
   * 폼 제출 핸들러
   * 선수 등록 폼을 제출할 때 호출됩니다.
   * 현재는 백엔드 API가 완전히 구현되지 않아 가상의 성공 응답을 시뮬레이션합니다.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 백엔드 API 연동 코드는 나중에 구현
      console.log('선수 등록 데이터:', {
        ...playerData,
        tournament_id: selectedTournament
      });
      
      // 가상의 성공 응답
      setTimeout(() => {
        setSuccess(true);
        setPlayerData({
          username: '',
          email: '',
          phone: '',
          nickname: ''
        });
        // 성공 후 다시 선수 매핑 정보 로드
        fetchPlayerMapping(selectedTournament);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('선수 등록 오류:', err);
      setError('선수 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      {/* 헤더 영역 */}
      <div className="mobile-header">
        <button 
          className="mobile-nav-button" 
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="mobile-header-title">선수회원 등록</h1>
        <div style={{ width: '24px' }}></div> {/* 균형을 위한 빈 공간 */}
      </div>
      
      {/* 선수 등록 폼 */}
      <Card className="mobile-card">
        <Card.Body>
          {success && (
            <Alert variant="success" className="mb-3">
              선수회원이 성공적으로 등록되었습니다.
            </Alert>
          )}
          
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            {/* 토너먼트 선택 드롭다운 */}
            <Form.Group className="mb-3">
              <Form.Label>토너먼트 선택</Form.Label>
              <Form.Select
                name="tournament"
                value={selectedTournament}
                onChange={handleTournamentChange}
                required
              >
                <option value="">토너먼트를 선택하세요</option>
                {tournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name} ({new Date(tournament.start_time).toLocaleString()})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {/* 선수 정보 입력 필드 */}
            <Form.Group className="mb-3">
              <Form.Label>이름</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={playerData.username}
                onChange={handleChange}
                placeholder="선수의 실명을 입력하세요"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>이메일</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={playerData.email}
                onChange={handleChange}
                placeholder="이메일 주소를 입력하세요"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>휴대폰 번호</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={playerData.phone}
                onChange={handleChange}
                placeholder="'-' 없이 입력하세요"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>닉네임</Form.Label>
              <Form.Control
                type="text"
                name="nickname"
                value={playerData.nickname}
                onChange={handleChange}
                placeholder="선수 닉네임을 입력하세요"
              />
            </Form.Group>
            
            {/* 제출 버튼 */}
            <div className="d-grid gap-2 mt-4">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                className="mobile-btn-primary"
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    처리 중...
                  </>
                ) : (
                  "선수회원 등록하기"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* 선수 매핑 정보 표시 */}
      {playerMappingData && (
        <Card className="mobile-card mt-3">
          <Card.Body>
            {/* 토너먼트 정보 */}
            <Card.Title>
              토너먼트: {playerMappingData['토너먼트명']}
            </Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              시작시간: {new Date(playerMappingData['토너먼트_시작시간']).toLocaleString()}
            </Card.Subtitle>
            <Card.Text>
              좌석권: {playerMappingData['배포된_좌석권_수량']} / {playerMappingData['총_좌석권_수량']}
            </Card.Text>
            
            {/* 선수별 현황 테이블 */}
            <h5 className="mt-4">선수별 현황</h5>
            {playerMappingData['선수별_현황'].length > 0 ? (
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>선수명</th>
                    <th>매장명</th>
                    <th>좌석권</th>
                  </tr>
                </thead>
                <tbody>
                  {playerMappingData['선수별_현황'].map((player, idx) => (
                    <tr key={idx}>
                      <td>{player['선수명']}</td>
                      <td>{player['매장명']}</td>
                      <td>{player['좌석권_보유']}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-center text-muted">등록된 선수가 없습니다.</p>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default PlayerRegistration; 