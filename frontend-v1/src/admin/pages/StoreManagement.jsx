import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Alert, Table, Nav, Tab, Modal } from 'react-bootstrap';
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
  
  // 매장별 토너먼트 관련 상태 추가
  const [storeTournaments, setStoreTournaments] = useState({}); // 매장별 토너먼트 데이터 저장
  const [loadingTournaments, setLoadingTournaments] = useState({}); // 매장별 토너먼트 로딩 상태
  const [activeTab, setActiveTab] = useState({}); // 매장별 활성 탭 상태 ('users' 또는 'tournaments')
  
  // 필터 상태 추가
  const [filters, setFilters] = useState({
    store: 'all',
    status: 'all'
  });

  // API 호출 중복 방지를 위한 ref
  const hasFetchedData = useRef(false);
  
  // CRUD 모달 상태 추가
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  
  // 매장 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    phone_number: '',
    manager_name: '',
    manager_phone: '',
    open_time: '',
    close_time: '',
    max_capacity: 50,
    status: 'ACTIVE',
    owner: '',
    image: null
  });
  
  // 매장 관리자 목록 상태
  const [storeOwners, setStoreOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  // 매장 관리자 목록 가져오기
  const fetchStoreOwners = async () => {
    try {
      setLoadingOwners(true);
      console.log('매장 관리자 목록 조회 시작...');
      
      // 매장 관리자 권한을 가진 사용자들 조회
      const response = await userAPI.getAllUsers('STORE_OWNER');
      console.log('매장 관리자 목록 응답:', response.data);
      
      setStoreOwners(response.data || []);
      setLoadingOwners(false);
    } catch (error) {
      console.error('매장 관리자 목록 로드 오류:', error);
      setStoreOwners([]);
      setLoadingOwners(false);
    }
  };

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

  // 매장 데이터 새로고침 함수 추가
  const refreshStoreData = () => {
    // 캐시 초기화
    setStoreUsers({});
    setStoreTournaments({});
    setLoadingUsers({});
    setLoadingTournaments({});
    setActiveTab({});
    setExpandedRowId(null);
    
    // 데이터 재조회
    hasFetchedData.current = false;
    fetchStores();
  };

  // 매장 생성 함수
  const handleCreateStore = async () => {
    try {
      setModalLoading(true);
      setError(null);
      
      // 필수 필드 검증
      if (!formData.name.trim()) {
        setError('매장명을 입력해주세요.');
        return;
      }
      
      if (!formData.address.trim()) {
        setError('매장 주소를 입력해주세요.');
        return;
      }
      
      if (!formData.owner) {
        setError('매장 소유자를 선택해주세요.');
        return;
      }
      
      const response = await storeAPI.createStore(formData);
      console.log('매장 생성 성공:', response.data);
      
      setSuccess('매장이 성공적으로 생성되었습니다.');
      setShowCreateModal(false);
      resetForm();
      
      // 매장 목록 새로고침
      refreshStoreData();
      
    } catch (error) {
      console.error('매장 생성 실패:', error);
      
      if (error.response?.data) {
        // 서버 유효성 검사 오류 처리
        if (error.response.data.name) {
          setError(error.response.data.name[0]);
        } else if (error.response.data.address) {
          setError(error.response.data.address[0]);
        } else if (error.response.data.phone_number) {
          setError(error.response.data.phone_number[0]);
        } else if (error.response.data.non_field_errors) {
          setError(error.response.data.non_field_errors[0]);
        } else {
          setError('매장 생성 중 오류가 발생했습니다.');
        }
      } else {
        setError('매장 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // 매장 수정 함수
  const handleUpdateStore = async () => {
    try {
      setModalLoading(true);
      setError(null);
      
      // 필수 필드 검증
      if (!formData.name.trim()) {
        setError('매장명을 입력해주세요.');
        return;
      }
      
      if (!formData.address.trim()) {
        setError('매장 주소를 입력해주세요.');
        return;
      }
      
      const response = await storeAPI.updateStore(currentStore.id, formData);
      console.log('매장 수정 성공:', response.data);
      
      setSuccess('매장 정보가 성공적으로 수정되었습니다.');
      setShowEditModal(false);
      resetForm();
      
      // 매장 목록 새로고침
      refreshStoreData();
      
    } catch (error) {
      console.error('매장 수정 실패:', error);
      
      if (error.response?.data) {
        // 서버 유효성 검사 오류 처리
        if (error.response.data.name) {
          setError(error.response.data.name[0]);
        } else if (error.response.data.address) {
          setError(error.response.data.address[0]);
        } else if (error.response.data.phone_number) {
          setError(error.response.data.phone_number[0]);
        } else if (error.response.data.non_field_errors) {
          setError(error.response.data.non_field_errors[0]);
        } else {
          setError('매장 수정 중 오류가 발생했습니다.');
        }
      } else {
        setError('매장 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // 매장 삭제 함수
  const handleDeleteStore = async () => {
    try {
      setModalLoading(true);
      setError(null);
      
      const response = await storeAPI.deleteStore(currentStore.id);
      console.log('매장 삭제 성공:', response.data);
      
      setSuccess(`매장 '${currentStore.name}'이(가) 성공적으로 삭제되었습니다.`);
      setShowDeleteModal(false);
      setCurrentStore(null);
      
      // 매장 목록 새로고침
      refreshStoreData();
      
    } catch (error) {
      console.error('매장 삭제 실패:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('매장 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // 폼 초기화 함수
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      phone_number: '',
      manager_name: '',
      manager_phone: '',
      open_time: '',
      close_time: '',
      max_capacity: 50,
      status: 'ACTIVE',
      owner: '',
      image: null
    });
  };

  // 폼 데이터 변경 핸들러
  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 매장 생성 모달 열기
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
    fetchStoreOwners(); // 매장 관리자 목록 가져오기
  };

  // 매장 수정 모달 열기
  const openEditModal = (store) => {
    setCurrentStore(store);
    setFormData({
      name: store.name || '',
      address: store.address || '',
      description: store.description || '',
      phone_number: store.phone_number || '',
      manager_name: store.manager_name || '',
      manager_phone: store.manager_phone || '',
      open_time: store.open_time || '',
      close_time: store.close_time || '',
      max_capacity: store.max_capacity || 50,
      status: store.status || 'ACTIVE',
      owner: store.owner || '',
      image: null
    });
    setShowEditModal(true);
    fetchStoreOwners(); // 매장 관리자 목록 가져오기
  };

  // 매장 삭제 모달 열기
  const openDeleteModal = (store) => {
    setCurrentStore(store);
    setShowDeleteModal(true);
  };

  // 성공 메시지 자동 사라지기
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // 매장 선수 목록 조회 - 수정된 버전
  const fetchStoreUsers = async (storeId) => {
    // 이미 로딩 중이거나 데이터가 있는 경우(빈 배열 포함) 중복 요청 방지
    if (loadingUsers[storeId] || storeId in storeUsers) {
      console.log(`매장 ${storeId} 사용자 목록: 캐시된 데이터 사용 또는 로딩 중.`);
      return;
    }

    try {
      setLoadingUsers(prev => ({ ...prev, [storeId]: true }));
      console.log(`매장 ${storeId} 사용자 목록 조회 시작...`);

      try {
        // 새로운 seatTicketAPI.getStoreUsers 메서드 사용
        const response = await seatTicketAPI.getStoreUsers(storeId);
        // 백엔드 응답이 객체이고 내부에 사용자 목록이 있을 수 있음 (e.g., response.data.users)
        const data = response.data;
        const users = Array.isArray(data)
          ? data
          : data && Array.isArray(data.users) // 'users' 속성 확인
          ? data.users
          : data && Array.isArray(data.results)
          ? data.results
          : [];

        setStoreUsers(prev => ({ ...prev, [storeId]: users }));
        console.log(`매장 ${storeId} 사용자 목록:`, users);
      } catch (apiError) {
        console.error('매장별 사용자 목록 조회 실패:', apiError);
        // API 호출 실패 시 빈 배열로 설정
        setStoreUsers(prev => ({ ...prev, [storeId]: [] }));
        
        // 404 오류가 아닌 경우에만 에러 메시지 표시
        if (apiError.response?.status !== 404) {
          console.warn(`매장 ${storeId}의 사용자 목록을 불러올 수 없습니다.`);
        }
      } finally {
        setLoadingUsers(prev => ({ ...prev, [storeId]: false }));
      }
    } catch (error) {
      console.error(`매장 ${storeId} 사용자 목록 로드 오류:`, error);
      setStoreUsers(prev => ({ ...prev, [storeId]: [] }));
      setLoadingUsers(prev => ({ ...prev, [storeId]: false }));
    }
  };

  // 매장별 토너먼트 목록 조회 - 수정된 버전
  const fetchStoreTournaments = async (storeId) => {
    // 이미 로딩 중이거나 데이터가 있는 경우(빈 배열 포함) 중복 요청 방지
    if (loadingTournaments[storeId] || storeId in storeTournaments) {
      console.log(`매장 ${storeId} 토너먼트 목록: 캐시된 데이터 사용 또는 로딩 중.`);
      return;
    }

    try {
      setLoadingTournaments(prev => ({ ...prev, [storeId]: true }));
      console.log(`매장 ${storeId} 토너먼트 목록 조회 시작...`);

      // distributionAPI를 사용하여 매장별 분배 요약 조회
      const response = await distributionAPI.getSummaryByStore(storeId);
      console.log(`매장 ${storeId} 토너먼트 응답:`, response.data);

      // 응답 데이터에서 토너먼트 목록 추출 - 올바른 필드명 사용
      const tournaments = response.data?.tournament_distributions || [];
      console.log(`매장 ${storeId} 토너먼트 목록:`, tournaments);
      
      setStoreTournaments(prev => ({ ...prev, [storeId]: tournaments }));
      
    } catch (error) {
      console.error(`매장 ${storeId} 토너먼트 목록 로드 오류:`, error);
      setStoreTournaments(prev => ({ ...prev, [storeId]: [] }));
    } finally {
      setLoadingTournaments(prev => ({ ...prev, [storeId]: false }));
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
    const newExpandedRowId = expanded ? row.id : null;
    setExpandedRowId(newExpandedRowId);

    if (expanded) {
      // 확장될 때 항상 기본 탭을 'tournaments'로 설정
      setActiveTab(prev => ({ ...prev, [row.id]: 'tournaments' }));
      
      // 확장 시 해당 매장의 토너먼트 목록과 방문자 목록을 모두 가져옴 (캐싱 체크 포함)
      fetchStoreTournaments(row.id);
      fetchStoreUsers(row.id);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (storeId, tabKey) => {
    setActiveTab(prev => ({ ...prev, [storeId]: tabKey }));
    
    // 토너먼트 탭으로 변경 시 토너먼트 목록 로드 (캐싱 체크 포함)
    if (tabKey === 'tournaments') {
      fetchStoreTournaments(storeId);
    }
    
    // 사용자 탭으로 변경 시 사용자 목록 로드 (캐싱 체크 포함)
    if (tabKey === 'users') {
      fetchStoreUsers(storeId);
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

  // 토너먼트 테이블 컬럼 정의 - 백엔드 응답 필드에 맞게 수정
  const tournamentColumns = useMemo(() => [
    {
      name: <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#721c24' }}>토너먼트명</span>,
      selector: (row) => row.tournament_name,
      sortable: true,
      center: true,
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#721c24' }}>분배 좌석권</span>,
      selector: (row) => row.allocated_quantity || 0,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className="badge bg-primary">
          {row.allocated_quantity || 0}매
        </span>
      ),
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#721c24' }}>남은 좌석권</span>,
      selector: (row) => row.remaining_quantity || 0,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className={`badge ${(row.remaining_quantity || 0) > 0 ? 'bg-success' : 'bg-warning'}`}>
          {row.remaining_quantity || 0}매
        </span>
      ),
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#721c24' }}>분배된 좌석권</span>,
      selector: (row) => row.distributed_quantity || 0,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className="badge bg-info">
          {row.distributed_quantity || 0}매
        </span>
      ),
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    },
    {
      name: <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#721c24' }}>분배율</span>,
      selector: (row) => row.distribution_rate || 0,
      sortable: true,
      center: true,
      cell: (row) => (
        <span className={`badge ${(row.distribution_rate || 0) >= 80 ? 'bg-success' : (row.distribution_rate || 0) >= 50 ? 'bg-warning' : 'bg-danger'}`}>
          {(row.distribution_rate || 0).toFixed(1)}%
        </span>
      ),
      style: {
        fontSize: '14px',
        fontWeight: 'normal'
      }
    }
  ], []);

  // 확장된 행에 표시될 탭 컴포넌트 - 수정된 버전
  const ExpandedStoreComponent = ({ data: store }) => {
    const users = Array.isArray(storeUsers[store.id]) ? storeUsers[store.id] : [];
    const tournaments = Array.isArray(storeTournaments[store.id]) ? storeTournaments[store.id] : [];
    const isLoadingUsers = loadingUsers[store.id] || false;
    const isLoadingTournaments = loadingTournaments[store.id] || false;
    const currentTab = activeTab[store.id] || 'tournaments';

    return (
      <div className="p-4 border border-primary rounded" style={{ backgroundColor: '#f8f9fa' }}>
        <Tab.Container activeKey={currentTab} onSelect={(k) => handleTabChange(store.id, k)}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="tournaments">
                <i className="fas fa-trophy me-2"></i>
                진행 토너먼트 ({tournaments.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="users">
                <i className="fas fa-users me-2"></i>
                매장선수 목록 ({users.length})
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* 매장선수 목록 탭 */}
            <Tab.Pane eventKey="users">
              <div className="row">
                <div className="col-12">
                  {isLoadingUsers ? (
                    <div className="text-center p-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">매장선수 목록을 불러오는 중입니다...</p>
                    </div>
                  ) : users.length > 0 ? (
                    <Table bordered hover responsive className="mb-0">
                      <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                        <tr>
                          <th className="text-center">사용자명</th>
                          <th className="text-center">전화번호</th>
                          <th className="text-center">이메일</th>
                          <th className="text-center">보유 좌석권</th>
                          <th className="text-center">사용 좌석권</th>
                          <th className="text-center">티켓 보유 여부</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, index) => (
                          <tr key={user.userId || user.user_id || user.id || index}>
                            <td className="text-center">{user.playerName || user.user_name || user.username || user.nickname || '-'}</td>
                            <td className="text-center">{user.playerPhone || user.phone_number || user.phone || '-'}</td>
                            <td className="text-center">{user.email || '-'}</td>
                            <td className="text-center">
                              <span className="badge bg-info">{user.activeTickets || user.granted_quantity || user.total_granted || 0}매</span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-success">{user.usedTickets || user.used_quantity || user.total_used || 0}매</span>
                            </td>
                            <td className="text-center">
                              <span className={`badge ${user.hasTicket === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                                {user.hasTicket === 'Y' ? '보유' : '없음'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center p-4 border rounded" style={{ backgroundColor: '#ffffff' }}>
                      <p className="mb-0 text-muted">이 매장에 등록된 선수가 없습니다.</p>
                    </div>
                  )}

                  {/* 사용자 요약 정보 */}
                  <div className="row mt-3">
                    <div className="col-12">
                      <div className="text-white p-3 rounded border" style={{ backgroundColor: '#6c757d' }}>
                        <div className="row text-center">
                          <div className="col-md-3">
                            <h6 className="text-white">총 등록 선수 수</h6>
                            <h4 className="text-white">{users.length}명</h4>
                          </div>
                          <div className="col-md-3">
                            <h6 className="text-white">평균 보유 좌석권</h6>
                            <h4 className="text-white">
                              {users.length > 0
                                ? (users.reduce((sum, user) => sum + (user.activeTickets || user.granted_quantity || 0), 0) / users.length).toFixed(1)
                                : 0
                              }매
                            </h4>
                          </div>
                          <div className="col-md-3">
                            <h6 className="text-white">티켓 보유 선수</h6>
                            <h4 className="text-white">
                              {users.filter(user => user.hasTicket === 'Y').length}명
                            </h4>
                          </div>
                          <div className="col-md-3">
                            <h6 className="text-white">총 보유 좌석권</h6>
                            <h4 className="text-white">
                              {users.reduce((sum, user) => sum + (user.activeTickets || user.granted_quantity || 0), 0)}매
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Pane>

            {/* 진행 토너먼트 탭 */}
            <Tab.Pane eventKey="tournaments">
              <div className="row">
                <div className="col-12">
                  {isLoadingTournaments ? (
                    <div className="text-center p-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">토너먼트 목록을 불러오는 중입니다...</p>
                    </div>
                  ) : tournaments.length > 0 ? (
                    <DataTable
                      columns={tournamentColumns}
                      data={tournaments}
                      pagination
                      paginationPerPage={5}
                      paginationRowsPerPageOptions={[5, 10]}
                      customStyles={{
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
                          }
                        }
                      }}
                      noDataComponent={
                        <div className="text-center p-4">
                          <div className="mb-3">
                            <i className="fas fa-trophy fa-2x text-muted"></i>
                          </div>
                          <h6 className="text-muted mb-0">진행 중인 토너먼트가 없습니다.</h6>
                        </div>
                      }
                      highlightOnHover
                      striped
                      dense
                    />
                  ) : (
                    <div className="text-center p-4 border rounded" style={{ backgroundColor: '#ffffff' }}>
                      <div className="mb-3">
                        <i className="fas fa-trophy fa-3x text-muted"></i>
                      </div>
                      <h6 className="text-muted">이 매장에서 진행하는 토너먼트가 없습니다.</h6>
                      <p className="text-muted mb-0">토너먼트 분배가 완료되면 여기에 표시됩니다.</p>
                    </div>
                  )}

                  {/* 토너먼트 요약 정보 */}
                  {tournaments.length > 0 && (
                    <div className="row mt-3">
                      <div className="col-12">
                        <div className="text-white p-3 rounded border" style={{ backgroundColor: '#721c24' }}>
                          <div className="row text-center">
                            <div className="col-md-3">
                              <h6 className="text-white">총 토너먼트 수</h6>
                              <h4 className="text-white">{tournaments.length}개</h4>
                            </div>
                            <div className="col-md-3">
                              <h6 className="text-white">총 분배 좌석권</h6>
                              <h4 className="text-white">
                                {tournaments.reduce((sum, t) => sum + (t.allocated_quantity || 0), 0)}매
                              </h4>
                            </div>
                            <div className="col-md-3">
                              <h6 className="text-white">총 남은 좌석권</h6>
                              <h4 className="text-white">
                                {tournaments.reduce((sum, t) => sum + (t.remaining_quantity || 0), 0)}매
                              </h4>
                            </div>
                            <div className="col-md-3">
                              <h6 className="text-white">총 분배된 좌석권</h6>
                              <h4 className="text-white">
                                {tournaments.reduce((sum, t) => sum + (t.distributed_quantity || 0), 0)}매
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
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
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>작업</span>,
      center: true,
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => openEditModal(row)}
            title="매장 수정"
          >
            <i className="fas fa-edit"></i>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => openDeleteModal(row)}
            title="매장 삭제"
          >
            <i className="fas fa-trash"></i>
          </Button>
        </div>
      ),
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
            variant="primary" 
            onClick={openCreateModal}
            className="me-2"
          >
            <i className="fas fa-plus me-2"></i>
            새 매장 생성
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={refreshStoreData}
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

      {/* 성공 메시지 */}
      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

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
              paginationPerPage={15}
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

      {/* 매장 생성 모달 */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>새 매장 생성</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장명 <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="매장명을 입력하세요"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장 소유자 <span className="text-danger">*</span></Form.Label>
                  {loadingOwners ? (
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span>매장 관리자 목록 로딩 중...</span>
                    </div>
                  ) : (
                    <Form.Select
                      name="owner"
                      value={formData.owner}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">매장 소유자를 선택하세요</option>
                      {storeOwners.map(owner => (
                        <option key={owner.id} value={owner.id}>
                          {owner.nickname || owner.name} ({owner.phone || '전화번호 없음'})
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>매장 주소 <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                placeholder="매장 주소를 입력하세요"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>매장 설명</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="매장에 대한 설명을 입력하세요"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장 전화번호</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleFormChange}
                    placeholder="02-123-4567"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장 상태</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="ACTIVE">운영중</option>
                    <option value="INACTIVE">휴업중</option>
                    <option value="CLOSED">폐업</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>관리자 이름</Form.Label>
                  <Form.Control
                    type="text"
                    name="manager_name"
                    value={formData.manager_name}
                    onChange={handleFormChange}
                    placeholder="관리자 이름을 입력하세요"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>관리자 연락처</Form.Label>
                  <Form.Control
                    type="text"
                    name="manager_phone"
                    value={formData.manager_phone}
                    onChange={handleFormChange}
                    placeholder="010-1234-5678"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>운영 시작 시간</Form.Label>
                  <Form.Control
                    type="time"
                    name="open_time"
                    value={formData.open_time}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>운영 종료 시간</Form.Label>
                  <Form.Control
                    type="time"
                    name="close_time"
                    value={formData.close_time}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={modalLoading}>
            취소
          </Button>
          <Button variant="primary" onClick={handleCreateStore} disabled={modalLoading}>
            {modalLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                생성 중...
              </>
            ) : (
              '매장 생성'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 매장 수정 모달 */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>매장 정보 수정</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장명 <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="매장명을 입력하세요"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장 소유자 <span className="text-danger">*</span></Form.Label>
                  {loadingOwners ? (
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span>매장 관리자 목록 로딩 중...</span>
                    </div>
                  ) : (
                    <Form.Select
                      name="owner"
                      value={formData.owner}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">매장 소유자를 선택하세요</option>
                      {storeOwners.map(owner => (
                        <option key={owner.id} value={owner.id}>
                          {owner.nickname || owner.name} ({owner.phone || '전화번호 없음'})
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>매장 주소 <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                placeholder="매장 주소를 입력하세요"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>매장 설명</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="매장에 대한 설명을 입력하세요"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장 전화번호</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleFormChange}
                    placeholder="02-123-4567"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>매장 상태</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="ACTIVE">운영중</option>
                    <option value="INACTIVE">휴업중</option>
                    <option value="CLOSED">폐업</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>관리자 이름</Form.Label>
                  <Form.Control
                    type="text"
                    name="manager_name"
                    value={formData.manager_name}
                    onChange={handleFormChange}
                    placeholder="관리자 이름을 입력하세요"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>관리자 연락처</Form.Label>
                  <Form.Control
                    type="text"
                    name="manager_phone"
                    value={formData.manager_phone}
                    onChange={handleFormChange}
                    placeholder="010-1234-5678"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>운영 시작 시간</Form.Label>
                  <Form.Control
                    type="time"
                    name="open_time"
                    value={formData.open_time}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>운영 종료 시간</Form.Label>
                  <Form.Control
                    type="time"
                    name="close_time"
                    value={formData.close_time}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={modalLoading}>
            취소
          </Button>
          <Button variant="primary" onClick={handleUpdateStore} disabled={modalLoading}>
            {modalLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                수정 중...
              </>
            ) : (
              '매장 수정'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 매장 삭제 모달 */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>매장 삭제</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mb-3">
              <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
            </div>
            <h5>정말로 이 매장을 삭제하시겠습니까?</h5>
            {currentStore && (
              <p className="text-muted">
                매장명: <strong>{currentStore.name}</strong><br />
                주소: {currentStore.address}
              </p>
            )}
            <div className="alert alert-warning">
              <i className="fas fa-info-circle me-2"></i>
              매장이 삭제되면 상태가 '폐업'으로 변경되며, 관련된 모든 데이터는 보존됩니다.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={modalLoading}>
            취소
          </Button>
          <Button variant="danger" onClick={handleDeleteStore} disabled={modalLoading}>
            {modalLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                삭제 중...
              </>
            ) : (
              '매장 삭제'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StoreManagement;