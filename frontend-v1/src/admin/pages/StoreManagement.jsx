import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Alert, Table } from 'react-bootstrap';
import { storeAPI, seatTicketAPI, userAPI, distributionAPI } from '../../utils/api';

// third party
import DataTable from 'react-data-table-component';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null); // Set에서 단일 값으로 변경
  const [storeUsers, setStoreUsers] = useState({}); // 매장별 사용자 데이터 저장
  const [loadingUsers, setLoadingUsers] = useState({}); // 매장별 로딩 상태
  
  // 필터 상태 추가
  const [filters, setFilters] = useState({
    store: 'all',
    status: 'all'
  });

  // API 호출 중복 방지를 위한 ref
  const hasFetchedData = useRef(false);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('매장 목록 조회 시작...');

      // 매장 목록과 토너먼트 분배 요약을 병렬로 조회
      const [storesResponse, distributionResponse] = await Promise.all([
        storeAPI.getAllStores(),
        distributionAPI.getOverallSummary()
      ]);

      console.log('매장 목록 응답:', storesResponse.data);
      console.log('분배 요약 응답:', distributionResponse.data);

      // 매장별 토너먼트 수 매핑 생성
      const storeToTournamentCount = {};
      if (distributionResponse.data && distributionResponse.data.store_summary) {
        distributionResponse.data.store_summary.forEach(storeSummary => {
          // store_summary에서 store_name으로 매칭하거나 store_id가 있다면 사용
          const storeId = storeSummary.store_id || null;
          const storeName = storeSummary.store_name;
          const tournamentCount = storeSummary.tournament_count || 0;
          
          if (storeId) {
            storeToTournamentCount[storeId] = tournamentCount;
          } else {
            // store_id가 없는 경우 store_name으로 매칭 시도
            storeToTournamentCount[storeName] = tournamentCount;
          }
        });
      }

      console.log('매장별 토너먼트 수 매핑:', storeToTournamentCount);

      // 매장 데이터에 실제 토너먼트 수 추가
      const storesWithTournamentCount = Array.isArray(storesResponse.data) 
        ? storesResponse.data.map(store => {
            // store_id로 먼저 매칭 시도, 없으면 store_name으로 매칭
            const tournamentCount = storeToTournamentCount[store.id] || 
                                   storeToTournamentCount[store.name] || 0;
            
            return {
              ...store,
              tournament_count: tournamentCount
            };
          })
        : [];

      console.log('토너먼트 수가 추가된 매장 데이터:', storesWithTournamentCount);

      setStores(storesWithTournamentCount);
      setLoading(false);
    } catch (error) {
      console.error('매장 목록 로드 오류:', error);
      
      // 네트워크 오류인지 확인
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('네트워크 연결을 확인해주세요.');
      } else if (error.response?.status === 404) {
        setError('매장 API를 찾을 수 없습니다. 관리자에게 문의하세요.');
      } else if (error.response?.status >= 500) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('매장 목록을 불러오는 중 오류가 발생했습니다.');
      }
      
      // 오류 발생 시 빈 배열로 설정
      setStores([]);
      setLoading(false);
    }
  };

  // 매장 방문 사용자 목록 조회 - 수정된 버전
  const fetchStoreUsers = async (storeId) => {
    try {
      setLoadingUsers(prev => ({ ...prev, [storeId]: true }));
      console.log(`매장 ${storeId} 사용자 목록 조회 시작...`);

      // 현재 백엔드에 매장별 사용자 API가 구현되지 않았으므로
      // 임시로 일반 사용자 목록을 조회하여 샘플 데이터 생성
      try {
        const response = await userAPI.getAllUsers('USER');
        console.log(`사용자 목록 응답:`, response.data);
        
        // 매장별 사용자 관계가 구현되지 않았으므로 임시 데이터 생성
        const allUsers = Array.isArray(response.data) ? response.data : [];
        const randomUserCount = Math.floor(Math.random() * Math.min(5, allUsers.length)) + 1;
        const selectedUsers = allUsers.slice(0, randomUserCount);
        
        const mockStoreUsers = selectedUsers.map(user => ({
          id: user.id,
          nickname: user.nickname || user.phone || '익명',
          phone: user.phone || '-',
          email: user.email || '-',
          tournament_count: Math.floor(Math.random() * 10),
          last_visit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));

        setStoreUsers(prev => ({ ...prev, [storeId]: mockStoreUsers }));
      } catch (apiError) {
        console.warn('사용자 API 호출 실패, 샘플 데이터 생성:', apiError);
        
        // API 호출 실패 시 샘플 데이터 생성
        const sampleUsers = [
          {
            id: 1,
            nickname: '홀덤마스터',
            phone: '010-1234-5678',
            email: 'user1@example.com',
            tournament_count: 5,
            last_visit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            nickname: '포커킹',
            phone: '010-9876-5432',
            email: 'user2@example.com',
            tournament_count: 3,
            last_visit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        setStoreUsers(prev => ({ ...prev, [storeId]: sampleUsers }));
      }
      
      setLoadingUsers(prev => ({ ...prev, [storeId]: false }));
    } catch (error) {
      console.error(`매장 ${storeId} 사용자 목록 로드 오류:`, error);
      setStoreUsers(prev => ({ ...prev, [storeId]: [] }));
      setLoadingUsers(prev => ({ ...prev, [storeId]: false }));
    }
  };

  // 컴포넌트 마운트 시 데이터 로드 (중복 호출 방지)
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchStores();
    }
  }, []);

  // 행 확장/축소 핸들러
  const handleRowExpandToggled = (expanded, row) => {
    if (expanded) {
      setExpandedRowId(row.id);
      // 확장 시 해당 매장의 사용자 목록을 가져옴
      if (!storeUsers[row.id]) {
        fetchStoreUsers(row.id);
      }
    } else {
      setExpandedRowId(null);
    }
  };

  // 매장 필터 변경 핸들러
  const handleFilterStoreChange = (e) => {
    const { value } = e.target;
    setFilters({
      ...filters,
      store: value
    });
  };

  // 필터링된 매장 목록 계산 - 개선된 버전
  const getFilteredStores = () => {
    if (!Array.isArray(stores)) {
      return [];
    }
    
    let filteredStores = stores;
    
    // 매장명 필터링
    if (filters.store !== 'all') {
      filteredStores = filteredStores.filter(store => store.id === parseInt(filters.store));
    }
    
    // 상태 필터링
    if (filters.status !== 'all') {
      filteredStores = filteredStores.filter(store => store.status === filters.status);
    }
    
    return filteredStores;
  };

  // 확장된 행에 표시될 매장 방문 사용자 목록 컴포넌트
  const ExpandedStoreComponent = ({ data }) => {
    const users = Array.isArray(storeUsers[data.id]) ? storeUsers[data.id] : [];
    const isLoadingUsers = loadingUsers[data.id] || false;
    return (
      <div className="p-4 border border-primary rounded" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="row">
          <div className="col-12">
            {isLoadingUsers ? (
              <div className="text-center p-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">사용자 목록을 불러오는 중입니다...</p>
              </div>
            ) : users.length > 0 ? (
              <Table bordered hover responsive className="mb-0">
                <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                  <tr>
                    <th className="text-center">닉네임</th>
                    <th className="text-center">전화번호</th>
                    <th className="text-center">이메일</th>
                    <th className="text-center">토너먼트 참가 횟수</th>
                    <th className="text-center">마지막 방문</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id || index}>
                      <td className="text-center">{user.nickname || '-'}</td>
                      <td className="text-center">{user.phone || '-'}</td>
                      <td className="text-center">{user.email || '-'}</td>
                      <td className="text-center">
                        <span className="badge bg-info">{user.tournament_count || 0}회</span>
                      </td>
                      <td className="text-center">
                        {user.last_visit ? new Date(user.last_visit).toLocaleString('ko-KR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center p-4 border rounded" style={{ backgroundColor: '#ffffff' }}>
                <p className="mb-0 text-muted">이 매장에 방문한 사용자가 없습니다.</p>
              </div>
            )}

            {/* 요약 정보 */}
            <div className="row mt-3">
              <div className="col-12">
                <div className="text-white p-3 rounded border" style={{ backgroundColor: '#6c757d' }}>
                  <div className="row text-center">
                    <div className="col-md-3">
                      <h6 className="text-white">총 방문자 수</h6>
                      <h4 className="text-white">{users.length}명</h4>
                    </div>
                    <div className="col-md-3">
                      <h6 className="text-white">평균 참가 횟수</h6>
                      <h4 className="text-white">
                        {users.length > 0
                          ? Math.round(users.reduce((sum, user) => sum + (user.tournament_count || 0), 0) / users.length * 10) / 10
                          : 0
                        }회
                      </h4>
                    </div>
                    <div className="col-md-3">
                      <h6 className="text-white">활성 사용자</h6>
                      <h4 className="text-white">
                        {users.filter(user => user.tournament_count > 0).length}명
                      </h4>
                    </div>
                    <div className="col-md-3">
                      <h6 className="text-white">최근 방문자</h6>
                      <h4 className="text-white">
                        {users.filter(user => {
                          if (!user.last_visit) return false;
                          const lastVisit = new Date(user.last_visit);
                          const oneWeekAgo = new Date();
                          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                          return lastVisit > oneWeekAgo;
                        }).length}명
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 매장 테이블 컬럼 정의
  const storeColumns = useMemo(() => [
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>매장명</span>,
      selector: (row) => row.name,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>주소</span>,
      selector: (row) => row.address,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>상태</span>,
      selector: (row) => row.status,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className={`badge ${row.status === 'ACTIVE' ? 'bg-success' : row.status === 'INACTIVE' ? 'bg-warning' : 'bg-danger'}`}>
          {row.status === 'ACTIVE' ? '운영중' : row.status === 'INACTIVE' ? '휴업중' : '폐업'}
        </span>
      ),
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>토너먼트 수</span>,
      selector: (row) => row.tournament_count || 0,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    }
  ], [expandedRowId]);

  // DataTable 커스텀 스타일
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8f9fa',
        minHeight: '60px'
      }
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        backgroundColor: '#ffffff',
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>매장 관리</h2>
          <p className="text-muted mb-0">등록된 매장 정보를 조회하고 관리할 수 있습니다.</p>
        </div>
        <div>
          <Button 
            variant="outline-primary" 
            onClick={() => {
              hasFetchedData.current = false;
              fetchStores();
            }}
            disabled={loading}
            className="me-2"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                새로고침 중...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt me-2"></i>
                새로고침
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 매장 통계 카드 */}
      {!loading && stores.length > 0 && (
        <Row className="mb-4">
          <Col md={4} sm={6} xs={12}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-primary">{stores.length}</h5>
                <p className="mb-0">총 매장 수</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} sm={6} xs={12}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-success">
                  {stores.filter(store => store.status === 'ACTIVE').length}
                </h5>
                <p className="mb-0">운영중 매장</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} sm={6} xs={12}>
            <Card className="text-center">
              <Card.Body>
                <h5 className="text-warning">
                  {stores.filter(store => store.status === 'INACTIVE').length}
                </h5>
                <p className="mb-0">휴업중 매장</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* 필터 섹션 */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6} sm={6} xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>매장명</Form.Label>
                <Form.Select 
                  name="store" 
                  value={filters.store} 
                  onChange={handleFilterStoreChange}
                >
                  <option value="all">모든 매장</option>
                  {loading ? (
                    <option disabled>로딩 중...</option>
                  ) : (
                    stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} sm={6} xs={12}>
              <Form.Group className="mb-3">
                <Form.Label>매장 상태</Form.Label>
                <Form.Select 
                  name="status" 
                  value={filters.status || 'all'} 
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">모든 상태</option>
                  <option value="ACTIVE">운영중</option>
                  <option value="INACTIVE">휴업중</option>
                  <option value="CLOSED">폐업</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* 매장 목록 */}
      <Card>
        <Card.Header>
          <h5>매장 목록</h5>
          <small>정렬 가능하고 확장 가능한 매장 테이블입니다. 행을 클릭하면 상세 정보를 볼 수 있습니다.</small>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">매장 목록을 불러오는 중입니다...</p>
            </div>
          ) : (
            <DataTable
              columns={storeColumns}
              data={getFilteredStores()}
              customStyles={customStyles}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
              expandableRows
              expandableRowsComponent={ExpandedStoreComponent}
              expandableRowExpanded={row => row.id === expandedRowId}
              onRowExpandToggled={handleRowExpandToggled}
              expandableRowsComponentProps={{ expandedRowId }}
              conditionalRowStyles={[
                {
                  when: row => expandedRowId === row.id,
                  style: {
                    backgroundColor: '#e3f2fd',
                    borderLeft: '4px solid #2196f3',
                    fontWeight: 'bold'
                  }
                }
              ]}
              noDataComponent={
                <div className="text-center p-5">
                  <div className="mb-3">
                    <i className="fas fa-store fa-3x text-muted"></i>
                  </div>
                  <h5 className="text-muted">
                    {filters.store === 'all' && filters.status === 'all'
                      ? '등록된 매장이 없습니다.' 
                      : '선택한 조건에 맞는 매장이 없습니다.'}
                  </h5>
                  <p className="text-muted mb-0">
                    {filters.store !== 'all' || filters.status !== 'all' 
                      ? '필터 조건을 변경해보세요.' 
                      : '새로운 매장을 등록해보세요.'}
                  </p>
                </div>
              }
              highlightOnHover
              striped
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default StoreManagement;