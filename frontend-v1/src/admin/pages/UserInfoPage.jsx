import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table } from 'react-bootstrap';
import API from '../../utils/api';
import { getToken } from '../../utils/auth';
import ErrorBoundary from '../components/ErrorBoundary';

const UserInfoPage = () => {
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sort: 'name'
  });

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
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

      if (response.data) {
        setOriginalUsers(response.data);
        setUsers(response.data);
        setError(null);
      } else {
        setError('사용자 데이터가 없습니다.');
      }
    } catch (err) {
      console.error('API 에러:', err);
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

  useEffect(() => {
    fetchUsers();
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
          user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      filteredUsers.sort((a, b) => {
        if (filters.sort === 'name') {
          return a.username.localeCompare(b.username);
        } else if (filters.sort === '-name') {
          return b.username.localeCompare(a.username);
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

  return (
    <ErrorBoundary>
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>사용자 관리</h2>
        </div>

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
                      placeholder="이름 또는 이메일로 검색..." 
                      value={filters.search}
                      onChange={handleFilterChange}
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
                  <div className="mt-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={handleSearch}
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
                    onChange={handleFilterChange}
                  >
                    <option value="name">이름 (오름차순)</option>
                    <option value="-name">이름 (내림차순)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={handleReset}>
                초기화
              </Button>
              <Button variant="primary" onClick={fetchUsers}>
                새로고침
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">로딩중...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>사용자명</th>
                      <th>이메일</th>
                      <th>전화번호</th>
                      <th>가입일</th>
                      <th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.phone_number}</td>
                        <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-2">
                            수정
                          </Button>
                          <Button variant="outline-danger" size="sm">
                            삭제
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default UserInfoPage;
