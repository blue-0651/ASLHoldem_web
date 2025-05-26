import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Modal, Spinner, Alert, Table } from 'react-bootstrap';
import { tournamentAPI, storeAPI, dashboardAPI } from '../../utils/api';

// third party
import DataTable from 'react-data-table-component';

const TournamentManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set()); // 확장된 행 상태 관리
  
  // 토너먼트별 상세 데이터 캐시
  const [tournamentDetailsCache, setTournamentDetailsCache] = useState(new Map());
  const [loadingDetails, setLoadingDetails] = useState(new Set());
  
  // API 호출 중복 방지를 위한 ref
  const hasFetchedData = useRef(false);
  
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
    tournament: 'all',
    status: 'all'
  });
  
  // 페이지 로드 시 토너먼트 목록 가져오기
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchTournaments();
      fetchStores();
    }
  }, []);
  
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      
      // getAllTournamentInfo로 변경 - 더 풍부한 데이터 제공
      const response = await tournamentAPI.getAllTournamentInfo();
      setTournaments(response.data); // .results 제거 - 직접 배열 구조
      
      setLoading(false);
      
    } catch (err) {
      setError('토너먼트 목록을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };
  
  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      
      // 실제 API 연동
      const response = await storeAPI.getAllStores();
      setStores(response.data);
      setLoadingStores(false);
      
    } catch (err) {
      setLoadingStores(false);
    }
  };
  
  // 토너먼트 상세 정보 가져오기
  const fetchTournamentDetails = async (tournamentId) => {
    // 이미 로딩 중이거나 캐시에 있으면 스킵
    if (loadingDetails.has(tournamentId) || tournamentDetailsCache.has(tournamentId)) {
      return;
    }

    try {
      setLoadingDetails(prev => new Set([...prev, tournamentId]));
      
      const response = await dashboardAPI.getPlayerMapping(tournamentId);
      
      // 캐시에 저장
      setTournamentDetailsCache(prev => new Map([...prev, [tournamentId, response.data]]));
      
    } catch (err) {
      setError(`토너먼트 상세 정보를 불러오는 중 오류가 발생했습니다.`);
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(tournamentId);
        return newSet;
      });
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
  
  // 토너먼트 필터 변경 핸들러
  const handleFilterTournamentChange = (e) => {
    const { value } = e.target;
    setFilters({
      ...filters,
      tournament: value
    });
  };
  
  // 상태 필터 변경 핸들러
  const handleFilterStateChange = (e) => {
    const { value } = e.target;
    setFilters({
      ...filters,
      status: value
    });
  };
  
  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      tournament: 'all',
      status: 'all'
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

  // 필터링된 토너먼트 목록 계산
  const getFilteredTournaments = () => {
    // tournaments가 배열이 아닌 경우 빈 배열 반환
    if (!Array.isArray(tournaments)) {
      return [];
    }
    
    const filtered = tournaments.filter(tournament => {
      // 토너먼트 필터 - "all"이 아닌 경우에만 필터링 적용
      if (filters.tournament !== 'all') {
        if (parseInt(filters.tournament) !== tournament.id) {
          return false;
        }
      }
      
      // 상태 필터 - "all"이 아닌 경우에만 필터링 적용
      if (filters.status !== 'all') {
        if (tournament.status !== filters.status) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered;
  };

  // 토너먼트 테이블 컬럼 정의
  const tournamentColumns = useMemo(() => [
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>대회명</span>,
      selector: (row) => row.description || row.name,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>SEAT권 총 수량</span>,
      selector: (row) => row.ticket_quantity,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>매장 수량</span>,
      selector: (row) => row.remaining_tickets || 0,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>선수 수량</span>,
      selector: (row) => row.participant_count || 0,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>시작시간</span>,
      selector: (row) => formatDate(row.start_time),
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    }
  ], [expandedRows]);

  // 행 확장/축소 핸들러
  const handleRowExpandToggled = (expanded, row) => {
    const newExpandedRows = new Set(expandedRows);
    if (expanded) {
      newExpandedRows.add(row.id);
      // 확장 시 상세 정보 가져오기
      fetchTournamentDetails(row.id);
    } else {
      newExpandedRows.delete(row.id);
    }
    setExpandedRows(newExpandedRows);
  };

  // 확장된 행에 표시될 실제 데이터 컴포넌트
  const ExpandedTournamentComponent = ({ data }) => {
    const tournamentDetails = tournamentDetailsCache.get(data.id);
    const isLoadingDetails = loadingDetails.has(data.id);

    if (isLoadingDetails) {
      return (
        <div className="p-4 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">토너먼트 상세 정보를 불러오는 중입니다...</p>
        </div>
      );
    }

    if (!tournamentDetails) {
      return (
        <div className="p-4 text-center">
          <Alert variant="warning">
            토너먼트 상세 정보를 불러올 수 없습니다.
          </Alert>
        </div>
      );
    }

    return (
      <div className="p-4 border border-danger rounded" style={{ backgroundColor: '#dc3545' }}>
        <div className="row">
          {/* 매장별 현황 */}
          <div className="col-md-6">
            <div className="border border-light rounded p-3 mb-3" style={{ backgroundColor: '#b02a37' }}>
              <h4 className="mb-3 bg-dark text-white p-3 rounded border border-light text-center" style={{ fontWeight: 'bold' }}>매장별 현황</h4>
              <Table bordered size="sm" className="mb-0" style={{ backgroundColor: '#ffffff' }}>
                <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                  <tr>
                    <th className="border border-dark text-white">매장명</th>
                    <th className="border border-dark text-white">SEAT권 수량</th>
                    <th className="border border-dark text-white">SEAT권 배포 수량</th>
                    <th className="border border-dark text-white">현재 보유 수량</th>
                  </tr>
                </thead>
                <tbody>
                  {tournamentDetails.매장별_현황?.length > 0 ? (
                    tournamentDetails.매장별_현황.map((store, index) => (
                      <tr key={index}>
                        <td className="border border-secondary">{store.매장명}</td>
                        <td className="text-center border border-secondary">{store.좌석권_수량 || 0}</td>
                        <td className="text-center border border-secondary">{store.배포된_수량 || 0}</td>
                        <td className="text-center border border-secondary">{(store.좌석권_수량 || 0) - (store.배포된_수량 || 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center border border-secondary">매장 데이터가 없습니다.</td>
                    </tr>
                  )}
                  {/* 총계 행 */}
                  <tr style={{ backgroundColor: '#ffc107', color: '#000' }}>
                    <td className="border border-warning"><strong>총계</strong></td>
                    <td className="text-center border border-warning"><strong>{tournamentDetails.총_좌석권_수량 || 0}</strong></td>
                    <td className="text-center border border-warning"><strong>{tournamentDetails.배포된_좌석권_수량 || 0}</strong></td>
                    <td className="text-center border border-warning"><strong>{(tournamentDetails.총_좌석권_수량 || 0) - (tournamentDetails.배포된_좌석권_수량 || 0)}</strong></td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </div>

          {/* 선수별 현황 */}
          <div className="col-md-6">
            <div className="border border-light rounded p-3 mb-3" style={{ backgroundColor: '#b02a37' }}>
              <h4 className="mb-3 bg-dark text-white p-3 rounded border border-light text-center" style={{ fontWeight: 'bold' }}>선수별 현황</h4>
              <Table bordered size="sm" className="mb-0" style={{ backgroundColor: '#ffffff' }}>
                <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                  <tr>
                    <th className="border border-dark text-white">선수</th>
                    <th className="border border-dark text-white">SEAT권 보유 수량</th>
                    <th className="border border-dark text-white">획득매장</th>
                    <th className="border border-dark text-white">SEAT권 사용 정보</th>
                  </tr>
                </thead>
                <tbody>
                  {tournamentDetails.선수별_현황?.length > 0 ? (
                    tournamentDetails.선수별_현황.map((player, index) => (
                      <tr key={index}>
                        <td className="border border-secondary">{player.선수명}</td>
                        <td className="text-center border border-secondary">{player.좌석권_보유 === 'Y' ? '1' : '0'}</td>
                        <td className="border border-secondary">{player.매장명}</td>
                        <td className="border border-secondary">
                          <Button variant="outline-primary" size="sm">보기</Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center border border-secondary">선수 데이터가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </div>

        {/* 요약 정보 */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="text-white p-3 rounded border border-light" style={{ backgroundColor: '#721c24' }}>
              <div className="row text-center">
                <div className="col-md-3 border-end border-light">
                  <h6 className="text-white">총 SEAT권</h6>
                  <h4 className="text-white">{tournamentDetails.총_좌석권_수량 || 0}</h4>
                </div>
                <div className="col-md-3 border-end border-light">
                  <h6 className="text-white">배포된 SEAT권</h6>
                  <h4 className="text-white">{tournamentDetails.배포된_좌석권_수량 || 0}</h4>
                </div>
                <div className="col-md-3 border-end border-light">
                  <h6 className="text-white">사용된 SEAT권</h6>
                  <h4 className="text-white">{tournamentDetails.사용된_좌석권_수량 || 0}</h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-white">참가 선수 수</h6>
                  <h4 className="text-white">{tournamentDetails.선수별_현황?.length || 0}명</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>토너먼트</Form.Label>
                <Form.Select 
                  name="tournament" 
                  value={filters.tournament} 
                  onChange={handleFilterTournamentChange}
                >
                  <option value="all">모든 토너먼트</option>
                  {Array.isArray(tournaments) && tournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name || `토너먼트 ${tournament.id}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>상태</Form.Label>
                <Form.Select 
                  name="status" 
                  value={filters.status} 
                  onChange={handleFilterStateChange}
                >
                  <option value="all">모든 상태</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 토너먼트 목록 */}
      <Card>
        <Card.Header>
          <h5>토너먼트 목록</h5>
          <small>정렬 가능하고 확장 가능한 토너먼트 테이블입니다. 행을 클릭하면 상세 정보를 볼 수 있습니다.</small>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">데이터를 불러오는 중입니다...</p>
            </div>
          ) : (
            <DataTable 
              columns={tournamentColumns} 
              data={getFilteredTournaments()} 
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
              expandableRows
              expandableRowsComponent={ExpandedTournamentComponent}
              onRowExpandToggled={handleRowExpandToggled}
              expandableRowsComponentProps={{ expandedRows }}
              conditionalRowStyles={[
                {
                  when: row => expandedRows.has(row.id),
                  style: {
                    backgroundColor: '#e3f2fd',
                    borderLeft: '4px solid #2196f3',
                    fontWeight: 'bold'
                  }
                }
              ]}
              noDataComponent={
                <div className="text-center p-4">
                  {tournaments.length === 0 ? '토너먼트 데이터가 없습니다.' : '필터 조건에 맞는 토너먼트가 없습니다.'}
                </div>
              }
              highlightOnHover
              striped
            />
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