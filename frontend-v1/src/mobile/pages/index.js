// 모바일 페이지 컴포넌트 내보내기
import StoreDashboard from './store/StoreDashboard.jsx';
import StoreInfo from './store/StoreInfo.jsx';
import Tournament from './store/Tournament.jsx';
import PlayerRegistration from './store/PlayerRegistration.jsx';
import TicketIssue from './store/TicketIssue.jsx';
import UserDashboard from './user/UserDashboard.jsx';

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
export { default as MobileLogin } from './common/MobileLogin.jsx';
export { default as MobileSignup } from './common/MobileSignup.jsx';
export { default as Settings } from './common/Settings.jsx';
export { default as UnderConstruction } from './common/UnderConstruction.jsx'; 