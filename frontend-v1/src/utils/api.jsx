import axios from 'axios';
import { getToken, refreshToken, logout } from './auth';

// API 기본 설정 - content-type 기본값 제거
const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1'
});

// 요청 인터셉터 - 인증 토큰 추가
API.interceptors.request.use(
  async (config) => {
    // 로그 출력
    console.log(`API 요청: ${config.method.toUpperCase()} ${config.url}`, config);

    // 토큰이 있으면 헤더에 추가
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 시 갱신
API.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status}`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 토큰 만료 오류(401) 및 재시도 안된 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 시도
        const { success, access } = await refreshToken();

        if (success && access) {
          // 갱신된 토큰으로 헤더 업데이트
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          // 원래 요청 재시도
          return API(originalRequest);
        } else {
          // 갱신 실패 시 로그아웃
          logout();
          // 로그인 페이지로 리다이렉트
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('토큰 갱신 오류:', refreshError);
        // 로그아웃 처리
        logout();
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // 기타 오류 처리
    if (error.response) {
      console.error(`API 응답 오류: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error('API 응답 없음:', error.request);
    } else {
      console.error('API 오류:', error.message);
    }

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

  // 토너먼트 생성 - FormData 형식으로 변경
  createTournament: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    // FormData 내용 로깅
    for (let pair of formData.entries()) {
      console.log(`FormData 항목: ${pair[0]}: ${pair[1]}`);
    }

    return API.post('/tournaments/', formData);
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

// 스토어(매장) 관련 API
export const storeAPI = {
  // 모든 매장 조회
  getAllStores: () => API.get('/stores/'),

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

  // 매장별 토너먼트 좌석권 정보 조회
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
  // 대시보드 통계 데이터 조회
  getStats: () => API.get('/tournaments/dashboard/stats/'),

  // 대시보드 매장/선수 매핑 현황 데이터 조회
  getPlayerMapping: (tournamentId) =>
    API.get('/tournaments/dashboard/player_mapping/', { params: tournamentId ? { tournament_id: tournamentId } : {} })
};

// API 모듈을 변수에 할당 후 내보내기
// const apiModule = {
//   tournament: tournamentAPI,
//   store: storeAPI,
//   registration: registrationAPI,
//   dashboard: dashboardAPI
// };

export default API;
