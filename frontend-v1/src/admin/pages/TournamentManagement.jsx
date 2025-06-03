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

  // 매장별 사용자 데이터 캐시 및 로딩 상태 관리
  const [storeUsersCache, setStoreUsersCache] = useState(new Map()); // 매장별 사용자 캐시
  const [loadingStoreUsers, setLoadingStoreUsers] = useState(new Set()); // 로딩 중인 매장

  // 선택된 매장 상태 추가
  const [selectedStoreByTournament, setSelectedStoreByTournament] = useState(new Map());

  // 매장별 현황 필터 상태 추가
  const [storeFilters, setStoreFilters] = useState(new Map());

  // SEAT권 수정 모달 상태 추가
  const [showSeatEditModal, setShowSeatEditModal] = useState(false);
  const [seatEditModalLoading, setSeatEditModalLoading] = useState(false);
  const [selectedStoreForSeatEdit, setSelectedStoreForSeatEdit] = useState(null);
  const [seatEditFormData, setSeatEditFormData] = useState({
    action: 'add', // 'add' 또는 'remove'
    quantity: '',
  });

  // 토너먼트 수정 모달 관련 상태 추가
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: '',
    start_date: '',
    start_time: '',
    buy_in: '',
    ticket_quantity: '',
    description: '',
    status: 'UPCOMING'
  });
  const [editModalLoading, setEditModalLoading] = useState(false);

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

      console.log(`토너먼트 목록 로딩 완료: ${response.data?.length || 0}개`);

      // 초기 로딩 시 모든 토너먼트의 상세 정보를 백그라운드에서 병렬 로딩
      // 이렇게 하면 선수 수량 등이 테이블에 즉시 표시됩니다.
      if (response.data && Array.isArray(response.data)) {
        console.log('백그라운드에서 모든 토너먼트 상세 정보 로딩 시작...');
        
        // 매장 정보를 먼저 로딩 (모든 토너먼트에서 공통으로 사용)
        await fetchAllStores();
        
        // 모든 토너먼트의 상세 정보를 병렬로 로딩
        const detailsPromises = response.data.map(tournament => 
          fetchTournamentDetails(tournament.id).catch(err => {
            console.warn(`토너먼트 ${tournament.id} 상세 정보 로딩 실패:`, err);
            return null; // 개별 실패는 무시하고 계속 진행
          })
        );
        
        await Promise.all(detailsPromises);
        console.log('백그라운드 상세 정보 로딩 완료');
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

      // 🚀 백그라운드 프리로딩: SEAT권을 보유한 매장들의 사용자 데이터를 미리 로딩
      console.log('🔄 백그라운드 프리로딩 시작: SEAT권 보유 매장들의 사용자 데이터');
      const storesWithTickets = combinedStoreData.filter(store => store.ticketQuantity > 0);
      
      if (storesWithTickets.length > 0) {
        console.log(`📋 프리로딩 대상 매장: ${storesWithTickets.length}개`);
        
        // 프리로딩은 백그라운드에서 병렬로 실행 (UI 블록킹 방지)
        setTimeout(() => {
          Promise.all(
            storesWithTickets.slice(0, 3).map(store => { // 상위 3개 매장만 프리로딩 (성능 고려)
              const cacheKey = `${tournamentId}-${store.storeId}`;
              if (!storeUsersCache.has(cacheKey) && !loadingStoreUsers.has(cacheKey)) {
                console.log(`🔄 백그라운드 프리로딩: ${store.storeName}`);
                return fetchStoreUsers(tournamentId, store.storeId, store.storeName);
              }
              return Promise.resolve();
            })
          ).then(() => {
            console.log('✅ 백그라운드 프리로딩 완료');
          }).catch(err => {
            console.warn('⚠️ 백그라운드 프리로딩 중 일부 오류 발생:', err);
          });
        }, 100); // 100ms 후 실행 (메인 로딩 완료 후)
      }

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

  // 매장별 사용자 조회 함수 수정 (성능 최적화)
  const fetchStoreUsers = async (tournamentId, storeId, storeName) => {
    // 캐시 키 생성
    const cacheKey = `${tournamentId}-${storeId}`;
    
    // 1. 즉시 피드백: 선택된 매장 상태를 먼저 업데이트 (UI 반응성 개선)
    setSelectedStoreByTournament(prev => new Map([...prev, [tournamentId, { storeId, storeName }]]));
    
    // 2. 캐시 확인: 이미 불러온 데이터가 있으면 즉시 반환
    if (storeUsersCache.has(cacheKey)) {
      console.log(`🎯 캐시에서 사용자 데이터 즉시 반환: ${storeName} (캐시키: ${cacheKey})`);
      const cachedUsers = storeUsersCache.get(cacheKey);
      
      // 캐시된 데이터로 즉시 업데이트
      setTournamentDetailsCache(prev => {
        const newCache = new Map(prev);
        const tournamentDetails = newCache.get(tournamentId);
        if (tournamentDetails) {
          newCache.set(tournamentId, {
            ...tournamentDetails,
            playerDetails: cachedUsers
          });
        }
        return newCache;
      });
      return;
    }
    
    // 3. 중복 요청 방지: 이미 로딩 중인 매장은 스킵
    if (loadingStoreUsers.has(cacheKey)) {
      console.log(`⏳ 이미 로딩 중인 매장: ${storeName} (캐시키: ${cacheKey})`);
      return;
    }

    try {
      // 4. 로딩 상태 시작
      setLoadingStoreUsers(prev => new Set([...prev, cacheKey]));
      
      console.log(`🔄 매장별 전체 사용자 조회 시작: ${storeName} (ID: ${storeId}), 토너먼트: ${tournamentId}`);

      // 5. API 호출 시작
      const response = await seatTicketAPI.getStoreUsers(storeId, tournamentId);

      console.log('📊 매장별 전체 사용자 조회 응답:', response.data);

      // API 응답에서 사용자 데이터 추출
      const usersData = response.data?.users || [];
      
      console.log(`📋 ${storeName} 매장의 전체 사용자 데이터:`, usersData);

      let storeUsers = [];

      if (usersData.length === 0) {
        console.log(`❌ ${storeName} 매장에 등록된 사용자가 없습니다.`);
        storeUsers.push({
          userId: null,
          playerName: '등록된 선수가 없습니다',
          playerPhone: '',
          storeName: storeName,
          activeTickets: 0,
          usedTickets: 0,
          totalTickets: 0,
          hasTicket: 'N'
        });
      } else {
        // API에서 이미 정렬된 사용자 데이터를 그대로 사용
        // (해당 토너먼트 좌석권 보유자가 상단에 배치됨)
        storeUsers = usersData.map(user => ({
          userId: user.userId,
          playerName: user.playerName,
          playerPhone: user.playerPhone,
          storeName: user.storeName,
          activeTickets: user.activeTickets,
          usedTickets: user.usedTickets,
          totalTickets: user.totalTickets,
          hasTicket: user.hasTicket
        }));
        
        console.log(`✅ ${storeName} 매장 전체 사용자 ${storeUsers.length}명 조회 완료`);
        console.log('- 해당 토너먼트 좌석권 보유자:', storeUsers.filter(u => u.hasTicket === 'Y').length, '명');
        console.log('- 해당 토너먼트 좌석권 미보유자:', storeUsers.filter(u => u.hasTicket === 'N').length, '명');
      }

      // 6. 캐시에 저장 (향후 빠른 접근을 위해)
      setStoreUsersCache(prev => new Map([...prev, [cacheKey, storeUsers]]));
      console.log(`💾 사용자 데이터 캐시 저장: ${cacheKey}`);

      // 7. 토너먼트 상세 정보 업데이트
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

    } catch (err) {
      console.error('❌ 매장별 전체 사용자 조회 오류:', err);
      setError(`매장별 사용자 정보를 불러오는 중 오류가 발생했습니다: ${err.message}`);
      
      // 오류 발생 시 빈 목록 표시
      const errorUsers = [{
        userId: null,
        playerName: '사용자 정보를 불러올 수 없습니다',
        playerPhone: '',
        storeName: storeName,
        activeTickets: 0,
        usedTickets: 0,
        totalTickets: 0,
        hasTicket: 'N'
      }];
      
      // 오류 상태도 캐시에 저장 (무한 재시도 방지)
      setStoreUsersCache(prev => new Map([...prev, [cacheKey, errorUsers]]));
      
      setTournamentDetailsCache(prev => {
        const newCache = new Map(prev);
        const tournamentDetails = newCache.get(tournamentId);
        if (tournamentDetails) {
          newCache.set(tournamentId, {
            ...tournamentDetails,
            playerDetails: errorUsers
          });
        }
        return newCache;
      });
    } finally {
      // 8. 로딩 상태 종료
      setLoadingStoreUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });
    }
  };

  // 캐시 초기화 함수 (필요 시 데이터 새로고침)
  const clearStoreUsersCache = () => {
    setStoreUsersCache(new Map());
    console.log('🧹 매장별 사용자 캐시 초기화 완료');
  };

  // 특정 매장의 캐시만 초기화
  const clearStoreUsersCacheByStore = (tournamentId, storeId) => {
    const cacheKey = `${tournamentId}-${storeId}`;
    setStoreUsersCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(cacheKey);
      return newCache;
    });
    console.log(`🧹 특정 매장 캐시 초기화: ${cacheKey}`);
  };

  // 매장명 클릭 핸들러 (강제 새로고침 옵션 추가)
  const handleStoreClick = (tournamentId, storeId, storeName, forceRefresh = false) => {
    if (forceRefresh) {
      clearStoreUsersCacheByStore(tournamentId, storeId);
    }
    fetchStoreUsers(tournamentId, storeId, storeName);
  };

  // SEAT권 수정 모달 열기
  const handleOpenSeatEditModal = (tournamentId, storeData) => {
    setSelectedStoreForSeatEdit({
      tournamentId,
      storeId: storeData.storeId,
      storeName: storeData.storeName,
      currentQuantity: storeData.ticketQuantity || 0, // 현재 총 SEAT권 수량
      distributedQuantity: storeData.distributedQuantity || 0,
      remainingQuantity: storeData.remainingQuantity || 0
    });
    setSeatEditFormData({
      action: 'add', // 이 값은 더 이상 직접적인 의미는 없지만, 혹시 모를 사이드 이펙트 방지 위해 유지
      // "변경할 수량"의 기본값을 현재 매장의 총 SEAT권 수량으로 설정
      quantity: storeData.ticketQuantity || 0, 
    });
    setError(null); // 이전 오류 메시지 초기화
    setShowSeatEditModal(true);
  };

  // SEAT권 수정 모달 폼 데이터 변경 핸들러
  const handleSeatEditFormChange = (e) => {
    const { name, value } = e.target;
    setSeatEditFormData({
      ...seatEditFormData,
      [name]: value
    });
  };

  // SEAT권 수량 수정 제출 핸들러 (API 연동)
  const handleSeatQuantityEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSeatEditModalLoading(true);
      setError(null);

      const newTotalQuantity = parseInt(seatEditFormData.quantity);
      // 변경할 수량이 음수이거나 숫자가 아닌 경우 방지
      if (isNaN(newTotalQuantity) || newTotalQuantity < 0) { 
        setError('올바른 수량을 입력해주세요. (0 이상의 숫자)');
        setSeatEditModalLoading(false);
        return;
      }

      const distributionsResponse = await distributionAPI.getSummaryByTournament(selectedStoreForSeatEdit.tournamentId);
      const storeDistributions = distributionsResponse.data.store_distributions || [];
      const currentDistribution = storeDistributions.find(dist => dist.store_id === selectedStoreForSeatEdit.storeId);

      let distributionIdToUpdate = null;
      if (currentDistribution && currentDistribution.id) {
          distributionIdToUpdate = currentDistribution.id;
      } else {
          const distributionListResponse = await distributionAPI.getDistributions({
              tournament: selectedStoreForSeatEdit.tournamentId,
              store: selectedStoreForSeatEdit.storeId
          });
          if (distributionListResponse.data && distributionListResponse.data.results && distributionListResponse.data.results.length > 0) {
              distributionIdToUpdate = distributionListResponse.data.results[0].id;
          } else if (Array.isArray(distributionListResponse.data) && distributionListResponse.data.length > 0 && distributionListResponse.data[0].id) {
            distributionIdToUpdate = distributionListResponse.data[0].id;
        }
      }

      // 새로운 총 할당량은 사용자가 입력한 값이 됨
      const newAllocatedQuantity = newTotalQuantity;

      // 새로운 보유 수량 계산 (새 총량 - 이미 배포된 수량)
      // 만약 새 총량이 배포된 수량보다 적으면, 문제가 될 수 있으므로 서버에서 처리하거나 추가 UI 필요
      // 여기서는 일단 계산된 값을 그대로 사용
      const newRemainingQuantity = newAllocatedQuantity - (selectedStoreForSeatEdit.distributedQuantity || 0);
      if (newRemainingQuantity < 0) {
        // 이 경우, 배포된 티켓을 회수하는 로직이 없다면 문제가 될 수 있음.
        // 일단 경고를 표시하거나, 서버에서 이 상황을 처리하도록 함.
        // 여기서는 일단 진행하되, 콘솔에 경고를 남김.
        console.warn(`경고: 새로운 총 수량(${newAllocatedQuantity})이 배포된 수량(${selectedStoreForSeatEdit.distributedQuantity})보다 적습니다.`);
      }

      const commonPayload = {
        tournament: selectedStoreForSeatEdit.tournamentId,
        store: selectedStoreForSeatEdit.storeId,
        allocated_quantity: newAllocatedQuantity,
        remaining_quantity: newRemainingQuantity >= 0 ? newRemainingQuantity : 0, // 보유 수량은 음수가 될 수 없음
        distributed_quantity: selectedStoreForSeatEdit.distributedQuantity || 0,
        memo: `관리자 수량 변경: 총 ${newAllocatedQuantity}매로 수정`
      };

      if (distributionIdToUpdate) {
        console.log('SEAT권 분배 수정 요청 (수량 변경):', commonPayload);
        await distributionAPI.updateDistribution(distributionIdToUpdate, commonPayload);
      } else {
        console.log('SEAT권 분배 생성 요청 (수량 변경):', commonPayload);
        await distributionAPI.createDistribution(commonPayload);
      }

      setSuccess(`${selectedStoreForSeatEdit.storeName} 매장의 SEAT권 총 수량이 ${newAllocatedQuantity}매로 성공적으로 변경되었습니다.`);

      // 전체 토너먼트 상세 정보 다시 불러오는 대신, 매장별 현황 관련 데이터만 업데이트
      try {
        setSeatEditModalLoading(true); // 로딩 상태는 유지
        const tournamentId = selectedStoreForSeatEdit.tournamentId;

        // 1. 최신 분배 정보 가져오기
        const newDistributionResponse = await distributionAPI.getSummaryByTournament(tournamentId);
        
        // 2. 매장별 현황 데이터 (storeDetails) 재구성
        const newStoreDistributions = newDistributionResponse.data.store_distributions || [];
        const newDistributionMap = new Map();
        newStoreDistributions.forEach(dist => {
          newDistributionMap.set(dist.store_id, dist);
        });

        // allStoresCache가 로드되었는지 확인, 안되었으면 로드 (일반적으로는 이미 로드되어 있을 것임)
        const currentAllStores = allStoresCache || await fetchAllStores(); 

        const newCombinedStoreData = (currentAllStores || []).map(store => {
          const distribution = newDistributionMap.get(store.id);
          return {
            storeName: store.name || '미지정 매장',
            storeId: store.id,
            ticketQuantity: distribution?.allocated_quantity || 0,
            distributedQuantity: distribution?.distributed_quantity || 0,
            remainingQuantity: distribution?.remaining_quantity || 0,
          };
        });

        // 3. 캐시 업데이트 (부분 업데이트)
        setTournamentDetailsCache(prevCache => {
          const updatedCache = new Map(prevCache);
          const currentTournamentDetails = updatedCache.get(tournamentId);

          if (currentTournamentDetails) {
            const updatedDetails = {
              ...currentTournamentDetails,
              storeDetails: newCombinedStoreData,
              totalTicketQuantity: newDistributionResponse.data.tournament?.ticket_quantity || currentTournamentDetails.totalTicketQuantity,
              distributedTicketQuantity: newDistributionResponse.data.summary?.total_distributed || currentTournamentDetails.distributedTicketQuantity,
              // storeCount는 allStoresCache 기반이므로 변경 필요 없음
              // playerCount, usedTicketQuantity 등 다른 API에서 오는 정보는 이 부분 업데이트에서 제외
            };
            updatedCache.set(tournamentId, updatedDetails);
            console.log(`토너먼트 ${tournamentId}의 매장별 현황 캐시 업데이트 완료`);
          } else {
            console.warn(`토너먼트 ${tournamentId} 캐시 정보를 찾을 수 없어 부분 업데이트 실패`);
            // 캐시가 없는 경우, 전체를 다시 불러오도록 유도할 수도 있으나, 일단은 경고만
            // 이 경우 사용자는 행을 다시 확장해야 할 수 있음
          }
          return updatedCache;
        });

      } catch (err) {
        console.error('매장별 현황 업데이트 중 오류:', err);
        setError('매장별 현황을 업데이트하는 중 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.');
        // 성공 메시지가 이미 설정되었을 수 있으므로, 오류 발생 시 성공 메시지 초기화
        setSuccess(null);
      }

      setShowSeatEditModal(false);
      setSeatEditModalLoading(false);

      setTimeout(() => {
        setSuccess(null);
        // setError(null); // 위에서 에러 발생 시 success를 null로 하므로, 여기서 error도 같이 null 처리해줄 수 있음
      }, 3000);

    } catch (err) {
      console.error('SEAT권 수량 조정 오류:', err);
      if (err.response && err.response.data) {
        setError(`SEAT권 수량 조정 중 오류가 발생했습니다: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('SEAT권 수량 조정 중 오류가 발생했습니다.');
      }
      setSeatEditModalLoading(false);
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
      }),
      cell: (row) => (
        <span style={{ 
          fontSize: expandedRowId === row.id ? '18px' : '14px',
          fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
          transition: 'all 0.3s ease'
        }}>
          {row.name}
        </span>
      )
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>바이인</span>,
      selector: (row) => row.buy_in,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      }),
      cell: (row) => (
        <span style={{ 
          fontSize: expandedRowId === row.id ? '18px' : '14px',
          fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
          transition: 'all 0.3s ease'
        }}>
          {row.buy_in || 0}매
        </span>
      )
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
      }),
      cell: (row) => (
        <span style={{ 
          fontSize: expandedRowId === row.id ? '18px' : '14px',
          fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
          transition: 'all 0.3s ease'
        }}>
          {row.ticket_quantity}
        </span>
      )
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>매장 수량 SEAT권</span>,
      selector: (row) => {
        const details = tournamentDetailsCache.get(row.id);
        if (!details?.storeDetails) {
          return 0;
        }
        // 매장에 할당된 총 SEAT권 수량 계산
        return details.storeDetails.reduce((sum, store) => sum + (store.ticketQuantity || 0), 0);
      },
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      }),
      cell: (row) => {
        const details = tournamentDetailsCache.get(row.id);
        const totalAllocated = details?.storeDetails 
          ? details.storeDetails.reduce((sum, store) => sum + (store.ticketQuantity || 0), 0)
          : 0;
        
        return (
          <span style={{ 
            fontSize: expandedRowId === row.id ? '18px' : '14px',
            fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}>
            {totalAllocated}
          </span>
        );
      }
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
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>작업</span>,
      button: true,
      cell: (row) => (
        <div className="d-flex justify-content-center">
          <Button
            variant="outline-info"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // 행 확장 방지
              handleOpenEditModal(row);
            }}
            className="me-2 py-1 px-2"
            style={{ fontSize: '12px' }}
            title="수정"
          >
            <i className="fas fa-edit"></i>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // 행 확장 방지
              console.log('토너먼트 삭제:', row.id);
              // TODO: 토너먼트 삭제 기능 구현 예정
            }}
            className="py-1 px-2"
            style={{ fontSize: '12px' }}
            title="삭제"
          >
            <i className="fas fa-trash"></i>
          </Button>
        </div>
      ),
      center: true,
      ignoreRowClick: true,
      allowOverflow: true,
      minWidth: '120px'
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

    // 매장에 할당된 총 SEAT권 수량 계산
    const totalAllocatedToStores = useMemo(() => {
      if (!tournamentDetails?.storeDetails) {
        return 0;
      }
      return tournamentDetails.storeDetails.reduce((sum, store) => sum + (store.ticketQuantity || 0), 0);
    }, [tournamentDetails?.storeDetails]);

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
              
              {/* 매장별 현황 안내 문구 */}
              <div className="text-end mb-1">
                <small style={{ color: '#e3f2fd', fontSize: '12px' }}>
                  💡 매장명을 클릭하면 해당 매장 선수를 조회합니다 
                  <span className="ms-1" title="한 번 조회한 데이터는 캐시되어 빠르게 로딩됩니다">
                    (🚀 빠른 로딩)
                  </span>
                </small>
              </div>
              <Table bordered size="sm" className="mb-0" style={{ backgroundColor: '#ffffff' }}>
                <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                  <tr>
                    <th className="border border-dark text-white">매장명</th>
                    <th className="border border-dark text-white">SEAT권 배포 수량</th>
                    <th className="border border-dark text-white">SEAT권 보유 수량</th>
                    <th className="border border-dark text-white">SEAT권 전체 수량</th>
                    <th className="border border-dark text-white">SEAT권 수량변경</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.length > 0 ? (
                    filteredStores.map((store, index) => {
                      const selectedStore = selectedStoreByTournament.get(data.id);
                      const isSelected = selectedStore && selectedStore.storeId === store.storeId;
                      const cacheKey = `${data.id}-${store.storeId}`;
                      const isLoadingUsers = loadingStoreUsers.has(cacheKey);
                      
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
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            onClick={() => handleStoreClick(data.id, store.storeId, store.storeName)}
                          >
                            {/* 로딩 상태 표시 */}
                            {isLoadingUsers && (
                              <Spinner 
                                animation="border" 
                                size="sm" 
                                variant="primary" 
                                className="me-2"
                                style={{ width: '1rem', height: '1rem' }}
                              />
                            )}
                            
                            {/* 매장 상태 아이콘 */}
                            {!isLoadingUsers && (hasSeatTickets ? '🎫' : '❌')} {store.storeName}
                            
                            {/* 선택 상태 표시 */}
                            {isSelected && !isLoadingUsers && <span className="ms-2">▶️</span>}
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
                          <td className="text-center border border-secondary">
                            <Button 
                              size="sm" 
                              variant="info" 
                              style={{ fontSize: '10px', padding: '2px 6px' }}
                              onClick={(e) => {
                                e.stopPropagation(); // 행 전체 클릭 이벤트 전파 방지
                                handleOpenSeatEditModal(data.id, store);
                              }}
                            >
                              변경
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center border border-secondary" style={{ color: '#6c757d', fontStyle: 'italic' }}>
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
                {(() => {
                  const selectedStore = selectedStoreByTournament.get(data.id);
                  const cacheKey = selectedStore ? `${data.id}-${selectedStore.storeId}` : null;
                  const isLoadingUsers = cacheKey && loadingStoreUsers.has(cacheKey);
                  
                  return selectedStore ? (
                    <>
                      {isLoadingUsers && (
                        <Spinner 
                          animation="border" 
                          size="sm" 
                          variant="light" 
                          className="me-2"
                          style={{ width: '1.2rem', height: '1.2rem' }}
                        />
                      )}
                      ▶️ {selectedStore.storeName} 매장선수 목록
                      {isLoadingUsers && <span className="ms-2 text-warning">로딩 중...</span>}
                    </>
                  ) : (
                    <>
                      ▶️ 매장선수 목록
                    </>
                  );
                })()}
              </h4>
              <Table bordered size="sm" className="mb-0" style={{ backgroundColor: '#ffffff' }}>
                <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                  <tr>
                    <th className="border border-dark text-white">선수</th>
                    <th className="border border-dark text-white">SEAT권 보유 수량</th>
                    <th className="border border-dark text-white">SEAT권 사용 수량</th>
                    <th className="border border-dark text-white">획득매장</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const selectedStore = selectedStoreByTournament.get(data.id);
                    const cacheKey = selectedStore ? `${data.id}-${selectedStore.storeId}` : null;
                    const isLoadingUsers = cacheKey && loadingStoreUsers.has(cacheKey);
                    
                    if (isLoadingUsers) {
                      return (
                        <tr>
                          <td colSpan="4" className="text-center border border-secondary p-4">
                            <div className="d-flex align-items-center justify-content-center">
                              <Spinner animation="border" variant="primary" className="me-2" />
                              <span>선수 목록을 불러오는 중입니다...</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    if (tournamentDetails.playerDetails?.length > 0) {
                      return tournamentDetails.playerDetails.map((player, index) => (
                        <tr key={index}>
                          <td className="border border-secondary">{player.playerName}</td>
                          <td className="text-center border border-secondary">{player.activeTickets || 0}</td>
                          <td className="text-center border border-secondary">{player.usedTickets || 0}</td>
                          <td className="border border-secondary">{player.storeName}</td>
                        </tr>
                      ));
                    } else {
                      return (
                        <tr>
                          <td colSpan="4" className="text-center border border-secondary">
                            {selectedStore ? '선수 데이터가 없습니다.' : '매장을 선택해주세요.'}
                          </td>
                        </tr>
                      );
                    }
                  })()}
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
                <div className="col border-end border-light">
                  <h6 className="text-white">SEAT권 총 수량</h6>
                  <h4 className="text-white">{tournamentDetails.totalTicketQuantity || 0}</h4>
                </div>
                <div className="col border-end border-light">
                  <h6 className="text-white">매장 수량 SEAT권</h6>
                  <h4 className="text-white">{totalAllocatedToStores}</h4>
                </div>
                <div className="col border-end border-light">
                  <h6 className="text-white">배포된 SEAT권</h6>
                  <h4 className="text-white">{tournamentDetails.distributedTicketQuantity || 0}</h4>
                </div>
                <div className="col border-end border-light">
                  <h6 className="text-white">사용된 SEAT권</h6>
                  <h4 className="text-white">{tournamentDetails.usedTicketQuantity || 0}</h4>
                </div>
                <div className="col">
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

  // 토너먼트 수정 모달 열기
  const handleOpenEditModal = (tournament) => {
    console.log('토너먼트 수정 모달 열기:', tournament);
    
    // start_time을 date와 time으로 분리
    const startDateTime = new Date(tournament.start_time);
    const startDate = startDateTime.toISOString().split('T')[0];
    const startTime = startDateTime.toTimeString().slice(0, 5);
    
    setEditingTournament(tournament);
    setEditFormData({
      id: tournament.id,
      name: tournament.name || '',
      start_date: startDate,
      start_time: startTime,
      buy_in: tournament.buy_in || '',
      ticket_quantity: tournament.ticket_quantity || '',
      description: tournament.description || '',
      status: tournament.status || 'UPCOMING'
    });
    setError(null); // 이전 오류 메시지 초기화
    setShowEditModal(true);
  };

  // 토너먼트 수정 폼 데이터 변경 핸들러
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // 토너먼트 수정 제출 핸들러
  const handleUpdateTournament = async (e) => {
    e.preventDefault();
    
    try {
      setEditModalLoading(true);
      setError(null);

      // 필수 필드 검증
      if (!editFormData.name || !editFormData.start_date || !editFormData.start_time || 
          !editFormData.buy_in || !editFormData.ticket_quantity) {
        setError('모든 필수 필드를 입력해주세요.');
        setEditModalLoading(false);
        return;
      }

      // 날짜 & 시간 결합
      const startDateTime = `${editFormData.start_date}T${editFormData.start_time}:00`;

      // 수정할 토너먼트 데이터 준비
      const updateData = {
        name: editFormData.name,
        start_time: startDateTime,
        buy_in: editFormData.buy_in,
        ticket_quantity: editFormData.ticket_quantity,
        description: editFormData.description || "",
        status: editFormData.status
      };

      console.log('토너먼트 수정 요청:', updateData);

      // API 호출
      await tournamentAPI.updateTournament(editFormData.id, updateData);

      setSuccess(`토너먼트 "${editFormData.name}"이 성공적으로 수정되었습니다.`);
      
      // 토너먼트 목록 다시 불러오기
      await fetchTournaments();

      // 모달 닫기
      setShowEditModal(false);
      setEditModalLoading(false);

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('토너먼트 수정 오류:', err);
      if (err.response && err.response.data) {
        setError(`토너먼트 수정 중 오류가 발생했습니다: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('토너먼트 수정 중 오류가 발생했습니다.');
      }
      setEditModalLoading(false);
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
                    SEAT권 수량 <span className="text-danger">*</span>
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
                  매장 정보는 토너먼트 생성 후 SEAT권 분배 시 자동으로 연결됩니다.
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

      {/* SEAT권 수정 모달 */}
      <Modal
        show={showSeatEditModal}
        onHide={() => setShowSeatEditModal(false)}
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            SEAT권 수량 변경
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          {selectedStoreForSeatEdit && (
            <>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    🏪 {selectedStoreForSeatEdit.storeName} 매장
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="text-center p-3 border rounded bg-light">
                        <h6 className="text-muted">현재 SEAT권 수량</h6>
                        <h3 className="text-primary fw-bold">{selectedStoreForSeatEdit.currentQuantity}매</h3>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center p-3 border rounded bg-light">
                        <h6 className="text-muted">배포된 수량</h6>
                        <h3 className="text-success fw-bold">{selectedStoreForSeatEdit.distributedQuantity}매</h3>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center p-3 border rounded bg-light">
                        <h6 className="text-muted">보유 수량 (배포 가능)</h6>
                        <h3 className="text-warning fw-bold">{selectedStoreForSeatEdit.remainingQuantity}매</h3>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Form onSubmit={handleSeatQuantityEditSubmit}>
                <Row className="align-items-end">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        변경할 수량 <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="number"
                          placeholder="새로운 총 수량 입력"
                          name="quantity"
                          value={seatEditFormData.quantity}
                          onChange={handleSeatEditFormChange}
                          required
                          min="0" // 총 수량이므로 0매도 가능하도록 변경
                          max={"10000"} 
                          className="form-control-lg"
                        />
                        <span className="input-group-text fs-5">매</span>
                      </div>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    {seatEditFormData.quantity !== '' && !isNaN(parseInt(seatEditFormData.quantity)) && selectedStoreForSeatEdit && (
                      <div className="mb-3 p-3 border rounded bg-light">
                        <h6 className="fw-bold text-center mb-2">변경 후 예상 정보</h6>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-muted">변경 전 총 수량:</span>
                          <strong className="fs-5">{selectedStoreForSeatEdit.currentQuantity}매</strong>
                        </div>
                        <div className={`d-flex justify-content-between align-items-center mb-1 ${parseInt(seatEditFormData.quantity) >= selectedStoreForSeatEdit.currentQuantity ? 'text-success' : 'text-danger'}`}>
                          <span>수량 변화:</span>
                          <strong className="fs-5">
                            {parseInt(seatEditFormData.quantity) - selectedStoreForSeatEdit.currentQuantity >= 0 ? '+' : ''}
                            {parseInt(seatEditFormData.quantity) - selectedStoreForSeatEdit.currentQuantity}매
                          </strong>
                        </div>
                        <hr className="my-1" />
                        <div className="d-flex justify-content-between align-items-center text-primary">
                          <span className="fw-bold">변경 후 총 수량:</span>
                          <strong className="fs-4 fw-bold">
                            {parseInt(seatEditFormData.quantity)}매
                          </strong>
                        </div>
                      </div>
                    )}
                  </Col>
                </Row>

                <hr className="my-4"/>

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      <span className="text-danger">*</span> 표시된 항목은 필수 입력 사항입니다.
                      <br />
                      <i className="fas fa-exclamation-triangle me-1"></i>
                      SEAT권 수량 변경은 즉시 반영되며, 되돌릴 수 없으니 신중하게 작업해주세요.
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowSeatEditModal(false)}
                      disabled={seatEditModalLoading}
                      size="lg"
                    >
                      <i className="fas fa-times me-1"></i>
                      취소
                    </Button>
                    <Button
                      variant='success'
                      type="submit"
                      disabled={seatEditModalLoading || seatEditFormData.quantity === '' || isNaN(parseInt(seatEditFormData.quantity)) || parseInt(seatEditFormData.quantity) < 0}
                      size="lg"
                    >
                      {seatEditModalLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          처리 중...
                        </>
                      ) : (
                        <>
                          <i className={`fas fa-edit me-1`}></i> 
                          SEAT권 수량 변경
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* 토너먼트 수정 모달 */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            토너먼트 정보 수정
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {editingTournament && (
            <>
              <div className="mb-4 p-3 border rounded bg-light">
                <h6 className="fw-bold text-center mb-2">수정 대상 토너먼트</h6>
                <div className="text-center">
                  <span className="fs-5 fw-bold text-primary">{editingTournament.name}</span>
                  <small className="d-block text-muted mt-1">
                    ID: {editingTournament.id} | 현재 상태: {editingTournament.status}
                  </small>
                </div>
              </div>

              <Form onSubmit={handleUpdateTournament}>
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
                        value={editFormData.name}
                        onChange={handleEditFormChange}
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
                        value={editFormData.start_date}
                        onChange={handleEditFormChange}
                        required
                      />
                      <Form.Text className="text-muted">
                        토너먼트 시작 날짜를 선택해주세요.
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
                        value={editFormData.start_time}
                        onChange={handleEditFormChange}
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
                          value={editFormData.buy_in}
                          onChange={handleEditFormChange}
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
                        SEAT권 총 수량 <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="number"
                          placeholder="100"
                          name="ticket_quantity"
                          value={editFormData.ticket_quantity}
                          onChange={handleEditFormChange}
                          required
                          min="1"
                          max="10000"
                        />
                        <span className="input-group-text">매</span>
                      </div>
                      <Form.Text className="text-muted">
                        토너먼트의 전체 SEAT권 수량을 설정해주세요.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>토너먼트 상태</Form.Label>
                      <Form.Select
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditFormChange}
                      >
                        <option value="UPCOMING">UPCOMING (예정)</option>
                        <option value="ONGOING">ONGOING (진행중)</option>
                        <option value="COMPLETED">COMPLETED (완료)</option>
                        <option value="CANCELLED">CANCELLED (취소)</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        토너먼트의 현재 상태를 선택해주세요.
                      </Form.Text>
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
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    maxLength={500}
                  />
                  <Form.Text className="text-muted">
                    최대 500자까지 입력 가능합니다. ({editFormData.description.length}/500)
                  </Form.Text>
                </Form.Group>

                <hr />

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      <span className="text-danger">*</span> 표시된 항목은 필수 입력 사항입니다.
                      <br />
                      <i className="fas fa-exclamation-triangle me-1"></i>
                      토너먼트 정보 수정은 즉시 반영되며, 신중하게 작업해주세요.
                    </small>
                  </div>
                  <div>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowEditModal(false)}
                      className="me-2"
                      disabled={editModalLoading}
                    >
                      <i className="fas fa-times me-1"></i>
                      취소
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={editModalLoading}
                    >
                      {editModalLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          수정 중...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-1"></i>
                          토너먼트 수정
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TournamentManagement; 