import API from './api';

// 토큰 관련 로컬 스토리지 키
const TOKEN_KEY = 'asl_holdem_access_token';
const REFRESH_TOKEN_KEY = 'asl_holdem_refresh_token';
const USER_INFO_KEY = 'asl_holdem_user_info';

// 로그인 함수
export const login = async (username, password, userType = 'store') => {
  try {
    // 모바일 환경에서는 어드민 로그인을 시도하지 않도록 체크
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && userType === 'admin') {
      return {
        success: false,
        error: { detail: '모바일에서는 관리자 로그인이 불가능합니다.' }
      };
    }
    
    // userType에 따라 다른 API 엔드포인트나 파라미터 사용 가능
    let endpoint;
    
    if (userType === 'admin') {
      endpoint = '/api/v1/accounts/token/admin/';
    } else if (userType === 'store') {
      endpoint = '/api/v1/accounts/token/';
    } else {
      endpoint = '/api/v1/accounts/token/user/';
    }
    
    const response = await API.post(endpoint, {
      username,
      password,
      user_type: userType // 백엔드에서 구분할 수 있도록 추가 파라미터
    });

    const { access, refresh } = response.data;
    
    // 토큰을 로컬 스토리지에 저장
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem('user_type', userType); // 유저 타입도 저장
    
    // 사용자 정보 가져오기
    const userInfo = await getUserInfo(username);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    
    return {
      success: true,
      user: userInfo
    };
  } catch (error) {
    console.error('로그인 실패:', error);
    return {
      success: false,
      error: error.response?.data || { detail: '로그인에 실패했습니다.' }
    };
  }
};

// 로그아웃 함수
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem('user_type');
};

// 사용자 정보 가져오기
export const getUserInfo = async (username) => {
  try {
    const formData = new FormData();
    formData.append('username', username);
    
    const response = await API.post('/api/v1/accounts/users/get_user/', formData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('사용자 정보 가져오기 실패:', error);
    throw error;
  }
};

// 토큰 가져오기
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// 리프레시 토큰 가져오기
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// 토큰 갱신
export const refreshToken = async () => {
  try {
    const refresh = getRefreshToken();
    if (!refresh) {
      throw new Error('리프레시 토큰이 없습니다.');
    }
    
    const response = await API.post('/api/v1/accounts/token/refresh/', {
      refresh
    });
    
    const { access } = response.data;
    localStorage.setItem(TOKEN_KEY, access);
    
    return {
      success: true,
      access
    };
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    // 갱신 실패 시 로그아웃 처리
    logout();
    return {
      success: false,
      error: error.response?.data || { detail: '세션이 만료되었습니다. 다시 로그인해 주세요.' }
    };
  }
};

// 인증 여부 확인
export const isAuthenticated = () => {
  return !!getToken();
};

// 현재 사용자 정보
export const getCurrentUser = () => {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY);
  return userInfoStr ? JSON.parse(userInfoStr) : null;
}; 