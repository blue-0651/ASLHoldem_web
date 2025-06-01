import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Modal, Spinner, Alert, Table, Pagination } from 'react-bootstrap';
import { tournamentAPI, dashboardAPI, distributionAPI, seatTicketAPI } from '../../utils/api';

// third party
import DataTable from 'react-data-table-component';

const TournamentManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null); // Set에서 단일 값으로 변경

  // 토너먼트별 상세 데이터 캐시
  const [tournamentDetailsCache, setTournamentDetailsCache] = useState(new Map());
  const [loadingDetails, setLoadingDetails] = useState(new Set());

  // 선택된 매장 상태 추가
  const [selectedStoreByTournament, setSelectedStoreByTournament] = useState(new Map());

  // API 호출 중복 방지를 위한 ref
  const hasFetchedData = useRef(false);

  // 폼 상태 - 매장 관련 필드 제거
  const [formData, setFormData] = useState({
    name: '',
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

  // 시트권 추가 모달 관련 상태 추가
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [selectedTournamentForTicket, setSelectedTournamentForTicket] = useState(null);
  const [availableStores, setAvailableStores] = useState([]);
  const [allocatedStores, setAllocatedStores] = useState([]);
  const [allStoresForDistribution, setAllStoresForDistribution] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  // 페이지네이션 관련 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 시트권 추가 폼 데이터
  const [ticketFormData, setTicketFormData] = useState({
    storeQuantities: {}  // { store_id: quantity } 형태로 매장별 수량 저장
  });

  // 페이지 로드 시 토너먼트 목록 가져오기
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchTournaments();
    }
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);

      // getAllTournamentInfo로 변경 - 더 풍부한 데이터 제공
      const response = await tournamentAPI.getAllTournamentInfo();
      setTournaments(response.data); // .results 제거 - 직접 배열 구조

      // 각 토너먼트의 상세 정보를 미리 가져오기 (백그라운드에서)
      if (Array.isArray(response.data)) {
        response.data.forEach(tournament => {
          // 비동기로 상세 정보 가져오기 (에러가 발생해도 전체 로딩에 영향 없음)
          fetchTournamentDetails(tournament.id).catch(err => {
            console.warn(`토너먼트 ${tournament.id} 상세 정보 로딩 실패:`, err);
          });
        });
      }

      setLoading(false);

    } catch (err) {
      setError('토너먼트 목록을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
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

      // 병렬로 여러 API 호출
      const [playerMappingResponse, distributionResponse, seatTicketResponse] = await Promise.all([
        dashboardAPI.getPlayerMapping(tournamentId),
        distributionAPI.getSummaryByTournament(tournamentId),
        seatTicketAPI.getTournamentSummary(tournamentId)
      ]);

      // 데이터 통합
      const combinedData = {
        // 기존 플레이어 매핑 데이터
        ...playerMappingResponse.data,

        // 매장별 현황 (distribution API에서)
        매장별_현황: distributionResponse.data.store_distributions?.map(store => ({
          매장명: store.store_name,
          매장_ID: store.store_id,  // 매장 ID 추가
          좌석권_수량: store.allocated_quantity || 0,
          배포된_수량: store.distributed_quantity || 0,
          보유_수량: store.remaining_quantity || 0
        })) || [],

        // 선수별 현황 (seat ticket API에서)
        선수별_현황: seatTicketResponse.data.user_summaries?.map(user => ({
          선수명: user.user_nickname || user.user_phone,
          좌석권_보유: user.active_tickets > 0 ? 'Y' : 'N',
          매장명: '미지정', // 현재 API에서 매장 정보가 없음
          좌석권_수량: user.active_tickets || 0
        })) || [],

        // 통계 정보
        총_좌석권_수량: distributionResponse.data.tournament?.ticket_quantity || 0,
        배포된_좌석권_수량: distributionResponse.data.summary?.total_distributed || 0,
        사용된_좌석권_수량: seatTicketResponse.data.ticket_stats?.used_tickets || 0,
        매장_수량: distributionResponse.data.store_distributions?.length || 0,
        선수_수량: seatTicketResponse.data.user_summaries?.length || 0
      };

      // 캐시에 저장
      setTournamentDetailsCache(prev => new Map([...prev, [tournamentId, combinedData]]));

    } catch (err) {
      console.error('토너먼트 상세 정보 API 오류:', err);
      setError(`토너먼트 상세 정보를 불러오는 중 오류가 발생했습니다.`);
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(tournamentId);
        return newSet;
      });
    }
  };

  // 매장별 사용자 조회 함수 수정
  const fetchStoreUsers = async (tournamentId, storeId, storeName) => {
    try {
      console.log(`매장별 사용자 조회 시작:`, { tournamentId, storeId, storeName });

      // 백엔드에서 매장별 필터링된 좌석권 조회
      const response = await seatTicketAPI.getUsersByStore(tournamentId, storeId);

      // API 응답 구조 디버깅
      console.log('매장별 좌석권 조회 API 응답:', response);
      console.log('response.data 타입:', typeof response.data);
      console.log('response.data 내용:', response.data);
      console.log('response.status:', response.status);
      console.log('response.headers:', response.headers);

      // 응답 데이터가 배열인지 확인
      let ticketsData = [];
      if (Array.isArray(response.data)) {
        ticketsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        // 페이지네이션된 응답인 경우
        ticketsData = response.data.results;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // 중첩된 data 구조인 경우
        ticketsData = response.data.data;
      } else {
        console.warn('예상하지 못한 API 응답 구조:', response.data);
        ticketsData = [];
      }

      console.log('처리할 티켓 데이터:', ticketsData);

      // 사용자별로 그룹화하여 중복 제거 (백엔드에서 이미 필터링됨)
      const userMap = new Map();
      ticketsData.forEach(ticket => {
        const userId = ticket.user;
        const userPhone = ticket.user_name || '미지정';

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            선수명: userPhone,
            좌석권_보유: 'Y',
            매장명: storeName,
            좌석권_수량: 0
          });
        }

        // 활성 좌석권 수량 증가
        if (ticket.status === 'ACTIVE') {
          userMap.get(userId).좌석권_수량 += 1;
        }
      });

      const storeUsers = Array.from(userMap.values());
      console.log('최종 매장 사용자 목록:', storeUsers);

      // 매장에 사용자가 없는 경우 안내 메시지
      if (storeUsers.length === 0) {
        console.log(`${storeName} 매장에 등록된 사용자가 없습니다.`);
        // 빈 배열이지만 안내 메시지를 위한 더미 데이터 추가
        storeUsers.push({
          선수명: '등록된 선수가 없습니다',
          좌석권_보유: 'N',
          매장명: storeName,
          좌석권_수량: 0
        });
      }

      // 토너먼트 상세 정보 업데이트
      setTournamentDetailsCache(prev => {
        const newCache = new Map(prev);
        const tournamentDetails = newCache.get(tournamentId);
        if (tournamentDetails) {
          newCache.set(tournamentId, {
            ...tournamentDetails,
            선수별_현황: storeUsers
          });
        }
        return newCache;
      });

      // 선택된 매장 정보 저장
      setSelectedStoreByTournament(prev => new Map([...prev, [tournamentId, { storeId, storeName }]]));

    } catch (err) {
      console.error('매장별 사용자 조회 오류:', err);
      console.error('오류 응답:', err.response);
      console.error('오류 상태 코드:', err.response?.status);
      console.error('오류 상태 텍스트:', err.response?.statusText);
      console.error('오류 데이터:', err.response?.data);
      console.error('오류 헤더:', err.response?.headers);
      console.error('요청 URL:', err.config?.url);
      console.error('요청 파라미터:', err.config?.params);

      setError(`매장별 사용자 정보를 불러오는 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 매장명 클릭 핸들러
  const handleStoreClick = (tournamentId, storeId, storeName) => {
    fetchStoreUsers(tournamentId, storeId, storeName);
  };

  // 시트권 추가 버튼 클릭 핸들러 추가
  const handleAddSeatTicket = async (tournamentId) => {
    console.log('시트권 추가 버튼 클릭:', tournamentId);
    
    setSelectedTournamentForTicket(tournamentId);
    setLoadingStores(true);
    
    // 페이지네이션 초기화
    setCurrentPage(1);
    
    // 일단 모달부터 열기
    setShowAddTicketModal(true);
    
    try {
      // 할당 가능한 매장 목록과 이미 할당된 매장 목록을 함께 조회
      const response = await distributionAPI.getAvailableStores(tournamentId);
      console.log('매장 목록 조회 성공:', response.data);
      
      const availableStoresList = response.data.available_stores || [];
      const allocatedStoresList = response.data.allocated_stores || [];
      
      setAvailableStores(availableStoresList);
      setAllocatedStores(allocatedStoresList);
      
      // 전체 매장 목록 생성 (분배된 매장 + 미분배 매장)
      const allStores = [...allocatedStoresList, ...availableStoresList];
      setAllStoresForDistribution(allStores);
      
      // 기존 분배 정보 조회하여 초기값 설정
      const distributionResponse = await distributionAPI.getSummaryByTournament(tournamentId);
      const existingDistributions = distributionResponse.data.store_distributions || [];
      
      // 기존 분배량을 초기값으로 설정
      const initialQuantities = {};
      existingDistributions.forEach(dist => {
        initialQuantities[dist.store_id] = dist.allocated_quantity || 0;
      });
      
      // 아직 분배되지 않은 매장은 0으로 설정
      availableStoresList.forEach(store => {
        if (!initialQuantities[store.id]) {
          initialQuantities[store.id] = 0;
        }
      });
      
      // 폼 데이터 초기화 (기존 분배량 반영)
      setTicketFormData({
        storeQuantities: initialQuantities
      });
      
    } catch (err) {
      console.error('매장 목록 조회 오류:', err);
      console.error('오류 상세:', err.response);
      
      // API가 구현되지 않은 경우 임시로 빈 배열 설정
      setAvailableStores([]);
      setAllocatedStores([]);
      setAllStoresForDistribution([]);
      
      // 폼 데이터 초기화
      setTicketFormData({
        storeQuantities: {}
      });
      
      // 에러 메시지를 사용자에게 표시 (모달은 그대로 유지)
      setError(`매장 목록을 불러오는 중 오류가 발생했습니다: ${err.message}. 백엔드 API 구현이 필요합니다.`);
      
      // 3초 후 에러 메시지 제거
      setTimeout(() => {
        setError(null);
      }, 5000);
      
    } finally {
      setLoadingStores(false);
    }
  };

  // 매장별 분배 수량 변경
  const updateStoreQuantity = (storeId, quantity) => {
    setTicketFormData(prev => ({
      ...prev,
      storeQuantities: {
        ...prev.storeQuantities,
        [storeId]: parseInt(quantity) || 0
      }
    }));
  };

  // 페이지네이션 관련 함수들
  const getTotalPages = () => {
    return Math.ceil(allStoresForDistribution.length / itemsPerPage);
  };

  const getCurrentPageStores = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allStoresForDistribution.slice(startIndex, endIndex);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationItems = () => {
    const totalPages = getTotalPages();
    const items = [];
    
    // 이전 버튼
    items.push(
      <Pagination.Prev 
        key="prev" 
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      />
    );

    // 페이지 번호들
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    // 다음 버튼
    items.push(
      <Pagination.Next 
        key="next" 
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      />
    );

    return items;
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
      if (!formData.name || !formData.start_date || !formData.start_time || !formData.buy_in || !formData.ticket_quantity) {
        setError('모든 필수 필드를 입력해주세요.');
        setLoading(false);
        return;
      }

      // 날짜 & 시간 결합
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;

      // 폼 데이터 준비 (현재 백엔드는 단일 매장만 지원하므로 첫 번째 매장 사용)
      const tournamentData = {
        name: formData.name,
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
  };  // 토너먼트 테이블 컬럼 정의
  const tournamentColumns = useMemo(() => [
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>대회명</span>,
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
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>SEAT권 총 수량</span>,
      selector: (row) => row.ticket_quantity,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>매장 수량</span>,
      selector: (row) => {
        const details = tournamentDetailsCache.get(row.id);
        return details?.매장_수량 || 0;
      },
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      })
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>선수 수량</span>,
      selector: (row) => {
        const details = tournamentDetailsCache.get(row.id);
        return details?.선수_수량 || 0;
      },
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
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      }),
      cell: (row) => {
        const getStatusColor = (status) => {
          switch (status) {
            case 'UPCOMING': return '#17a2b8'; // 파란색
            case 'ONGOING': return '#28a745'; // 초록색
            case 'COMPLETED': return '#6c757d'; // 회색
            case 'CANCELLED': return '#dc3545'; // 빨간색
            default: return '#6c757d';
          }
        };
        
        return (
          <span 
            style={{ 
              color: getStatusColor(row.status),
              fontWeight: 'bold',
              fontSize: expandedRowId === row.id ? '18px' : '14px',
              transition: 'all 0.3s ease'
            }}
          >
            {row.status}
          </span>
        );
      }
    }
  ], [expandedRowId, tournamentDetailsCache]);

  // 행 확장/축소 핸들러
  const handleRowExpandToggled = (expanded, row) => {
    if (expanded) {
      setExpandedRowId(row.id);
      // 확장 시 상세 정보 가져오기
      fetchTournamentDetails(row.id);
    } else {
      setExpandedRowId(null);
    }
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
              <div className="d-flex justify-content-between align-items-center mb-3 bg-dark text-white p-3 rounded border border-light">
                <h4 className="mb-0" style={{ fontWeight: 'bold', color: 'white' }}>매장별 현황</h4>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleAddSeatTicket(data.id)}
                  className="ms-2"
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  <i className="fas fa-plus me-1"></i>
                  시트권 추가
                </Button>
              </div>
              <Table bordered size="sm" className="mb-0" style={{ backgroundColor: '#ffffff' }}>
                <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                  <tr>
                    <th className="border border-dark text-white">매장명</th>
                    <th className="border border-dark text-white">SEAT권 수량</th>
                    <th className="border border-dark text-white">SEAT권 배포 수량</th>
                    <th className="border border-dark text-white">보유 수량</th>
                  </tr>
                </thead>
                <tbody>
                  {tournamentDetails.매장별_현황?.length > 0 ? (
                    tournamentDetails.매장별_현황.map((store, index) => {
                      const selectedStore = selectedStoreByTournament.get(data.id);
                      const isSelected = selectedStore && selectedStore.storeId === store.매장_ID;

                      return (
                        <tr
                          key={index}
                          style={{
                            backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleStoreClick(data.id, store.매장_ID, store.매장명)}
                        >
                          <td
                            className="border border-secondary"
                            style={{
                              fontWeight: isSelected ? 'bold' : 'normal',
                              color: isSelected ? '#1976d2' : 'inherit'
                            }}
                          >
                            {store.매장명}
                            {isSelected && <span className="ms-2">👈 선택됨</span>}
                          </td>
                          <td className="text-center border border-secondary">{store.좌석권_수량 || 0}</td>
                          <td className="text-center border border-secondary">{store.배포된_수량 || 0}</td>
                          <td className="text-center border border-secondary">{store.보유_수량 || 0}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center border border-secondary">매장 데이터가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>

          {/* 선수별 현황 */}
          <div className="col-md-6">
            <div className="border border-light rounded p-3 mb-3" style={{ backgroundColor: '#b02a37' }}>
              <h4 className="mb-3 bg-dark text-white p-3 rounded border border-light text-center" style={{ fontWeight: 'bold' }}>
                선수별 현황
                {(() => {
                  const selectedStore = selectedStoreByTournament.get(data.id);
                  return selectedStore ? (
                    <small className="d-block mt-1" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                      📍 {selectedStore.storeName} 매장 선수 목록
                    </small>
                  ) : (
                    <small className="d-block mt-1" style={{ fontSize: '14px', fontWeight: 'normal' }}>
                      💡 매장명을 클릭하면 해당 매장 선수를 조회합니다
                    </small>
                  );
                })()}
              </h4>
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
                        <td className="text-center border border-secondary">{player.좌석권_수량 || 0}</td>
                        <td className="border border-secondary">{player.매장명}</td>
                        <td className="text-center border border-secondary">0</td>
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
                  <h4 className="text-white">{tournamentDetails.선수_수량 || 0}명</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleShowModal = (board = null) => {
    // 모달 에러 상태 초기화
    setError(null);

    if (board) {
      setFormData({
        title: board.title,
        content: board.content,
        notice_type: board.notice_type,
        priority: board.priority,
        z_order: board.z_order,
        is_published: board.is_published,
        is_pinned: board.is_pinned,
        start_date: board.start_date ? board.start_date.slice(0, 16) : '',
        end_date: board.end_date ? board.end_date.slice(0, 16) : ''
      });
    } else {
      // 새 토너먼트 작성 시 현재 날짜와 시간 설정
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm 형식

      setFormData({
        title: '',
        content: '',
        notice_type: 'GENERAL',
        priority: 'NORMAL',
        z_order: 0,
        is_published: true,
        is_pinned: false,
        start_date: currentDate,
        start_time: currentTime,
        buy_in: '',
        ticket_quantity: '',
        description: '',
        status: 'UPCOMING'
      });
    }
    setShowCreateModal(true);
  };

  // 토너먼트 생성 모달을 여는 함수
  const openCreateModal = () => {
    // 현재 날짜와 시간 설정
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm 형식

    setFormData({
      name: '',
      start_date: currentDate,
      start_time: currentTime,
      buy_in: '',
      ticket_quantity: '',
      description: '',
      status: 'UPCOMING'
    });

    setShowCreateModal(true);
  };

  // 시트권 분배 실행
  const handleSubmitTicketDistribution = async () => {
    if (!selectedTournamentForTicket) return;

    try {
      setLoading(true);
      setError(null);

      // 분배 수량이 0보다 큰 매장들만 필터링
      const distributionsToCreate = Object.entries(ticketFormData.storeQuantities)
        .filter(([storeId, quantity]) => quantity > 0)
        .map(([storeId, quantity]) => ({
          store_id: parseInt(storeId),
          allocated_quantity: quantity,
          memo: `매장별 시트권 분배 - ${quantity}개`
        }));

      if (distributionsToCreate.length === 0) {
        setError('최소 1개 이상의 매장에 분배 수량을 입력해주세요.');
        setLoading(false);
        return;
      }

      const response = await distributionAPI.createBulkDistribution(
        selectedTournamentForTicket,
        distributionsToCreate
      );

      setSuccess('시트권 분배가 성공적으로 완료되었습니다.');
      setShowAddTicketModal(false);
      
      // 토너먼트 목록 새로고침
      fetchTournaments();
      
      // 해당 토너먼트 상세 정보 새로고침
      setTournamentDetailsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(selectedTournamentForTicket);
        return newCache;
      });
      
      fetchTournamentDetails(selectedTournamentForTicket);

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('시트권 분배 오류:', err);
      setError(err.response?.data?.message || '시트권 분배 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>토너먼트 관리</h2>
        <Button variant="primary" onClick={openCreateModal}>
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
          ) : (            <DataTable
              columns={tournamentColumns}
              data={getFilteredTournaments()}
              pagination
              paginationPerPage={20}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
              expandableRows
              expandableRowsComponent={ExpandedTournamentComponent}
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
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            새 토너먼트 생성
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleCreateTournament}>
            {/* 토너먼트 이름 */}
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    토너먼트 이름 <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="예: 주말 스페셜 토너먼트"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    maxLength={100}
                  />
                  <Form.Text className="text-muted">
                    최대 100자까지 입력 가능합니다.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    시작 날짜 <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Form.Text className="text-muted">
                    오늘 이후 날짜만 선택 가능합니다.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    시작 시간 <span className="text-danger">*</span>
                  </Form.Label>
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
                  <Form.Label>
                    바이인 <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="number"
                      placeholder="1"
                      name="buy_in"
                      value={formData.buy_in}
                      onChange={handleFormChange}
                      required
                      min="0"
                      step="1"
                    />
                    <span className="input-group-text">매</span>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    SEAT 권 수량 <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="number"
                      placeholder="100"
                      name="ticket_quantity"
                      value={formData.ticket_quantity}
                      onChange={handleFormChange}
                      required
                      min="1"
                      max="1000"
                    />
                    <span className="input-group-text">매</span>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>토너먼트 설명</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="토너먼트에 대한 상세 설명을 입력해주세요. (선택사항)"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                maxLength={500}
              />
              <Form.Text className="text-muted">
                최대 500자까지 입력 가능합니다. ({formData.description.length}/500)
              </Form.Text>
            </Form.Group>

            <hr />

            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted">
                <small>
                  <i className="fas fa-info-circle me-1"></i>
                  <span className="text-danger">*</span> 표시된 항목은 필수 입력 사항입니다.
                  <br />
                  매장 정보는 토너먼트 생성 후 SEAT 권 분배 시 자동으로 연결됩니다.
                </small>
              </div>
              <div>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="me-2"
                  disabled={loading}
                >
                  <i className="fas fa-times me-1"></i>
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
                      생성 중...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus me-1"></i>
                      토너먼트 생성
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 시트권 추가 모달 */}
      <Modal
        show={showAddTicketModal}
        onHide={() => setShowAddTicketModal(false)}
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            시트권 매장별 분배
            {selectedTournamentForTicket && (
              <small className="text-muted d-block mt-1">
                대회명: {(() => {
                  const tournament = tournaments.find(t => t.id === selectedTournamentForTicket);
                  return tournament ? tournament.name : `토너먼트 ID: ${selectedTournamentForTicket}`;
                })()}
              </small>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {loadingStores ? (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">매장 정보를 불러오는 중입니다...</p>
            </div>
          ) : (
            <>
              {/* 매장별 분배 설정 */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">매장별 시트권 분배</h6>
                  <div className="text-muted">
                    <small>
                      {allStoresForDistribution.length > 0 ? (
                        <>
                          총 {allStoresForDistribution.length}개 매장 중 {currentPage * itemsPerPage - itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, allStoresForDistribution.length)}번째 매장
                        </>
                      ) : (
                        '매장 없음'
                      )}
                    </small>
                  </div>
                </div>
                
                {allStoresForDistribution.length > 0 ? (
                  <>
                    <div className="border rounded p-3" style={{ minHeight: '400px', maxHeight: '400px', overflowY: 'auto' }}>
                      {getCurrentPageStores().map(store => {
                        const isAllocated = allocatedStores.some(allocatedStore => allocatedStore.id === store.id);
                        return (
                          <Row key={store.id} className="mb-3 align-items-center">
                            <Col md={8}>
                              <div>
                                <strong>{store.name}</strong>
                                {isAllocated && <span className="badge bg-success ms-2">분배완료</span>}
                                <small className="text-muted d-block">{store.address || '주소 없음'}</small>
                              </div>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label className="small">SEAT권 수량</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={ticketFormData.storeQuantities[store.id] || 0}
                                  onChange={(e) => updateStoreQuantity(store.id, e.target.value)}
                                  placeholder="0"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        );
                      })}
                    </div>

                    {/* 페이지네이션 */}
                    {getTotalPages() > 1 && (
                      <div className="d-flex justify-content-center mt-3">
                        <Pagination size="sm">
                          {renderPaginationItems()}
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted py-4" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <i className="fas fa-store fa-2x mb-2"></i>
                    <p>매장 정보가 없습니다.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowAddTicketModal(false)}
            disabled={loading}
          >
            <i className="fas fa-times me-1"></i>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitTicketDistribution}
            disabled={loading || allStoresForDistribution.length === 0 || !Object.values(ticketFormData.storeQuantities).some(qty => qty > 0)}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                분배 중...
              </>
            ) : (
              <>
                <i className="fas fa-check me-1"></i>
                시트권 분배 실행
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TournamentManagement; 