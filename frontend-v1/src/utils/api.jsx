import axios from 'axios';
import { getToken, refreshToken, logout } from './auth';

// API 기본 설정 - content-type 기본값 제거
const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1'
});

// 요청 인터셉터 - 인증 토큰 추가
API.interceptors.request.use(
  async (config) => {

    // 토큰이 있으면 헤더에 추가
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 개발 환경에서만 요청 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('[API REQUEST]', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
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
        // 로그아웃 처리
        logout();
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        return Promise.reject(error);
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

// 사용자 정보 관련 API
export const userAPI = {
  // 현재 사용자 정보 조회
  getCurrentUser: () => API.get('/accounts/me/'),
};

// 공지사항(Notice) 관련 API
export const noticeAPI = {
  //  모든 공지사항 조회 (일반 사용자용 - 활성화된 공지사항만)
  getAllNotices: () => API.get('/notices/'),

  // 관리자용 모든 공지사항 조회 (날짜 제한 없음)
  getAllNoticesAdmin: () => API.get('/notices/admin/'),

  // 공지사항 상세 조회
  getNoticeById: (id) => API.get(`/notices/${id}/`),

  // 공지사항 생성
  createNotice: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
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
      console.log('전송할 FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
    }
    
    return API.post('/notices/create/', formData);
  },

  // 공지사항 수정
  updateNotice: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
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
      console.log('수정할 FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
    }
    
    // PATCH 메서드 사용 (부분 업데이트에 더 적합)
    return API.patch(`/notices/${id}/update/`, formData);
  },

  // 공지사항 삭제
  deleteNotice: (id) => API.delete(`/notices/${id}/delete/`)
};

// API 모듈을 변수에 할당 후 내보내기
// const apiModule = {
//   tournament: tournamentAPI,
//   store: storeAPI,
//   registration: registrationAPI,
//   dashboard: dashboardAPI
// };

export default API;
