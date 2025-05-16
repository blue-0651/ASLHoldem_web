import axios from 'axios';

// 토큰 관련 로컬 스토리지 키
const TOKEN_KEY = 'asl_holdem_access_token';
const REFRESH_TOKEN_KEY = 'asl_holdem_refresh_token';
const USER_INFO_KEY = 'asl_holdem_user_info';
const USER_TYPE_KEY = 'user_type';
const BASE_URL = 'http://localhost:8000';

// API 엔드포인트
const getLoginEndpoint = (userType) => {
  const paths = {
    admin: '/api/v1/accounts/token/admin/',
    store: '/api/v1/accounts/token/',
    user: '/api/v1/accounts/token/user/'
  };

  const path = paths[userType] || paths.user;
  return BASE_URL + path;
};

const isMobileDevice = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const reqGetLoginUserType = () => {
  const userType = localStorage.getItem(USER_TYPE_KEY);
  if (userType) {
    return userType;
  }
  return ''; // 기본값
};

// 사용자 정보 가져오기
export const reqIsAuthenticated = () => {
  return !!getToken();
};

// 사용자 정보 가져오기
export const reqIsRefreshToken = () => {
  return !!getRefreshToken();
};

// 로그아웃 함수
export const reqLogout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
};

// 로그인 함수
export const reqLogin = async (username, password, userType = 'user') => {
  try {
    if (isMobileDevice() && userType === 'admin') {
      reqLogout();
      return {
        success: false,
        error: { detail: '모바일에서는 관리자 로그인이 불가능합니다.' }
      };
    }

    const apiService = axios.create();
    //apiService.defaults.baseURL = BASE_URL;

    if (reqIsAuthenticated()) {
      reqLogout();
    }

    const response = await apiService.post(getLoginEndpoint(userType), { username, password, user_type: userType });

    // 로그 출력
    console.log('Login attempt:', {
      username,
      passwordLength: password.length,
      userType,
      endpoint: getLoginEndpoint(userType)
    });

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

    const userInfo = await reqGetUserInfo(username, getToken());
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

    return {
      success: true,
      user: userInfo
    };
  } catch (error) {
    console.log('로그인 실패:', error);

    // 로그인 실패 시 로컬 스토리지에서 토큰 제거
    reqLogout();

    return {
      success: false,
      error: error.response?.data || { detail: '로그인에 실패했습니다.' }
    };
  }
};

// 사용자 정보 가져오기
export const reqGetUserInfo = async (username, tokenValue) => {
  try {
    const formData = new FormData();
    formData.append('username', username);

    const apiService = axios.create();
    //apiService.defaults.baseURL = BASE_URL;

    const response = await apiService.post(BASE_URL + '/api/v1/accounts/users/get_user/', formData, {
      headers: { Authorization: `Bearer ${tokenValue}` }
    });

    //로그 출력
    console.log('사용자 정보 가져오기:', {
      username,
      tokenValue,
      response: response.data
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.log('사용자 정보 가져오기 실패:', error);
    return {
      success: false,
      error: error.response?.data || { detail: '사용자 정보를 가져오는 데 실패했습니다.' }
    };
  }
};

// 사용자 정보 생성 요청
export const reqSignUp = async (username, email, password, first_name, last_name, is_staff, is_superuser, is_active, phone, birthday, gender) => {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);

    formData.append('first_name', first_name);
    formData.append('last_name', last_name);

    formData.append('is_staff', is_staff);
    formData.append('is_superuser', is_superuser);
    formData.append('is_active', is_active);
    
    // 전화번호 추가
    formData.append('phone', phone);
    
    // 생일 데이터 형식 변환 및 확인 - birth_date로 필드명 변경
    try {
      // YYYY-MM-DD 형식의 날짜 확인
      const birthdayDate = new Date(birthday);
      // 형식이 유효한지 확인
      if (isNaN(birthdayDate)) {
        console.error('잘못된 날짜 형식:', birthday);
        formData.append('birth_date', birthday); // 원래 형식 그대로 전송
      } else {
        // ISO 형식으로 변환 (YYYY-MM-DD)
        const formattedDate = birthdayDate.toISOString().split('T')[0];
        console.log('변환된 생년월일:', formattedDate);
        formData.append('birth_date', formattedDate);
      }
    } catch (dateError) {
      console.error('날짜 변환 오류:', dateError);
      formData.append('birth_date', birthday); // 오류 시 원래 형식 그대로 전송
    }
    
    // 성별 데이터 추가
    formData.append('gender', gender);

    // 폼 데이터 확인용 로그
    console.log('서버로 전송하는 데이터:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const apiService = axios.create();
    //apiService.defaults.baseURL = BASE_URL;

    const response = await apiService.post(BASE_URL + '/api/v1/accounts/users/', formData);

    //로그 출력
    console.log('회원가입 결과:', {
      username,
      email,
      gender,
      birth_date: formData.get('birth_date'), // 실제 전송된 생년월일 값 확인
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
      error: error.response?.data || { detail: '사용자 정보를 가져오는 데 실패했습니다.' }
    };
  }
};
