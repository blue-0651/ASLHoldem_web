import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Alert, Table } from 'react-bootstrap';
import { storeAPI } from '../../utils/api';

// third party
import DataTable from 'react-data-table-component';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set()); // 확장된 행 상태 관리
  const [storeUsers, setStoreUsers] = useState({}); // 매장별 사용자 데이터 저장
  const [loadingUsers, setLoadingUsers] = useState({}); // 매장별 로딩 상태
  
  // 필터 상태 추가
  const [filters, setFilters] = useState({
    store: 'all'
  });

  // API 호출 중복 방지를 위한 ref
  const hasFetchedData = useRef(false);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('매장 목록 조회 시작...');

      const response = await storeAPI.getAllStores();
      console.log('매장 목록 응답:', response.data);

      setStores(response.data);
      setLoading(false);
    } catch (error) {
      console.error('매장 목록 로드 오류:', error);
      setError('매장 목록을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 매장 방문 사용자 목록 조회
  const fetchStoreUsers = async (storeId) => {
    try {
      setLoadingUsers(prev => ({ ...prev, [storeId]: true }));
      console.log(`매장 ${storeId} 사용자 목록 조회 시작...`);

      const response = await storeAPI.getStoreUsers(storeId);
      console.log(`매장 ${storeId} 사용자 목록 응답:`, response.data);

      setStoreUsers(prev => ({ ...prev, [storeId]: response.data }));
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
    const newExpandedRows = new Set(expandedRows);
    if (expanded) {
      newExpandedRows.add(row.id);
      // 확장 시 해당 매장의 사용자 목록을 가져옴
      if (!storeUsers[row.id]) {
        fetchStoreUsers(row.id);
      }
    } else {
      newExpandedRows.delete(row.id);
    }
    setExpandedRows(newExpandedRows);
  };

  // 매장 필터 변경 핸들러
  const handleFilterStoreChange = (e) => {
    const { value } = e.target;
    setFilters({
      ...filters,
      store: value
    });
  };

  // 필터링된 매장 목록 계산
  const getFilteredStores = () => {
    if (!Array.isArray(stores)) {
      return [];
    }
    
    if (filters.store === 'all') {
      return stores;
    }
    
    return stores.filter(store => store.id === parseInt(filters.store));
  };
  // 확장된 행에 표시될 매장 방문 사용자 목록 컴포넌트
  const ExpandedStoreComponent = ({ data }) => {
    const users = Array.isArray(storeUsers[data.id]) ? storeUsers[data.id] : [];
    const isLoadingUsers = loadingUsers[data.id] || false;    return (
      <div className="p-4 border border-primary rounded" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="row">
          <div className="col-12">
            {isLoadingUsers ? (
              <div className="text-center p-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">사용자 목록을 불러오는 중입니다...</p>
              </div>
            ) : users.length > 0 ? (              <Table bordered hover responsive className="mb-0">
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
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>주소</span>,
      selector: (row) => row.address,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
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
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>토너먼트 수</span>,
      selector: (row) => row.tournament_count || 0,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>액션</span>,
      cell: (row) => (
        <Button variant="outline-primary" size="sm">
          수정
        </Button>
      ),
      center: true,
      ignoreRowClick: true,
      style: (row) => ({
        fontSize: expandedRows.has(row.id) ? '18px' : '14px',
        fontWeight: expandedRows.has(row.id) ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    }
  ], [expandedRows]);

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
        <h2>매장 관리</h2>
      </div>      {/* 필터 섹션 */}
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
                        {store.description || store.name}
                      </option>
                    ))
                  )}
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
              ]}              noDataComponent={
                <div className="text-center p-4">
                  {filters.store === 'all' 
                    ? '매장 데이터가 없습니다.' 
                    : '선택한 조건에 맞는 매장이 없습니다.'}
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