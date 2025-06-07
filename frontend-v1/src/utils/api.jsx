import axios from 'axios';
import { getToken, refreshToken, logout } from './auth';

// API 기본 설정 - content-type 기본값 제거
const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000
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
  }
};

// 스토어(매장) 관련 API - DEPRECATED
// 매장 정보는 distributionAPI.getSummaryByTournament()에서 제공됩니다.
export const storeAPI = {
  // 모든 매장 조회 - DEPRECATED
  getAllStores: () => API.get('/stores/'),

  // 특정 매장 방문 사용자 목록 - DEPRECATED
  getStoreUsers: (storeId) => API.post(`/stores/${storeId}/users/`),

  // 매장 이름과 사용자 이름으로 검색 - DEPRECATED
  searchUserByStore: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    return API.post('/stores/search_user_by_store/', formData);
  },

  // 매장별 토너먼트 좌석권 정보 조회 - DEPRECATED
  getStoreTournamentTickets: (storeId) => API.get(`/stores/${storeId}/tournament_tickets/`)
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

// 토너먼트 좌석권 분배 관련 API
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

// 좌석권 관련 API
export const seatTicketAPI = {
  // 토너먼트 요약 조회
  getTournamentSummary: (tournamentId) => 
    API.get('/seats/tickets/tournament_summary/', { params: { tournament_id: tournamentId } }),

  // 사용자 좌석권 통계 조회
  getUserStats: (userId, tournamentId) => 
    API.get('/seats/tickets/user_stats/', { params: { user_id: userId, tournament_id: tournamentId } }),

  // 좌석권 지급
  grantTickets: (data) => API.post('/seats/tickets/grant/', data),

  // 좌석권 사용
  useTicket: (data) => API.post('/seats/tickets/use/', data),

  // 대량 좌석권 작업
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

  // 토너먼트별 전체 좌석권 조회
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
  
  // 전화번호로 사용자 조회 (FormData 방식)
  getUserByPhone: (phone) => {
    const formData = new FormData();
    formData.append('phone', phone);
    return API.post('/accounts/users/get_user_by_phone/', formData);
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

// API 모듈을 변수에 할당 후 내보내기
// const apiModule = {
//   tournament: tournamentAPI,
//   store: storeAPI,
//   registration: registrationAPI,
//   dashboard: dashboardAPI
// };

export default API;
