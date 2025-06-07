// 모바일 페이지 컴포넌트 내보내기
import StoreDashboard from './store/StoreDashboard';
import StoreInfo from './store/StoreInfo';
import Tournament from './store/Tournament';
import PlayerRegistration from './store/PlayerRegistration';
import TicketIssue from './store/TicketIssue';
import UserDashboard from './user/UserDashboard';

// 컴포넌트 내보내기
export {
  StoreDashboard,
  StoreInfo,
  Tournament, 
  PlayerRegistration,
  TicketIssue,
  UserDashboard
};

// Common (공통) 페이지
export { default as MobileLogin } from './common/MobileLogin';
export { default as MobileSignup } from './common/MobileSignup';
export { default as Settings } from './common/Settings';
export { default as UnderConstruction } from './common/UnderConstruction'; 