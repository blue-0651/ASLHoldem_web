/**
 * 사용자 이름을 표시하기 위한 유틸리티 함수들
 */

/**
 * 사용자 정보에서 표시할 이름을 가져옵니다.
 * 우선순위: nickname > phone > 기본값
 * 
 * @param {Object} user - 사용자 정보 객체
 * @param {string} defaultName - 기본값 (옵션, 기본값: '사용자')
 * @returns {string} 표시할 사용자명
 */
export const getDisplayName = (user, defaultName = '사용자') => {
  if (!user) {
    return defaultName;
  }
  
  // nickname이 있고 빈 문자열이 아닌 경우 (데이터베이스의 nickname 필드)
  if (user.nickname && user.nickname.trim()) {
    return user.nickname.trim();
  }
  
  // nickname이 없거나 빈 문자열인 경우 phone 사용
  if (user.phone) {
    return user.phone;
  }
  
  // 둘 다 없는 경우 기본값 반환
  return defaultName;
};

/**
 * 전화번호를 포맷팅합니다.
 * 예: "010-1234-5678" -> "010-****-5678"
 * 
 * @param {string} phone - 전화번호
 * @param {boolean} maskMiddle - 중간 번호를 마스킹할지 여부 (기본값: false)
 * @returns {string} 포맷팅된 전화번호
 */
export const formatPhone = (phone, maskMiddle = false) => {
  if (!phone) return '';
  
  if (maskMiddle && phone.length >= 8) {
    const parts = phone.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-****-${parts[2]}`;
    }
  }
  
  return phone;
};

/**
 * 이메일 주소를 마스킹합니다.
 * 예: "user@example.com" -> "us**@example.com"
 * 
 * @param {string} email - 이메일 주소
 * @returns {string} 마스킹된 이메일 주소
 */
export const maskEmail = (email) => {
  if (!email) return '';
  
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  const maskedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;
    
  return `${maskedLocal}@${domain}`;
}; 