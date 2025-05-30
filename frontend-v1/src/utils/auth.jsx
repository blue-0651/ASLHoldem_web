import axios from 'axios';

// 토큰 관련 로컬 스토리지 키
const TOKEN_KEY = 'asl_holdem_access_token';
const REFRESH_TOKEN_KEY = 'asl_holdem_refresh_token';
const USER_INFO_KEY = 'asl_holdem_user_info';

// API 기본 URL 설정
const baseURL = 'http://localhost:8000/api/v1';

// 로그인 함수
export const login = async (phone, password, userType = 'store') => {
  try {
    // 모바일 환경에서는 어드민 로그인을 시도하지 않도록 체크
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && userType === 'admin') {
      return {
        success: false,
        error: { detail: '모바일에서는 관리자 로그인이 불가능합니다.' }
      };
    }

    // userType에 따라 다른 API 엔드포인트 사용
    let endpoint;

    if (userType === 'admin') {
      endpoint = '/accounts/token/admin/';
    } else if (userType === 'store') {
      endpoint = '/accounts/token/store/';
    } else {
      endpoint = '/accounts/token/user/';
    }

    // 전화번호 형식 정리 (하이픈 제거)
    const cleanPhone = phone.replace(/-/g, '');

    console.log('Login attempt:', {
      phone: cleanPhone,
      passwordLength: password.length,
      userType,
      endpoint
    });

    const response = await axios.post(baseURL + endpoint, {
      phone: cleanPhone,
      password
    });

    const { access, refresh } = response.data;

    // 토큰을 로컬 스토리지에 저장
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem('user_type', userType); // 유저 타입도 저장

    // JWT 토큰에서 사용자 정보 추출
    let userInfo = null;
    
    try {
      const tokenParts = access.split('.');
      const tokenPayload = JSON.parse(atob(tokenParts[1]));
      
      userInfo = {
        id: tokenPayload.user_id,
        phone: tokenPayload.phone,
        nickname: tokenPayload.nickname || '',
        email: tokenPayload.email || '',
        is_store_owner: tokenPayload.is_store_owner || false,
        role: tokenPayload.role || (userType === 'store' ? 'STORE_OWNER' : 'USER')
      };
      
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    } catch (error) {
      console.error('JWT 토큰 파싱 오류:', error);
      return {
        success: false,
        error: { detail: '사용자 정보 처리 중 오류가 발생했습니다.' }
      };
    }

    return {
      success: true,
      user: userInfo
    };
  } catch (error) {
    console.error('로그인 실패:', error);
    
    // 에러 메시지 처리
    let errorMessage = '로그인에 실패했습니다.';
    
    if (error.response) {
      if (error.response.data.non_field_errors) {
        errorMessage = error.response.data.non_field_errors[0];
      } else if (error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response.status === 400) {
        errorMessage = '전화번호 또는 비밀번호가 올바르지 않습니다.';
      } else if (error.response.status === 401) {
        errorMessage = '인증에 실패했습니다. 다시 로그인해주세요.';
      } else if (error.response.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
      }
    }
    
    return {
      success: false,
      error: { detail: errorMessage }
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
export const getUserInfo = async (phone) => {
  try {
    const response = await axios.post(baseURL + '/accounts/users/get_user/', {
      phone: phone
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

    const response = await axios.post(baseURL + '/accounts/token/refresh/', {
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
  //return true;
  return !!getToken();
};

// 현재 사용자 정보
export const getCurrentUser = () => {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY);
  
  if (userInfoStr) {
    return JSON.parse(userInfoStr);
  } else {
    return null;
  }
};
