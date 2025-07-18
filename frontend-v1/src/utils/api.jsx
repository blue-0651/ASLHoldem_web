import axios from 'axios';
import { getToken, refreshToken, logout } from './auth';

// API 기본 설정 - Android WebView 호환성을 위해 상대 경로 사용
const API = axios.create({
  baseURL: '/api/v1',
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터 - 인증 토큰 추가
API.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('asl_holdem_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // FormData 전송 시 Content-Type 자동 설정을 위해 헤더 제거
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // 개발 환경에서만 요청 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('[API REQUEST]', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data instanceof FormData ? 'FormData' : config.data
      });
    }

    return config;
  },
  (error) => {
    // 개발 환경에서만 요청 에러 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('[API REQUEST ERROR]', error);
    }
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 시 갱신
API.interceptors.response.use(
  (response) => {
    // 개발 환경에서만 응답 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('[API RESPONSE]', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    // 개발 환경에서만 응답 에러 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('[API RESPONSE ERROR]', error);
    }
    const originalRequest = error.config;

    // 토큰이 만료되었고, 이전에 재시도하지 않았다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 리프레시 토큰으로 새 액세스 토큰 발급
        const refreshToken = localStorage.getItem('asl_holdem_refresh_token');
        const response = await axios.post('/api/v1/accounts/token/refresh/', {
          refresh: refreshToken
        });

        // 새 토큰 저장
        const { access } = response.data;
        localStorage.setItem('asl_holdem_access_token', access);

        // 원래 요청 재시도
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃
        localStorage.removeItem('asl_holdem_access_token');
        localStorage.removeItem('asl_holdem_refresh_token');
        logout();
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 기타 오류 처리는 각 컴포넌트에서 처리

    return Promise.reject(error);
  }
);

// 토너먼트 관련 API
export const tournamentAPI = {
  // 모든 토너먼트 조회
  getAllTournaments: () => API.get('/tournaments/'),

  // 토너먼트 상태별 조회
  getTournamentsByStatus: (status) => API.get(`/tournaments/?status=${status}`),

  // 매장별 토너먼트 조회
  getTournamentsByStore: (storeId) => API.get(`/tournaments/?store=${storeId}`),

  // 내 토너먼트 목록
  getMyTournaments: (userId) => {
    const formData = new FormData();
    formData.append('user_id', userId);
    return API.post('/tournaments/my/', formData);
  },

  // 토너먼트 참가자 수 조회
  getTournamentParticipantsCount: (tournamentName) => {
    const formData = new FormData();
    formData.append('tournament_name', tournamentName);
    return API.post('/tournaments/participants/count/', formData);
  },

  // 모든 토너먼트 상세 정보 조회
  getAllTournamentInfo: (params = {}) => API.get('/tournaments/all_info/', { params }),

  // 토너먼트 생성 - 기본 엔드포인트 (POST /tournaments/)
  createTournament: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    return API.post('/tournaments/', formData);
  },

  // 토너먼트 생성 - 추가 엔드포인트 (POST /tournaments/create/)
  createTournamentAlternative: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    return API.post('/tournaments/create/', formData);
  },

  // 토너먼트 수정 - FormData 형식으로 변경
  updateTournament: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    return API.put(`/tournaments/${id}/`, formData);
  },

  // 토너먼트 삭제
  deleteTournament: (id) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 토너먼트 삭제 (ID: ${id})`);
    }
    
    return API.delete(`/tournaments/${id}/`);
  }
};

// 스토어(매장) 관련 API
export const storeAPI = {
  // 모든 매장 조회
  getAllStores: () => API.get('/stores/'),

  // 특정 매장 정보 조회
  getStoreById: (storeId) => API.get(`/stores/${storeId}/`),

  // 특정 매장 방문 사용자 목록
  getStoreUsers: (storeId) => API.post(`/stores/${storeId}/users/`),

  // 매장 이름과 사용자 이름으로 검색
  searchUserByStore: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    return API.post('/stores/search_user_by_store/', formData);
  },

  // 매장별 토너먼트 SEAT권 정보 조회
  getStoreTournamentTickets: (storeId) => API.get(`/stores/${storeId}/tournament_tickets/`),

  // 매장 생성
  createStore: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    // 디버깅을 위한 FormData 내용 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 매장 생성 - 전송할 FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
    }
    
    return API.post('/stores/', formData);
  },

  // 매장 수정
  updateStore: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    // 디버깅을 위한 FormData 내용 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 매장 수정 (ID: ${id}) - 전송할 FormData:`);
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
    }
    
    return API.put(`/stores/${id}/`, formData);
  },

  // 매장 삭제
  deleteStore: (id) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 매장 삭제 (ID: ${id})`);
    }
    
    return API.delete(`/stores/${id}/`);
  }
};

// 등록 관련 API
export const registrationAPI = {
  // 내 등록 정보 조회
  getMyRegistrations: (userId) => {
    const formData = new FormData();
    formData.append('user_id', userId);
    return API.post('/tournaments/registrations/my/', formData);
  },

  // 토너먼트 등록
  registerTournament: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    return API.post('/tournaments/registrations/', formData);
  }
};

// 대시보드 관련 API
export const dashboardAPI = {
  // 대시보드 통계 데이터 조회 (OPTIONS 방지)
  getStats: () => API.get('/tournaments/dashboard/stats-simple/'),

  // 대시보드 매장/선수 매핑 현황 데이터 조회
  getPlayerMapping: (tournamentId) =>
    API.get('/tournaments/dashboard/player_mapping/', { params: tournamentId ? { tournament_id: tournamentId } : {} })
};

// 토너먼트 SEAT권 분배 관련 API
export const distributionAPI = {
  // 분배 목록 조회 추가
  getDistributions: (params = {}) => API.get('/seats/distributions/', { params }),

  // 토너먼트별 분배 요약 조회
  getSummaryByTournament: (tournamentId) => 
    API.get('/seats/distributions/summary_by_tournament/', { params: { tournament_id: tournamentId } }),

  // 매장별 분배 요약 조회
  getSummaryByStore: (storeId) => 
    API.get('/seats/distributions/summary_by_store/', { params: { store_id: storeId } }),

  // 전체 분배 요약 조회
  getOverallSummary: () => API.get('/seats/distributions/overall_summary/'),

  // 새로 추가: 토너먼트에 시트권 분배 생성
  createDistribution: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    return API.post('/seats/distributions/', formData);
  },

  // 새로 추가: 여러 매장에 한 번에 시트권 분배
  createBulkDistribution: (tournamentId, distributions) => {
    return API.post('/seats/distributions/bulk_create/', {
      tournament_id: tournamentId,
      distributions: distributions
    });
  },

  // 새로 추가: 분배 정보 수정
  updateDistribution: (distributionId, data) => {
    return API.put(`/seats/distributions/${distributionId}/`, data);
  },

  // 새로 추가: 분배 삭제
  deleteDistribution: (distributionId) => 
    API.delete(`/seats/distributions/${distributionId}/`),

  // 새로 추가: 토너먼트에 할당 가능한 매장 목록 조회
  getAvailableStores: (tournamentId) => 
    API.get('/seats/distributions/available_stores/', { params: { tournament_id: tournamentId } }),

  // 새로 추가: 토너먼트 시트권 자동 분배 (매장별 동일 수량)
  autoDistributeEqual: (tournamentId, storeIds) => {
    return API.post('/seats/distributions/auto_distribute/', {
      tournament_id: tournamentId,
      store_ids: storeIds,
      distribution_type: 'equal'
    });
  },

  // 새로 추가: 토너먼트 시트권 자동 분배 (매장별 가중치 적용)
  autoDistributeWeighted: (tournamentId, storeWeights) => {
    return API.post('/seats/distributions/auto_distribute/', {
      tournament_id: tournamentId,
      store_weights: storeWeights,
      distribution_type: 'weighted'
    });
  }
};

// SEAT권 관련 API
export const seatTicketAPI = {
  // 토너먼트 요약 조회
  getTournamentSummary: (tournamentId) => 
    API.get('/seats/tickets/tournament_summary/', { params: { tournament_id: tournamentId } }),

  // 사용자 SEAT권 통계 조회
  getUserStats: (userId, tournamentId) => 
    API.get('/seats/tickets/user_stats/', { params: { user_id: userId, tournament_id: tournamentId } }),

  // SEAT권 지급
  grantTickets: (data) => API.post('/seats/tickets/grant/', data),

  // SEAT권 사용
  useTicket: (data) => API.post('/seats/tickets/use/', data),

  // 대량 SEAT권 작업
  bulkOperation: (data) => API.post('/seats/tickets/bulk_operation/', data),

  // 매장별 사용자 조회 (수정된 버전)
  getUsersByStore: (tournamentId, storeId) => 
    API.get('/seats/tickets/', { 
      params: { 
        tournament_id: tournamentId,
        store_id: storeId,
        status: 'ACTIVE'  // 백엔드에서 store_id 필터링 지원
      } 
    }),

  // 토너먼트별 전체 SEAT권 조회
  getTicketsByTournament: (tournamentId, filters = {}) => 
    API.get('/seats/tickets/', { 
      params: { 
        tournament_id: tournamentId,
        ...filters
      } 
    }),

  // 매장별 전체 사용자 조회 (GET 방식, OPTIONS 방지)
  getStoreUsers: (storeId, tournamentId = null) => {
    const params = {
      store_id: storeId
    };
    if (tournamentId) {
      params.tournament_id = tournamentId;
    }
    return API.get('/seats/tickets/store-users-simple/', { params });
  },

  // 최근 거래 내역 조회 - SeatTicket 엔드포인트 사용 (TicketIssuePage.jsx와 동일)
  getRecentTransactions: (filters = {}) => {
    const params = {
      ordering: '-created_at', // 최신순 정렬
      ...filters
    };
    return API.get('/seats/tickets/', { params });
  }
};

// 사용자 정보 관련 API
export const userAPI = {
  // 현재 사용자 정보 조회
  getCurrentUser: () => API.get('/accounts/me/'),
  
  // 모든 사용자 목록 조회 (role 필터링 가능)
  getAllUsers: (role = null) => {
    const params = role ? { role } : {};
    return API.get('/accounts/users/', { params });
  },
  
  // 전화번호 또는 사용자 ID로 사용자 조회 (JSON 방식)
  getUserByPhoneOrId: (data) => {
    return API.post('/accounts/users/get_user/', data);
  },
  
  // 전화번호로 사용자 조회 (GET 방식)
  getUserByPhone: (phone) => {
    return API.get('/store/search-user/', { params: { phone } });
  },
  
  // 사용자 통계 조회
  getUserStats: () => API.get('/accounts/users/get_user_stats/'),
};

// 공지사항(Notice) 관련 API
export const noticeAPI = {
  //  모든 공지사항 조회 (일반 사용자용 - 활성화된 공지사항만)
  getAllNotices: () => API.get('/notices/'),

  // 관리자용 모든 공지사항 조회 (날짜 제한 없음, OPTIONS 방지)
  getAllNoticesAdmin: () => API.get('/notices/admin-simple/'),

  // 공지사항 상세 조회
  getNoticeById: (id) => API.get(`/notices/${id}/`),

  // 공지사항 생성
  // 지원 필드: title, content, notice_type, priority, z_order, is_published, is_pinned, attachment, start_date, end_date
  createNotice: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      // z_order는 숫자형 필드이므로 0도 유효값으로 처리
      if (key === 'z_order') {
        formData.append(key, data[key] || 0);
        return;
      }
      
      // 빈 문자열이나 null 값은 제외하고 전송 (날짜 필드 제외)
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      } else if (['start_date', 'end_date'].includes(key) && data[key] === '') {
        // 날짜 필드가 빈 문자열인 경우 아예 전송하지 않음
        return;
      }
    });
    
    // 디버깅을 위한 FormData 내용 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 공지사항 생성 - 전송할 FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
    }
    
    return API.post('/notices/create/', formData);
  },

  // 공지사항 수정
  updateNotice: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'z_order') {
        formData.append(key, data[key] || 0);
        return;
      }
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      } else if (['start_date', 'end_date'].includes(key) && data[key] === '') {
        return;
      }
    });
    formData.append('_method', 'PATCH');
    
    // 디버깅을 위한 FormData 내용 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 공지사항 수정 (ID: ${id}) - 전송할 FormData:`);
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
    }
    
    return API.post(`/notices/${id}/update/`, formData);
  },

  // 공지사항 삭제
  deleteNotice: (id) => {
    const formData = new FormData();
    formData.append('_method', 'DELETE');
    
    // 디버깅을 위한 FormData 내용 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 공지사항 삭제 (ID: ${id}) - 전송할 FormData:`);
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
    }
    
    return API.post(`/notices/${id}/delete/`, formData);
  }
};

// 배너(Banner) 관련 API
export const bannerAPI = {
  // 모든 배너 조회 (인증 필요)
  getAllBanners: (params = {}) => API.get('/banners/', { params }),

  // 활성 배너만 조회 (로그인 불필요)
  getActiveBanners: (params = {}) => API.get('/banners/active/', { params }),

  // 특정 배너 상세 조회
  getBannerById: (id) => API.get(`/banners/${id}/`),

  // 매장별 배너 조회
  getBannersByStore: (storeId) => 
    API.get('/banners/by_store/', { params: { store_id: storeId } }),

  // 내 매장 배너 조회 (매장 관리자용)
  getMyBanners: () => API.get('/banners/my_banners/'),

  // 배너 생성
  createBanner: (data) => {
    // data가 이미 FormData 객체인 경우 그대로 사용
    if (data instanceof FormData) {
      // 운영환경에서도 디버깅 로그 출력 (배너 업로드 문제 해결용)
      console.log('📤 배너 생성 - 전송할 FormData:');
      for (let [key, value] of data.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      // 이미지 파일 세부 정보 출력
      const imageFile = data.get('image');
      if (imageFile && imageFile instanceof File) {
        console.log('📸 이미지 파일 정보:');
        console.log(`  - 파일명: ${imageFile.name}`);
        console.log(`  - 파일 크기: ${imageFile.size} bytes`);
        console.log(`  - 파일 타입: ${imageFile.type}`);
        console.log(`  - 최종 수정일: ${imageFile.lastModified}`);
      }
      
      return API.post('/banners/', data);
    }
    
    // data가 일반 객체인 경우 FormData로 변환 (하위 호환성 유지)
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    // 운영환경에서도 디버깅 로그 출력 (배너 업로드 문제 해결용)
    console.log('📤 배너 생성 - 전송할 FormData:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    
    // 이미지 파일 세부 정보 출력
    const imageFile = formData.get('image');
    if (imageFile && imageFile instanceof File) {
      console.log('📸 이미지 파일 정보:');
      console.log(`  - 파일명: ${imageFile.name}`);
      console.log(`  - 파일 크기: ${imageFile.size} bytes`);
      console.log(`  - 파일 타입: ${imageFile.type}`);
      console.log(`  - 최종 수정일: ${imageFile.lastModified}`);
    }
    
    return API.post('/banners/', formData);
  },

  // 배너 수정
  updateBanner: (id, data) => {
    // data가 이미 FormData 객체인 경우 그대로 사용
    if (data instanceof FormData) {
      // 디버깅을 위한 FormData 내용 출력
      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 배너 수정 (ID: ${id}) - 전송할 FormData:`);
        for (let [key, value] of data.entries()) {
          console.log(`  ${key}:`, value);
        }
      }
      
      return API.put(`/banners/${id}/`, data);
    }
    
    // data가 일반 객체인 경우 FormData로 변환
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    // 디버깅을 위한 FormData 내용 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 배너 수정 (ID: ${id}) - 전송할 FormData:`);
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
    }
    
    return API.put(`/banners/${id}/`, formData);
  },

  // 배너 삭제
  deleteBanner: (id) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 배너 삭제 (ID: ${id})`);
    }
    
    return API.delete(`/banners/${id}/`);
  },

  // 배너 활성화/비활성화 토글
  toggleBannerActive: (id) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 배너 상태 토글 (ID: ${id})`);
    }
    
    return API.post(`/banners/${id}/toggle_active/`);
  },

  // 필터링된 배너 조회 (다양한 옵션 지원)
  getBannersWithFilters: (filters = {}) => {
    const params = {};
    
    // 매장별 필터링
    if (filters.storeId) {
      params.store_id = filters.storeId;
    }
    
    // 활성 상태 필터링
    if (filters.isActive !== undefined) {
      params.is_active = filters.isActive;
    }
    
    // 기간별 필터링
    if (filters.startDate) {
      params.start_date = filters.startDate;
    }
    
    if (filters.endDate) {
      params.end_date = filters.endDate;
    }
    
    return API.get('/banners/', { params });
  },

  // 메인 토너먼트 배너로 설정 (관리자만)
  setAsMainTournament: (id) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 메인 토너먼트 배너 설정 (ID: ${id})`);
    }
    
    return API.post(`/banners/${id}/set_as_main_tournament/`);
  },

  // 현재 메인 토너먼트 배너 조회 (모든 사용자)
  getMainTournamentBanner: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 메인 토너먼트 배너 조회');
    }
    
    return API.get('/banners/main_tournament/');
  },

  // 인기 스토어 갤러리용 배너 조회 (모든 사용자)
  getStoreGalleryBanners: () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 인기 스토어 갤러리 배너 조회');
    }
    
    return API.get('/banners/store_gallery/');
  }
};

// 시트 관련 API
export const seatAPI = {
  // 내 시트권 조회
  getMySeats: () => API.get('/seats/my/'),
};

// API 모듈을 변수에 할당 후 내보내기
// const apiModule = {
//   tournament: tournamentAPI,
//   store: storeAPI,
//   registration: registrationAPI,
//   dashboard: dashboardAPI,
//   banner: bannerAPI
// };

export default API;
