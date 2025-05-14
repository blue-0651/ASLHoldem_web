// api.jsx, auth.jsx
import axios from 'axios';

// 토큰 관련 로컬 스토리지 키
const TOKEN_KEY = 'asl_holdem_access_token';
const REFRESH_TOKEN_KEY = 'asl_holdem_refresh_token';
const USER_INFO_KEY = 'asl_holdem_user_info';

// _API 기본 설정 - content-type 기본값 제거
const _API = axios.create({
  baseURL: 'http://localhost:8000'
});

// 요청 인터셉터 - 인증 토큰 추가
_API.interceptors.request.use(
  async (config) => {
    // 로그 출력
    console.log(`_API 요청: ${config.method.toUpperCase()} ${config.url}`, config);

    // 토큰이 있으면 헤더에 추가
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.log('_API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 시 갱신
_API.interceptors.response.use(
  (response) => {
    console.log(`_API 응답: ${response.status}`, response.data);
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
          return _API(originalRequest);
        } else {
          // 갱신 실패 시 로그아웃
          logout();
          // 로그인 페이지로 리다이렉트
          //window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.log('토큰 갱신 오류:', refreshError);
        // 로그아웃 처리
        logout();

        // 로그인 페이지로 리다이렉트
        //window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // 기타 오류 처리
    if (error.response) {
      console.log(`_API 응답 오류: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.log('_API 응답 없음:', error.request);
    } else {
      console.log('_API 오류:', error.message);
    }

    return Promise.reject(error);
  }
);

// 로그인 함수
// Helper functions
const isMobileDevice = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const getLoginEndpoint = (userType) => {
  const endpoints = {
    admin: '/api/v1/accounts/token/admin/',
    store: '/api/v1/accounts/token/',
    user: '/api/v1/accounts/token/user/'
  };
  return endpoints[userType] || endpoints.user;
};

const login = async (username, password, userType = 'store') => {
  try {
    if (isMobileDevice() && userType === 'admin') {
      return {
        success: false,
        error: { detail: '모바일에서는 관리자 로그인이 불가능합니다.' }
      };
    }

    const endpoint = getLoginEndpoint(userType);

    console.log('Login attempt:', {
      username,
      passwordLength: password.length,
      userType,
      endpoint
    });

    const response = await _API.post(endpoint, {
      username,
      password,
      user_type: userType
    });

    const { access, refresh } = response.data || {};
    if (!access || !refresh) {
      throw new Error('토큰 정보가 응답에 포함되어 있지 않습니다.');
    }

    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem('user_type', userType);

    const userInfo = await getUserInfo(username);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

    return {
      success: true,
      user: userInfo
    };
  } catch (error) {
    console.log('로그인 실패:', error);
    return {
      success: false,
      error: error.response?.data || { detail: '로그인에 실패했습니다.' }
    };
  }
};

// 로그아웃 함수
const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem('user_type');
};

// 사용자 정보 가져오기
const getUserInfo = async (username) => {
  try {
    const formData = new FormData();
    formData.append('username', username);

    const response = await _API.post('/api/v1/accounts/users/get_user/', formData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    return response.data;
  } catch (error) {
    console.log('사용자 정보 가져오기 실패:', error);
    throw error;
  }
};

// 현재 사용자 정보
const getCurrentUser = () => {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY);
  return userInfoStr ? JSON.parse(userInfoStr) : null;
};

// 토큰 가져오기
const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// 리프레시 토큰 가져오기
const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// 토큰 갱신
const refreshToken = async () => {
  try {
    const refresh = getRefreshToken();
    if (!refresh) {
      throw new Error('리프레시 토큰이 없습니다.');
    }

    const response = await _API.post('/api/v1/accounts/token/refresh/', {
      refresh
    });

    const { access } = response.data;
    localStorage.setItem(TOKEN_KEY, access);

    return {
      success: true,
      access
    };
  } catch (error) {
    console.log('토큰 갱신 실패:', error);
    // 갱신 실패 시 로그아웃 처리
    logout();
    return {
      success: false,
      error: error.response?.data || { detail: '세션이 만료되었습니다. 다시 로그인해 주세요.' }
    };
  }
};

// 인증 여부 확인
const isAuthenticated = () => {
  return !!getToken();
};

// 전체 모듈 임포트
// API 모듈을 변수에 할당 후 내보내기
const apiService = {
  login,
  logout,
  getCurrentUser,
  getToken,
  refreshToken,
  isAuthenticated,
  getUserInfo
};

export default apiService;
