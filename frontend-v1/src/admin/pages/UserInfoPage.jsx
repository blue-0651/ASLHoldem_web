import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import API from '../../utils/api';
import { getToken } from '../../utils/auth';
import ErrorBoundary from '../components/ErrorBoundary';

// third party
import DataTable from 'react-data-table-component';

const UserInfoPage = () => {
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sort: 'name'
  });

  // API 호출 중복 방지를 위한 ref
  const hasFetchedData = useRef(false);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('사용자 목록 조회 시작...');
      
      const token = getToken();
      
      if (!token) {
        setError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const response = await API.get('/accounts/users/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('사용자 목록 응답:', response.data);

      if (response.data) {
        // 첫 번째 사용자 데이터의 구조를 확인하여 전화번호 필드명 파악
        if (response.data.length > 0) {
          console.log('첫 번째 사용자 데이터 구조:', response.data[0]);
          const firstUser = response.data[0];
          console.log('전화번호 필드 확인:', {
            phone_number: firstUser.phone_number,
            phone: firstUser.phone,
            mobile: firstUser.mobile
          });
        }

        // 역할 통계 디버깅
        const roleStats = {};
        response.data.forEach(user => {
          const role = user.role || 'undefined';
          roleStats[role] = (roleStats[role] || 0) + 1;
        });
        console.log('👥 사용자 역할 통계:', roleStats);
        
        // 매장 관리자 찾기
        const storeManagers = response.data.filter(user => user.role === 'STORE_MANAGER');
        console.log('🏪 매장 관리자 목록:', storeManagers);
        
        // 다양한 매장 관리자 role 값 확인
        const possibleStoreManagerRoles = response.data.filter(user => 
          user.role && (
            user.role.includes('STORE') || 
            user.role.includes('MANAGER') || 
            user.role.includes('store') || 
            user.role.includes('manager')
          )
        );
        console.log('🔍 매장 관리자 가능성 있는 사용자:', possibleStoreManagerRoles);
        
        setOriginalUsers(response.data);
        setUsers(response.data);
        setError(null);
        console.log(`✅ 사용자 ${response.data.length}명 로드 완료`);
      } else {
        setError('사용자 데이터가 없습니다.');
      }
    } catch (err) {
      console.error('❌ 사용자 목록 로드 오류:', err);
      if (err.response) {
        const errorMessage = err.response.data?.message || 
                           err.response.data?.detail || 
                           err.response.data?.error || 
                           '알 수 없는 오류가 발생했습니다.';
        setError(`서버 오류 (${err.response.status}): ${errorMessage}`);
      } else if (err.request) {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError(`요청 오류: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드 (중복 호출 방지)
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchUsers();
    }
  }, []);

  // 필터 변경 핸들러
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 검색 실행
  const handleSearch = () => {
    const filteredUsers = applyFilters();
    setUsers(filteredUsers);
  };

  // 필터 적용
  const applyFilters = () => {
    try {
      let filteredUsers = [...originalUsers]; // 원본 데이터에서 필터링
      
      if (filters.search) {
        filteredUsers = filteredUsers.filter(user => 
          (user.nickname && user.nickname.toLowerCase().includes(filters.search.toLowerCase())) ||
          user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          (user.phone_number && user.phone_number.includes(filters.search)) ||
          (user.phone && user.phone.includes(filters.search)) ||
          (user.mobile && user.mobile.includes(filters.search))
        );
      }

      filteredUsers.sort((a, b) => {
        if (filters.sort === 'name') {
          const nameA = a.nickname || a.username || '';
          const nameB = b.nickname || b.username || '';
          return nameA.localeCompare(nameB);
        } else if (filters.sort === '-name') {
          const nameA = a.nickname || a.username || '';
          const nameB = b.nickname || b.username || '';
          return nameB.localeCompare(nameA);
        }
        return 0;
      });

      return filteredUsers;
    } catch (err) {
      console.error('필터 적용 중 오류:', err);
      return originalUsers;
    }
  };

  // 필터 초기화
  const handleReset = () => {
    setFilters({ search: '', sort: 'name' });
    setUsers(originalUsers); // 원본 데이터로 복원
  };

  // 새로고침 핸들러 (수동 새로고침 시에는 중복 방지 해제)
  const handleRefresh = () => {
    hasFetchedData.current = false;  // 수동 새로고침이므로 중복 방지 해제
    fetchUsers();
  };

  // 사용자 역할 판별 유틸리티 함수
  const getUserRoleInfo = useCallback((user) => {
    const role = user.role;
    
    // 관리자 확인
    if (role === 'ADMIN' || role === 'admin' || role === 'Admin') {
      return { type: 'ADMIN', display: '관리자', class: 'bg-danger' };
    }
    
    // 매장 관리자 확인 (다양한 형태)
    if (role === 'STORE_OWNER' ||           // 실제 API에서 사용하는 값!
        role === 'STORE_MANAGER' || 
        role === 'store_manager' || 
        role === 'store_owner' ||
        role === 'StoreManager' ||
        role === 'StoreOwner' ||
        role === 'MANAGER' ||
        (role && role.toLowerCase().includes('store') && (role.toLowerCase().includes('manager') || role.toLowerCase().includes('owner')))) {
      return { type: 'STORE_MANAGER', display: '매장관리자', class: 'bg-primary' };
    }
    
    // 일반 사용자 (기본값)
    if (!role || role === 'USER' || role === 'user' || role === 'User') {
      return { type: 'USER', display: '일반사용자', class: 'bg-success' };
    }
    
    // 알 수 없는 역할
    return { type: role, display: role, class: 'bg-secondary' };
  }, []);

  // 사용자 테이블 컬럼 정의
  const userColumns = useMemo(() => [
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>닉네임</span>,
      selector: (row) => row.nickname || row.username || '-',
      sortable: true,
      center: true,
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>이메일</span>,
      selector: (row) => row.email,
      sortable: true,
      center: true,
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>전화번호</span>,
      selector: (row) => row.phone_number || row.phone || row.mobile || '-',
      sortable: true,
      center: true,
      cell: (row) => {
        const phone = row.phone_number || row.phone || row.mobile;
        if (!phone) return '-';
        
        // 전화번호 포맷팅 (한국 전화번호 형식)
        const phoneStr = phone.toString().replace(/[^0-9]/g, '');
        if (phoneStr.length === 11 && phoneStr.startsWith('010')) {
          return `${phoneStr.slice(0, 3)}-${phoneStr.slice(3, 7)}-${phoneStr.slice(7)}`;
        } else if (phoneStr.length === 10) {
          return `${phoneStr.slice(0, 3)}-${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
        }
        return phone; // 포맷팅할 수 없으면 원본 반환
      },
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>가입일</span>,
      selector: (row) => row.date_joined,
      sortable: true,
      center: true,
      cell: (row) => new Date(row.date_joined).toLocaleDateString('ko-KR'),
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>역할</span>,
      selector: (row) => getUserRoleInfo(row).type,
      sortable: true,
      center: true,
      cell: (row) => {
        const roleInfo = getUserRoleInfo(row);
        return <span className={`badge ${roleInfo.class}`}>{roleInfo.display}</span>;
      },
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>액션</span>,
      center: true,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => handleEdit(row)}
          >
            수정
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => handleDelete(row)}
          >
            삭제
          </Button>
        </div>
      ),
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    }
  ], [getUserRoleInfo]);

  // 편집 핸들러 (추후 구현)
  const handleEdit = (user) => {
    console.log('사용자 편집:', user);
    // TODO: 사용자 편집 모달 또는 페이지 구현
  };

  // 삭제 핸들러 (추후 구현)
  const handleDelete = (user) => {
    console.log('사용자 삭제:', user);
    // TODO: 사용자 삭제 확인 모달 및 API 호출 구현
  };

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
    <ErrorBoundary>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>사용자 관리</h2>
            <p className="text-muted mb-0">시스템에 등록된 사용자 정보를 조회하고 관리할 수 있습니다.</p>
          </div>
          <div>
            <Button 
              variant="outline-primary" 
              onClick={handleRefresh}
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

        {/* 사용자 통계 카드 */}
        {!loading && users.length > 0 && (() => {
          // 실시간 통계 계산 및 디버깅
          const totalUsers = originalUsers.length;
          const regularUsers = originalUsers.filter(user => getUserRoleInfo(user).type === 'USER');
          const storeManagers = originalUsers.filter(user => getUserRoleInfo(user).type === 'STORE_MANAGER');
          const admins = originalUsers.filter(user => getUserRoleInfo(user).type === 'ADMIN');
          
          // 매장 관리자 디버깅
          console.log('🔧 실시간 통계 디버깅:');
          console.log('- 총 사용자 수:', totalUsers);
          console.log('- 일반 사용자:', regularUsers.length, regularUsers.map(u => ({username: u.username, role: u.role})));
          console.log('- 매장 관리자:', storeManagers.length, storeManagers.map(u => ({username: u.username, role: u.role})));
          console.log('- 시스템 관리자:', admins.length, admins.map(u => ({username: u.username, role: u.role})));
          
          // 모든 사용자의 역할 정보 상세 출력
          originalUsers.forEach(user => {
            const roleInfo = getUserRoleInfo(user);
            if (roleInfo.type === 'STORE_MANAGER') {
              console.log(`✅ 매장 관리자 발견: ${user.username} (원본 role: "${user.role}", 판별 결과: ${roleInfo.type})`);
            }
          });
          
          return (
            <Row className="mb-4">
              <Col md={3} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-primary">{totalUsers}</h5>
                    <p className="mb-0">총 사용자 수</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-success">{regularUsers.length}</h5>
                    <p className="mb-0">일반 사용자</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-primary">{storeManagers.length}</h5>
                    <p className="mb-0">매장 관리자</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6} xs={12}>
                <Card className="text-center">
                  <Card.Body>
                    <h5 className="text-danger">{admins.length}</h5>
                    <p className="mb-0">시스템 관리자</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          );
        })()}

        {/* 필터 섹션 */}
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={6} sm={12}>
                <Form.Group className="mb-3">
                  <Form.Label>검색</Form.Label>
                  <div className="d-flex">
                    <Form.Control 
                      type="text" 
                      name="search"
                      placeholder="닉네임, 이메일 또는 전화번호로 검색..." 
                      value={filters.search}
                      onChange={handleFilterChange}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="me-2"
                    />
                    <Button 
                      variant="primary" 
                      onClick={handleSearch}
                      style={{ minWidth: '80px' }}
                    >
                      검색
                    </Button>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6} sm={12}>
                <Form.Group className="mb-3">
                  <Form.Label>정렬</Form.Label>
                  <Form.Select 
                    name="sort"
                    value={filters.sort}
                    onChange={(e) => {
                      handleFilterChange(e);
                      // 정렬 변경 시 자동으로 필터 적용
                      setTimeout(() => {
                        const filteredUsers = applyFilters();
                        setUsers(filteredUsers);
                      }, 0);
                    }}
                  >
                    <option value="name">닉네임 (오름차순)</option>
                    <option value="-name">닉네임 (내림차순)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={handleReset}>
                초기화
              </Button>
              <Button variant="primary" onClick={handleSearch}>
                필터 적용
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* 사용자 목록 */}
        <Card>
          <Card.Header>
            <h5>사용자 목록</h5>
            <small>정렬 가능하고 검색 가능한 사용자 테이블입니다. 필터를 사용하여 원하는 사용자를 찾을 수 있습니다.</small>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">사용자 목록을 불러오는 중입니다...</p>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={users}
                customStyles={customStyles}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                noDataComponent={
                  <div className="text-center p-5">
                    <div className="mb-3">
                      <i className="fas fa-users fa-3x text-muted"></i>
                    </div>
                    <h5 className="text-muted">
                      {filters.search
                        ? '검색 조건에 맞는 사용자가 없습니다.' 
                        : '등록된 사용자가 없습니다.'}
                    </h5>
                    <p className="text-muted mb-0">
                      {filters.search 
                        ? '다른 검색어를 시도해보세요.' 
                        : '새로운 사용자를 등록해보세요.'}
                    </p>
                  </div>
                }
                highlightOnHover
                striped
                responsive
              />
            )}
          </Card.Body>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default UserInfoPage;
