import axios from 'axios';

// 토큰 관련 로컬 스토리지 키
const TOKEN_KEY = 'asl_holdem_access_token';
const REFRESH_TOKEN_KEY = 'asl_holdem_refresh_token';
const USER_INFO_KEY = 'asl_holdem_user_info';
const USER_TYPE_KEY = 'user_type';
const IS_STORE_OWNER_KEY = 'is_store_owner';

// API 기본 URL 설정 - 환경에 따라 동적으로 설정
const getBaseURL = () => {
  // 개발 환경에서 현재 호스트의 IP를 사용
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // 모바일 환경에서는 현재 호스트의 IP를 사용하되 포트는 8000으로 변경
    return `http://${window.location.hostname}:8000`;
  }
  // 로컬 개발 환경
  return 'http://localhost:8000';
};

const BASE_URL = getBaseURL();
const baseURL = BASE_URL + '/api/v1';

// 모바일 기기 확인 헬퍼 함수
const isMobileDevice = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// API 엔드포인트 헬퍼 함수
const getLoginEndpoint = (userType) => {
  const paths = {
    admin: '/api/v1/accounts/token/admin/',
    store: '/api/v1/accounts/token/store/',
    user: '/api/v1/accounts/token/user/'
  };

  const path = paths[userType] || paths.user;
  return BASE_URL + path;
};

// 로그인 함수 (기존 auth.jsx 방식 유지)
export const login = async (phone, password, userType = 'store') => {
  try {
    // 모바일 환경에서는 어드민 로그인을 시도하지 않도록 체크
    const isMobile = isMobileDevice();
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

    console.log('Login attempt:', JSON.stringify({
      phone: cleanPhone,
      passwordLength: password.length,
      userType,
      endpoint,
      baseURL: baseURL,
      fullURL: baseURL + endpoint,
      hostname: window.location.hostname
    }));

    const response = await axios.post(baseURL + endpoint, {
      phone: cleanPhone,
      password
    });

    const { access, refresh } = response.data;

    // 토큰을 로컬 스토리지에 저장
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(USER_TYPE_KEY, userType); // 유저 타입도 저장

    // JWT 토큰에서 사용자 정보 추출
    let userInfo = null;
    
    try {
      const tokenParts = access.split('.');
      const tokenPayload = JSON.parse(atob(tokenParts[1]));
      
      userInfo = {
        id: tokenPayload.user_id,
        user_id: tokenPayload.user_id, // 호환성을 위해 user_id 필드도 추가
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
    console.error('로그인 실패:', JSON.stringify({
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    }));
    
    // 에러 메시지 처리
    let errorMessage = '로그인에 실패했습니다.';
    
    if (error.response) {
      console.error('서버 응답 오류:', JSON.stringify({
        status: error.response.status,
        data: error.response.data
      }));
      
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
      } else if (error.response.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
    } else if (error.request) {
      console.error('네트워크 오류:', JSON.stringify({
        readyState: error.request.readyState,
        status: error.request.status,
        responseText: error.request.responseText
      }));
      
      // 안드로이드에서 HTTP 요청이 차단되는 경우
      if (error.message.includes('Network Error') || error.message.includes('ERR_CLEARTEXT_NOT_PERMITTED')) {
        errorMessage = '네트워크 보안 정책으로 인해 연결할 수 없습니다. 앱 설정을 확인해주세요.';
      } else {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
    } else {
      console.error('요청 설정 오류:', error.message);
      errorMessage = '요청 처리 중 오류가 발생했습니다.';
    }
    
    return {
      success: false,
      error: { detail: errorMessage }
    };
  }
};

// authService.jsx의 로그인 함수 (별도 유지 - 반환 형식이 다름)
export const reqLoginWithPhone = async (phone, password, userType = 'user') => {
  try {
    if (isMobileDevice() && userType === 'admin') {
      logout(); // 통합된 로그아웃 함수 사용
      return {
        success: false,
        error: { detail: '모바일에서는 관리자 로그인이 불가능합니다.' }
      };
    }

    const apiService = axios.create();

    if (isAuthenticated()) {
      logout();
    }

    const response = await apiService.post(getLoginEndpoint(userType), {
      phone,
      password
    });

    // 로그 출력
    console.log('Login attempt:', JSON.stringify({
      phone,
      passwordLength: password.length,
      userType,
      endpoint: getLoginEndpoint(userType)
    }));

    const { access, refresh } = response.data || {};
    if (!access || !refresh) {
      return {
        success: false,
        error: '토큰 정보가 응답에 포함되어 있지 않습니다.'
      };
    }

    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(USER_TYPE_KEY, userType);
    localStorage.setItem('userPhone', phone);

    // JWT 토큰에서 사용자 정보 추출 및 저장
    try {
      const tokenParts = access.split('.');
      const tokenPayload = JSON.parse(atob(tokenParts[1]));
      
      const userInfo = {
        id: tokenPayload.user_id,
        user_id: tokenPayload.user_id, // 호환성을 위해 user_id 필드도 추가
        phone: tokenPayload.phone,
        nickname: tokenPayload.nickname || '',
        email: tokenPayload.email || '',
        is_store_owner: tokenPayload.is_store_owner || false,
        is_staff: tokenPayload.is_staff || false,
        is_superuser: tokenPayload.is_superuser || false,
        role: tokenPayload.role || (userType === 'admin' ? 'ADMIN' : userType === 'store' ? 'STORE_OWNER' : 'USER')
      };
      
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      console.log('사용자 정보 저장 완료:', userInfo);
    } catch (tokenError) {
      console.error('JWT 토큰 파싱 오류:', tokenError);
    }

    return {
      success: true,
      response: response.data
    };
  } catch (error) {
    console.error('로그인 실패:', JSON.stringify({
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    }));

    // 로그인 실패 시 로컬 스토리지에서 토큰 제거
    logout();

    return {
      success: false,
      error: error.response?.data || { detail: '로그인에 실패했습니다.' }
    };
  }
};

// 로그아웃 함수 (authService.jsx 버전으로 통합 - 더 완전함)
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  localStorage.removeItem(IS_STORE_OWNER_KEY);
  localStorage.removeItem('userPhone');
};

// authService.jsx 호환성을 위한 별칭
export const reqLogout = logout;

// 회원가입 함수 (authService.jsx에서 가져옴)
export const reqSignUp = async (phone, nickname, email, password, first_name, last_name, birthday, gender) => {
  try {
    const apiService = axios.create();

    const signupData = {
      phone: phone,
      nickname: nickname || null, // nickname은 선택사항
      email: email,
      password: password,
      first_name: first_name,
      last_name: last_name,
      birth_date: birthday,
      gender: gender,
      is_staff: false,
      is_superuser: false,
      is_active: true
    };

    // 로그 출력
    console.log('서버로 전송하는 회원가입 데이터:', signupData);

    const response = await apiService.post(BASE_URL + '/api/v1/accounts/users/', signupData);

    //로그 출력
    console.log('회원가입 결과:', {
      phone,
      nickname,
      email,
      gender,
      birth_date: birthday,
      response: response.data
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.log('사용자 회원가입 실패:', error);

    // 오류 세부 사항 출력
    if (error.response) {
      console.log('서버 응답 오류 데이터:', error.response.data);
      console.log('서버 응답 상태:', error.response.status);
    }

    return {
      success: false,
      error: error.response?.data || { detail: '회원가입에 실패했습니다.' }
    };
  }
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
  return !!getToken();
};

// authService.jsx 호환성을 위한 별칭
export const reqIsAuthenticated = isAuthenticated;

// 리프레시 토큰 존재 여부 확인 (authService.jsx에서 가져옴)
export const reqIsRefreshToken = () => {
  return !!getRefreshToken();
};

// 로그인한 사용자 타입 가져오기 (authService.jsx에서 가져옴)
export const reqGetLoginUserType = () => {
  const userType = localStorage.getItem(USER_TYPE_KEY);
  if (userType) {
    return userType;
  }
  return ''; // 기본값
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
