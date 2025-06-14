import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Modal, Spinner, Alert, Table } from 'react-bootstrap';
import { tournamentAPI, dashboardAPI, distributionAPI, seatTicketAPI, storeAPI } from '../../utils/api';

// third party
import DataTable from 'react-data-table-component';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

// Custom DatePicker styles
const datePickerCustomStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container {
    width: 100%;
  }
  .react-datepicker__input-container input {
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #212529;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ced4da;
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
  .react-datepicker__input-container input:focus {
    color: #212529;
    background-color: #fff;
    border-color: #8B4513;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(139, 69, 19, 0.25);
  }
  .react-datepicker {
    font-family: inherit;
  }
  .react-datepicker__header {
    background-color: #8B4513;
    border-bottom: 1px solid #8B4513;
  }
  .react-datepicker__current-month {
    color: white;
    font-weight: bold;
  }
  .react-datepicker__day-name {
    color: white;
  }
  .react-datepicker__day--selected {
    background-color: #8B4513;
    color: white;
  }
  .react-datepicker__day--selected:hover {
    background-color: #6F4E37;
  }
  .react-datepicker__day:hover {
    background-color: #F5F5DC;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #CD853F;
    color: white;
  }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
    background-color: #8B4513;
    color: white;
  }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected:hover {
    background-color: #6F4E37;
  }
  .react-datepicker__today-button {
    background-color: #8B4513;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    margin: 5px;
  }
  .react-datepicker__today-button:hover {
    background-color: #6F4E37;
  }
  .react-datepicker__navigation--previous:hover,
  .react-datepicker__navigation--next:hover {
    border-color: #8B4513;
  }
  .react-datepicker__month-dropdown-container--scroll,
  .react-datepicker__year-dropdown-container--scroll {
    background-color: #FDF5E6;
  }
  .react-datepicker__month-option:hover,
  .react-datepicker__year-option:hover {
    background-color: #F5DEB3;
  }
  .react-datepicker__month-option--selected_month,
  .react-datepicker__year-option--selected_year {
    background-color: #8B4513;
    color: white;
  }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box {
    border-left: 1px solid #8B4513;
  }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box .react-datepicker__time-header {
    color: #8B4513;
    font-weight: bold;
  }
  .react-datepicker__day--today {
    background-color: #F5DEB3;
    color: #8B4513;
    font-weight: bold;
  }
  .react-datepicker__day--today:hover {
    background-color: #DEB887;
  }
  .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
    background-color: #F5DEB3;
    color: #8B4513;
  }
  .react-datepicker__triangle {
    border-bottom-color: #8B4513 !important;
  }
  .react-datepicker__day--weekend {
    color: #A0522D;
  }
  .react-datepicker__day--outside-month {
    color: #D2B48C;
  }
  .react-datepicker__day--disabled {
    color: #DDD;
    background-color: #FDF5E6;
  }
`;

const TournamentManagement = () => {
  // Custom styles를 head에 추가
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = datePickerCustomStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 🆕 초기 로딩과 상세 로딩 분리
  const [initialLoading, setInitialLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);

  // 토너먼트별 상세 데이터 캐시
  const [tournamentDetailsCache, setTournamentDetailsCache] = useState(new Map());
  const [loadingDetails, setLoadingDetails] = useState(new Set());

  // 매장별 사용자 데이터 캐시 및 로딩 상태 관리
  const [storeUsersCache, setStoreUsersCache] = useState(new Map());
  const [loadingStoreUsers, setLoadingStoreUsers] = useState(new Set());

  // 선택된 매장 상태 추가
  const [selectedStoreByTournament, setSelectedStoreByTournament] = useState(new Map());

  // 매장별 현황 필터 상태 추가
  const [storeFilters, setStoreFilters] = useState(new Map());

  // SEAT권 수정 모달 상태 추가
  const [showSeatEditModal, setShowSeatEditModal] = useState(false);
  const [seatEditModalLoading, setSeatEditModalLoading] = useState(false);
  const [selectedStoreForSeatEdit, setSelectedStoreForSeatEdit] = useState(null);
  const [seatEditFormData, setSeatEditFormData] = useState({
    action: 'add',
    quantity: '',
  });

  // 토너먼트 수정 모달 관련 상태 추가
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: '',
    startDateTime: new Date(),
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
    startDateTime: new Date(),
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

  // 🚀 성능 개선: 초기 로딩 최적화
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      
      // 1단계: 필수 데이터만 빠르게 로딩
      const initializePage = async () => {
        try {
          setInitialLoading(true);
          console.log('🚀 1단계: 필수 데이터 로딩 시작');
          
          // 토너먼트 목록만 먼저 빠르게 로딩
          await fetchTournamentsOnly();
          
          console.log('✅ 1단계 완료: 토너먼트 목록 표시');
          setInitialLoading(false);
          
          // 2단계: 백그라운드에서 매장 정보 로딩 (UI 블록킹 없이)
          console.log('🔄 2단계: 백그라운드 데이터 로딩 시작');
          setBackgroundLoading(true);
          
          setTimeout(async () => {
            try {
              await fetchAllStores();
              console.log('✅ 2단계 완료: 매장 정보 캐시 완료');
              
              // 3단계: 선택적 프리로딩 (사용자가 페이지를 보고 있을 때만)
              if (document.hasFocus()) {
                await preloadPopularTournamentDetails();
              }
            } catch (err) {
              console.warn('⚠️ 백그라운드 로딩 중 오류:', err);
            } finally {
              setBackgroundLoading(false);
            }
          }, 100); // 100ms 후 백그라운드 작업 시작
          
        } catch (err) {
          console.error('❌ 초기 로딩 실패:', err);
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
          setInitialLoading(false);
          setBackgroundLoading(false);
        }
      };
      
      initializePage();
    }
  }, []);

  // 🆕 토너먼트 목록만 빠르게 로딩하는 함수
  const fetchTournamentsOnly = async () => {
    try {
      console.log('📋 토너먼트 목록만 로딩 중...');
      
      const response = await tournamentAPI.getAllTournamentInfo();
      setTournaments(response.data);
      
      console.log(`✅ 토너먼트 목록 로딩 완료: ${response.data?.length || 0}개`);
      
    } catch (err) {
      console.error('토너먼트 목록 로딩 실패:', err);
      throw err; // 상위에서 처리하도록 전파
    }
  };

  // 🆕 인기 토너먼트만 선택적으로 프리로딩
  const preloadPopularTournamentDetails = async () => {
    if (!tournaments || tournaments.length === 0) return;
    
    try {
      console.log('🔥 인기 토너먼트 선택적 프리로딩 시작');
      
      // UPCOMING 상태이고 SEAT권이 많은 상위 3개 토너먼트만 프리로딩
      const popularTournaments = tournaments
        .filter(t => t.status === 'UPCOMING')
        .sort((a, b) => (b.ticket_quantity || 0) - (a.ticket_quantity || 0))
        .slice(0, 3);
      
      if (popularTournaments.length > 0) {
        console.log(`🎯 프리로딩 대상: ${popularTournaments.length}개 토너먼트`);
        
        // 병렬로 프리로딩 (실패해도 계속 진행)
        const preloadPromises = popularTournaments.map(tournament => 
          fetchTournamentDetails(tournament.id, true).catch(err => {
            console.warn(`토너먼트 ${tournament.id} 프리로딩 실패:`, err);
            return null;
          })
        );
        
        await Promise.all(preloadPromises);
        console.log('✅ 인기 토너먼트 프리로딩 완료');
      }
      
    } catch (err) {
      console.warn('⚠️ 선택적 프리로딩 중 오류:', err);
    }
  };

  // 매장 정보 캐싱 함수 (성능 최적화)
  const fetchAllStores = async () => {
    if (allStoresCache || storesLoading) {
      return allStoresCache;
    }

    try {
      setStoresLoading(true);
      console.log('🏪 매장 정보 최초 로딩 시작');
      
      const response = await storeAPI.getAllStores();
      const stores = Array.isArray(response.data) ? response.data : [];
      
      setAllStoresCache(stores);
      console.log(`✅ 매장 정보 캐시 완료: ${stores.length}개 매장`);
      
      return stores;
    } catch (err) {
      console.error('❌ 매장 정보 로딩 실패:', err);
      return [];
    } finally {
      setStoresLoading(false);
    }
  };

  // 🚀 기존 fetchTournaments 함수 제거 (fetchTournamentsOnly로 대체)

  // 🚀 토너먼트 상세 정보 가져오기 (성능 최적화)
  const fetchTournamentDetails = async (tournamentId, isPreload = false) => {
    // 이미 로딩 중이거나 캐시에 있으면 스킵
    if (loadingDetails.has(tournamentId) || tournamentDetailsCache.has(tournamentId)) {
      return;
    }

    try {
      setLoadingDetails(prev => new Set([...prev, tournamentId]));

      if (!isPreload) {
        console.log(`🔍 토너먼트 ${tournamentId} 상세 정보 로딩 시작`);
      }

      // 매장 정보는 캐시에서 가져오기 (중복 API 호출 방지)
      let allStores = allStoresCache;
      if (!allStores) {
        if (!isPreload) {
          console.log('📦 매장 캐시가 없어서 새로 로딩');
        }
        allStores = await fetchAllStores();
      }

      // 🚀 에러 처리 개선: 개별 API 실패 시에도 다른 데이터는 표시
      const apiResults = await Promise.allSettled([
        dashboardAPI.getPlayerMapping(tournamentId),
        distributionAPI.getSummaryByTournament(tournamentId),
        seatTicketAPI.getTournamentSummary(tournamentId),
        seatTicketAPI.getTicketsByTournament(tournamentId, { status: 'ACTIVE' }) // 🆕 매장 정보 획득용
      ]);

      // 각 API 결과 처리 (실패한 것은 기본값 사용)
      const [playerMappingResult, distributionResult, seatTicketResult, ticketDetailsResult] = apiResults;
      
      const playerMappingResponse = playerMappingResult.status === 'fulfilled' 
        ? playerMappingResult.value 
        : { data: {} };
        
      const distributionResponse = distributionResult.status === 'fulfilled' 
        ? distributionResult.value 
        : { data: { store_distributions: [], summary: {}, tournament: {} } };
        
      const seatTicketResponse = seatTicketResult.status === 'fulfilled' 
        ? seatTicketResult.value 
        : { data: { user_summaries: [], ticket_stats: {} } };

      // 🆕 티켓 상세 정보 처리 (매장 정보 포함)
      const ticketDetailsResponse = ticketDetailsResult.status === 'fulfilled' 
        ? ticketDetailsResult.value 
        : { data: [] };

      // 🆕 사용자별 매장 매핑 생성 (user_id -> {storeId, storeName})
      const userStoreMapping = new Map();
      
      // API 응답 구조 안전하게 처리
      let ticketDetailsData = [];
      if (ticketDetailsResponse.data) {
        // 응답이 배열인지 확인
        if (Array.isArray(ticketDetailsResponse.data)) {
          ticketDetailsData = ticketDetailsResponse.data;
        } else if (ticketDetailsResponse.data.results && Array.isArray(ticketDetailsResponse.data.results)) {
          // 페이지네이션된 응답인 경우
          ticketDetailsData = ticketDetailsResponse.data.results;
        } else {
          console.warn('⚠️ 예상과 다른 티켓 상세 API 응답 구조:', ticketDetailsResponse.data);
        }
      }
      
      // 안전하게 매장 매핑 생성 (다양한 필드명 지원)
      if (Array.isArray(ticketDetailsData) && ticketDetailsData.length > 0) {
        ticketDetailsData.forEach((ticket, index) => {
          // 다양한 사용자 ID 필드 지원
          const userId = ticket?.user || ticket?.user_id || ticket?.userId;
          
          // 다양한 매장 ID 필드 지원
          const storeId = ticket?.store || ticket?.store_id || ticket?.storeId;
          
          // 다양한 매장명 필드 지원
          const storeName = ticket?.store_name || ticket?.storeName || ticket?.store?.name;
          
          if (!isPreload && index < 3) {
            console.log(`🔍 티켓 ${index + 1} 매핑 시도:`, {
              userId,
              storeId,
              storeName,
              originalTicket: ticket
            });
          }
          
          if (userId && storeId && storeName) {
            userStoreMapping.set(userId, {
              storeId: storeId,
              storeName: storeName
            });
            
            if (!isPreload && index < 3) {
              console.log(`✅ 사용자 ${userId} -> 매장 ${storeName} (ID: ${storeId}) 매핑 성공`);
            }
          } else {
            if (!isPreload && index < 3) {
              console.warn(`⚠️ 티켓 ${index + 1} 매핑 실패 - 필수 필드 누락:`, {
                hasUserId: !!userId,
                hasStoreId: !!storeId,
                hasStoreName: !!storeName
              });
            }
          }
        });
      }

      // 실패한 API 로그 출력
      apiResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const apiNames = ['플레이어 매핑', '분배 정보', 'SEAT권 요약', '매장별 티켓 상세'];
          console.warn(`⚠️ ${apiNames[index]} API 실패:`, result.reason);
        }
      });

      if (!isPreload) {
        console.log('📊 Distribution API 응답:', distributionResponse.data);
        console.log('🏪 Store distributions:', distributionResponse.data.store_distributions);
        console.log('📦 캐시된 매장 정보 사용:', allStores?.length || 0, '개 매장');
      }
      
      // 매장별 현황 데이터 처리
      const storeDistributions = distributionResponse.data.store_distributions || [];
      
      // 🔄 보조 매장 매핑 생성 (분배 정보 기반)
      const storeIdToNameMapping = new Map();
      storeDistributions.forEach(dist => {
        const matchingStore = allStores?.find(store => store.id === dist.store_id);
        if (matchingStore) {
          storeIdToNameMapping.set(dist.store_id, matchingStore.name);
        }
      });
      
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

      if (!isPreload) {
        console.log(`✅ 토너먼트 ${tournamentId} 상세 정보 로딩 완료: 매장 ${combinedStoreData.length}개, 선수 ${seatTicketResponse.data.user_summaries?.length || 0}명`);
        console.log(`🆕 티켓 상세 데이터 처리 완료: ${ticketDetailsData.length}건의 티켓 정보`);
        
        // 🔍 디버깅: 티켓 상세 데이터 구조 확인
        if (ticketDetailsData.length > 0) {
          console.log('🔍 첫 번째 티켓 데이터 구조:', ticketDetailsData[0]);
          console.log('🔍 티켓 데이터 필드들:', Object.keys(ticketDetailsData[0] || {}));
        }
        
        // 🔍 디버깅: 사용자 요약 데이터 구조 확인
        if (seatTicketResponse.data.user_summaries?.length > 0) {
          console.log('🔍 첫 번째 사용자 요약 구조:', seatTicketResponse.data.user_summaries[0]);
          console.log('🔍 사용자 요약 필드들:', Object.keys(seatTicketResponse.data.user_summaries[0] || {}));
          
          // 🔍 모든 사용자의 시트권 현황 분석
          console.log('📊 전체 사용자 요약 분석:');
          seatTicketResponse.data.user_summaries.forEach((user, idx) => {
            console.log(`  사용자 ${idx + 1}:`, {
              id: user?.id,
              user: user?.user,
              nickname: user?.user_nickname,
              phone: user?.user_phone,
              activeTickets: user?.active_tickets || 0,
              usedTickets: user?.used_tickets || 0,
              totalTickets: user?.total_tickets || 0,
              shouldShow: (user?.active_tickets || 0) > 0
            });
          });
        }
        
        console.log(`🆕 매장 매핑 생성 완료: ${userStoreMapping.size}명의 선수에 대한 매장 정보`);
        if (userStoreMapping.size > 0) {
          console.log('🏪 사용자별 매장 매핑:', Array.from(userStoreMapping.entries()));
        } else {
          console.warn('⚠️ 매장 매핑이 생성되지 않았습니다. 원인을 확인해주세요.');
        }
      }

      // 데이터 통합
      const combinedData = {
        ...playerMappingResponse.data,
        storeDetails: combinedStoreData,
        // 🚀 매장별 시트권 그룹핑 - 티켓 데이터 직접 활용
        playerDetails: (() => {
          if (!Array.isArray(ticketDetailsData) || ticketDetailsData.length === 0) {
            return [];
          }
          
          // 📊 사용자-매장 조합별로 티켓 그룹핑
          const userStoreGroups = new Map();
          
          ticketDetailsData.forEach(ticket => {
            const userId = ticket?.user;
            const storeId = ticket?.store;
            const storeName = ticket?.store_name;
            const userName = ticket?.user_nickname || ticket?.user_name || ticket?.user_phone;
            const userPhone = ticket?.user_phone || '';
            
            if (userId && storeId && storeName) {
              const groupKey = `${userId}-${storeId}`;
              
              if (!userStoreGroups.has(groupKey)) {
                userStoreGroups.set(groupKey, {
                  userId,
                  userName,
                  userPhone,
                  storeId,
                  storeName,
                  tickets: []
                });
              }
              
              userStoreGroups.get(groupKey).tickets.push(ticket);
            }
          });
          
          // 🎯 그룹별로 티켓 수량 계산하여 행 생성
          const playerRows = [];
          
          userStoreGroups.forEach((group, groupKey) => {
            const activeTickets = group.tickets.filter(t => t.status === 'ACTIVE').length;
            const usedTickets = group.tickets.filter(t => t.status === 'USED').length;
            const totalTickets = group.tickets.length;
            
            // 활성 티켓이 있는 경우만 표시
            if (activeTickets > 0) {
              playerRows.push({
                playerName: group.userName || '이름 없음',
                playerPhone: group.userPhone || '',
                hasTicket: 'Y',
                storeName: group.storeName,
                storeId: group.storeId,
                ticketCount: activeTickets,
                activeTickets: activeTickets,
                usedTickets: usedTickets,
                totalTickets: totalTickets,
                groupKey: groupKey // 디버깅용
              });
            }
          });
          
          // 🔍 디버깅: 매장별 그룹핑 결과 로그
          if (!isPreload && playerRows.length > 0) {
            console.log('🏪 매장별 시트권 그룹핑 결과:');
            playerRows.forEach((row, idx) => {
              console.log(`  ${idx + 1}. ${row.playerName} @ ${row.storeName}: ${row.activeTickets}매 (사용: ${row.usedTickets}매)`);
            });
          }
          
          return playerRows;
        })(),
        totalTicketQuantity: distributionResponse.data.tournament?.ticket_quantity || 0,
        distributedTicketQuantity: distributionResponse.data.summary?.total_distributed || 0,
        usedTicketQuantity: seatTicketResponse.data.ticket_stats?.used_tickets || 0,
        storeCount: combinedStoreData.length,
        playerCount: seatTicketResponse.data.user_summaries?.length || 0
      };

      // 캐시에 저장
      setTournamentDetailsCache(prev => new Map([...prev, [tournamentId, combinedData]]));

      // 🚀 지능형 프리로딩: 즉시 필요할 가능성이 높은 데이터만 백그라운드 로딩
      if (!isPreload) {
        const storesWithTickets = combinedStoreData.filter(store => store.ticketQuantity > 0);
        
        if (storesWithTickets.length > 0 && storesWithTickets.length <= 2) {
          // 매장이 적을 때만 사용자 데이터 프리로딩
          setTimeout(() => {
            const topStore = storesWithTickets[0];
            if (topStore) {
              console.log(`🎯 지능형 프리로딩: ${topStore.storeName} 사용자 데이터`);
              fetchStoreUsers(tournamentId, topStore.storeId, topStore.storeName).catch(() => {
                // 프리로딩 실패는 무시
              });
            }
          }, 500);
        }
      }

    } catch (err) {
      console.error(`❌ 토너먼트 ${tournamentId} 상세 정보 API 오류:`, err);
      if (!isPreload) {
        setError(`토너먼트 상세 정보를 불러오는 중 오류가 발생했습니다.`);
      }
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
        });        // 3. 캐시 업데이트 (부분 업데이트)
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

        // 4. 메인 테이블 tournaments 배열도 업데이트 (매장 수량 SEAT권 컬럼 반영)
        setTournaments(prevTournaments => {
          return prevTournaments.map(tournament => {
            if (tournament.id === tournamentId) {
              // 새 매장 할당량 계산 (모든 매장의 할당량 합계)
              const newStoreAllocatedTotal = newStoreDistributions.reduce(
                (sum, dist) => sum + (dist.allocated_quantity || 0), 0
              );
              
              console.log(`토너먼트 ${tournamentId}의 매장 수량 SEAT권 업데이트: ${tournament.store_allocated_tickets || 0} → ${newStoreAllocatedTotal}`);
              
              return {
                ...tournament,
                store_allocated_tickets: newStoreAllocatedTotal
              };
            }
            return tournament;
          });
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
      setSeatEditModalLoading(false);
      
      if (err.response && err.response.data) {
        // 서버에서 ValidationError가 발생한 경우 처리
        if (err.response.status === 500) {
          // 500 에러인 경우 더 자세한 오류 정보 추출
          const errorMessage = err.response.data.error || err.response.data.message || '알 수 없는 오류가 발생했습니다.';
          
          // ValidationError 메시지에서 핵심 정보 추출
          if (errorMessage.includes('전체 분배량') && errorMessage.includes('초과할 수 없습니다')) {
            const match = errorMessage.match(/전체 분배량\((\d+)\)이 토너먼트 좌석권 수량\((\d+)\)을 초과할 수 없습니다/);
            if (match) {
              const [, totalAllocated, tournamentTotal] = match;
              setError(`❌ SEAT권 분배 한도 초과\n\n현재 입력한 수량으로 인해 전체 분배량이 ${totalAllocated}개가 되어 토너먼트 총 좌석권 수량(${tournamentTotal}개)을 초과하게 됩니다.\n\n다른 매장에 이미 분배된 좌석권을 고려하여 더 적은 수량을 입력해주세요.`);
            } else {
              setError(`❌ SEAT권 분배 한도 초과\n\n${errorMessage}\n\n다른 매장에 이미 분배된 좌석권 수량을 확인하고 적절한 수량을 입력해주세요.`);
            }
          } else if (errorMessage.includes('분배량은 보유수량과 배포수량의 합과 같아야 합니다')) {
            setError('❌ 수량 계산 오류\n\n분배량은 보유수량과 배포수량의 합과 같아야 합니다.\n현재 배포된 수량을 고려하여 올바른 총 수량을 입력해주세요.');
          } else {
            setError(`SEAT권 수량 조정 중 오류가 발생했습니다:\n${errorMessage}`);
          }
        } else {
          // 다른 HTTP 오류 코드인 경우
          const errorMessage = err.response.data.error || err.response.data.message || JSON.stringify(err.response.data);
          setError(`SEAT권 수량 조정 중 오류가 발생했습니다: ${errorMessage}`);
        }
      } else if (err.message) {
        setError(`SEAT권 수량 조정 중 네트워크 오류가 발생했습니다: ${err.message}`);
      } else {
        setError('SEAT권 수량 조정 중 알 수 없는 오류가 발생했습니다.');
      }
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
      if (!formData.name || !formData.startDateTime || !formData.buy_in || !formData.ticket_quantity) {
        setError('모든 필수 필드를 입력해주세요.');
        setLoading(false);
        return;
      }

      // 날짜 & 시간 포맷
      const startDateTime = formData.startDateTime.toISOString();

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
        startDateTime: new Date(),
        buy_in: '',
        ticket_quantity: '',
        description: '',
        status: 'UPCOMING'
      });

      // 🚀 성능 개선: 토너먼트 목록만 빠르게 새로고침
      await refreshTournamentList();

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

  // 🆕 토너먼트 목록 빠른 새로고침 함수
  const refreshTournamentList = async () => {
    try {
      console.log('🔄 토너먼트 목록 새로고침');
      await fetchTournamentsOnly();
      
      // 캐시 무효화 (새로운 토너먼트가 추가되었으므로)
      setTournamentDetailsCache(new Map());
      console.log('✅ 토너먼트 목록 새로고침 완료');
    } catch (err) {
      console.error('❌ 토너먼트 목록 새로고침 실패:', err);
      setError('토너먼트 목록을 새로고침하는 중 오류가 발생했습니다.');
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

    // 현재 시간에 가까운 순서로 정렬
    const now = new Date();
    const sortedFiltered = filtered.sort((a, b) => {
      const dateA = new Date(a.start_time);
      const dateB = new Date(b.start_time);
      
      // 현재 시간과의 절댓값 차이 계산
      const diffA = Math.abs(dateA.getTime() - now.getTime());
      const diffB = Math.abs(dateB.getTime() - now.getTime());
      
      return diffA - diffB; // 차이가 적은 순서로 정렬
    });

    return sortedFiltered;
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
      selector: (row) => row.store_allocated_tickets || 0,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      }),
      cell: (row) => {
        // 🚀 성능 최적화: API 응답에서 직접 가져온 매장 할당 SEAT권 수량 사용
        const storeAllocated = row.store_allocated_tickets || 0;
        
        return (
          <span style={{ 
            fontSize: expandedRowId === row.id ? '18px' : '14px',
            fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}>
            {storeAllocated}
          </span>
        );
      }
    },
    {
      name: <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>시작 시간</span>,
      selector: (row) => row.start_time,
      sortable: true,
      center: true,
      style: (row) => ({
        fontSize: expandedRowId === row.id ? '18px' : '14px',
        fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
        transition: 'all 0.3s ease'
      }),
             cell: (row) => {
         const formatStartTime = (dateTimeString) => {
           if (!dateTimeString) return '-';
           
           try {
             const date = new Date(dateTimeString);
             const dateStr = date.toLocaleDateString('ko-KR', { 
               year: 'numeric',
               month: 'short', 
               day: 'numeric' 
             });
             const timeStr = date.toLocaleTimeString('ko-KR', { 
               hour: '2-digit', 
               minute: '2-digit',
               hour12: false 
             });
             return `${dateStr} ${timeStr}`;
           } catch (error) {
             return dateTimeString;
           }
         };
        
        return (
          <span style={{ 
            fontSize: expandedRowId === row.id ? '18px' : '14px',
            fontWeight: expandedRowId === row.id ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}>
            {formatStartTime(row.start_time)}
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
  ], [expandedRowId]);

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
    const isPreloaded = tournamentDetails && !isLoadingDetails; // 🆕 프리로드 여부 확인

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
      // 🚀 성능 최적화: API 응답에서 직접 가져온 값 사용 (cache 계산 불필요)
      return data.store_allocated_tickets || 0;
    }, [data.store_allocated_tickets]);

    if (isLoadingDetails) {
      return (
        <div className="p-4 text-center border border-info rounded" style={{ backgroundColor: '#e3f2fd' }}>
          <div className="d-flex align-items-center justify-content-center mb-3">
            <Spinner animation="border" variant="primary" className="me-3" />
            <div>
              <h5 className="mb-1">🔍 토너먼트 상세 정보 로딩 중...</h5>
              <small className="text-muted">
                📊 매장별 현황, 선수 정보, 통계 데이터를 불러오고 있습니다
              </small>
            </div>
          </div>
          <div className="progress mb-2" style={{ height: '4px' }}>
            <div className="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" style={{ width: '100%' }}></div>
          </div>
          <small className="text-info">
            💡 한 번 로딩된 데이터는 캐시되어 다음에는 즉시 표시됩니다
          </small>
        </div>
      );
    }

    if (!tournamentDetails) {
      return (
        <div className="p-4 text-center border border-warning rounded" style={{ backgroundColor: '#fff3cd' }}>
          <Alert variant="warning" className="mb-3">
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
              <div>
                <strong>토너먼트 상세 정보를 불러올 수 없습니다</strong>
                <div className="small mt-1">네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.</div>
              </div>
            </div>
          </Alert>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => fetchTournamentDetails(data.id)}
            disabled={isLoadingDetails}
          >
            <i className="fas fa-redo me-1"></i>
            다시 시도
          </Button>
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
                                  <option value="all">전체매장</option>
              <option value="with_seats">SEAT권 보유매장</option>
              <option value="without_seats">SEAT권 비보유매장</option>
                  </Form.Select>
                  <small className="text-white ms-2" style={{ fontSize: '11px', minWidth: '60px' }}>
                    ({filteredStores.length}개)
                  </small>
                </div>
              </div>
              
              {/* 매장별 현황 안내 문구 */}
              <div className="text-end mb-1">
                <small style={{ color: '#e3f2fd', fontSize: '12px' }}>
                  💡 매장별 SEAT권 분배 현황을 확인할 수 있습니다
                </small>
              </div>
              
              {/* 🆕 로딩 성능 개선: 매장 데이터 테이블 */}
              {filteredStores.length > 50 ? (
                /* 대량 데이터 경고 */
                <Alert variant="warning" className="mb-3">
                  <small>
                    ⚠️ 매장이 많아 로딩이 지연될 수 있습니다. ({filteredStores.length}개)
                    필터를 사용하여 결과를 줄여보세요.
                  </small>
                </Alert>
              ) : null}
              
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
                      const hasUserCache = storeUsersCache.has(cacheKey); // 🆕 캐시 여부 확인
                      
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
                              fontWeight: 'normal',
                              color: hasSeatTickets ? 'inherit' : '#856404',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '200px'
                            }}
                          >
                            {store.storeName}
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
                                      {currentStoreFilter === 'with_seats' && 'SEAT권을 보유한 매장이 없습니다.'}
              {currentStoreFilter === 'without_seats' && 'SEAT권을 보유하지 않은 매장이 없습니다.'}
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
              </h4>
              
              {/* 선수별 현황 안내 문구 */}
              <div className="text-end mb-1">
                <small style={{ color: '#e3f2fd', fontSize: '12px' }}>
                  💡 선수별 SEAT권 분배 현황을 확인할 수 있습니다
                </small>
              </div>
              
              <Table bordered size="sm" className="mb-0" style={{ backgroundColor: '#ffffff' }}>                <thead style={{ backgroundColor: '#6c757d', color: 'white' }}>
                  <tr>
                    <th className="border border-dark text-white">선수</th>
                    <th className="border border-dark text-white">획득 매장</th>
                    <th className="border border-dark text-white">SEAT권 보유 수량</th>
                    <th className="border border-dark text-white">SEAT권 사용 수량</th>
                    <th className="border border-dark text-white">SEAT권 사용정보</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // 토너먼트 상세 정보에서 참가 선수 데이터 가져오기
                    const isLoadingDetails = loadingDetails.has(data.id);
                    
                    if (isLoadingDetails) {
                      return (
                        <tr>
                          <td colSpan="5" className="text-center border border-secondary p-4">
                            <div className="d-flex align-items-center justify-content-center">
                              <Spinner animation="border" variant="primary" className="me-2" />
                              <span>참가 선수 목록을 불러오는 중입니다...</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // 캐시된 토너먼트 상세 정보에서 참가 선수 데이터 가져오기
                    const tournamentDetails = tournamentDetailsCache.get(data.id);
                    const allParticipants = tournamentDetails?.playerDetails || [];
                    
                    // 실제 좌석권 보유자만 필터링 (토너먼트 참가자)
                    const actualParticipants = allParticipants.filter(user => 
                      user.hasTicket === 'Y' && (user.ticketCount || 0) > 0
                    );

                    if (actualParticipants.length > 0) {
                      return actualParticipants.map((participant, index) => (
                        <tr key={index}>
                          <td className="border border-secondary">
                            <div className="d-flex align-items-center">
                  
                              <div>
                                <div style={{ fontWeight: 'bold' }}>{participant.playerName}</div>
                                {participant.playerPhone && (
                                  <small className="text-muted">{participant.playerPhone}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center border border-secondary">
                            <div className="d-flex align-items-center justify-content-center">
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                  {participant.storeName || '미지정'}
                                </div>
                                {participant.storeId && (
                                  <small className="text-muted" style={{ fontSize: '10px' }}>
                                    ID: {participant.storeId}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center border border-secondary">
                            <span className="badge bg-success fs-6">
                              {participant.ticketCount || participant.activeTickets || 0}매
                            </span>
                          </td>
                          <td className="text-center border border-secondary">
                            <span className="badge bg-info fs-6">
                              {participant.usedTickets || 0}매
                            </span>
                          </td>
                          <td className="text-center border border-secondary">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => {
                                // TODO: SEAT권 사용정보 조회 기능 구현 예정
                                console.log('SEAT권 정보 버튼 클릭:', participant.playerName);
                              }}
                            >
                              <i className="fas fa-info-circle me-1"></i>
                              SEAT권 정보
                            </Button>
                          </td>
                        </tr>
                      ));
                    } else {
                      return (
                        <tr>
                          <td colSpan="5" className="text-center border border-secondary p-4">
                            <div className="text-muted">
                              <i className="fas fa-users fa-2x mb-2"></i>
                              <p className="mb-0">
                                {tournamentDetails ? 
                                  '아직 SEAT권을 보유한 참가자가 없습니다.' : 
                                  '토너먼트 정보를 불러오는 중입니다...'}
                              </p>
                              {tournamentDetails && (
                                <small className="text-info">
                                  💡 실제 SEAT권을 보유한 참가자만 표시됩니다.
                                  <br />
                                  등록만 된 사용자는 SEAT권 발급 후 표시됩니다.
                                </small>
                              )}
                            </div>
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

    setFormData({
      name: '',
      startDateTime: now,
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
    
    // start_time을 Date 객체로 변환
    const startDateTime = new Date(tournament.start_time);
    
    setEditingTournament(tournament);
    setEditFormData({
      id: tournament.id,
      name: tournament.name || '',
      startDateTime: startDateTime,
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
      if (!editFormData.name || !editFormData.startDateTime || 
          !editFormData.buy_in || !editFormData.ticket_quantity) {
        setError('모든 필수 필드를 입력해주세요.');
        setEditModalLoading(false);
        return;
      }

      // 날짜 & 시간 포맷
      const startDateTime = editFormData.startDateTime.toISOString();

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
      
      // 🚀 성능 개선: 토너먼트 목록만 빠르게 새로고침
      await refreshTournamentList();

      // 해당 토너먼트의 캐시 무효화 (수정되었으므로)
      setTournamentDetailsCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(editFormData.id);
        return newCache;
      });

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
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5>토너먼트 목록</h5>
              <small>정렬 가능하고 확장 가능한 토너먼트 테이블입니다. 행을 클릭하면 상세 정보를 볼 수 있습니다.</small>
            </div>
            
            {/* 🆕 로딩 상태 표시 개선 */}
            <div className="d-flex align-items-center">
              {backgroundLoading && (
                <div className="me-3 d-flex align-items-center">
                  <Spinner animation="border" size="sm" variant="info" className="me-2" />
                  <small className="text-info">백그라운드 로딩 중...</small>
                </div>
              )}
              
              {!initialLoading && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={refreshTournamentList}
                  disabled={loading || backgroundLoading}
                  title="토너먼트 목록 새로고침"
                >
                  <i className="fas fa-sync-alt me-1"></i>
                  새로고침
                </Button>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {initialLoading ? (
            /* 🚀 초기 로딩 - 빠른 피드백 */
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 mb-2">📋 토너먼트 목록을 불러오는 중입니다...</p>
              <small className="text-muted">
                빠른 로딩을 위해 기본 정보만 먼저 표시합니다
              </small>
            </div>
          ) : loading ? (
            /* 기존 로딩 (생성/수정 등의 작업 시) */
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">처리 중입니다...</p>
            </div>
          ) : (
            <div>
              {/* 🆕 백그라운드 로딩 진행 상황 표시 */}
              {backgroundLoading && (
                <Alert variant="info" className="d-flex align-items-center mb-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <div className="flex-grow-1">
                    <strong>백그라운드 최적화 진행 중</strong>
                    <div className="small mt-1">
                      매장 정보 캐싱 및 인기 토너먼트 프리로딩을 진행하고 있습니다. 
                      이 작업은 페이지 사용에 영향을 주지 않습니다.
                    </div>
                  </div>
                </Alert>
              )}
              
              <DataTable
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
                    {tournaments.length === 0 ? (
                      <div>
                        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p className="text-muted">토너먼트 데이터가 없습니다.</p>
                        <small className="text-muted">새 토너먼트를 생성해보세요.</small>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-filter fa-2x text-muted mb-3"></i>
                        <p className="text-muted">필터 조건에 맞는 토너먼트가 없습니다.</p>
                        <small className="text-muted">필터 조건을 변경해보세요.</small>
                      </div>
                    )}
                  </div>
                }
                highlightOnHover
                striped
                progressPending={loading}
                progressComponent={
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">데이터를 불러오는 중입니다...</p>
                  </div>
                }
              />
            </div>
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
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    시작 날짜 및 시간 <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="w-100">
                    <DatePicker
                      selected={formData.startDateTime}
                      onChange={(date) => setFormData({...formData, startDateTime: date})}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="yyyy년 MM월 dd일 HH:mm"
                      locale={ko}
                      minDate={new Date()}
                      maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                      className="form-control w-100"
                      placeholderText="날짜와 시간을 선택해주세요"
                      required
                      autoComplete="off"
                      showPopperArrow={false}
                      popperPlacement="bottom-start"
                      todayButton="오늘"
                      timeCaption="시간"
                      calendarStartDay={0}
                      shouldCloseOnSelect={false}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
                  <Form.Text className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    토너먼트 시작 날짜와 시간을 선택해주세요. (오늘 이후만 선택 가능)
                    <br />
                    <small>💡 15분 단위로 시간 선택이 가능합니다.</small>
                  </Form.Text>
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
              {/* 토너먼트 전체 정보 */}
              {(() => {
                const cachedTournamentDetails = tournamentDetailsCache.get(selectedStoreForSeatEdit.tournamentId);
                if (cachedTournamentDetails) {
                  const { totalTicketQuantity, distributedTicketQuantity } = cachedTournamentDetails;
                  const totalAllocated = cachedTournamentDetails.storeDetails ? 
                    cachedTournamentDetails.storeDetails.reduce((sum, store) => sum + (store.ticketQuantity || 0), 0) : 0;
                  const remainingToAllocate = totalTicketQuantity - totalAllocated;
                  
                  return (
                    <Alert variant="info" className="mb-4">
                      <Alert.Heading className="h6 mb-3">
                        <i className="fas fa-info-circle me-2"></i>
                        토너먼트 전체 SEAT권 현황
                      </Alert.Heading>
                      <Row className="text-center">
                        <Col md={3}>
                          <div className="d-flex flex-column">
                            <span className="text-muted small">총 좌석권</span>
                            <strong className="fs-5 text-dark">{totalTicketQuantity.toLocaleString()}매</strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="d-flex flex-column">
                            <span className="text-muted small">총 분배량</span>
                            <strong className="fs-5 text-primary">{totalAllocated.toLocaleString()}매</strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="d-flex flex-column">
                            <span className="text-muted small">미분배량</span>
                            <strong className={`fs-5 ${remainingToAllocate > 0 ? 'text-success' : 'text-danger'}`}>
                              {remainingToAllocate.toLocaleString()}매
                            </strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="d-flex flex-column">
                            <span className="text-muted small">분배율</span>
                            <strong className="fs-5 text-info">
                              {totalTicketQuantity > 0 ? Math.round((totalAllocated / totalTicketQuantity) * 100) : 0}%
                            </strong>
                          </div>
                        </Col>
                      </Row>
                    </Alert>
                  );
                }
                return null;
              })()}

              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    {selectedStoreForSeatEdit.storeName} 매장
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
                    {seatEditFormData.quantity !== '' && !isNaN(parseInt(seatEditFormData.quantity)) && selectedStoreForSeatEdit && (() => {
                      const newQuantity = parseInt(seatEditFormData.quantity);
                      const cachedTournamentDetails = tournamentDetailsCache.get(selectedStoreForSeatEdit.tournamentId);
                      let isOverLimit = false;
                      let limitInfo = null;
                      
                      if (cachedTournamentDetails) {
                        const { totalTicketQuantity } = cachedTournamentDetails;
                        const currentAllocated = cachedTournamentDetails.storeDetails ? 
                          cachedTournamentDetails.storeDetails.reduce((sum, store) => {
                            // 현재 편집 중인 매장은 제외하고 계산
                            if (store.storeId === selectedStoreForSeatEdit.storeId) {
                              return sum;
                            }
                            return sum + (store.ticketQuantity || 0);
                          }, 0) : 0;
                        
                        const newTotalAllocated = currentAllocated + newQuantity;
                        isOverLimit = newTotalAllocated > totalTicketQuantity;
                        
                        limitInfo = {
                          totalTicketQuantity,
                          currentAllocated,
                          newTotalAllocated,
                          remaining: totalTicketQuantity - newTotalAllocated
                        };
                      }

                      return (
                        <div className={`mb-3 p-3 border rounded ${isOverLimit ? 'bg-danger-subtle border-danger' : 'bg-light'}`}>
                          <h6 className="fw-bold text-center mb-2">
                            {isOverLimit ? '⚠️ 분배 한도 초과' : '변경 후 예상 정보'}
                          </h6>
                          
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted">변경 전 총 수량:</span>
                            <strong className="fs-5">{selectedStoreForSeatEdit.currentQuantity}매</strong>
                          </div>
                          
                          <div className={`d-flex justify-content-between align-items-center mb-1 ${newQuantity >= selectedStoreForSeatEdit.currentQuantity ? 'text-success' : 'text-danger'}`}>
                            <span>수량 변화:</span>
                            <strong className="fs-5">
                              {newQuantity - selectedStoreForSeatEdit.currentQuantity >= 0 ? '+' : ''}
                              {newQuantity - selectedStoreForSeatEdit.currentQuantity}매
                            </strong>
                          </div>
                          
                          <hr className="my-1" />
                          
                          <div className={`d-flex justify-content-between align-items-center ${isOverLimit ? 'text-danger' : 'text-primary'}`}>
                            <span className="fw-bold">변경 후 총 수량:</span>
                            <strong className="fs-4 fw-bold">{newQuantity}매</strong>
                          </div>
                          
                          {limitInfo && (
                            <>
                              <hr className="my-2" />
                              <div className="small">
                                <div className="d-flex justify-content-between mb-1">
                                  <span className="text-muted">토너먼트 총 좌석권:</span>
                                  <strong>{limitInfo.totalTicketQuantity.toLocaleString()}매</strong>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                  <span className="text-muted">다른 매장 분배합계:</span>
                                  <strong>{limitInfo.currentAllocated.toLocaleString()}매</strong>
                                </div>
                                <div className={`d-flex justify-content-between ${isOverLimit ? 'text-danger fw-bold' : 'text-success'}`}>
                                  <span>변경 후 전체 분배량:</span>
                                  <strong>{limitInfo.newTotalAllocated.toLocaleString()}매</strong>
                                </div>
                                {isOverLimit && (
                                  <div className="text-danger small fw-bold mt-2">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    {Math.abs(limitInfo.remaining)}매 초과! 최대 {limitInfo.totalTicketQuantity - limitInfo.currentAllocated}매까지 가능합니다.
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
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
                      disabled={(() => {
                        // 기본 유효성 검사
                        if (seatEditModalLoading || seatEditFormData.quantity === '' || isNaN(parseInt(seatEditFormData.quantity)) || parseInt(seatEditFormData.quantity) < 0) {
                          return true;
                        }
                        
                        // 분배 한도 초과 검사
                        const newQuantity = parseInt(seatEditFormData.quantity);
                        const cachedTournamentDetails = tournamentDetailsCache.get(selectedStoreForSeatEdit?.tournamentId);
                        if (cachedTournamentDetails && selectedStoreForSeatEdit) {
                          const { totalTicketQuantity } = cachedTournamentDetails;
                          const currentAllocated = cachedTournamentDetails.storeDetails ? 
                            cachedTournamentDetails.storeDetails.reduce((sum, store) => {
                              // 현재 편집 중인 매장은 제외하고 계산
                              if (store.storeId === selectedStoreForSeatEdit.storeId) {
                                return sum;
                              }
                              return sum + (store.ticketQuantity || 0);
                            }, 0) : 0;
                          
                          const newTotalAllocated = currentAllocated + newQuantity;
                          if (newTotalAllocated > totalTicketQuantity) {
                            return true; // 한도 초과 시 비활성화
                          }
                        }
                        
                        return false;
                      })()}
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
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        시작 날짜 및 시간 <span className="text-danger">*</span>
                      </Form.Label>
                                             <div className="w-100">
                         <DatePicker
                           selected={editFormData.startDateTime}
                           onChange={(date) => setEditFormData({...editFormData, startDateTime: date})}
                           showTimeSelect
                           timeFormat="HH:mm"
                           timeIntervals={15}
                           dateFormat="yyyy년 MM월 dd일 HH:mm"
                           locale={ko}
                           maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                           className="form-control w-100"
                           placeholderText="날짜와 시간을 선택해주세요"
                           required
                           autoComplete="off"
                           showPopperArrow={false}
                           popperPlacement="bottom-start"
                           todayButton="오늘"
                           timeCaption="시간"
                           calendarStartDay={0}
                           shouldCloseOnSelect={false}
                           showMonthDropdown
                           showYearDropdown
                           dropdownMode="select"
                         />
                       </div>
                                             <Form.Text className="text-muted">
                         <i className="fas fa-info-circle me-1"></i>
                         토너먼트 시작 날짜와 시간을 선택해주세요.
                         <br />
                         <small>💡 15분 단위로 시간 선택이 가능합니다.</small>
                       </Form.Text>
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