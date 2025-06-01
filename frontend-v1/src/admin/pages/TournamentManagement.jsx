import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Modal, Spinner, Alert, Table } from 'react-bootstrap';
import { tournamentAPI, dashboardAPI, distributionAPI, seatTicketAPI, storeAPI } from '../../utils/api';

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

  // 매장별 현황 필터 상태 추가
  const [storeFilters, setStoreFilters] = useState(new Map());

  // 매장 정보 캐시 추가 (전역 캐시)
  const [allStoresCache, setAllStoresCache] = useState(null);
  const [storesLoading, setStoresLoading] = useState(false);

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

  // 페이지 로드 시 토너먼트 목록 가져오기
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchTournaments();
      fetchAllStores(); // 매장 정보 한 번만 가져오기
    }
  }, []);

  // 매장 정보 캐싱 함수 추가
  const fetchAllStores = async () => {
    if (allStoresCache || storesLoading) {
      return allStoresCache; // 이미 캐시되어 있거나 로딩 중이면 반환
    }

    try {
      setStoresLoading(true);
      console.log('매장 정보 최초 로딩 시작');
      
      const response = await storeAPI.getAllStores();
      const stores = Array.isArray(response.data) ? response.data : [];
      
      setAllStoresCache(stores);
      console.log(`매장 정보 캐시 완료: ${stores.length}개 매장`);
      
      return stores;
    } catch (err) {
      console.error('매장 정보 로딩 실패:', err);
      return [];
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);

      // getAllTournamentInfo로 변경 - 더 풍부한 데이터 제공
      const response = await tournamentAPI.getAllTournamentInfo();
      setTournaments(response.data); // .results 제거 - 직접 배열 구조

      // 백그라운드 상세 정보 로딩 제거 - 필요할 때만 로딩하도록 변경
      console.log(`토너먼트 목록 로딩 완료: ${response.data?.length || 0}개`);

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

      console.log(`토너먼트 ${tournamentId} 상세 정보 로딩 시작`);

      // 매장 정보는 캐시에서 가져오기 (중복 API 호출 방지)
      let allStores = allStoresCache;
      if (!allStores) {
        console.log('매장 캐시가 없어서 새로 로딩');
        allStores = await fetchAllStores();
      }

      // 병렬로 필요한 API만 호출 (매장 정보 제외)
      const [playerMappingResponse, distributionResponse, seatTicketResponse] = await Promise.all([
        dashboardAPI.getPlayerMapping(tournamentId),
        distributionAPI.getSummaryByTournament(tournamentId),
        seatTicketAPI.getTournamentSummary(tournamentId)
      ]);

      console.log('Distribution API 응답:', distributionResponse.data);
      console.log('Store distributions:', distributionResponse.data.store_distributions);
      console.log('캐시된 매장 정보 사용:', allStores?.length || 0, '개 매장');
      
      // 매장별 현황 데이터 처리
      const storeDistributions = distributionResponse.data.store_distributions || [];
      
      // 분배 정보를 매장 ID로 인덱싱
      const distributionMap = new Map();
      storeDistributions.forEach(dist => {
        distributionMap.set(dist.store_id, dist);
      });

      // 전체 매장과 분배 정보 결합
      const combinedStoreData = (allStores || []).map(store => {
        const distribution = distributionMap.get(store.id);
        
        return {
          storeName: store.name || '미지정 매장',
          storeId: store.id,
          ticketQuantity: distribution?.allocated_quantity || 0,
          distributedQuantity: distribution?.distributed_quantity || 0,
          remainingQuantity: distribution?.remaining_quantity || 0
        };
      });

      console.log(`토너먼트 ${tournamentId} 상세 정보 로딩 완료: 매장 ${combinedStoreData.length}개, 선수 ${seatTicketResponse.data.user_summaries?.length || 0}명`);

      // 데이터 통합
      const combinedData = {
        // 기존 플레이어 매핑 데이터
        ...playerMappingResponse.data,

        // 매장별 현황 - 전체 매장 포함 (SEAT권 0인 매장도 포함)
        storeDetails: combinedStoreData,

        // 선수별 현황 (seat ticket API에서)
        playerDetails: seatTicketResponse.data.user_summaries?.map(user => ({
          playerName: user.user_nickname || user.user_phone,
          hasTicket: user.active_tickets > 0 ? 'Y' : 'N',
          storeName: '미지정', // 현재 API에서 매장 정보가 없음
          ticketCount: user.active_tickets || 0
        })) || [],

        // 통계 정보
        totalTicketQuantity: distributionResponse.data.tournament?.ticket_quantity || 0,
        distributedTicketQuantity: distributionResponse.data.summary?.total_distributed || 0,
        usedTicketQuantity: seatTicketResponse.data.ticket_stats?.used_tickets || 0,
        storeCount: combinedStoreData.length, // 전체 매장 수량
        playerCount: seatTicketResponse.data.user_summaries?.length || 0
      };

      console.log('최종 통합 데이터:', combinedData);
      console.log('매장별 현황 최종 데이터:', combinedData.storeDetails);

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
      console.log(`매장별 사용자 조회: ${storeName} (ID: ${storeId})`);

      // 백엔드에서 매장별 필터링된 좌석권 조회
      const response = await seatTicketAPI.getUsersByStore(tournamentId, storeId);

      // API 응답 구조 처리
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

      // 사용자별로 그룹화하여 중복 제거 (백엔드에서 이미 필터링됨)
      const userMap = new Map();
      ticketsData.forEach(ticket => {
        const userId = ticket.user;
        const userPhone = ticket.user_name || '미지정';

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            playerName: userPhone,
            hasTicket: 'Y',
            storeName: storeName,
            ticketCount: 0
          });
        }

        // 활성 좌석권 수량 증가
        if (ticket.status === 'ACTIVE') {
          userMap.get(userId).ticketCount += 1;
        }
      });

      const storeUsers = Array.from(userMap.values());

      // 매장에 사용자가 없는 경우 안내 메시지
      if (storeUsers.length === 0) {
        console.log(`${storeName} 매장에 등록된 사용자가 없습니다.`);
        // 빈 배열이지만 안내 메시지를 위한 더미 데이터 추가
        storeUsers.push({
          playerName: '등록된 선수가 없습니다',
          hasTicket: 'N',
          storeName: storeName,
          ticketCount: 0
        });
      } else {
        console.log(`${storeName} 매장 사용자 ${storeUsers.length}명 조회 완료`);
      }

      // 토너먼트 상세 정보 업데이트
      setTournamentDetailsCache(prev => {
        const newCache = new Map(prev);
        const tournamentDetails = newCache.get(tournamentId);
        if (tournamentDetails) {
          newCache.set(tournamentId, {
            ...tournamentDetails,
            playerDetails: storeUsers
          });
        }
        return newCache;
      });

      // 선택된 매장 정보 저장
      setSelectedStoreByTournament(prev => new Map([...prev, [tournamentId, { storeId, storeName }]]));

    } catch (err) {
      console.error('매장별 사용자 조회 오류:', err);
      setError(`매장별 사용자 정보를 불러오는 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 매장명 클릭 핸들러
  const handleStoreClick = (tournamentId, storeId, storeName) => {
    fetchStoreUsers(tournamentId, storeId, storeName);
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
        return details?.storeCount || 0;
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
        return details?.playerCount || 0;
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
      // 확장 시 상세 정보가 없는 경우에만 가져오기 (중복 방지)
      if (!tournamentDetailsCache.has(row.id) && !loadingDetails.has(row.id)) {
        console.log(`토너먼트 ${row.id} 확장 - 상세 정보 로딩 시작`);
        fetchTournamentDetails(row.id);
      } else if (tournamentDetailsCache.has(row.id)) {
        console.log(`토너먼트 ${row.id} 확장 - 캐시된 데이터 사용`);
      } else {
        console.log(`토너먼트 ${row.id} 확장 - 이미 로딩 중`);
      }
    } else {
      setExpandedRowId(null);
    }
  };

  // 확장된 행에 표시될 실제 데이터 컴포넌트
  const ExpandedTournamentComponent = ({ data }) => {
    const tournamentDetails = tournamentDetailsCache.get(data.id);
    const isLoadingDetails = loadingDetails.has(data.id);

    // 현재 토너먼트의 매장 필터 상태 가져오기
    const currentStoreFilter = storeFilters.get(data.id) || 'with_seats';

    // 매장 필터 변경 핸들러
    const handleStoreFilterChange = (e) => {
      const { value } = e.target;
      setStoreFilters(prev => new Map([...prev, [data.id, value]]));
    };

    // 매장 데이터 필터링 함수
    const getFilteredStores = () => {
      if (!tournamentDetails?.storeDetails) {
        console.log('매장별 현황 데이터가 없습니다:', tournamentDetails);
        return [];
      }
      
      const stores = tournamentDetails.storeDetails;
      console.log('전체 매장 데이터:', stores);
      console.log('현재 필터:', currentStoreFilter);
      
      // 각 매장의 SEAT권 수량 상태 확인
      stores.forEach((store, index) => {
        console.log(`매장 ${index + 1}:`, {
          storeName: store.storeName,
          ticketQuantity: store.ticketQuantity,
          distributedQuantity: store.distributedQuantity,
          remainingQuantity: store.remainingQuantity
        });
      });
      
      let filteredResult = [];
      
      switch (currentStoreFilter) {
        case 'with_seats':
          // SEAT권 보유매장: ticketQuantity가 0보다 큰 매장
          filteredResult = stores.filter(store => {
            const hasSeatTickets = (store.ticketQuantity || 0) > 0;
            console.log(`${store.storeName} - SEAT권 보유 여부:`, hasSeatTickets, `(수량: ${store.ticketQuantity || 0})`);
            return hasSeatTickets;
          });
          break;
          
        case 'without_seats':
          // SEAT권 비보유매장: ticketQuantity가 0인 매장
          filteredResult = stores.filter(store => {
            const noSeatTickets = (store.ticketQuantity || 0) === 0;
            console.log(`${store.storeName} - SEAT권 비보유 여부:`, noSeatTickets, `(수량: ${store.ticketQuantity || 0})`);
            return noSeatTickets;
          });
          break;
          
        case 'all':
        default:
          // 전체매장 - 모든 매장을 명시적으로 포함 (SEAT권 보유/비보유 구분 없이)
          filteredResult = [...stores]; // 배열 복사로 안전하게 처리
          console.log('전체매장 필터 - 모든 매장 포함:', filteredResult.length, '개');
          break;
      }
      
      console.log('필터링 결과:', filteredResult);
      return filteredResult;
    };

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

    const filteredStores = getFilteredStores();

    return (
      <div className="p-4 border border-danger rounded" style={{ backgroundColor: '#dc3545' }}>
        <div className="row">
          {/* 매장별 현황 */}
          <div className="col-md-6">
            <div className="border border-light rounded p-3 mb-3" style={{ backgroundColor: '#b02a37' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 bg-dark text-white p-3 rounded border border-light">
                <h4 className="mb-0" style={{ fontWeight: 'bold', color: 'white' }}>매장별 현황</h4>
                
                {/* 매장 필터 UI */}
                <div className="d-flex align-items-center">
                  <Form.Select
                    size="sm"
                    value={currentStoreFilter}
                    onChange={handleStoreFilterChange}
                    style={{ 
                      width: '180px', 
                      fontSize: '12px',
                      backgroundColor: 'white',
                      color: 'black',
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="all">🏪 전체매장</option>
                    <option value="with_seats">🎫 SEAT권 보유매장</option>
                    <option value="without_seats">❌ SEAT권 비보유매장</option>
                  </Form.Select>
                  <small className="text-white ms-2" style={{ fontSize: '11px', minWidth: '60px' }}>
                    ({filteredStores.length}개)
                  </small>
                </div>
              </div>
              <Table bordered size="sm" className="mb-0" style={{ backgroundColor: '#ffffff' }}>
                <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                  <tr>
                    <th className="border border-dark text-white">매장명</th>
                    <th className="border border-dark text-white">SEAT권 배포 수량</th>
                    <th className="border border-dark text-white">SEAT권 보유 수량</th>
                    <th className="border border-dark text-white">SEAT권 전체 수량</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.length > 0 ? (
                    filteredStores.map((store, index) => {
                      const selectedStore = selectedStoreByTournament.get(data.id);
                      const isSelected = selectedStore && selectedStore.storeId === store.storeId;
                      
                      // SEAT권 보유 여부에 따른 스타일링
                      const hasSeatTickets = (store.ticketQuantity || 0) > 0;
                      const rowStyle = {
                        backgroundColor: isSelected ? '#e3f2fd' : (hasSeatTickets ? 'transparent' : '#fff3cd'),
                        cursor: 'pointer'
                      };

                      return (
                        <tr
                          key={index}
                          style={rowStyle}
                        >
                          <td
                            className="border border-secondary"
                            style={{
                              fontWeight: isSelected ? 'bold' : 'normal',
                              color: isSelected ? '#1976d2' : (hasSeatTickets ? 'inherit' : '#856404'),
                              cursor: 'pointer'
                            }}
                            onClick={() => handleStoreClick(data.id, store.storeId, store.storeName)}
                          >
                            {hasSeatTickets ? '🎫' : '❌'} {store.storeName}
                            {isSelected && <span className="ms-2">👈 선택됨</span>}
                          </td>
                          <td className="text-center border border-secondary">{store.distributedQuantity || 0}</td>
                          <td className="text-center border border-secondary">{store.remainingQuantity || 0}</td>
                          <td className="text-center border border-secondary">
                            <div className="d-flex justify-content-center align-items-center">
                              <span style={{ 
                                fontWeight: hasSeatTickets ? 'bold' : 'normal',
                                color: hasSeatTickets ? '#28a745' : '#dc3545'
                              }}>
                                {store.ticketQuantity || 0}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center border border-secondary" style={{ color: '#6c757d', fontStyle: 'italic' }}>
                        {currentStoreFilter === 'with_seats' && '🎫 SEAT권을 보유한 매장이 없습니다.'}
                        {currentStoreFilter === 'without_seats' && '❌ SEAT권을 보유하지 않은 매장이 없습니다.'}
                        {currentStoreFilter === 'all' && '매장 데이터가 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              
              {/* 필터 통계 정보 */}
              {tournamentDetails.storeDetails?.length > 0 && (
                <div className="mt-2 p-2 bg-light rounded border">
                  <small className="text-muted d-flex justify-content-between">
                    <span>
                      📊 필터 결과: <strong>{filteredStores.length}</strong>개 매장
                    </span>
                    <span>
                      전체: <strong>{tournamentDetails.storeCount}</strong>개 |
                      보유: <strong>{tournamentDetails.storeDetails.filter(store => (store.ticketQuantity || 0) > 0).length}</strong>개 |
                      비보유: <strong>{tournamentDetails.storeDetails.filter(store => (store.ticketQuantity || 0) === 0).length}</strong>개
                    </span>
                  </small>
                </div>
              )}
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
                  {tournamentDetails.playerDetails?.length > 0 ? (
                    tournamentDetails.playerDetails.map((player, index) => (
                      <tr key={index}>
                        <td className="border border-secondary">{player.playerName}</td>
                        <td className="text-center border border-secondary">{player.ticketCount || 0}</td>
                        <td className="border border-secondary">{player.storeName}</td>
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
                  <h4 className="text-white">{tournamentDetails.totalTicketQuantity || 0}</h4>
                </div>
                <div className="col-md-3 border-end border-light">
                  <h6 className="text-white">배포된 SEAT권</h6>
                  <h4 className="text-white">{tournamentDetails.distributedTicketQuantity || 0}</h4>
                </div>
                <div className="col-md-3 border-end border-light">
                  <h6 className="text-white">사용된 SEAT권</h6>
                  <h4 className="text-white">{tournamentDetails.usedTicketQuantity || 0}</h4>
                </div>
                <div className="col-md-3">
                  <h6 className="text-white">참가 선수 수</h6>
                  <h4 className="text-white">{tournamentDetails.playerCount || 0}명</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
    </div>
  );
};

export default TournamentManagement; 